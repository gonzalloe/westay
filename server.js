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
const { logger, httpLogger } = require('./backend/middleware/logger');
const { i18nMiddleware } = require('./backend/i18n');
const { attachWebSocket, broadcast, getClientCount, getConnectedUsers } = require('./backend/websocket');
const { isSSLEnabled, createHTTPSServer, createRedirectServer } = require('./backend/https');
const payment = require('./backend/services/payment');

const app = express();
const PORT = process.env.PORT || 3456;

// ---- Security Middleware ----

// Helmet: HTTP security headers (CSP, HSTS, X-Frame, etc.)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],    // SPA uses inline event handlers
      styleSrc: ["'self'", "'unsafe-inline'"],      // SPA uses inline styles
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", "ws:", "wss:", "https://checkout.stripe.com", "https://api.stripe.com"],
      frameSrc: ["'self'", "https://checkout.stripe.com"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: []
    }
  },
  crossOriginEmbedderPolicy: false
}));

// CORS: restrict origins in production
const corsOrigin = process.env.CORS_ORIGIN || '*';
app.use(cors({
  origin: corsOrigin === '*' ? true : corsOrigin.split(',').map(s => s.trim()),
  credentials: true
}));

// Stripe webhook needs raw body BEFORE json parser
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    if (!payment.isConfigured()) {
      return res.status(503).json({ error: 'Payment gateway not configured' });
    }
    const sig = req.headers['stripe-signature'];
    const event = payment.constructWebhookEvent(req.body, sig);

    // Handle Checkout Session completed — auto-mark bill as paid
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      if (session.payment_status === 'paid' && session.metadata && session.metadata.billId) {
        const billId = session.metadata.billId;
        const billType = session.metadata.billType || 'rent';
        const piId = session.payment_intent;
        logger.info('Checkout completed — marking bill paid', { billId, billType, paymentIntent: piId });
        try {
          const { getDB } = require('./backend/db');
          const db = await getDB();
          if (billType === 'utility') {
            await db.update('utility_bills', billId, { status: 'Paid', paidAt: new Date().toISOString(), paymentMethod: 'stripe', paymentIntentId: piId });
          } else {
            await db.update('bills', billId, { s: 'Paid', paidAt: new Date().toISOString(), paymentMethod: 'stripe', paymentIntentId: piId });
          }
          const broadcast = app.get('broadcast');
          if (broadcast) broadcast('bills', 'paid', { billId, billType });
        } catch(dbErr) {
          logger.error('Webhook DB update failed', { error: dbErr.message, billId });
        }
      }
    } else if (event.type === 'payment_intent.succeeded') {
      const pi = event.data.object;
      logger.info('Payment succeeded', { paymentIntentId: pi.id, amount: pi.amount, billId: pi.metadata.billId });
    } else if (event.type === 'payment_intent.payment_failed') {
      const pi = event.data.object;
      logger.warn('Payment failed', { paymentIntentId: pi.id, billId: pi.metadata.billId });
    }

    res.json({ received: true });
  } catch (e) {
    logger.error('Webhook error', { error: e.message });
    res.status(400).json({ error: 'Webhook processing failed' });
  }
});

// Body parser with size limit
app.use(express.json({ limit: '5mb' }));

// HTTP request logging
app.use(httpLogger);

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

// Forgot-password rate limit (prevent email enumeration / account takeover)
const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts per hour per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many password reset attempts, please try again in 1 hour' }
});
app.use('/api/auth/forgot-password', forgotPasswordLimiter);

// ---- DB initialization guard ----
let dbReady = false;

app.use('/api', async (req, res, next) => {
  if (!dbReady) {
    try {
      await getDB();
      dbReady = true;
    } catch(e) {
      return res.status(500).json({ error: 'Database initialization failed' });
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

  // --- Properties: admin/operator full CRUD, others read-only ---
  const propsRouter = require('./backend/routes/props')(db);
  app.get('/api/props', authenticate, propsRouter);
  app.get('/api/props/:name', authenticate, propsRouter);
  app.post('/api/props', authenticate, requireRole('admin', 'operator'), propsRouter);
  app.put('/api/props/:name', authenticate, requireRole('admin', 'operator'), propsRouter);
  app.delete('/api/props/:name', authenticate, requireRole('admin', 'operator'), propsRouter);
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

  // --- Leads: admin/operator/agent access ---
  const leadsRouter = require('./backend/routes/leads')(db);
  app.use('/api/leads', authenticate, requireRole('admin', 'operator', 'agent'), leadsRouter);

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

  // --- Payments: all authenticated (Stripe + manual) ---
  const paymentsRouter = require('./backend/routes/payments')(db);
  app.use('/api/payments', authenticate, paymentsRouter);

  // --- Notifications: operator can send bulk, authenticated can send individual ---
  const notificationsRouter = require('./backend/routes/notifications')(db);
  app.use('/api/notifications', authenticate, notificationsRouter);

  // --- Audit: admin only ---
  const auditRouter = require('./backend/routes/audit')(db);
  app.use('/api/audit', authenticate, requireRole('admin'), auditRouter);

  // --- WebSocket status endpoint ---
  app.get('/api/ws/status', authenticate, requireRole('admin'), (req, res) => {
    res.json({
      connectedClients: getClientCount(),
      authenticatedUsers: getConnectedUsers()
    });
  });

  // ---- Serve uploaded files (authenticated) ----
  app.use('/uploads', authenticate, express.static(path.join(__dirname, 'backend', 'uploads')));

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

  // ---- Start Server (HTTP or HTTPS) + WebSocket ----
  let server;
  const httpsServer = createHTTPSServer(app);

  if (httpsServer) {
    // HTTPS mode
    server = httpsServer;
    server.listen(PORT, () => {
      logger.info('WeStay server started (HTTPS)', { port: PORT });
      printStartupBanner('https');
    });

    // HTTP -> HTTPS redirect on port 80 (if available)
    const redirectPort = parseInt(process.env.HTTP_REDIRECT_PORT) || 80;
    try {
      const redirect = createRedirectServer(PORT);
      redirect.listen(redirectPort, () => {
        logger.info('HTTP redirect server', { from: redirectPort, to: PORT });
      });
    } catch (e) {
      logger.debug('HTTP redirect server not started (port ' + redirectPort + ' unavailable)');
    }
  } else {
    // HTTP mode (default)
    server = app.listen(PORT, () => {
      logger.info('WeStay server started (HTTP)', { port: PORT });
      printStartupBanner('http');
    });
  }

  // Attach WebSocket handler to the HTTP(S) server
  attachWebSocket(server);

  dbReady = true;

  // ---- Graceful Shutdown ----
  function shutdown(signal) {
    logger.info('Shutdown signal received', { signal });
    server.close(() => {
      logger.info('HTTP server closed');
      getDB().then(db => {
        if (db && db._save) db._save();
        logger.info('Database saved — clean exit');
        process.exit(0);
      }).catch(() => process.exit(1));
    });
    // Force exit after 10s if graceful shutdown hangs
    setTimeout(() => {
      logger.error('Forced shutdown after 10s timeout');
      process.exit(1);
    }, 10000);
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception', { error: err.message, stack: err.stack });
    shutdown('uncaughtException');
  });
  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled rejection', { reason: String(reason) });
  });
})();

function printStartupBanner(protocol) {
  const base = protocol + '://localhost:' + PORT;
  console.log('');
  console.log('  ===================================');
  console.log('  WeStay Backend Server');
  console.log('  ===================================');
  console.log('  Frontend  : ' + base);
  console.log('  API Base  : ' + base + '/api');
  console.log('  API Docs  : ' + base + '/api/docs/ui');
  console.log('  WebSocket : ws://localhost:' + PORT + '/ws');
  console.log('  Database  : SQLite (backend/data/westay.db)');
  console.log('  Auth      : JWT + bcrypt');
  console.log('  Security  : helmet + rate-limit + CORS + input sanitization');
  console.log('  HTTPS     : ' + (isSSLEnabled() ? 'Enabled' : 'Disabled (set SSL_ENABLED=true)'));
  console.log('  Payments  : ' + (payment.isConfigured() ? 'Stripe (live)' : 'Not configured'));
  console.log('  i18n      : English, Malay, Chinese');
  console.log('  Logging   : Structured (logs/app.log, logs/error.log, logs/http.log)');
  console.log('  ===================================');
  console.log('');
  console.log('  Default Accounts:');
  console.log('    admin    / admin123456   (system admin — full access)');
  console.log('    operator / op123456      (operator — routine operations)');
  console.log('    sarah    / tenant123     (tenant - Sarah Lim)');
  console.log('    landlord / landlord123   (landlord - Dato Lee Wei)');
  console.log('    vendor   / vendor123     (vendor - AirCool Services)');
  console.log('    agent    / agent123      (agent)');
  console.log('');
}
