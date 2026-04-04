// ============ WESTAY EXPRESS BACKEND SERVER ============
// Full-stack: SQLite DB + JWT Auth + Role-based Access + REST API
// Repository pattern: swap sqlite-adapter for mysql/mongo in db/index.js

// Load environment variables FIRST
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { getDB } = require('./backend/db');
const { authenticate, requireRole, optionalAuth } = require('./backend/middleware/auth');
const { sanitizeRequest } = require('./backend/middleware/validate');
const errorHandler = require('./backend/middleware/error-handler');
const { i18nMiddleware } = require('./backend/i18n');
const { attachWebSocket, broadcast, getClientCount, getConnectedUsers } = require('./backend/websocket');

const app = express();
const PORT = process.env.PORT || 3456;

// ---- Security Middleware ----

// Helmet: HTTP security headers (CSP, HSTS, X-Frame, etc.)
app.use(helmet({
  contentSecurityPolicy: false, // disabled — SPA loads inline scripts / CDN assets
  crossOriginEmbedderPolicy: false
}));

// CORS: restrict origins in production
const corsOrigin = process.env.CORS_ORIGIN || '*';
app.use(cors({
  origin: corsOrigin === '*' ? true : corsOrigin.split(',').map(s => s.trim()),
  credentials: true
}));

// Body parser with size limit
app.use(express.json({ limit: '5mb' }));

// Sanitize all incoming request bodies / query / params
app.use(sanitizeRequest);

// i18n: set req.locale and req.t() from Accept-Language or ?lang=
app.use(i18nMiddleware);

// ---- Rate Limiting ----

// Global API rate limit
const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 min
  max: parseInt(process.env.RATE_LIMIT_MAX) || 300, // 300 req per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' }
});
app.use('/api', globalLimiter);

// Aggressive login rate limit (brute-force protection)
const loginLimiter = rateLimit({
  windowMs: parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 min
  max: parseInt(process.env.LOGIN_RATE_LIMIT_MAX) || 5, // 5 login attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts, please try again in 15 minutes' }
});
app.use('/api/auth/login', loginLimiter);

// ---- DB initialization guard ----
let dbReady = false;

app.use('/api', async (req, res, next) => {
  if (!dbReady) {
    try {
      await getDB();
      dbReady = true;
    } catch(e) {
      return res.status(500).json({ error: 'Database initialization failed: ' + e.message });
    }
  }
  next();
});

(async () => {
  const db = await getDB();

  // ==========================================
  // Make broadcast available to routes for real-time events
  // ==========================================
  app.set('broadcast', broadcast);

  // ==========================================
  // PUBLIC ROUTES (no auth required)
  // ==========================================

  // API Documentation (public — no auth needed)
  app.use('/api/docs', require('./backend/routes/docs')());

  // i18n translations (public)
  app.use('/api/i18n', require('./backend/routes/i18n')());

  // ==========================================
  // AUTH ROUTES (no auth required for login)
  // ==========================================
  app.use('/api/auth', require('./backend/routes/auth')(db));

  // ==========================================
  // PROTECTED API ROUTES
  // All routes below require authentication.
  // Role restrictions are applied per-route.
  // ==========================================

  // --- Properties: operator full CRUD, others read-only ---
  const propsRouter = require('./backend/routes/props')(db);
  app.get('/api/props', authenticate, propsRouter);
  app.get('/api/props/:name', authenticate, propsRouter);
  app.post('/api/props', authenticate, requireRole('operator'), propsRouter);
  app.put('/api/props/:name', authenticate, requireRole('operator'), propsRouter);
  app.delete('/api/props/:name', authenticate, requireRole('operator'), propsRouter);
  // Fallback mount for any missed sub-routes
  app.use('/api/props', authenticate, propsRouter);

  // --- Tenants: operator full CRUD, tenant read own, landlord read their tenants ---
  const tenantsRouter = require('./backend/routes/tenants')(db);
  app.use('/api/tenants', authenticate, tenantsRouter);

  // --- Tickets: all roles can read, tenant/operator can create, operator can manage ---
  const ticketsRouter = require('./backend/routes/tickets')(db);
  app.use('/api/tickets', authenticate, ticketsRouter);

  // --- Bills: all authenticated can read, operator manages ---
  const billsRouter = require('./backend/routes/bills')(db);
  app.use('/api/bills', authenticate, billsRouter);

  // --- Vendors: operator/vendor access ---
  const vendorsRouter = require('./backend/routes/vendors')(db);
  app.use('/api/vendors', authenticate, vendorsRouter);

  // --- Work Orders: operator/vendor access ---
  const workOrdersRouter = require('./backend/routes/work-orders')(db);
  app.use('/api/work-orders', authenticate, workOrdersRouter);

  // --- Leads: operator/agent access ---
  const leadsRouter = require('./backend/routes/leads')(db);
  app.use('/api/leads', authenticate, requireRole('operator', 'agent'), leadsRouter);

  // --- Landlords: operator/landlord access ---
  const landlordsRouter = require('./backend/routes/landlords')(db);
  app.use('/api/landlords', authenticate, landlordsRouter);

  // --- Contracts: all authenticated can read, operator manages ---
  const contractsRouter = require('./backend/routes/contracts')(db);
  app.use('/api/contracts', authenticate, contractsRouter);

  // --- Utility Bills: all authenticated ---
  const utilityBillsRouter = require('./backend/routes/utility-bills')(db);
  app.use('/api/utility-bills', authenticate, utilityBillsRouter);

  // --- IoT: operator manages, tenant reads own devices ---
  const iotRouter = require('./backend/routes/iot')(db);
  app.use('/api/iot', authenticate, iotRouter);

  // --- Misc: various access levels ---
  const miscRouter = require('./backend/routes/misc')(db);
  app.use('/api/misc', authenticate, miscRouter);

  // --- Reports: all authenticated (CSV export) ---
  const reportsRouter = require('./backend/routes/reports')(db);
  app.use('/api/reports', authenticate, reportsRouter);

  // --- Audit: operator only ---
  const auditRouter = require('./backend/routes/audit')(db);
  app.use('/api/audit', authenticate, requireRole('operator'), auditRouter);

  // --- WebSocket status endpoint ---
  app.get('/api/ws/status', authenticate, requireRole('operator'), (req, res) => {
    res.json({
      connectedClients: getClientCount(),
      authenticatedUsers: getConnectedUsers()
    });
  });

  // ---- Static Files (serves frontend from project root) ----
  app.use(express.static(path.join(__dirname), {
    extensions: ['html', 'css', 'js'],
    index: 'index.html'
  }));

  // Fallback: SPA — serve index.html for any non-API, non-file request
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    if (path.extname(req.path)) {
      return next();
    }
    res.sendFile(path.join(__dirname, 'index.html'));
  });

  // ---- Centralized Error Handler (MUST be last middleware) ----
  app.use(errorHandler);

  // ---- Start Server + WebSocket ----
  const server = app.listen(PORT, () => {
    console.log('');
    console.log('  ===================================');
    console.log('  WeStay Backend Server');
    console.log('  ===================================');
    console.log('  Frontend  : http://localhost:' + PORT);
    console.log('  API Base  : http://localhost:' + PORT + '/api');
    console.log('  API Docs  : http://localhost:' + PORT + '/api/docs/ui');
    console.log('  WebSocket : ws://localhost:' + PORT + '/ws');
    console.log('  Database  : SQLite (backend/data/westay.db)');
    console.log('  Auth      : JWT + bcrypt');
    console.log('  Security  : helmet + rate-limit + CORS + input sanitization');
    console.log('  i18n      : English, Malay, Chinese');
    console.log('  ===================================');
    console.log('');
    console.log('  Default Accounts:');
    console.log('    operator / op123456     (full access)');
    console.log('    sarah    / tenant123    (tenant - Sarah Lim)');
    console.log('    landlord / landlord123  (landlord - Dato Lee Wei)');
    console.log('    vendor   / vendor123    (vendor - AirCool Services)');
    console.log('    agent    / agent123     (agent)');
    console.log('');
    console.log('  New Features:');
    console.log('    /api/docs/ui           Interactive API documentation');
    console.log('    /api/reports/*         Report export (JSON + CSV)');
    console.log('    /api/audit             Audit log (operator only)');
    console.log('    /api/i18n/locales      Supported languages');
    console.log('    ws://localhost:' + PORT + '/ws    Real-time events');
    console.log('');
  });

  // Attach WebSocket handler to the HTTP server
  attachWebSocket(server);

  dbReady = true;
})();
