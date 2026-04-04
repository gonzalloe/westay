// ============ WESTAY EXPRESS BACKEND SERVER ============
// Full-stack: SQLite DB + JWT Auth + Role-based Access + REST API
// Repository pattern: swap sqlite-adapter for mysql/mongo in db/index.js

const express = require('express');
const cors = require('cors');
const path = require('path');
const { getDB } = require('./backend/db');
const { authenticate, requireRole, optionalAuth } = require('./backend/middleware/auth');

const app = express();
const PORT = process.env.PORT || 3456;

// ---- Middleware ----
app.use(cors());
app.use(express.json({ limit: '5mb' }));

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

  // ---- Start Server ----
  app.listen(PORT, () => {
    console.log('');
    console.log('  ===================================');
    console.log('  WeStay Backend Server');
    console.log('  ===================================');
    console.log('  Frontend : http://localhost:' + PORT);
    console.log('  API Base : http://localhost:' + PORT + '/api');
    console.log('  Database : SQLite (backend/data/westay.db)');
    console.log('  Auth     : JWT + bcrypt');
    console.log('  ===================================');
    console.log('');
    console.log('  Default Accounts:');
    console.log('    operator / op123456     (full access)');
    console.log('    sarah    / tenant123    (tenant - Sarah Lim)');
    console.log('    landlord / landlord123  (landlord - Dato Lee Wei)');
    console.log('    vendor   / vendor123    (vendor - AirCool Services)');
    console.log('    agent    / agent123     (agent)');
    console.log('');
    console.log('  Auth Endpoints:');
    console.log('    POST /api/auth/login       Login (get JWT)');
    console.log('    POST /api/auth/register    Create user (operator only)');
    console.log('    GET  /api/auth/me          Current user profile');
    console.log('    PATCH /api/auth/password   Change password');
    console.log('    GET  /api/auth/users       List users (operator only)');
    console.log('');
    console.log('  Data Endpoints (all require Bearer token):');
    console.log('    /api/props, /api/tenants, /api/tickets, /api/bills');
    console.log('    /api/vendors, /api/work-orders, /api/leads');
    console.log('    /api/landlords, /api/contracts, /api/utility-bills');
    console.log('    /api/iot/*, /api/misc/*');
    console.log('');
  });

  dbReady = true;
})();
