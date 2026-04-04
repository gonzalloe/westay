// ============ AUTO-GENERATED API DOCUMENTATION ============
// Serves OpenAPI 3.0 spec at GET /api/docs
// Serves HTML docs viewer at GET /api/docs/ui
// No external dependencies — self-contained

const express = require('express');
const router = express.Router();

// ---- OpenAPI 3.0 Specification ----
const spec = {
  openapi: '3.0.3',
  info: {
    title: 'WeStay API',
    description: 'RESTful API for WeStay Co-Living Property Management Platform. Supports JWT authentication, role-based access, pagination, and real-time WebSocket events.',
    version: '1.0.0',
    contact: { name: 'WeStay Team', url: 'https://github.com/gonzalloe/westay' },
    license: { name: 'ISC' }
  },
  servers: [
    { url: '/api', description: 'Current server' }
  ],
  tags: [
    { name: 'Auth', description: 'Authentication & user management' },
    { name: 'Properties', description: 'Property/unit CRUD' },
    { name: 'Tenants', description: 'Tenant management' },
    { name: 'Tickets', description: 'Maintenance tickets' },
    { name: 'Bills', description: 'Billing & invoicing' },
    { name: 'Vendors', description: 'Vendor management' },
    { name: 'Work Orders', description: 'Maintenance work orders' },
    { name: 'Leads', description: 'Lead/prospect pipeline' },
    { name: 'Landlords', description: 'Landlord management & reports' },
    { name: 'Contracts', description: 'Tenancy agreements' },
    { name: 'Utility Bills', description: 'Utility bill generation' },
    { name: 'IoT', description: 'Electric/water meters, smart locks, IoT locks' },
    { name: 'Misc', description: 'Notifications, automations, check-in/out, config' },
    { name: 'Reports', description: 'Report export (JSON/CSV)' },
    { name: 'Audit', description: 'Audit log & change tracking' },
    { name: 'i18n', description: 'Internationalization' },
    { name: 'WebSocket', description: 'Real-time events (ws://)' }
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token from POST /api/auth/login'
      }
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'Not found' },
          details: { type: 'array', items: { type: 'string' } }
        }
      },
      Paginated: {
        type: 'object',
        properties: {
          data: { type: 'array', items: {} },
          pagination: {
            type: 'object',
            properties: {
              page: { type: 'integer' },
              limit: { type: 'integer' },
              total: { type: 'integer' },
              totalPages: { type: 'integer' }
            }
          }
        }
      },
      LoginRequest: {
        type: 'object',
        required: ['username', 'password'],
        properties: {
          username: { type: 'string', maxLength: 50, example: 'operator' },
          password: { type: 'string', maxLength: 128, example: 'op123456' }
        }
      },
      LoginResponse: {
        type: 'object',
        properties: {
          token: { type: 'string' },
          user: {
            type: 'object',
            properties: {
              id: { type: 'integer' },
              username: { type: 'string' },
              role: { type: 'string', enum: ['admin', 'operator', 'tenant', 'landlord', 'vendor', 'agent'] },
              name: { type: 'string' }
            }
          }
        }
      },
      Property: {
        type: 'object',
        properties: {
          n: { type: 'string', description: 'Property name (primary key)' },
          o: { type: 'number', description: 'Occupancy %' },
          r: { type: 'number', description: 'Room count' },
          c: { type: 'string', description: 'Color hex' },
          icon: { type: 'string' },
          addr: { type: 'string' },
          rev: { type: 'number', description: 'Revenue' },
          type: { type: 'string' }
        }
      },
      Tenant: {
        type: 'object',
        properties: {
          n: { type: 'string', description: 'Name (primary key)' },
          p: { type: 'string', description: 'Unit assignment' },
          r: { type: 'string', description: 'Rent amount' },
          s: { type: 'string', enum: ['active', 'pending', 'overdue'] },
          e: { type: 'string', description: 'Lease end date' },
          phone: { type: 'string' },
          dep: { type: 'string', description: 'Deposit' }
        }
      },
      Bill: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'INV-2604' },
          t: { type: 'string', description: 'Tenant name' },
          a: { type: 'string', description: 'Amount' },
          s: { type: 'string', enum: ['Pending', 'Paid', 'Overdue'] },
          d: { type: 'string', description: 'Date' },
          prop: { type: 'string', description: 'Property' }
        }
      },
      AuditEntry: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          timestamp: { type: 'string', format: 'date-time' },
          action: { type: 'string', enum: ['create', 'update', 'delete', 'login', 'password_change', 'status_change', 'data_reset'] },
          entity: { type: 'string' },
          entityId: { type: 'string' },
          userId: { type: 'integer' },
          username: { type: 'string' },
          role: { type: 'string' },
          ip: { type: 'string' },
          details: { type: 'object' }
        }
      }
    },
    parameters: {
      Pagination: {
        page: { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1 }, description: 'Page number (omit for raw array)' },
        limit: { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 200, default: 50 }, description: 'Items per page' }
      },
      Lang: {
        name: 'lang', in: 'query', schema: { type: 'string', enum: ['en', 'ms', 'zh'] }, description: 'Response language'
      }
    }
  },
  paths: {
    // ---- Auth ----
    '/auth/login': {
      post: {
        tags: ['Auth'], summary: 'Login', operationId: 'login',
        description: 'Authenticate with username/password, returns JWT token (7-day expiry). Rate limited: 5 attempts per 15 minutes.',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } } },
        responses: {
          200: { description: 'Login successful', content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginResponse' } } } },
          401: { description: 'Invalid credentials' },
          429: { description: 'Rate limited' }
        }
      }
    },
    '/auth/register': {
      post: {
        tags: ['Auth'], summary: 'Register new user', operationId: 'register', security: [{ BearerAuth: [] }],
        description: 'Create a new user account. Admin only.',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['username', 'password', 'name'], properties: { username: { type: 'string' }, password: { type: 'string', minLength: 6 }, name: { type: 'string' }, role: { type: 'string', enum: ['admin', 'operator', 'tenant', 'landlord', 'vendor', 'agent'] }, email: { type: 'string' }, phone: { type: 'string' } } } } } },
        responses: { 201: { description: 'User created' }, 409: { description: 'Username exists' } }
      }
    },
    '/auth/me': {
      get: { tags: ['Auth'], summary: 'Current user profile', security: [{ BearerAuth: [] }], responses: { 200: { description: 'User profile' } } }
    },
    '/auth/password': {
      patch: { tags: ['Auth'], summary: 'Change password', security: [{ BearerAuth: [] }], responses: { 200: { description: 'Password changed' } } }
    },
    '/auth/users': {
      get: { tags: ['Auth'], summary: 'List all users (admin only)', security: [{ BearerAuth: [] }], responses: { 200: { description: 'User list' } } }
    },
    '/auth/users/{id}': {
      delete: { tags: ['Auth'], summary: 'Delete user (admin only)', security: [{ BearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'Deleted' } } }
    },

    // ---- CRUD pattern (Properties, Tenants, etc.) ----
    '/props': { get: { tags: ['Properties'], summary: 'List all properties', security: [{ BearerAuth: [] }], parameters: [], responses: { 200: { description: 'Property list' } } }, post: { tags: ['Properties'], summary: 'Create property (admin/operator)', security: [{ BearerAuth: [] }], responses: { 201: { description: 'Created' } } } },
    '/props/{name}': { get: { tags: ['Properties'], summary: 'Get property by name', security: [{ BearerAuth: [] }], parameters: [{ name: 'name', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Property' } } }, put: { tags: ['Properties'], summary: 'Update property', security: [{ BearerAuth: [] }], responses: { 200: { description: 'Updated' } } }, delete: { tags: ['Properties'], summary: 'Delete property', security: [{ BearerAuth: [] }], responses: { 200: { description: 'Deleted' } } } },

    '/tenants': { get: { tags: ['Tenants'], summary: 'List tenants (?status=active&prop=Cambridge)', security: [{ BearerAuth: [] }], responses: { 200: { description: 'Tenant list' } } }, post: { tags: ['Tenants'], summary: 'Create tenant', security: [{ BearerAuth: [] }], responses: { 201: { description: 'Created' } } } },
    '/tenants/{name}': { get: { tags: ['Tenants'], summary: 'Get tenant', security: [{ BearerAuth: [] }], responses: { 200: { description: 'Tenant' } } }, put: { tags: ['Tenants'], summary: 'Update tenant', security: [{ BearerAuth: [] }], responses: { 200: { description: 'Updated' } } }, delete: { tags: ['Tenants'], summary: 'Delete tenant', security: [{ BearerAuth: [] }], responses: { 200: { description: 'Deleted' } } } },

    '/tickets': { get: { tags: ['Tickets'], summary: 'List tickets (?pr=High&s=Open)', security: [{ BearerAuth: [] }], responses: { 200: { description: 'Ticket list' } } }, post: { tags: ['Tickets'], summary: 'Create ticket', security: [{ BearerAuth: [] }], responses: { 201: { description: 'Created' } } } },
    '/tickets/{id}': { get: { tags: ['Tickets'], summary: 'Get ticket', security: [{ BearerAuth: [] }], responses: { 200: { description: 'Ticket' } } }, put: { tags: ['Tickets'], summary: 'Update ticket', security: [{ BearerAuth: [] }], responses: { 200: { description: 'Updated' } } }, delete: { tags: ['Tickets'], summary: 'Delete ticket', security: [{ BearerAuth: [] }], responses: { 200: { description: 'Deleted' } } } },
    '/tickets/{id}/status': { patch: { tags: ['Tickets'], summary: 'Update ticket status', security: [{ BearerAuth: [] }], responses: { 200: { description: 'Status updated' } } } },

    '/bills': { get: { tags: ['Bills'], summary: 'List bills (?s=Pending&t=Sarah+Lim)', security: [{ BearerAuth: [] }], responses: { 200: { description: 'Bill list' } } }, post: { tags: ['Bills'], summary: 'Create bill', security: [{ BearerAuth: [] }], responses: { 201: { description: 'Created' } } } },
    '/bills/{id}': { get: { tags: ['Bills'], summary: 'Get bill', security: [{ BearerAuth: [] }], responses: { 200: { description: 'Bill' } } }, put: { tags: ['Bills'], summary: 'Update bill', security: [{ BearerAuth: [] }], responses: { 200: { description: 'Updated' } } }, delete: { tags: ['Bills'], summary: 'Delete bill', security: [{ BearerAuth: [] }], responses: { 200: { description: 'Deleted' } } } },
    '/bills/{id}/pay': { patch: { tags: ['Bills'], summary: 'Pay bill (auto-reconnects meter & lock)', security: [{ BearerAuth: [] }], responses: { 200: { description: 'Paid + reconnection info' } } } },
    '/bills/generate': { post: { tags: ['Bills'], summary: 'Auto-generate invoices for active tenants', security: [{ BearerAuth: [] }], responses: { 200: { description: '{ generated: count }' } } } },

    '/vendors': { get: { tags: ['Vendors'], summary: 'List vendors', security: [{ BearerAuth: [] }], responses: { 200: { description: 'Vendor list' } } }, post: { tags: ['Vendors'], summary: 'Create vendor', security: [{ BearerAuth: [] }], responses: { 201: { description: 'Created' } } } },
    '/work-orders': { get: { tags: ['Work Orders'], summary: 'List work orders', security: [{ BearerAuth: [] }], responses: { 200: { description: 'Work order list' } } }, post: { tags: ['Work Orders'], summary: 'Create work order', security: [{ BearerAuth: [] }], responses: { 201: { description: 'Created' } } } },
    '/leads': { get: { tags: ['Leads'], summary: 'List leads (operator/agent)', security: [{ BearerAuth: [] }], responses: { 200: { description: 'Lead list' } } }, post: { tags: ['Leads'], summary: 'Create lead', security: [{ BearerAuth: [] }], responses: { 201: { description: 'Created' } } } },
    '/landlords': { get: { tags: ['Landlords'], summary: 'List landlords', security: [{ BearerAuth: [] }], responses: { 200: { description: 'Landlord list' } } }, post: { tags: ['Landlords'], summary: 'Create landlord', security: [{ BearerAuth: [] }], responses: { 201: { description: 'Created' } } } },
    '/landlords/{name}/report': { get: { tags: ['Landlords'], summary: 'Owner report (revenue, meters, expenses)', security: [{ BearerAuth: [] }], responses: { 200: { description: 'Owner report data' } } } },
    '/contracts': { get: { tags: ['Contracts'], summary: 'List contracts', security: [{ BearerAuth: [] }], responses: { 200: { description: 'Contract list' } } }, post: { tags: ['Contracts'], summary: 'Create contract', security: [{ BearerAuth: [] }], responses: { 201: { description: 'Created' } } } },
    '/contracts/{id}/sign': { patch: { tags: ['Contracts'], summary: 'E-sign contract', security: [{ BearerAuth: [] }], responses: { 200: { description: 'Signed' } } } },
    '/utility-bills': { get: { tags: ['Utility Bills'], summary: 'List utility bills', security: [{ BearerAuth: [] }], responses: { 200: { description: 'Utility bill list' } } } },
    '/utility-bills/generate': { post: { tags: ['Utility Bills'], summary: 'Auto-generate from meter readings', security: [{ BearerAuth: [] }], responses: { 200: { description: 'Generated' } } } },
    '/utility-bills/{id}/pay': { patch: { tags: ['Utility Bills'], summary: 'Pay utility bill', security: [{ BearerAuth: [] }], responses: { 200: { description: 'Paid' } } } },

    // ---- IoT ----
    '/iot/electric-meters': { get: { tags: ['IoT'], summary: 'List electric meters', security: [{ BearerAuth: [] }], responses: { 200: { description: 'Meter list' } } } },
    '/iot/electric-meters/{meterId}/cut': { patch: { tags: ['IoT'], summary: 'Disconnect electric meter', security: [{ BearerAuth: [] }], responses: { 200: { description: 'Disconnected' } } } },
    '/iot/electric-meters/{meterId}/reconnect': { patch: { tags: ['IoT'], summary: 'Reconnect electric meter', security: [{ BearerAuth: [] }], responses: { 200: { description: 'Reconnected' } } } },
    '/iot/water-meters': { get: { tags: ['IoT'], summary: 'List water meters', security: [{ BearerAuth: [] }], responses: { 200: { description: 'Water meter list' } } } },
    '/iot/smart-locks': { get: { tags: ['IoT'], summary: 'List smart lock registry', security: [{ BearerAuth: [] }], responses: { 200: { description: 'Smart lock list' } } } },
    '/iot/locks': { get: { tags: ['IoT'], summary: 'List IoT locks', security: [{ BearerAuth: [] }], responses: { 200: { description: 'IoT lock list' } } } },
    '/iot/locks/{id}/toggle': { patch: { tags: ['IoT'], summary: 'Toggle lock/unlock', security: [{ BearerAuth: [] }], responses: { 200: { description: 'Toggled' } } } },

    // ---- Misc ----
    '/misc/checkinout': { get: { tags: ['Misc'], summary: 'List check-in/out records', security: [{ BearerAuth: [] }], responses: { 200: { description: 'Record list' } } }, post: { tags: ['Misc'], summary: 'Create inspection', security: [{ BearerAuth: [] }], responses: { 201: { description: 'Created' } } } },
    '/misc/notifs': { get: { tags: ['Misc'], summary: 'List notifications', security: [{ BearerAuth: [] }], responses: { 200: { description: 'Notification list' } } }, post: { tags: ['Misc'], summary: 'Create notification', security: [{ BearerAuth: [] }], responses: { 201: { description: 'Created' } } } },
    '/misc/notifs/{id}/read': { patch: { tags: ['Misc'], summary: 'Mark notification as read', security: [{ BearerAuth: [] }], responses: { 200: { description: 'Marked' } } } },
    '/misc/notifs/read-all': { patch: { tags: ['Misc'], summary: 'Mark all notifications read', security: [{ BearerAuth: [] }], responses: { 200: { description: 'All marked' } } } },
    '/misc/automations': { get: { tags: ['Misc'], summary: 'List automations', security: [{ BearerAuth: [] }], responses: { 200: { description: 'Automation list' } } } },
    '/misc/automations/{key}/toggle': { patch: { tags: ['Misc'], summary: 'Toggle automation on/off', security: [{ BearerAuth: [] }], responses: { 200: { description: 'Toggled' } } } },
    '/misc/all-data': { get: { tags: ['Misc'], summary: 'Bulk fetch all data (21 collections)', security: [{ BearerAuth: [] }], responses: { 200: { description: 'All data' } } } },
    '/misc/reset': { post: { tags: ['Misc'], summary: 'Reset all data to demo (admin only)', security: [{ BearerAuth: [] }], responses: { 200: { description: 'Data reset' } } } },
    '/misc/save-data': { post: { tags: ['Misc'], summary: 'Bulk save data (admin only)', security: [{ BearerAuth: [] }], responses: { 200: { description: 'Saved' } } } },

    // ---- Reports ----
    '/reports/owner/{name}': { get: { tags: ['Reports'], summary: 'Owner report JSON', security: [{ BearerAuth: [] }], parameters: [{ name: 'name', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'Owner report' } } } },
    '/reports/owner/{name}/csv': { get: { tags: ['Reports'], summary: 'Owner report CSV download', security: [{ BearerAuth: [] }], parameters: [{ name: 'name', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'CSV file', content: { 'text/csv': {} } } } } },
    '/reports/portfolio': { get: { tags: ['Reports'], summary: 'Portfolio report JSON', security: [{ BearerAuth: [] }], responses: { 200: { description: 'Portfolio report' } } } },
    '/reports/portfolio/csv': { get: { tags: ['Reports'], summary: 'Portfolio report CSV', security: [{ BearerAuth: [] }], responses: { 200: { description: 'CSV file' } } } },
    '/reports/tenants/csv': { get: { tags: ['Reports'], summary: 'Export tenants as CSV', security: [{ BearerAuth: [] }], responses: { 200: { description: 'CSV file' } } } },
    '/reports/bills/csv': { get: { tags: ['Reports'], summary: 'Export bills as CSV', security: [{ BearerAuth: [] }], responses: { 200: { description: 'CSV file' } } } },
    '/reports/tickets/csv': { get: { tags: ['Reports'], summary: 'Export tickets as CSV', security: [{ BearerAuth: [] }], responses: { 200: { description: 'CSV file' } } } },
    '/reports/work-orders/csv': { get: { tags: ['Reports'], summary: 'Export work orders as CSV', security: [{ BearerAuth: [] }], responses: { 200: { description: 'CSV file' } } } },

    // ---- Audit ----
    '/audit': { get: { tags: ['Audit'], summary: 'Query audit logs (?action=create&entity=props&from=2026-04-01)', security: [{ BearerAuth: [] }], description: 'Admin only. Supports filters: action, entity, userId, username, from, to, limit.', responses: { 200: { description: 'Audit log entries' } } } },
    '/audit/stats': { get: { tags: ['Audit'], summary: 'Audit log statistics', security: [{ BearerAuth: [] }], responses: { 200: { description: 'Aggregated stats' } } } },
    '/audit/export': { get: { tags: ['Audit'], summary: 'Export audit logs as CSV', security: [{ BearerAuth: [] }], responses: { 200: { description: 'CSV file' } } } },

    // ---- i18n ----
    '/i18n/locales': { get: { tags: ['i18n'], summary: 'List supported locales', responses: { 200: { description: '["en","ms","zh"]' } } } },
    '/i18n/translations/{locale}': { get: { tags: ['i18n'], summary: 'Get all translations for a locale', parameters: [{ name: 'locale', in: 'path', required: true, schema: { type: 'string', enum: ['en', 'ms', 'zh'] } }], responses: { 200: { description: 'Translation object' } } } }
  }
};

module.exports = function () {
  // GET /api/docs — OpenAPI JSON spec
  router.get('/', (req, res) => {
    res.json(spec);
  });

  // GET /api/docs/ui — Swagger-like HTML viewer (no external dependencies)
  router.get('/ui', (req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WeStay API Documentation</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; background:#fafafa; color:#333; }
    .header { background:linear-gradient(135deg,#6C5CE7,#a29bfe); color:#fff; padding:32px 40px; }
    .header h1 { font-size:28px; margin-bottom:8px; }
    .header p { opacity:0.9; font-size:14px; }
    .container { max-width:1100px; margin:0 auto; padding:24px; }
    .tag-section { margin-bottom:32px; }
    .tag-title { font-size:20px; font-weight:700; color:#6C5CE7; margin-bottom:12px; padding-bottom:8px; border-bottom:2px solid #e8e6ff; }
    .endpoint { background:#fff; border:1px solid #e0e0e0; border-radius:8px; margin-bottom:8px; overflow:hidden; }
    .endpoint-header { display:flex; align-items:center; padding:12px 16px; cursor:pointer; gap:12px; }
    .endpoint-header:hover { background:#f5f5f5; }
    .method { font-size:12px; font-weight:700; padding:4px 10px; border-radius:4px; color:#fff; min-width:60px; text-align:center; text-transform:uppercase; }
    .method-get { background:#00B894; }
    .method-post { background:#6C5CE7; }
    .method-put { background:#FDCB6E; color:#333; }
    .method-patch { background:#FD79A8; }
    .method-delete { background:#E17055; }
    .path { font-family:'Courier New',monospace; font-size:14px; font-weight:600; }
    .summary { color:#666; font-size:13px; margin-left:auto; }
    .auth-badge { font-size:10px; background:#ffeaa7; color:#6c5ce7; padding:2px 8px; border-radius:3px; font-weight:600; }
    .info-box { background:#e8e6ff; border-radius:8px; padding:16px; margin-bottom:24px; font-size:13px; line-height:1.6; }
    .info-box code { background:#fff; padding:2px 6px; border-radius:3px; font-size:12px; }
    .stats { display:flex; gap:16px; margin:16px 0; flex-wrap:wrap; }
    .stat { background:#fff; border:1px solid #e0e0e0; border-radius:8px; padding:16px 24px; text-align:center; }
    .stat-num { font-size:28px; font-weight:700; color:#6C5CE7; }
    .stat-label { font-size:12px; color:#888; margin-top:4px; }
    @media(max-width:600px) { .summary { display:none; } .container { padding:12px; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>\u26a1 WeStay API Documentation</h1>
    <p>v1.0.0 &mdash; RESTful API for Co-Living Property Management</p>
    <p style="margin-top:8px;font-size:12px;opacity:0.7">OpenAPI spec: <a href="/api/docs" style="color:#ffeaa7">/api/docs</a> &bull; WebSocket: <code>ws://localhost:PORT/ws</code></p>
  </div>
  <div class="container">
    <div class="stats" id="stats"></div>
    <div class="info-box">
      <strong>Authentication:</strong> POST <code>/api/auth/login</code> with <code>{"username":"admin","password":"admin123456"}</code> to get a JWT token.
      Include <code>Authorization: Bearer &lt;token&gt;</code> header on all subsequent requests.<br>
      <strong>Pagination:</strong> Add <code>?page=1&limit=50</code> to any list endpoint. Without <code>page</code>, returns raw array.<br>
      <strong>Language:</strong> Add <code>?lang=ms</code> or <code>?lang=zh</code> for Malay/Chinese error messages. Also respects <code>Accept-Language</code> header.<br>
      <strong>Rate Limits:</strong> Global API: 300 req/15min. Login: 5 attempts/15min.
    </div>
    <div id="endpoints"></div>
  </div>
  <script>
    fetch('/api/docs').then(r=>r.json()).then(spec=>{
      const el=document.getElementById('endpoints');
      const statsEl=document.getElementById('stats');
      const tags=spec.tags||[];
      let totalEndpoints=0;
      const tagPaths={};
      for(const[path,methods]of Object.entries(spec.paths||{})){
        for(const[method,op]of Object.entries(methods)){
          totalEndpoints++;
          const tag=(op.tags&&op.tags[0])||'Other';
          if(!tagPaths[tag])tagPaths[tag]=[];
          tagPaths[tag].push({method,path,op});
        }
      }
      statsEl.innerHTML='<div class="stat"><div class="stat-num">'+totalEndpoints+'</div><div class="stat-label">Endpoints</div></div>'
        +'<div class="stat"><div class="stat-num">'+tags.length+'</div><div class="stat-label">Categories</div></div>'
        +'<div class="stat"><div class="stat-num">6</div><div class="stat-label">User Roles</div></div>'
        +'<div class="stat"><div class="stat-num">3</div><div class="stat-label">Languages</div></div>';
      let html='';
      for(const tag of tags){
        const items=tagPaths[tag.name]||[];
        if(!items.length)continue;
        html+='<div class="tag-section"><div class="tag-title">'+tag.name+(tag.description?' &mdash; '+tag.description:'')+'</div>';
        for(const{method,path,op}of items){
          const auth=op.security&&op.security.length?'<span class="auth-badge">\ud83d\udd12 Auth</span>':'';
          html+='<div class="endpoint"><div class="endpoint-header"><span class="method method-'+method+'">'+method+'</span><span class="path">'+path+'</span>'+auth+'<span class="summary">'+(op.summary||'')+'</span></div></div>';
        }
        html+='</div>';
      }
      el.innerHTML=html;
    });
  </script>
</body>
</html>`);
  });

  return router;
};
