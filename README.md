# WeStay — Co-Living Property Management Platform

> Full-stack SPA for managing co-living properties, tenants, billing, IoT devices, and maintenance workflows.

**Branch: `backend-dev`** — Contains the full backend server (Express 5 + SQLite + JWT Auth).  
**Branch: `demo`** — Frontend-only, deployed to [GitHub Pages](https://gonzalloe.github.io/westay/) for stakeholder demo.

---

## Table of Contents

- [Quick Start](#quick-start)
- [Tech Stack](#tech-stack)
- [Architecture Overview](#architecture-overview)
- [Backend Structure](#backend-structure)
- [API Endpoints (~125+ total)](#api-endpoints)
- [Authentication & Roles](#authentication--roles)
- [Database Layer](#database-layer)
- [Changing the Database Adapter](#changing-the-database-adapter)
- [IoT & Automations](#iot--automations)
- [Testing](#testing)
- [Merging `backend-dev` into `demo`](#merging-backend-dev-into-demo)
- [What's Done](#whats-done)
- [What's NOT Done Yet](#whats-not-done-yet)
- [Default Demo Accounts](#default-demo-accounts)

---

## Quick Start

```bash
# Clone and switch to backend branch
git clone https://github.com/gonzalloe/westay.git
cd westay
git checkout backend-dev

# Install dependencies
npm install

# Copy and configure environment variables
cp .env.example .env
# Edit .env with your settings (JWT_SECRET, Stripe keys, SMTP, etc.)

# Start the server
npm start
# => http://localhost:3456
```

The server serves both the API (`/api/*`) and the frontend (static files from project root). The SQLite database auto-initializes with demo data on first run.

### Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Server port (default: 3456) |
| `JWT_SECRET` | **Yes** | Secret key for JWT signing |
| `DB_PATH` | No | SQLite file path (default: `backend/data/westay.db`) |
| `CORS_ORIGIN` | No | Allowed CORS origins (default: `*`) |
| `STRIPE_SECRET_KEY` | No | Stripe API key for payments |
| `STRIPE_WEBHOOK_SECRET` | No | Stripe webhook signing secret |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | No | Email (Nodemailer) config |
| `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_ID` | No | WhatsApp Cloud API config |
| `SSL_KEY_PATH`, `SSL_CERT_PATH` | No | HTTPS certificate paths |

See `.env.example` for the full list.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Vanilla JS (SPA, no framework), CSS |
| **Backend** | Express 5.x |
| **Database** | SQLite via [sql.js](https://github.com/nicolewhite/sql.js) (pure JS, no native deps) |
| **Auth** | JWT ([jsonwebtoken](https://www.npmjs.com/package/jsonwebtoken)) + bcrypt ([bcryptjs](https://www.npmjs.com/package/bcryptjs)) |
| **Security** | helmet (HTTP headers) + express-rate-limit + CORS + input sanitization |
| **Payments** | Stripe (FPX + card + GrabPay) |
| **Notifications** | Nodemailer (email) + WhatsApp Cloud API + in-app |
| **File Upload** | multer (local storage, MIME filtering) |
| **HTTPS** | SSL/TLS with auto-redirect + self-signed cert generation |
| **Logging** | Custom structured logging (file rotation: app.log, error.log, http.log) |
| **Testing** | Jest 30 (100 tests across 4 suites) |
| **i18n** | Built-in (English, Malay, Chinese) |
| **Real-Time** | WebSocket (native, no socket.io) |

### Dependencies

```
# Production
express            ^5.2.1   — Web framework
sql.js             ^1.14.1  — Pure-JS SQLite (WASM)
jsonwebtoken       ^9.0.3   — JWT signing/verification
bcryptjs           ^3.0.3   — Password hashing (async)
cors               ^2.8.6   — Cross-origin resource sharing
helmet             ^8.1.0   — HTTP security headers
dotenv             ^17.4.0  — Environment variable management
express-rate-limit ^8.3.2   — API rate limiting
multer             ^2.1.1   — File upload handling
nodemailer         ^8.0.4   — Email sending (SMTP)
stripe             ^22.0.0  — Payment processing (FPX, card, GrabPay)

# Dev
jest               ^30.3.0  — Test framework
```

---

## Architecture Overview

```
project-root/
├── server.js                   # Express entry point (port 3456) + WebSocket + HTTPS
├── .env.example                # Environment variable template (57 vars)
├── package.json                # Dependencies & scripts
├── backend/
│   ├── db/
│   │   ├── interface.js        # Abstract DB contract (13+ methods)
│   │   ├── sqlite-adapter.js   # SQLite implementation (persistent)
│   │   ├── memory-adapter.js   # In-memory implementation (dev/test)
│   │   ├── index.js            # Adapter factory (swap DB here)
│   │   ├── seed.js             # Demo data (16+ entities)
│   │   └── seed-users.js       # 5 default user accounts
│   ├── middleware/
│   │   ├── auth.js             # JWT verify + role-based access control
│   │   ├── validate.js         # Input validation + XSS sanitization
│   │   ├── error-handler.js    # Centralized error handler
│   │   ├── paginate.js         # Pagination helper (?page=1&limit=50)
│   │   ├── audit.js            # Audit log middleware (change tracking)
│   │   ├── logger.js           # Structured logging (file rotation)
│   │   └── upload.js           # File upload (multer, MIME filtering)
│   ├── services/
│   │   ├── notification.js     # Email + WhatsApp + in-app notification engine
│   │   └── payment.js          # Stripe integration (FPX, card, GrabPay)
│   ├── https.js                # Optional HTTPS with self-signed cert generation
│   ├── i18n/
│   │   ├── index.js            # Translation engine + middleware
│   │   └── locales/
│   │       ├── en.js           # English translations
│   │       ├── ms.js           # Malay (Bahasa Melayu) translations
│   │       └── zh.js           # Chinese (中文) translations
│   ├── websocket.js            # WebSocket real-time engine
│   └── routes/                 # 19 route files
│       ├── auth.js             # Login, register, profile, user mgmt
│       ├── props.js            # Properties CRUD
│       ├── tenants.js          # Tenants CRUD
│       ├── tickets.js          # Maintenance tickets + photos
│       ├── bills.js            # Billing + auto-reconnect on payment
│       ├── vendors.js          # Vendor management
│       ├── work-orders.js      # Work orders + vendor job tracking
│       ├── leads.js            # Lead/prospect pipeline
│       ├── landlords.js        # Landlords + owner reports
│       ├── contracts.js        # Tenancy contracts + e-signing
│       ├── utility-bills.js    # Utility bill generation + rates
│       ├── iot.js              # Electric/water meters, smart locks, IoT locks
│       ├── misc.js             # Check-in/out, notifs, automations, config, bulk ops
│       ├── reports.js          # Report export (JSON + CSV)
│       ├── audit.js            # Audit log API (query, stats, CSV export)
│       ├── docs.js             # Auto-generated API docs (OpenAPI 3.0)
│       ├── i18n.js             # i18n API (locales, translations)
│       ├── notifications.js    # Multi-channel notifications (email, WhatsApp, in-app)
│       └── payments.js         # Stripe payment gateway
├── tests/
│   ├── setup.js                # Test environment setup
│   ├── db.test.js              # Database adapter tests
│   ├── api.test.js             # API endpoint tests
│   ├── middleware.test.js      # Middleware tests
│   └── services.test.js        # Service layer tests
├── index.html                  # Frontend SPA entry
├── app.js, crud.js, ...        # Frontend JS modules (10 files)
└── styles.css                  # Frontend styles
```

### Key Design Pattern: Repository/Adapter

The backend uses an **abstract `DatabaseInterface`** class with 13+ methods. Any adapter that implements these methods can be swapped in with a single line change. Currently two adapters exist:

- **`SqliteAdapter`** — Persistent, writes to `backend/data/westay.db`
- **`MemoryAdapter`** — In-memory arrays/objects, data lost on restart

This makes it trivial to add MySQL, PostgreSQL, MongoDB, or any other adapter in the future.

---

## Backend Structure

### Database Interface (13+ methods)

| Method | Description |
|---|---|
| `getAll(collection)` | Get all records from a collection |
| `getById(collection, id)` | Get single record by ID |
| `query(collection, filter)` | Filter records by key-value pairs |
| `create(collection, data)` | Create a new record |
| `update(collection, id, updates)` | Partial update by ID |
| `delete(collection, id)` | Delete by ID |
| `updateWhere(collection, filter, updates)` | Update first match by filter |
| `deleteWhere(collection, filter)` | Delete all matching records |
| `replaceAll(collection, data)` | Replace entire collection (for reset) |
| `getStore(store, key)` | Get value from key-value store |
| `setStore(store, key, value)` | Set value in key-value store |
| `getAllStore(store)` | Get entire key-value store |
| `deleteStore(store, key)` | Delete key from store |

**User auth methods** (on SQLite adapter): `getUserByUsername`, `getUserById`, `createUser`, `updateUser`, `deleteUser`, `getAllUsers`, `hasUsers`, `isSeeded`, `resetDB`

Two data paradigms:
- **Collections** (array-based): props, tenants, tickets, bills, vendors, work_orders, leads, landlords, contracts, utility_bills, checkinout_records, smart_lock_registry, electric_meters, water_meters, iot_locks, notifs
- **Stores** (key-value): ticket_photos, property_expenses, automations, utility_rates, config

### Data Entities (16 collections + 6 KV stores)

| Entity | ID Field | Description |
|---|---|---|
| `props` | `n` (name) | Properties/units |
| `tenants` | `n` (name) | Tenant profiles |
| `tickets` | `id` | Maintenance tickets |
| `bills` | `id` | Rent invoices |
| `vendors` | `n` (name) | Service vendors |
| `work_orders` | `id` | Maintenance work orders |
| `leads` | `n` (name) | Prospect leads |
| `landlords` | `n` (name) | Property owners |
| `contracts` | `id` | Tenancy agreements |
| `utility_bills` | `id` | Utility invoices |
| `checkinout_records` | `id` | Check-in/out inspections |
| `smart_lock_registry` | `tenant` | Fingerprint access registry |
| `electric_meters` | `meterId` | Electric meter readings |
| `water_meters` | `meterId` | Water meter readings |
| `iot_locks` | `id` | Physical IoT lock devices |
| `notifs` | `id` | In-app notifications |

---

## API Endpoints

**~125+ endpoints** across 19 route files. All authenticated endpoints require `Authorization: Bearer <JWT>`.

### Auth (`/api/auth`) — 6 endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/login` | Public | Login, returns JWT |
| POST | `/api/auth/register` | Operator only | Create new user |
| GET | `/api/auth/me` | Authenticated | Current user profile |
| PATCH | `/api/auth/password` | Authenticated | Change own password |
| GET | `/api/auth/users` | Operator only | List all users |
| DELETE | `/api/auth/users/:id` | Operator only | Delete user |

### Properties (`/api/props`) — 5 endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/props` | Authenticated | List all properties |
| GET | `/api/props/:name` | Authenticated | Get by name |
| POST | `/api/props` | Operator only | Create property |
| PUT | `/api/props/:name` | Operator only | Update property |
| DELETE | `/api/props/:name` | Operator only | Delete property |

### Tenants (`/api/tenants`) — 5 endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/tenants` | Authenticated | List (filter: `?status=active&prop=Cambridge`) |
| GET | `/api/tenants/:name` | Authenticated | Get by name |
| POST | `/api/tenants` | Authenticated | Create tenant |
| PUT | `/api/tenants/:name` | Authenticated | Update tenant |
| DELETE | `/api/tenants/:name` | Authenticated | Delete tenant |

### Tickets (`/api/tickets`) — 9 endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/tickets` | Authenticated | List (filter: `?pr=High&s=Open`) |
| GET | `/api/tickets/:id` | Authenticated | Get by ID |
| POST | `/api/tickets` | Authenticated | Create ticket |
| PUT | `/api/tickets/:id` | Authenticated | Update ticket |
| PATCH | `/api/tickets/:id/status` | Authenticated | Status transition |
| DELETE | `/api/tickets/:id` | Authenticated | Delete ticket |
| GET | `/api/tickets/:id/photos` | Authenticated | Get ticket photos |
| POST | `/api/tickets/:id/photos` | Authenticated | Add photos |
| DELETE | `/api/tickets/:id/photos/:index` | Authenticated | Delete photo |

### Bills (`/api/bills`) — 7 endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/bills` | Authenticated | List (filter: `?s=Pending&t=Sarah+Lim`) |
| GET | `/api/bills/:id` | Authenticated | Get by ID |
| POST | `/api/bills` | Authenticated | Create bill |
| PUT | `/api/bills/:id` | Authenticated | Update bill |
| PATCH | `/api/bills/:id/pay` | Authenticated | Pay bill (auto-reconnects meters & locks) |
| POST | `/api/bills/generate` | Authenticated | Auto-generate invoices for active tenants |
| DELETE | `/api/bills/:id` | Authenticated | Delete bill |

### Vendors (`/api/vendors`) — 5 endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/vendors` | Authenticated | List (filter: `?type=...`) |
| GET | `/api/vendors/:name` | Authenticated | Get by name |
| POST | `/api/vendors` | Authenticated | Create vendor |
| PUT | `/api/vendors/:name` | Authenticated | Update vendor |
| DELETE | `/api/vendors/:name` | Authenticated | Delete vendor |

### Work Orders (`/api/work-orders`) — 6 endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/work-orders` | Authenticated | List all |
| GET | `/api/work-orders/:id` | Authenticated | Get by ID |
| POST | `/api/work-orders` | Authenticated | Create work order |
| PUT | `/api/work-orders/:id` | Authenticated | Update work order |
| PATCH | `/api/work-orders/:id/status` | Authenticated | Status transition (auto-increments vendor jobs) |
| DELETE | `/api/work-orders/:id` | Authenticated | Delete work order |

### Leads (`/api/leads`) — 6 endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/leads` | Operator/Agent | List all |
| GET | `/api/leads/:name` | Operator/Agent | Get by name |
| POST | `/api/leads` | Operator/Agent | Create lead |
| PUT | `/api/leads/:name` | Operator/Agent | Update lead |
| PATCH | `/api/leads/:name/status` | Operator/Agent | Update status |
| DELETE | `/api/leads/:name` | Operator/Agent | Delete lead |

### Landlords (`/api/landlords`) — 6 endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/landlords` | Authenticated | List all |
| GET | `/api/landlords/:name` | Authenticated | Get by name |
| GET | `/api/landlords/:name/report` | Authenticated | Full owner report (properties, bills, meters, expenses) |
| POST | `/api/landlords` | Authenticated | Create landlord |
| PUT | `/api/landlords/:name` | Authenticated | Update landlord |
| DELETE | `/api/landlords/:name` | Authenticated | Delete landlord |

### Contracts (`/api/contracts`) — 6 endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/contracts` | Authenticated | List all |
| GET | `/api/contracts/:id` | Authenticated | Get by ID |
| POST | `/api/contracts` | Authenticated | Create contract |
| PUT | `/api/contracts/:id` | Authenticated | Update contract |
| PATCH | `/api/contracts/:id/sign` | Authenticated | E-sign contract (sets status to Active) |
| DELETE | `/api/contracts/:id` | Authenticated | Delete contract |

### Utility Bills (`/api/utility-bills`) — 7 endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/utility-bills` | Authenticated | List (filter: `?tenant=...&status=Pending`) |
| GET | `/api/utility-bills/:id` | Authenticated | Get by ID |
| POST | `/api/utility-bills/generate` | Authenticated | Auto-generate from meter readings + rates |
| PATCH | `/api/utility-bills/:id/pay` | Authenticated | Pay utility bill |
| PUT | `/api/utility-bills/:id` | Authenticated | Update utility bill |
| DELETE | `/api/utility-bills/:id` | Authenticated | Delete utility bill |
| GET | `/api/utility-bills/config/rates` | Authenticated | Get utility rate config |

### IoT Devices (`/api/iot`) — 15 endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| **Electric Meters** | | | |
| GET | `/api/iot/electric-meters` | Authenticated | List (filter: `?unit=...&status=...`) |
| GET | `/api/iot/electric-meters/:meterId` | Authenticated | Get meter |
| PATCH | `/api/iot/electric-meters/:meterId/cut` | Authenticated | Manual disconnect |
| PATCH | `/api/iot/electric-meters/:meterId/reconnect` | Authenticated | Reconnect meter |
| POST | `/api/iot/electric-meters/check-late-payment` | Authenticated | Auto-cut overdue tenants |
| PATCH | `/api/iot/electric-meters/cut-unit/:unitName` | Authenticated | Disconnect entire unit |
| **Water Meters** | | | |
| GET | `/api/iot/water-meters` | Authenticated | List (filter: `?unit=...`) |
| GET | `/api/iot/water-meters/:meterId` | Authenticated | Get water meter |
| **Smart Locks (Fingerprint)** | | | |
| GET | `/api/iot/smart-locks` | Authenticated | List all |
| PATCH | `/api/iot/smart-locks/:tenant/disable` | Authenticated | Disable fingerprint |
| PATCH | `/api/iot/smart-locks/:tenant/enable` | Authenticated | Re-enable fingerprint |
| POST | `/api/iot/smart-locks/check-expiry` | Authenticated | Auto-disable expired leases |
| **Physical IoT Locks** | | | |
| GET | `/api/iot/locks` | Authenticated | List (filter: `?prop=...&filter=low-battery`) |
| GET | `/api/iot/locks/:id` | Authenticated | Get lock |
| PATCH | `/api/iot/locks/:id/toggle` | Authenticated | Toggle lock/unlock |

### Misc (`/api/misc`) — 18 endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| **Check-In/Out** | | | |
| GET | `/api/misc/checkinout` | Authenticated | List (filter: `?tenant=...`) |
| GET | `/api/misc/checkinout/:id` | Authenticated | Get record |
| POST | `/api/misc/checkinout` | Authenticated | Create inspection |
| PUT | `/api/misc/checkinout/:id` | Authenticated | Update record |
| PATCH | `/api/misc/checkinout/:id/complete` | Authenticated | Mark completed |
| **Notifications** | | | |
| GET | `/api/misc/notifs` | Authenticated | List all |
| POST | `/api/misc/notifs` | Authenticated | Create notification |
| PATCH | `/api/misc/notifs/:id/read` | Authenticated | Mark as read |
| PATCH | `/api/misc/notifs/read-all` | Authenticated | Mark all as read |
| **Automations** | | | |
| GET | `/api/misc/automations` | Authenticated | List automation states |
| GET | `/api/misc/automations/:key` | Authenticated | Get automation |
| PATCH | `/api/misc/automations/:key/toggle` | Authenticated | Toggle on/off |
| **Config & Bulk** | | | |
| GET | `/api/misc/config/:key` | Authenticated | Get config entry |
| GET | `/api/misc/property-expenses` | Authenticated | All property expenses |
| PUT | `/api/misc/property-expenses/:prop` | Authenticated | Set expenses |
| POST | `/api/misc/reset` | Operator only | Reset all data to demo |
| GET | `/api/misc/all-data` | Authenticated | Bulk fetch (21 collections) |
| POST | `/api/misc/save-data` | Operator only | Bulk save |

### Payments (`/api/payments`) — 5 endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/payments/create-intent` | Authenticated | Create Stripe PaymentIntent (FPX, card, or GrabPay) |
| POST | `/api/payments/confirm` | Authenticated | Confirm payment + update bill status |
| POST | `/api/payments/refund` | Operator only | Refund a payment |
| GET | `/api/payments/status/:intentId` | Authenticated | Check payment status |
| POST | `/api/payments/webhook` | Public (Stripe) | Stripe webhook handler (signature verified) |

### Notifications (`/api/notifications`) — 6 endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/notifications/email` | Authenticated | Send email notification |
| POST | `/api/notifications/whatsapp` | Authenticated | Send WhatsApp message |
| POST | `/api/notifications/in-app` | Authenticated | Create in-app notification |
| POST | `/api/notifications/rent-reminder/:tenantName` | Authenticated | Send rent reminder (email + WhatsApp + in-app) |
| POST | `/api/notifications/bulk-reminders` | Operator only | Send reminders to all tenants with pending bills |
| GET | `/api/notifications/channels` | Authenticated | List available notification channels |

### Reports (`/api/reports`) — 8 endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/reports/owner/:name` | Authenticated | Owner report JSON (enhanced with summary) |
| GET | `/api/reports/owner/:name/csv` | Authenticated | Owner report CSV download |
| GET | `/api/reports/portfolio` | Authenticated | Portfolio report (all properties) |
| GET | `/api/reports/portfolio/csv` | Authenticated | Portfolio report CSV download |
| GET | `/api/reports/tenants/csv` | Authenticated | Export tenants as CSV |
| GET | `/api/reports/bills/csv` | Authenticated | Export bills as CSV |
| GET | `/api/reports/tickets/csv` | Authenticated | Export tickets as CSV |
| GET | `/api/reports/work-orders/csv` | Authenticated | Export work orders as CSV |

### Audit Log (`/api/audit`) — 3 endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/audit` | Operator only | Query audit logs (`?action=create&entity=props&from=2026-04-01&limit=100`) |
| GET | `/api/audit/stats` | Operator only | Aggregated audit statistics (by action, entity, user, time) |
| GET | `/api/audit/export` | Operator only | Export audit logs as CSV |

### API Documentation (`/api/docs`) — 2 endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/docs` | Public | OpenAPI 3.0 JSON specification |
| GET | `/api/docs/ui` | Public | Interactive HTML API documentation viewer |

### i18n (`/api/i18n`) — 2 endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/i18n/locales` | Public | List supported locales (`["en","ms","zh"]`) |
| GET | `/api/i18n/translations/:locale` | Public | Get all translations for a locale |

### WebSocket (`ws://localhost:PORT/ws`)

Real-time event broadcasting. Connect via WebSocket, authenticate with JWT.

| Message | Direction | Description |
|---|---|---|
| `{ type: "auth", token: "<JWT>" }` | Client → Server | Authenticate connection |
| `{ type: "subscribe", channels: ["notifs","iot"] }` | Client → Server | Subscribe to channels |
| `{ type: "event", channel: "notifs", event: "new", data: {...} }` | Server → Client | Real-time event push |
| `{ type: "ping" }` / `{ type: "pong" }` | Bidirectional | Heartbeat |

**Channels:** `notifs`, `tickets`, `bills`, `iot`, `audit`

---

## Authentication & Roles

### How Auth Works

1. **Login**: `POST /api/auth/login` with `{ username, password }` → returns JWT token
2. **Use token**: Include `Authorization: Bearer <token>` header on all subsequent requests
3. **Token expiry**: 7 days
4. **Password storage**: bcrypt hashed (cost factor 10)

### Middleware

| Middleware | Behavior |
|---|---|
| `authenticate` | Verifies JWT, sets `req.user`, returns 401 if invalid |
| `requireRole(...roles)` | Checks `req.user.role` against allowed roles, returns 403 if denied |
| `optionalAuth` | Sets `req.user` if valid token present, proceeds regardless |

### 5 User Roles

| Role | Pages | Access Level |
|---|---|---|
| `operator` | 14 | Full access to everything (admin) |
| `tenant` | 10 | View own data, submit tickets, view bills |
| `landlord` | 7 | View own properties, reports, bills |
| `vendor` | 7 | View assigned work orders, update status |
| `agent` | 8 | Manage leads/prospects |

---

## Database Layer

### Current Setup: SQLite (sql.js)

- **File**: `backend/data/westay.db` (auto-created on first run)
- **Engine**: [sql.js](https://github.com/nicolewhite/sql.js) — SQLite compiled to WebAssembly, runs in pure JS
- **No native dependencies** — works on any OS without build tools
- **Auto-seeds** demo data if database is empty

### Changing the Database Adapter

The database layer uses the **Repository/Adapter pattern**. To switch databases:

#### Option A: Switch to In-Memory (for dev/testing)

Edit `backend/db/index.js`:

```js
// Comment out SQLite:
// const SqliteAdapter = require('./sqlite-adapter');
// db = new SqliteAdapter();

// Uncomment Memory:
const MemoryAdapter = require('./memory-adapter');
db = new MemoryAdapter();
```

#### Option B: Create a New Adapter (MySQL, PostgreSQL, MongoDB, etc.)

1. **Create a new adapter file** (e.g., `backend/db/mysql-adapter.js`)
2. **Extend `DatabaseInterface`** and implement all methods:

```js
const DatabaseInterface = require('./interface');

class MySQLAdapter extends DatabaseInterface {
  async init() { /* connect to MySQL */ }
  async getAll(collection) { /* SELECT * FROM collection */ }
  async getById(collection, id) { /* SELECT WHERE id = ? */ }
  async query(collection, filter) { /* SELECT WHERE ... */ }
  async create(collection, data) { /* INSERT INTO */ }
  async update(collection, id, updates) { /* UPDATE SET */ }
  async delete(collection, id) { /* DELETE FROM */ }
  async updateWhere(collection, filter, updates) { /* ... */ }
  async deleteWhere(collection, filter) { /* ... */ }
  async replaceAll(collection, data) { /* TRUNCATE + INSERT */ }
  async getStore(store, key) { /* KV table lookup */ }
  async setStore(store, key, value) { /* KV table upsert */ }
  async getAllStore(store) { /* KV table scan */ }
  async deleteStore(store, key) { /* KV table delete */ }
  
  // Also implement these (used by auth):
  async getUserByUsername(username) { /* ... */ }
  async getUserById(id) { /* ... */ }
  async createUser(user) { /* ... */ }
  async updateUser(id, updates) { /* ... */ }
  async deleteUser(id) { /* ... */ }
  async getAllUsers() { /* ... */ }
  async hasUsers() { /* ... */ }
  async isSeeded() { /* ... */ }
  async resetDB() { /* ... */ }
}
```

3. **Swap in `backend/db/index.js`**:

```js
const MySQLAdapter = require('./mysql-adapter');
db = new MySQLAdapter();
```

That's it — zero changes needed in route files or middleware.

#### ID Field Mapping

Each collection has a specific ID field (not always `id`). The adapter's `idFields` map handles this:

```js
this.idFields = {
  props: 'n',              // name-based
  tenants: 'n',            // name-based
  tickets: 'id',           // auto-generated (TK-001)
  bills: 'id',             // auto-generated (INV-2604)
  vendors: 'n',            // name-based
  work_orders: 'id',       // auto-generated (WO-101)
  leads: 'n',              // name-based
  landlords: 'n',          // name-based
  contracts: 'id',         // auto-generated (TA-2026-048)
  utility_bills: 'id',     // auto-generated (UTL-2604-01)
  checkinout_records: 'id', // auto-generated (CIO-001)
  smart_lock_registry: 'tenant', // tenant name
  electric_meters: 'meterId',
  water_meters: 'meterId',
  iot_locks: 'id',
  notifs: 'id'             // timestamp-based
};
```

---

## IoT & Automations

### Auto-Cut Electric on Overdue Payment

When `POST /api/iot/electric-meters/check-late-payment` is called:
- Finds all bills with status `Overdue`
- Disconnects the electric meter of each overdue tenant
- Logs the action to the automation store

### Auto-Disable Smart Locks on Lease Expiry

When `POST /api/iot/smart-locks/check-expiry` is called:
- Checks all smart lock entries for expired leases
- Disables fingerprint access for expired tenants
- Logs the action

### Auto-Reconnect on Payment

When `PATCH /api/bills/:id/pay` is called:
- Marks bill as Paid
- Auto-reconnects the tenant's electric meter (if disconnected due to overdue)
- Auto-re-enables smart lock fingerprint (if disabled due to non-payment)

---

## Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# With coverage
npm run test:coverage
```

**100 tests** across 4 suites:

| Suite | Tests | Coverage |
|---|---|---|
| `db.test.js` | Database adapter operations (CRUD, stores, queries, users) | SQLite + seed |
| `api.test.js` | API endpoint integration tests (auth, CRUD, pagination) | Routes + middleware |
| `middleware.test.js` | Middleware unit tests (auth, validate, paginate, audit, error) | All middleware |
| `services.test.js` | Service layer tests (notification, payment) | Services |

---

## Merging `backend-dev` into `demo`

### When to Merge

Only merge when you're ready to deploy the full-stack version (i.e., when the stakeholder has reviewed the demo and you're moving to a hosted environment like Vercel, Railway, or a VPS).

> ⚠️ **Important**: The `demo` branch is deployed to GitHub Pages (static frontend only). Merging backend code into `demo` will **not break** the GitHub Pages site (it just ignores `server.js` and `backend/`), but the `.gitignore` changes will differ.

### How to Merge

```bash
# Make sure both branches are up to date
git checkout demo
git pull origin demo

git checkout backend-dev
git pull origin backend-dev

# Merge backend-dev into demo
git checkout demo
git merge backend-dev

# Resolve any conflicts (likely in .gitignore, README.md)
# After resolving:
git add .
git commit -m "merge: integrate full-stack backend into demo"
git push origin demo
```

### Post-Merge Checklist

- [ ] Update `.gitignore` — decide whether to keep `server.js` excluded (if still using GitHub Pages) or included (if deploying full-stack)
- [ ] Update GitHub Pages settings if switching to a hosted backend
- [ ] Set environment variables on your hosting platform:
  - `JWT_SECRET` — change from dev default to a secure random string
  - `STRIPE_SECRET_KEY` — production Stripe key
  - `SMTP_*` — production email config
  - `PORT` — if your host requires a specific port

### If You Want to Keep Both Deployment Modes

Keep `demo` for GitHub Pages (frontend-only with localStorage fallback) and `backend-dev` for full-stack development. The frontend already has an **API-first with localStorage fallback** design — it works both ways automatically.

---

## What's Done

| Feature | Version | Details |
|---|---|---|
| REST API | v1.0 | 19 route files, ~125+ endpoints |
| SQLite Database | v1.0 | Persistent, auto-seed, repository pattern |
| In-Memory DB | v1.0 | Available as alternative adapter |
| JWT Authentication | v1.0 | Login, register, token refresh via 7-day expiry |
| Role-Based Access | v1.0 | 5 roles (46 total page routes), per-route middleware enforcement |
| Password Security | v1.0 | async bcrypt hashed, min 6 chars, change password endpoint |
| Property Management | v1.0 | Full CRUD |
| Tenant Management | v1.0 | Full CRUD + status tracking |
| Billing & Invoicing | v1.0 | Full CRUD + auto-generate + pay |
| Maintenance Tickets | v1.0 | Full CRUD + photos + status transitions |
| Work Orders | v1.0 | Full CRUD + vendor job tracking |
| Vendor Management | v1.0 | Full CRUD |
| Lead Pipeline | v1.0 | Full CRUD + status tracking |
| Landlord Reports | v1.0 | Owner report with revenue, meters, expenses, net income |
| Contracts | v1.0 | Full CRUD + e-sign |
| Utility Bills | v1.0 | Auto-generate from meter readings + rate config |
| IoT Electric Meters | v1.0 | Monitor, cut, reconnect, unit-wide ops |
| IoT Water Meters | v1.0 | Monitor readings |
| Smart Lock Registry | v1.0 | Fingerprint enable/disable |
| Physical IoT Locks | v1.0 | Status, toggle, battery monitoring |
| Auto-Cut on Overdue | v1.0 | Electric disconnect automation |
| Auto-Disable Expired Locks | v1.0 | Lease expiry automation |
| Auto-Reconnect on Payment | v1.0 | Meter + lock re-enable |
| Check-In/Out Inspections | v1.0 | Full CRUD + completion |
| In-App Notifications | v1.0 | Create, read, mark-read |
| Bulk Data Ops | v1.0 | Fetch all / save all / reset to demo |
| Demo Data Seeding | v1.0 | 16+ entities auto-seeded |
| Frontend API Integration | v1.0 | Real login, Bearer token, API-first with localStorage fallback |
| Security Hardening | v1.1 | helmet + dotenv + express-rate-limit + CORS + input sanitization |
| Input Validation | v1.1 | Custom `validate()` middleware on all POST/PUT/PATCH routes |
| API Pagination | v1.1 | All list endpoints: `?page=1&limit=50` (backward-compatible) |
| Centralized Error Handler | v1.1 | `errorHandler` middleware catches all unhandled errors |
| Multi-Language (i18n) | v1.2 | English, Malay, Chinese — API + middleware + frontend-ready |
| Report Export | v1.2 | CSV export: owner reports, portfolio, tenants, bills, tickets, work orders |
| Audit Log | v1.2 | Full change tracking: create/update/delete/login + query/stats/CSV export |
| API Documentation | v1.2 | OpenAPI 3.0 spec + interactive HTML viewer at `/api/docs/ui` |
| WebSocket Real-Time | v1.2 | Native WS at `/ws` — notifications, IoT, tickets, bills, audit channels |
| **Payment Gateway** | **v1.3** | **Stripe integration: FPX, card, GrabPay — create intent, confirm, refund, webhooks** |
| **HTTPS/SSL** | **v1.3** | **Optional SSL/TLS with auto-redirect + self-signed cert generation** |
| **File Upload** | **v1.3** | **multer-based upload with MIME filtering, entity-type organization, deletion** |
| **Email Notifications** | **v1.3** | **Nodemailer with HTML templates, rent reminders, bulk reminders** |
| **WhatsApp Notifications** | **v1.3** | **WhatsApp Cloud API integration for tenant messaging** |
| **Structured Logging** | **v1.3** | **Custom logger with file rotation (app.log, error.log, http.log)** |
| **Test Suite** | **v1.3** | **100 tests across 4 suites (Jest 30) — DB, API, middleware, services** |

---

## What's NOT Done Yet

### 🟢 Nice to Have (Non-Blocking)

| Feature | Priority | Details |
|---|---|---|
| **Tenant Self-Registration** | Low | Tenants can't register themselves. Operator must create accounts. |
| **Docker** | Low | No Dockerfile. Would simplify deployment. |
| **CI/CD** | Low | No GitHub Actions. Would automate testing + deployment. |
| **OpenAPI Spec Update** | Low | `/api/docs` doesn't include payment & notification endpoints yet. |
| **Tenant Marketplace** | Low | Frontend page exists as "coming soon" placeholder. |
| **Agent Contacts** | Low | Frontend page exists as "coming soon" placeholder. |
| **Forgot Password** | Low | Login page has link but no handler implemented. |

### ⚠️ Production Hardening Notes

These are configuration/deployment concerns, not missing code:

- **CSP WebSocket**: `index.html` Content-Security-Policy `connect-src` needs `ws:` / `wss:` directive for WebSocket to work in strict browsers
- **package.json `main`**: Points to `app.js` instead of `server.js` (no functional impact, cosmetic only)
- **Environment secrets**: Must set real `JWT_SECRET`, `STRIPE_SECRET_KEY`, SMTP credentials before deploying
- **Rate limiting**: Tune `RATE_LIMIT_*` values for production traffic patterns
- **CORS**: Set `CORS_ORIGIN` to specific domain(s) instead of `*`

---

## Default Demo Accounts

| Username | Password | Role | Linked Entity |
|---|---|---|---|
| `operator` | `op123456` | Operator (Admin) | — |
| `sarah` | `tenant123` | Tenant | Sarah Lim |
| `landlord` | `landlord123` | Landlord | Dato Lee Wei |
| `vendor` | `vendor123` | Vendor | AirCool Services |
| `agent` | `agent123` | Agent | — |

---

## License

ISC
