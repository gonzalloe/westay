# WeStay — Co-Living Property Management Platform

> Full-stack SPA for managing co-living properties, tenants, billing, IoT devices, and maintenance workflows.

**Branch: `staging`** — Full-stack development (Express 5 + SQLite + JWT Auth + frontend).  
**Branch: `demo`** — Frontend-only, deployed to [GitHub Pages](https://gonzalloe.github.io/westay/) for stakeholder demo.  
**Branch: `master`** — Production (reserved for stable releases).

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
- [Stripe Payment Integration](#stripe-payment-integration)
- [Email (SMTP) Integration](#email-smtp-integration)
- [WhatsApp (Meta Cloud API) Integration](#whatsapp-meta-cloud-api-integration)
- [SSL / HTTPS Setup](#ssl--https-setup)
- [Hosting & Deployment](#hosting--deployment)
- [Merging `staging` into `demo`](#merging-staging-into-demo)
- [What's Done](#whats-done)
- [What's NOT Done Yet](#whats-not-done-yet)
- [Default Demo Accounts](#default-demo-accounts)

---

## Quick Start

```bash
# Clone and switch to staging branch
git clone https://github.com/gonzalloe/westay.git
cd westay
git checkout staging

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
| `STRIPE_SECRET_KEY` | No | Stripe API secret key (enables real payments) |
| `STRIPE_PUBLISHABLE_KEY` | No | Stripe publishable key (returned by GET /api/payments/status) |
| `STRIPE_WEBHOOK_SECRET` | No | Stripe webhook signing secret (for payment confirmation backup) |
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
| **Testing** | Jest 30 (106 tests across 4 suites) |
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
│   │   └── seed-users.js       # 6 default user accounts
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
| POST | `/api/auth/register` | Admin only | Create new user |
| GET | `/api/auth/me` | Authenticated | Current user profile |
| PATCH | `/api/auth/password` | Authenticated | Change own password |
| GET | `/api/auth/users` | Admin only | List all users |
| DELETE | `/api/auth/users/:id` | Admin only | Delete user |

### Properties (`/api/props`) — 5 endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/props` | Authenticated | List all properties |
| GET | `/api/props/:name` | Authenticated | Get by name |
| POST | `/api/props` | Admin/Operator | Create property |
| PUT | `/api/props/:name` | Admin/Operator | Update property |
| DELETE | `/api/props/:name` | Admin/Operator | Delete property |

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
| GET | `/api/leads` | Admin/Operator/Agent | List all |
| GET | `/api/leads/:name` | Admin/Operator/Agent | Get by name |
| POST | `/api/leads` | Admin/Operator/Agent | Create lead |
| PUT | `/api/leads/:name` | Admin/Operator/Agent | Update lead |
| PATCH | `/api/leads/:name/status` | Admin/Operator/Agent | Update status |
| DELETE | `/api/leads/:name` | Admin/Operator/Agent | Delete lead |

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
| POST | `/api/misc/reset` | Admin only | Reset all data to demo |
| GET | `/api/misc/all-data` | Authenticated | Bulk fetch (21 collections) |
| POST | `/api/misc/save-data` | Admin only | Bulk save |

### Payments (`/api/payments`) — 5 endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/payments/create-intent` | Authenticated | Create Stripe PaymentIntent (FPX, card, or GrabPay) |
| POST | `/api/payments/confirm` | Authenticated | Confirm payment + update bill status |
| POST | `/api/payments/refund` | Authenticated | Refund a payment |
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
| GET | `/api/audit` | Admin only | Query audit logs (`?action=create&entity=props&from=2026-04-01&limit=100`) |
| GET | `/api/audit/stats` | Admin only | Aggregated audit statistics (by action, entity, user, time) |
| GET | `/api/audit/export` | Admin only | Export audit logs as CSV |

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
5. **Demo mode**: When backend is unreachable (GitHub Pages), login uses hardcoded demo credentials with a `demo_` token prefix and switches to localStorage-only mode

### Middleware

| Middleware | Behavior |
|---|---|
| `authenticate` | Verifies JWT, sets `req.user`, returns 401 if invalid |
| `requireRole(...roles)` | Checks `req.user.role` against allowed roles, returns 403 if denied |
| `optionalAuth` | Sets `req.user` if valid token present, proceeds regardless |

### 6 User Roles — Overview

| Role | Pages | Access Level |
|---|---|---|
| `admin` | 16 | Full access: everything operator has + user management, audit log, data reset, bulk save |
| `operator` | 14 | Routine operations: properties, tenants, billing, maintenance, IoT, leads, reports, settings (no destructive actions) |
| `tenant` | 10 | View own data, submit tickets, view/pay bills, smart access, utilities, community |
| `landlord` | 7 | View own properties, financials, tenancy overview, maintenance log, payouts, reports |
| `vendor` | 7 | View assigned work orders, schedule, submit invoices, manage company profile |
| `agent` | 8 | Manage leads/prospects, listings, viewings, applications, commission tracking |

---

### 🔴 Admin (16 pages)

**Everything the Operator can do, plus:**

| Exclusive Capability | Frontend Page | Backend Endpoint |
|---|---|---|
| **User Management** — Create, list, delete user accounts of any role | `users` page | `POST /api/auth/register`, `GET /api/auth/users`, `DELETE /api/auth/users/:id` |
| **Audit Log** — View, filter, and export all system activity (create/update/delete/login events) | `audit` page | `GET /api/audit`, `GET /api/audit/stats`, `GET /api/audit/export` |
| **Reset Demo Data** — Destructive wipe of all data back to demo state | `settings` page (button) | `POST /api/misc/reset` |
| **Bulk Save Data** — Overwrite all collections at once | API only | `POST /api/misc/save-data` |
| **WebSocket Status** — Monitor connected clients and authenticated users | API only | `GET /api/ws/status` |

**Pages:** Dashboard, Properties, Tenants, Landlords, Contracts, Billing & Invoices, Maintenance, Vendors, IoT & Smart Locks, Leads & CRM, Community, AI Insights, Reports & Analytics, Admin Settings, User Management, Audit Log

**Quick Actions:** Add Property, Add Tenant, New Ticket, New Contract, Add Vendor, Add Lead, User Management, Automation Center, Generate Report, Generate TA, Owner Report, Utility Bills, Check-In/Out

---

### 🟣 Operator (14 pages)

Day-to-day operations manager. Same pages as Admin **except** no User Management, no Audit Log, and Settings page has non-destructive data export only (no data reset).

| Capability | Details |
|---|---|
| **Property Management** | Full CRUD — add, edit, delete properties |
| **Tenant Management** | Full CRUD — add, edit, view tenants, check-in/out inspections |
| **Billing & Invoicing** | Create, manage, pay bills, generate invoices, utility bill management |
| **Maintenance** | Full ticket lifecycle — create, assign, update status, manage photos |
| **Vendor Management** | Full CRUD — add, manage vendors |
| **IoT & Smart Locks** | Manage electric meters (cut/reconnect), smart lock fingerprints (enable/disable), view physical lock status |
| **Leads & CRM** | Full lead pipeline — add, update status, convert |
| **Contracts** | Full CRUD — create, e-sign, auto-generate tenancy agreements |
| **Landlord Management** | View landlords, generate owner reports, export data |
| **Reports** | Portfolio analytics, CSV export (tenants, bills, tickets, work orders) |
| **Notifications** | Send bulk rent reminders (email + WhatsApp + in-app) |
| **Automations** | Toggle auto-report, auto-TA, smart lock expiry, late payment electric cut |
| **Community** | Manage community feed |
| **AI Insights** | Dynamic pricing, tenant risk scoring, predictive maintenance |

**Pages:** Dashboard, Properties, Tenants, Landlords, Contracts, Billing & Invoices, Maintenance, Vendors, IoT & Smart Locks, Leads & CRM, Community, AI Insights, Reports & Analytics, Settings

**Quick Actions:** Same as Admin except no User Management

---

### 🟢 Tenant (10 pages)

Self-service portal for tenants. Can only view/manage their own data.

| Capability | Details |
|---|---|
| **Dashboard** | Personal overview — rent due, days remaining, open requests, community score |
| **My Unit** | View unit details (property, room, floor, size, move-in date, deposits) |
| **My Bills** | View rent + utility bills, pay via payment gateway (FPX, card, e-wallet), export, preview report |
| **My Contract** | View tenancy agreement, download TA |
| **Maintenance** | Submit new maintenance requests, track ticket status |
| **Smart Access** | View door lock status, access log |
| **Utilities** | View electric/water meter readings, check sub-meter connection status |
| **Community** | Read/post in community feed |
| **Events** | View community events |
| **Marketplace** | Browse marketplace (coming soon) |

**Quick Actions:** New Maintenance Request, Pay Rent, Utility Bills, My Check-In/Out Photos

---

### 🩷 Landlord (7 pages)

Property owner portal. Views filtered to own properties only.

| Capability | Details |
|---|---|
| **Portfolio Dashboard** | Overview — property count, total units, occupancy, revenue, estimated payout |
| **My Properties** | View own properties with occupancy and performance stats |
| **Financials** | Revenue breakdown — gross revenue, management fee (20%), net payout, payout history |
| **Tenancy Overview** | View tenants in own properties — name, unit, rent, status, lease end |
| **Maintenance Log** | View maintenance tickets on own properties |
| **Payouts** | Payout history and financial details |
| **Reports** | Owner monthly report (auto-generated, retained 6 months), revenue/occupancy/maintenance/NPS reports, CSV export |

**Quick Actions:** My Owner Report

---

### 🟩 Vendor (7 pages)

Service provider portal for maintenance vendors.

| Capability | Details |
|---|---|
| **Dashboard** | Work overview — total work orders, pending, in progress, rating |
| **Work Orders** | View assigned work orders, update status (Pending → In Progress → Completed) |
| **Schedule** | View upcoming job schedule |
| **My Invoices** | View submitted invoices, submit new invoices |
| **Payments** | Payment tracking for completed jobs |
| **Company Profile** | View/edit company details — registration, contact, specialty, rating |
| **Reviews & Ratings** | View client reviews and ratings |

**Quick Actions:** Submit Invoice

---

### 🟡 Agent (8 pages)

Real estate agent portal for lead management and property leasing.

| Capability | Details |
|---|---|
| **Dashboard** | Sales overview — active leads, viewings this week, applications, MTD commission |
| **My Leads** | Full lead pipeline — add, update status (New → Contacted → Viewing → Negotiating → Converted), export |
| **Available Listings** | Browse vacant units across all properties, share listing links |
| **Viewings** | Manage property viewing appointments |
| **Applications** | Review and approve/reject tenant applications |
| **Commission** | View commission history — monthly, YTD, deals closed |
| **Contacts** | Contact management (coming soon) |
| **Performance** | Agent metrics — team rank, conversion rate, response time, client rating |

**Quick Actions:** Add Lead

---

### Role Capability Matrix

| Capability | Admin | Operator | Tenant | Landlord | Vendor | Agent |
|---|---|---|---|---|---|---|
| Properties (CRUD) | ✅ Full | ✅ Full | ❌ | 👁 Own only | ❌ | 👁 Listings |
| Tenants (CRUD) | ✅ Full | ✅ Full | 👁 Own data | 👁 Own tenants | ❌ | ❌ |
| Billing | ✅ Manage all | ✅ Manage all | 💳 View/pay own | ❌ | ❌ | ❌ |
| Maintenance | ✅ Full | ✅ Full | ✏️ Create/view own | 👁 Own properties | ❌ | ❌ |
| Vendors | ✅ Full | ✅ Full | ❌ | ❌ | 👁 Own profile | ❌ |
| Work Orders | ✅ Full | ✅ Full | ❌ | ❌ | ✏️ Update status | ❌ |
| IoT & Smart Locks | ✅ Full | ✅ Full | 👁 Own access | ❌ | ❌ | ❌ |
| Leads & CRM | ✅ Full | ✅ Full | ❌ | ❌ | ❌ | ✅ Full |
| Contracts | ✅ Full | ✅ Full | 👁 Own contract | ❌ | ❌ | ❌ |
| Reports & Export | ✅ Full | ✅ Full | ❌ | 👁 Own reports | ❌ | ❌ |
| Community | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| AI Insights | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Payments (Stripe) | ✅ Manage | ✅ Manage | 💳 Pay own bills | ❌ | ❌ | ❌ |
| Notifications (bulk) | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **User Management** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Audit Log** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Data Reset** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Bulk Data Save** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

### Backend API Access by Role

| API Route | Public | Admin | Operator | Tenant | Landlord | Vendor | Agent |
|---|---|---|---|---|---|---|---|
| `POST /api/auth/login` | ✅ | — | — | — | — | — | — |
| `POST /api/auth/register` | | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `GET /api/auth/me` | | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `GET /api/auth/users` | | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `DELETE /api/auth/users/:id` | | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `POST/PUT/DELETE /api/props` | | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `GET /api/props` | | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/api/leads/*` | | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| `/api/audit/*` | | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `POST /api/misc/reset` | | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `POST /api/misc/save-data` | | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `GET /api/ws/status` | | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `/api/docs/*` | ✅ | — | — | — | — | — | — |
| `/api/i18n/*` | ✅ | — | — | — | — | — | — |
| All other CRUD routes | | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

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

**106 tests** across 4 suites:

| Suite | Tests | Coverage |
|---|---|---|
| `db.test.js` | Database adapter operations (CRUD, stores, queries, users) | SQLite + seed |
| `api.test.js` | API endpoint integration tests (auth, CRUD, pagination) | Routes + middleware |
| `middleware.test.js` | Middleware unit tests (auth, validate, paginate, audit, error) | All middleware |
| `services.test.js` | Service layer tests (notification, payment) | Services |

---

## Stripe Payment Integration

WeStay uses **Stripe Checkout Sessions** for real payments. When Stripe is configured, tenants are redirected to Stripe's hosted payment page (FPX bank login, card form, or GrabPay authorization). When Stripe is **not** configured, the frontend falls back to a simulated payment experience.

### How It Works (Architecture)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  FRONTEND (features-new.js / app.js)                                    │
│                                                                         │
│  1. Tenant clicks "Pay" → selectPaymentMethod(fpx/card/ewallet)        │
│  2. processGatewayPayment() →                                          │
│     a. GET /api/payments/status  (check if Stripe is configured)       │
│     b. POST /api/payments/checkout  (create Checkout Session)          │
│     c. window.location.href = session.sessionUrl  ← REDIRECT TO STRIPE│
│                                                                         │
│  3. After payment, Stripe redirects back to:                            │
│     /?payment_success=BILL_ID&session_id=cs_xxx                        │
│  4. _handlePaymentReturn() in app.js →                                 │
│     GET /api/payments/verify-session/:sessionId                        │
│  5. Bill marked as Paid → receipt shown                                │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  BACKEND (server.js / routes/payments.js / services/payment.js)         │
│                                                                         │
│  GET  /api/payments/status         → { configured: true/false }        │
│  POST /api/payments/checkout       → Create Stripe Checkout Session    │
│  GET  /api/payments/verify-session → Verify payment + mark bill paid   │
│  POST /api/payments/webhook        → Stripe webhook (backup handler)   │
│  POST /api/payments/confirm/:id    → Manual confirm + mark paid        │
│  POST /api/payments/refund         → Stripe refund                     │
│                                                                         │
│  services/payment.js:                                                   │
│  - createCheckoutSession()  → Stripe Checkout with FPX/card/GrabPay   │
│  - constructWebhookEvent()  → Verify webhook signature                │
│  - createRefund()           → Process refunds                          │
│  - isConfigured()           → Check if STRIPE_SECRET_KEY is set        │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  STRIPE (External)                                                      │
│                                                                         │
│  Checkout Session  → Hosted payment page (bank login / card / ewallet) │
│  Webhook           → POST /api/payments/webhook (backup confirmation)  │
│  Dashboard         → View payments, refunds, disputes                  │
└─────────────────────────────────────────────────────────────────────────┘
```

### Supported Payment Methods (Malaysia)

| Method | Stripe Type | Description |
|---|---|---|
| **FPX** | `fpx` | Malaysian online banking — redirects to bank login (Maybank, CIMB, Public Bank, RHB, Hong Leong, etc.) |
| **Credit/Debit Card** | `card` | Visa, Mastercard — Stripe-hosted card form (PCI DSS compliant) |
| **GrabPay** | `grabpay` | E-wallet — redirects to GrabPay authorization page |

### Step 1: Create a Stripe Account

1. Go to [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register)
2. Sign up (no credit card needed for test mode)
3. Complete email verification

> **Tip:** You can use Stripe in **Test Mode** (no real money) during development. Toggle "Test mode" on the Stripe dashboard.

### Step 2: Get Your API Keys

1. Go to [https://dashboard.stripe.com/test/apikeys](https://dashboard.stripe.com/test/apikeys) (note: `/test/` for test mode)
2. Copy these two keys:
   - **Publishable key** — starts with `pk_test_`
   - **Secret key** — starts with `sk_test_` (click "Reveal test key")

### Step 3: Configure `.env`

Edit your `.env` file (copy from `.env.example` if you haven't):

```env
# ---- Payment Gateway (Stripe) ----
STRIPE_SECRET_KEY=sk_test_51ABC...your_real_key...
STRIPE_PUBLISHABLE_KEY=pk_test_51ABC...your_real_key...
STRIPE_WEBHOOK_SECRET=whsec_...  # (set this in Step 5 below)
```

> **Important:** `sk_test_your_key_here` is a placeholder. Replace it with your actual key — otherwise `isConfigured()` returns `false` and you'll get simulation fallback.

### Step 4: Enable FPX (for Malaysia)

FPX is not enabled by default in Stripe. You must activate it:

1. Go to [https://dashboard.stripe.com/test/settings/payment_methods](https://dashboard.stripe.com/test/settings/payment_methods)
2. Find **FPX** and click **Turn on**
3. Find **GrabPay** and click **Turn on**
4. **Card** is enabled by default

> **Note:** For **production** FPX, Stripe requires your business to be registered in Malaysia or have a Malaysian bank account. Test mode works globally.

### Step 5: Set Up Webhooks

Webhooks are the **backup** payment confirmation — they fire even if the user closes the browser before the redirect.

#### For Local Development (use Stripe CLI)

```bash
# Install Stripe CLI
# macOS: brew install stripe/stripe-cli/stripe
# Windows: scoop install stripe (or download from https://stripe.com/docs/stripe-cli)

# Login to Stripe
stripe login

# Forward webhooks to your local server
stripe listen --forward-to localhost:3456/api/payments/webhook
```

The CLI will print a webhook signing secret like `whsec_...`. Copy it to your `.env`:

```env
STRIPE_WEBHOOK_SECRET=whsec_abc123...from_stripe_cli...
```

#### For Production (Dashboard Webhook)

1. Go to [https://dashboard.stripe.com/test/webhooks](https://dashboard.stripe.com/test/webhooks) (or `/webhooks` for live mode)
2. Click **Add endpoint**
3. **Endpoint URL**: `https://your-domain.com/api/payments/webhook`
4. **Events to listen to**: Select these events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
5. Click **Add endpoint**
6. Copy the **Signing secret** (`whsec_...`) into your `.env`

### Step 6: Restart the Server

```bash
npm start
```

On startup, you should see:

```
  Payments  : Stripe (live)
```

Instead of:

```
  Payments  : Not configured
```

### Step 7: Test a Payment

1. Login as **sarah** (tenant account)
2. Go to **My Bills** → click **Pay** on any unpaid bill
3. Select **FPX** / **Card** / **GrabPay**
4. Click **Pay RM X.XX**
5. You'll be **redirected to Stripe's hosted payment page**
6. Use Stripe test credentials (see below)
7. After completing payment, you're redirected back to WeStay
8. `_handlePaymentReturn()` verifies the session and shows a receipt

### Stripe Test Credentials

| Method | Test Data |
|---|---|
| **Card** | Number: `4242 4242 4242 4242`, Expiry: any future date, CVC: any 3 digits |
| **FPX** | Select any bank from the list → Stripe shows a test authorization page → click "Authorize test payment" |
| **GrabPay** | Stripe shows a test authorization page → click "Authorize test payment" |

> **Decline test:** Use card `4000 0000 0000 0002` to simulate a declined payment.

For more test cards: [https://docs.stripe.com/testing](https://docs.stripe.com/testing)

### Payment Flow (Detailed)

```
Tenant clicks "Pay"
    │
    ▼
selectPaymentMethod('fpx' / 'card' / 'ewallet')
    │
    ▼
processGatewayPayment(billType, billId)
    │
    ├── GET /api/payments/status
    │   └── { configured: true }  ← Stripe is ready
    │
    ├── POST /api/payments/checkout
    │   Body: { billId, billType, paymentMethod }
    │   └── Returns: { sessionId, sessionUrl }
    │
    ▼
window.location.href = sessionUrl  ← BROWSER REDIRECTS TO STRIPE
    │
    ▼
┌──────────────────────────────┐
│  STRIPE HOSTED PAYMENT PAGE  │
│                              │
│  FPX → Bank login page       │
│  Card → Card number form     │
│  GrabPay → Auth page         │
└──────────────────────────────┘
    │
    ▼
On success, Stripe redirects to:
  /?payment_success=BILL_ID&session_id=cs_xxx
    │
    ▼
_handlePaymentReturn()  (app.js)
    │
    ├── GET /api/payments/verify-session/cs_xxx
    │   └── Server verifies with Stripe API + marks bill as Paid
    │   └── Auto-reconnects electric meter + smart lock (if disconnected)
    │
    ▼
Receipt shown + toast "Payment confirmed!"

── BACKUP: Stripe webhook ──
POST /api/payments/webhook
    │
    ▼
Event: checkout.session.completed
    │
    └── _markBillPaid() → same bill update + auto-reconnect logic
```

### Simulation Fallback

When Stripe is **not** configured (`STRIPE_SECRET_KEY` is missing or is the placeholder value), the frontend automatically falls back to a simulated payment experience:

- **FPX**: Shows a mock bank selection grid (Maybank, CIMB, Public Bank, etc.)
- **Card**: Shows a mock card entry form
- **GrabPay**: Shows a mock authorization page

This allows the app to demo the full payment UX on GitHub Pages or in offline mode without a Stripe account.

### Production Checklist

- [ ] Switch to **live mode** keys (`sk_live_...`, `pk_live_...`) on the Stripe Dashboard
- [ ] Set up a **live webhook endpoint** (HTTPS required) pointing to `https://your-domain.com/api/payments/webhook`
- [ ] Enable **FPX** and **GrabPay** in Stripe Dashboard → Settings → Payment Methods (requires Malaysia business verification for FPX)
- [ ] Set `STRIPE_WEBHOOK_SECRET` to the live webhook signing secret
- [ ] Update `CORS_ORIGIN` in `.env` to your production domain
- [ ] Enable HTTPS (`SSL_ENABLED=true`) — Stripe requires HTTPS for production
- [ ] Test with Stripe's test cards before going live
- [ ] Monitor payments in Stripe Dashboard → Payments

### Troubleshooting

| Issue | Cause | Fix |
|---|---|---|
| "Payment gateway not configured" on API call | `STRIPE_SECRET_KEY` not set or still placeholder | Set real `sk_test_...` key in `.env` |
| Server shows `Payments: Not configured` | Same as above | Check `.env` |
| Payment page doesn't redirect (shows simulation instead) | `_useAPI = false` (demo mode) or Stripe not configured | Login with real backend (not GitHub Pages), check `STRIPE_SECRET_KEY` |
| FPX not available on Stripe checkout page | FPX not enabled in Stripe | Go to Stripe Dashboard → Settings → Payment methods → Turn on FPX |
| Webhook errors in logs | `STRIPE_WEBHOOK_SECRET` wrong or missing | Recopy from Stripe CLI output or Dashboard |
| "No such checkout session" on verify | Session expired (24 hours) | Payment must be completed within 24h of session creation |
| Payment succeeds on Stripe but bill not marked paid | Webhook not configured or verify-session not called | Set up webhook as backup; check `_handlePaymentReturn()` runs on redirect |

---

## Email (SMTP) Integration

WeStay uses **Nodemailer** to send transactional emails (rent reminders, ticket updates). It works with any SMTP provider — Gmail, Mailgun, SendGrid SMTP relay, Amazon SES, or your own mail server.

### How It Works (Architecture)

```
┌──────────────────────────────────────────────────────────┐
│  BACKEND                                                  │
│                                                          │
│  services/notification.js                                │
│  ├── isEmailConfigured()  → checks SMTP_HOST/USER/PASS  │
│  ├── sendEmail({ to, subject, text, html })              │
│  ├── sendMultiChannel(db, { channels, ... })             │
│  ├── rentDueEmailHtml()   → HTML template for rent       │
│  └── ticketUpdateEmailHtml() → HTML template for tickets │
│                                                          │
│  routes/notifications.js                                 │
│  ├── GET  /api/notifications/status     → channel avail  │
│  ├── POST /api/notifications/email      → send one email │
│  ├── POST /api/notifications/send       → multi-channel  │
│  ├── POST /api/notifications/rent-reminder  → 1 tenant   │
│  └── POST /api/notifications/bulk-rent-reminder → all    │
└──────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────┐
│  SMTP SERVER (External)                                   │
│  Gmail / Mailgun / SendGrid / Amazon SES / Custom         │
└──────────────────────────────────────────────────────────┘
```

### Fallback When Not Configured

When SMTP is **not** configured, `isEmailConfigured()` returns `false`. Email sends return `{ success: false, error: 'Email not configured...' }` and are silently skipped in multi-channel sends. **In-app notifications always work** regardless.

### Step 1: Choose an SMTP Provider

| Provider | Free Tier | SMTP Host | Notes |
|---|---|---|---|
| **Gmail** | 500/day (personal) | `smtp.gmail.com` | Requires App Password (not regular password) |
| **Mailgun** | 100/day (sandbox) | `smtp.mailgun.org` | Best for transactional email |
| **SendGrid** | 100/day | `smtp.sendgrid.net` | Use API key as password |
| **Amazon SES** | 62,000/month (from EC2) | `email-smtp.{region}.amazonaws.com` | Cheapest at scale |
| **Mailtrap** | 100/month (testing) | `sandbox.smtp.mailtrap.io` | Great for dev — catches all emails |

### Step 2: Get SMTP Credentials

#### Gmail (Quick Start)

1. Go to [https://myaccount.google.com/security](https://myaccount.google.com/security)
2. Enable **2-Step Verification** (required)
3. Go to [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
4. Select **Mail** → **Other** → name it "WeStay" → **Generate**
5. Copy the 16-character App Password (e.g., `abcd efgh ijkl mnop`)

#### Mailgun

1. Sign up at [https://www.mailgun.com/](https://www.mailgun.com/)
2. Go to **Sending** → **Domains** → select your sandbox domain
3. Click **SMTP credentials** → note the login and password
4. **For production:** Add and verify your own domain (requires DNS TXT/CNAME records)

#### SendGrid

1. Sign up at [https://sendgrid.com/](https://sendgrid.com/)
2. Go to **Settings** → **API Keys** → **Create API Key** (Full Access)
3. SMTP username is always `apikey`, password is your API key

### Step 3: Configure `.env`

```env
# ---- Email (SMTP / Nodemailer) ----
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=abcd efgh ijkl mnop
SMTP_FROM=noreply@westay.my
```

| Variable | Required | Description |
|---|---|---|
| `SMTP_HOST` | Yes | SMTP server hostname |
| `SMTP_PORT` | No | Port (default: `587` for TLS, `465` for SSL) |
| `SMTP_SECURE` | No | `true` for port 465 (SSL), `false` for port 587 (STARTTLS) |
| `SMTP_USER` | Yes | SMTP login (email address or API key) |
| `SMTP_PASS` | Yes | SMTP password or App Password |
| `SMTP_FROM` | No | Sender address (default: `noreply@westay.my`) |

### Step 4: Restart and Verify

```bash
npm start
```

Test with the API:

```bash
curl -X POST http://localhost:3456/api/notifications/email \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{"to": "test@example.com", "subject": "WeStay Test", "message": "Hello from WeStay!"}'
```

Check `GET /api/notifications/status` — should show `email.configured: true`.

### Email Templates

WeStay includes built-in HTML email templates:

| Template | Function | Used By |
|---|---|---|
| **Rent Due Reminder** | `rentDueEmailHtml(name, amount, date, property)` | `/api/notifications/rent-reminder` |
| **Ticket Update** | `ticketUpdateEmailHtml(name, ticketId, status, desc)` | (available for custom use) |

### Troubleshooting

| Issue | Cause | Fix |
|---|---|---|
| `email.configured: false` on `/status` | Missing `SMTP_HOST`, `SMTP_USER`, or `SMTP_PASS` | Check `.env` — all three are required |
| `Invalid login` error | Wrong credentials or Gmail blocking | Use App Password for Gmail; check provider docs |
| `ECONNREFUSED` | Wrong host/port | Verify SMTP host and port; try port 465 with `SMTP_SECURE=true` |
| Emails going to spam | No SPF/DKIM on sender domain | Set up SPF/DKIM DNS records, or use a verified Mailgun/SendGrid domain |
| `self signed certificate` error | SMTP server uses self-signed cert | (For dev only) Set `NODE_TLS_REJECT_UNAUTHORIZED=0` — **never in production** |

---

## WhatsApp (Meta Cloud API) Integration

WeStay can send WhatsApp messages to tenants via the **Meta (Facebook) Cloud API for WhatsApp Business**. This is used for rent reminders and announcements.

### How It Works (Architecture)

```
┌──────────────────────────────────────────────────────────┐
│  BACKEND                                                  │
│                                                          │
│  services/notification.js                                │
│  ├── isWhatsAppConfigured() → checks API_URL + TOKEN     │
│  ├── sendWhatsApp({ to, message })       → text message  │
│  ├── sendWhatsApp({ to, template, ... }) → template msg  │
│  └── sendMultiChannel(db, { channels: ['whatsapp'] })    │
│                                                          │
│  routes/notifications.js                                 │
│  ├── POST /api/notifications/whatsapp       → direct msg │
│  └── POST /api/notifications/rent-reminder  → auto-adds  │
│          WhatsApp if tenant has phone number              │
└──────────────────────────────────────────────────────────┘
         │
         ▼  (native Node.js fetch — no extra library)
┌──────────────────────────────────────────────────────────┐
│  META GRAPH API                                           │
│  https://graph.facebook.com/v17.0/{phone_id}/messages     │
│                                                          │
│  Supports: text messages + template messages               │
│  Auth: Bearer token in Authorization header               │
└──────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────┐
│  WHATSAPP                                                 │
│  Message delivered to tenant's WhatsApp                   │
└──────────────────────────────────────────────────────────┘
```

### Fallback When Not Configured

When WhatsApp is **not** configured, `isWhatsAppConfigured()` returns `false`. WhatsApp sends return `{ success: false, error: 'WhatsApp not configured...' }` and are silently skipped in multi-channel sends. **In-app notifications always work** regardless.

### Prerequisites

- A **Facebook Business Account** (free)
- A **Meta Developer Account** (free)
- A **WhatsApp Business API** app on Meta Developer Portal
- A phone number registered with WhatsApp Business

> **Note:** The WhatsApp Business API is **not** the same as WhatsApp Business App. The API is for programmatic message sending.

### Step 1: Create a Meta Developer App

1. Go to [https://developers.facebook.com/apps/](https://developers.facebook.com/apps/)
2. Click **Create App** → Choose **Business** → Click **Next**
3. Enter app name (e.g., "WeStay Notifications") → Select your Business Account → **Create App**
4. On the app dashboard, find **WhatsApp** → Click **Set up**

### Step 2: Get API Credentials

1. In your Meta app, go to **WhatsApp** → **API Setup**
2. You'll see:
   - **Phone number ID** — a numeric ID like `1234567890123456`
   - **WhatsApp Business Account ID**
   - **Temporary access token** (expires in 24h — for testing only)
3. Copy the **Phone number ID** and **Temporary access token**

#### For Production: Generate a Permanent Token

1. Go to [https://developers.facebook.com/tools/explorer/](https://developers.facebook.com/tools/explorer/)
2. Select your app → Add permission `whatsapp_business_messaging`
3. Generate a **System User token** with `whatsapp_business_messaging` permission
4. This token does not expire

Alternatively:
1. Go to **Business Settings** → **System Users** → **Add** → Name: "WeStay API"
2. Assign your WhatsApp Business Account as an Asset
3. Generate token with `whatsapp_business_messaging` permission

### Step 3: Configure `.env`

```env
# ---- WhatsApp (Meta Cloud API) ----
WHATSAPP_API_URL=https://graph.facebook.com/v17.0/1234567890123456/messages
WHATSAPP_API_TOKEN=EAAxxxxxxx...your_token_here...
WHATSAPP_PHONE_ID=1234567890123456
```

| Variable | Required | Description |
|---|---|---|
| `WHATSAPP_API_URL` | Yes | Meta Graph API endpoint (replace `{phone_id}` with your actual phone number ID, or leave as `{phone_id}` — code replaces it) |
| `WHATSAPP_API_TOKEN` | Yes | Bearer token for Meta API auth |
| `WHATSAPP_PHONE_ID` | No | Phone number ID (used if `{phone_id}` is in the URL template) |

### Step 4: Add a Test Phone Number

During development, you can only send messages to **verified phone numbers**:

1. In your Meta app → **WhatsApp** → **API Setup** → scroll to **"To" phone number**
2. Click **Manage phone number list** → Add your number → Verify via SMS code

### Step 5: Restart and Test

```bash
npm start
```

Test with the API:

```bash
curl -X POST http://localhost:3456/api/notifications/whatsapp \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{"to": "60123456789", "message": "Hello from WeStay!"}'
```

> **Phone format:** Use international format without `+` (e.g., `60123456789` for Malaysia).

Check `GET /api/notifications/status` — should show `whatsapp.configured: true`.

### Template Messages

For production, WhatsApp requires **pre-approved message templates** for business-initiated conversations. The code supports templates:

```bash
curl -X POST http://localhost:3456/api/notifications/whatsapp \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "60123456789",
    "template": "rent_reminder",
    "templateParams": { "name": "Sarah", "amount": "RM 850", "date": "2026-04-10" }
  }'
```

To create templates:
1. Go to Meta app → **WhatsApp** → **Message Templates** → **Create Template**
2. Choose category **Utility** → Name: `rent_reminder`
3. Add body with variables: `Hi {{1}}, your rent of {{2}} is due on {{3}}.`
4. Submit for review (usually approved within minutes)

### Troubleshooting

| Issue | Cause | Fix |
|---|---|---|
| `whatsapp.configured: false` on `/status` | Missing `WHATSAPP_API_URL` or `WHATSAPP_API_TOKEN` | Check `.env` |
| `(#131030) Recipient phone number not in allowed list` | Sending to unverified number in test mode | Add the number in Meta app → API Setup → Manage phone numbers |
| `Invalid OAuth 2.0 Access Token` | Token expired or wrong | Use a System User permanent token (see Step 2) |
| `(#131047) Re-engagement message` | More than 24h since user's last message | Use an approved template message instead of text |
| `ENOTFOUND graph.facebook.com` | No internet or DNS issue | Check network; ensure server has outbound HTTPS access |

### Production Checklist

- [ ] Replace temporary token with a **permanent System User token**
- [ ] Create and get approval for all **message templates** you plan to use
- [ ] Register your **own phone number** (instead of Meta's test number) for a branded sender
- [ ] Set up a **webhook** in Meta app to receive message status updates (delivered, read)
- [ ] Add your production server IP to the **App IP Whitelist** (optional, for security)

---

## SSL / HTTPS Setup

WeStay includes built-in HTTPS support using Node.js `https` module. When enabled, it serves the app over TLS and automatically redirects HTTP to HTTPS.

### How It Works

```
┌─────────────────────────────────────────────────────────┐
│  server.js                                               │
│                                                         │
│  1. createHTTPSServer(app) → reads SSL cert + key       │
│  2. If certs found: HTTPS server on PORT                │
│     + HTTP redirect server on port 80                   │
│  3. If SSL not enabled: plain HTTP server (default)     │
│                                                         │
│  backend/https.js                                       │
│  ├── isSSLEnabled()        → checks SSL_ENABLED + paths │
│  ├── createHTTPSServer()   → returns https.Server       │
│  ├── createRedirectServer()→ HTTP→HTTPS 301 redirect    │
│  └── generateSelfSigned()  → dev certs via openssl      │
└─────────────────────────────────────────────────────────┘
```

### Fallback When Not Configured

When `SSL_ENABLED` is not `true` or cert files are missing, the server falls back to plain HTTP. The startup banner shows `HTTPS: Disabled`.

### When Do You Need HTTPS?

| Scenario | HTTPS Required? |
|---|---|
| Local development | No (HTTP on localhost is fine) |
| Stripe production (live keys) | **Yes** — Stripe requires HTTPS for webhooks |
| WhatsApp webhook receiving | **Yes** — Meta requires HTTPS for webhooks |
| Public-facing deployment (VPS/cloud) | **Yes** — for security and SEO |
| GitHub Pages (demo branch) | Not applicable — GitHub provides HTTPS |

### Option A: Self-Signed Certificate (Development)

For local HTTPS testing (browsers will show a security warning):

```bash
# Generate self-signed cert (requires OpenSSL installed)
node -e "require('./backend/https').generateSelfSigned()"
```

This creates:
- `certs/dev-privkey.pem` — private key
- `certs/dev-cert.pem` — self-signed certificate

Configure `.env`:

```env
SSL_ENABLED=true
SSL_KEY_PATH=./certs/dev-privkey.pem
SSL_CERT_PATH=./certs/dev-cert.pem
```

### Option B: Let's Encrypt (Production — Free)

For a real certificate trusted by all browsers:

#### Using Certbot (Linux/VPS)

```bash
# Install certbot
sudo apt install certbot

# Get certificate (your domain must point to the server)
sudo certbot certonly --standalone -d yourdomain.com

# Certificates are saved to:
#   /etc/letsencrypt/live/yourdomain.com/privkey.pem
#   /etc/letsencrypt/live/yourdomain.com/fullchain.pem
```

Configure `.env`:

```env
SSL_ENABLED=true
SSL_KEY_PATH=/etc/letsencrypt/live/yourdomain.com/privkey.pem
SSL_CERT_PATH=/etc/letsencrypt/live/yourdomain.com/fullchain.pem
SSL_CA_PATH=/etc/letsencrypt/live/yourdomain.com/chain.pem
HTTP_REDIRECT_PORT=80
```

> **Auto-renewal:** Certbot automatically renews certs. Add a cron job to restart the server after renewal:
> ```bash
> 0 3 * * * certbot renew --quiet && systemctl restart westay
> ```

#### Using Reverse Proxy (Recommended for Production)

Most production setups put WeStay behind **Nginx** or **Caddy** which handle SSL termination:

```
Internet → Caddy/Nginx (HTTPS:443) → WeStay (HTTP:3456)
```

In this case, keep `SSL_ENABLED=false` and let the reverse proxy handle HTTPS.

**Caddy example** (auto-HTTPS with zero config):

```caddyfile
yourdomain.com {
    reverse_proxy localhost:3456
}
```

**Nginx example:**

```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3456;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `SSL_ENABLED` | Yes (to enable) | `false` | Set to `true` to enable HTTPS |
| `SSL_KEY_PATH` | Yes (if enabled) | `./certs/privkey.pem` | Path to private key PEM file |
| `SSL_CERT_PATH` | Yes (if enabled) | `./certs/fullchain.pem` | Path to certificate PEM file |
| `SSL_CA_PATH` | No | `./certs/chain.pem` | CA chain (for intermediate certificates) |
| `HTTP_REDIRECT_PORT` | No | `80` | Port for HTTP→HTTPS redirect server |

### Troubleshooting

| Issue | Cause | Fix |
|---|---|---|
| `HTTPS: Disabled` in startup banner | `SSL_ENABLED` not `true` or cert paths missing | Set `SSL_ENABLED=true` and verify paths in `.env` |
| `SSL key not found` warning | File doesn't exist at specified path | Check `SSL_KEY_PATH` — use absolute path if relative doesn't work |
| Browser shows "Not Secure" / cert warning | Using self-signed cert | Expected in dev; use Let's Encrypt for production |
| `EACCES` on port 80 (redirect server) | Port 80 requires root/admin | Use `sudo` on Linux, or change `HTTP_REDIRECT_PORT=8080` |
| `EADDRINUSE` on port 80 | Another service (Nginx/Apache) using port 80 | Stop the other service, or use reverse proxy instead |

---

## Hosting & Deployment

### Hosting Environment Requirements

WeStay is a **long-running Node.js server** (not serverless). Here's everything the hosting environment must support:

| Requirement | Details |
|---|---|
| **Runtime** | Node.js **20 LTS** or newer (Express 5, sql.js WASM) |
| **Process type** | Long-running server (NOT serverless/edge functions) |
| **WebSocket** | Required — custom WS engine on `/ws` (HTTP Upgrade, same port) |
| **Persistent disk** | Required — SQLite file (`backend/data/westay.db`), uploads (`backend/uploads/`), logs (`backend/logs/`) |
| **Writable filesystem** | Required — SQLite writes on every mutation, multer saves uploads to disk |
| **Port** | Single port (default `3456`, configurable via `PORT` env var). WS runs on same port |
| **WASM support** | Required — sql.js loads `sql-wasm.wasm` at runtime (Node.js 18+ has this built-in) |
| **Native modules** | None — all npm deps are pure JavaScript (no `node-gyp`, no C/C++ compiler needed) |
| **Cron/scheduler** | Not needed — no background jobs (heartbeat is in-process `setInterval`) |
| **Outbound HTTPS** | Needed only if using: Stripe API, WhatsApp API, SMTP email |

### Resource Estimates

| Resource | Minimum | Recommended | Notes |
|---|---|---|------|
| **RAM** | 256 MB | 512 MB | sql.js loads entire DB into memory (~1-5 MB for typical use) |
| **CPU** | 1 shared vCPU | 1 dedicated vCPU | Very light workload — no heavy computation |
| **Disk** | 500 MB | 1 GB+ | Code (~3 MB) + node_modules (~120 MB) + logs (up to 150 MB) + DB + uploads |
| **Bandwidth** | 100 GB/month | Unlimited | SPA is lightweight; API traffic is minimal for co-living scale |

### Platform Compatibility

| Platform | Compatible | WebSocket | Persistent Disk | Free Tier | Notes |
|---|---|---|---|---|---|
| **Railway** | ✅ | ✅ | ✅ (volumes) | Trial $5 credit | ⭐ **Best pick** — easiest deploy, built-in volumes |
| **Render** | ✅ | ✅ | ✅ (disk add-on) | 750h/month free | Good free tier, disk needs paid plan |
| **Fly.io** | ✅ | ✅ | ✅ (volumes) | 3 shared VMs free | Edge deploy, good for SEA region |
| **DigitalOcean Droplet** | ✅ | ✅ | ✅ (native) | — | $4/month (512 MB), full VPS control |
| **Hetzner Cloud** | ✅ | ✅ | ✅ (native) | — | €3.29/month (2 GB), cheapest VPS |
| **AWS Lightsail** | ✅ | ✅ | ✅ (native) | 3 months free | $3.50/month, AWS infrastructure |
| **Heroku** | ⚠️ Partial | ✅ | ❌ Ephemeral FS | Eco $5/month | SQLite + uploads **lost on restart** |
| **Vercel** | ❌ | ❌ | ❌ | — | Serverless — no WS, no long-running process |
| **Netlify** | ❌ | ❌ | ❌ | — | Serverless functions only |
| **Cloudflare Workers** | ❌ | ❌ | ❌ | — | No Node.js runtime, no FS |

### 🏆 Recommended: Cheapest & Good Options

#### Option 1: Railway (Easiest — PaaS)

**Cost: ~$5/month** | Zero DevOps | Git push to deploy

Railway is the fastest path from `git push` to production. It auto-detects Node.js, supports WebSocket, and has persistent volumes.

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login & init
railway login
railway init

# 3. Add persistent volume for SQLite + uploads
railway volume add --mount /app/backend/data
railway volume add --mount /app/backend/uploads
railway volume add --mount /app/backend/logs

# 4. Set environment variables
railway variables set JWT_SECRET=your-strong-random-secret-here
railway variables set NODE_ENV=production
railway variables set PORT=3456
railway variables set CORS_ORIGIN=https://your-app.up.railway.app
# (Add SMTP, Stripe, WhatsApp vars as needed)

# 5. Deploy
railway up
```

**Pros:** Easiest setup, auto-SSL, auto-deploy from GitHub, built-in volumes, logs dashboard.  
**Cons:** $5/month minimum after trial (no permanent free tier).

#### Option 2: Hetzner Cloud VPS (Cheapest — IaaS)

**Cost: €3.29/month (~RM 16)** | 2 GB RAM, 20 GB disk | Full VPS control

Best value for money. Requires basic Linux knowledge.

```bash
# 1. Create a CX22 instance (2 GB RAM, 1 vCPU, 20 GB disk) — €3.29/month
#    Choose: Ubuntu 22.04, Ashburn or Singapore datacenter

# 2. SSH in and install Node.js
ssh root@your-server-ip
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs git

# 3. Clone and setup
git clone https://github.com/gonzalloe/westay.git
cd westay
git checkout staging
npm install --production
cp .env.example .env
nano .env  # Set JWT_SECRET, CORS_ORIGIN, etc.

# 4. Install PM2 (process manager — keeps app running)
npm install -g pm2
pm2 start server.js --name westay
pm2 save
pm2 startup  # Auto-restart on reboot

# 5. Install Caddy for auto-HTTPS (free Let's Encrypt)
apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
apt update && apt install caddy

# 6. Configure Caddy (auto-HTTPS, reverse proxy)
cat > /etc/caddy/Caddyfile << 'EOF'
yourdomain.com {
    reverse_proxy localhost:3456
}
EOF
systemctl restart caddy

# Done! https://yourdomain.com is live with auto-renewing SSL
```

**Pros:** Cheapest option, 2 GB RAM (overkill for WeStay), full server control, Singapore DC available (low latency for MY).  
**Cons:** Manual setup, you manage updates/security.

#### Option 3: DigitalOcean Droplet (Balanced)

**Cost: $4/month** | 512 MB RAM, 10 GB disk | Good docs & community

Same setup as Hetzner but with DigitalOcean's ecosystem (monitoring, backups, firewall UI).

```bash
# Create a $4/month Droplet: Basic, Regular, 512 MB / 1 vCPU / 10 GB SSD
# Choose: Singapore datacenter (sgp1) — closest to Malaysia
# Then follow the same steps as Hetzner above
```

#### Option 4: Fly.io (Free Tier — Edge)

**Cost: Free (up to 3 VMs)** | 256 MB RAM | Edge deploy

```bash
# 1. Install flyctl
curl -L https://fly.io/install.sh | sh

# 2. Create app
cd westay
fly launch  # Auto-detects Node.js

# 3. Create persistent volume
fly volumes create westay_data --size 1 --region sin  # Singapore, 1 GB

# 4. Add to fly.toml
# [mounts]
#   source = "westay_data"
#   destination = "/data"

# 5. Update .env: DB_PATH=/data/westay.db (symlink uploads + logs to /data too)

# 6. Set secrets
fly secrets set JWT_SECRET=your-strong-secret
fly secrets set NODE_ENV=production

# 7. Deploy
fly deploy
```

**Pros:** Free tier, edge deployment (Singapore region), auto-SSL.  
**Cons:** 256 MB might be tight, volume setup more complex, free tier may change.

### Cost Comparison Summary

| Platform | Monthly Cost | RAM | Disk | Setup Difficulty | Best For |
|---|---|---|---|---|---|
| **Fly.io** | Free | 256 MB | 1 GB vol | Medium | Testing / MVP on zero budget |
| **Hetzner** | €3.29 (~RM 16) | 2 GB | 20 GB | Medium | Best value — production ready |
| **AWS Lightsail** | $3.50 | 512 MB | 20 GB | Medium | AWS ecosystem |
| **DigitalOcean** | $4 | 512 MB | 10 GB | Medium | Great docs, MY-friendly DC |
| **Railway** | ~$5 | 512 MB | Volumes | **Easy** | Fastest deploy, zero DevOps |
| **Render** | $7+ (with disk) | 512 MB | Persistent | Easy | Good monitoring UI |

### Production Deployment Checklist

Before going live, ensure these are configured:

- [ ] **`JWT_SECRET`** — Set a strong random string (min 32 characters): `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- [ ] **`NODE_ENV=production`** — Enables production logging level, stricter security
- [ ] **`CORS_ORIGIN`** — Set to your actual domain (not `*`)
- [ ] **HTTPS** — Use reverse proxy (Caddy/Nginx) or set `SSL_ENABLED=true`
- [ ] **Persistent storage** — SQLite file, uploads, and logs on persistent disk/volume
- [ ] **Process manager** — PM2 or Docker to auto-restart on crash
- [ ] **Backups** — Schedule daily backup of `backend/data/westay.db` (it's a single file — just `cp` it)
- [ ] **Firewall** — Only expose ports 80 (HTTP redirect) and 443 (HTTPS)
- [ ] **Domain + DNS** — Point your domain's A record to server IP

### Optional: Database Hosting for Future Scaling

WeStay currently uses **SQLite (via sql.js)** — a single-file database loaded into memory. This is perfect for small-to-medium co-living operations (up to ~1000 tenants, 10K records). When you outgrow SQLite, the **repository pattern** in `backend/db/` makes migration straightforward.

#### When to Migrate Away from SQLite

| Signal | Threshold | What It Means |
|---|---|---|
| DB file size | > 100 MB | Memory usage too high (sql.js loads entire DB) |
| Concurrent writes | > 50 req/sec | SQLite is single-writer (no concurrent writes) |
| Multi-server | > 1 instance | SQLite is local — can't share across servers |
| Data sensitivity | Production PII | Want managed backups, encryption at rest |

#### Recommended: PostgreSQL (Best for Future Scaling)

PostgreSQL is the industry standard for production apps. Cheapest managed options:

| Provider | Free Tier | Paid Plan | Region | Notes |
|---|---|---|---|---|
| **Neon** | 512 MB free forever | $19/month (10 GB) | Singapore 🇸🇬 | ⭐ Best free tier, serverless Postgres, branching |
| **Supabase** | 500 MB free, 2 projects | $25/month (8 GB) | Singapore 🇸🇬 | Postgres + auth + storage + real-time |
| **Railway** | Included in $5 plan | — | US/EU | Postgres add-on, same platform as app |
| **PlanetScale** | 5 GB free (MySQL) | $39/month | Singapore 🇸🇬 | MySQL-compatible, great for scaling (branching) |
| **ElephantSQL** | 20 MB free | $5/month (100 MB) | Various | Simplest managed Postgres |
| **AWS RDS** | 12 months free | $15+/month | Singapore 🇸🇬 | Enterprise grade |
| **DigitalOcean Managed DB** | — | $15/month | Singapore 🇸🇬 | Easy setup, auto-backups |

#### Migration Path (SQLite → PostgreSQL)

The codebase is designed for this. You only need to:

1. **Write a new adapter:** Create `backend/db/postgres-adapter.js` implementing the same `DatabaseInterface` from `backend/db/interface.js`
2. **Swap in `backend/db/index.js`:** Change one line from `new SqliteAdapter()` to `new PostgresAdapter()`
3. **Add `pg` package:** `npm install pg`
4. **Migrate data:** Export SQLite data as JSON → import into Postgres

```
backend/db/
├── interface.js          ← Abstract contract (getAll, getById, create, update, delete...)
├── sqlite-adapter.js     ← Current (swap this out)
├── memory-adapter.js     ← Dev fallback
├── postgres-adapter.js   ← NEW: implement same interface
└── index.js              ← Change one line to swap adapter
```

No route files, no middleware, no frontend code needs to change — only the adapter.

#### 🏆 Recommended DB Strategy

| Phase | Database | Cost | When |
|---|---|---|---|
| **Now → MVP** | SQLite (current) | Free | 0-500 tenants, single server |
| **Growth** | Neon (PostgreSQL) | Free → $19/month | 500+ tenants or multi-server |
| **Scale** | Supabase or AWS RDS | $25+/month | Enterprise features, managed backups |

> **TL;DR:** Stick with SQLite until you genuinely need to scale. When you do, Neon (free Postgres) is the cheapest path — and the repository pattern makes the migration a one-file change.

---

## Merging `staging` into `demo`

### When to Merge

Only merge when you're ready to deploy the full-stack version (i.e., when the stakeholder has reviewed the demo and you're moving to a hosted environment like Vercel, Railway, or a VPS).

> ⚠️ **Important**: The `demo` branch is deployed to GitHub Pages (static frontend only). Merging backend code into `demo` will **not break** the GitHub Pages site (it just ignores `server.js` and `backend/`), but the `.gitignore` changes will differ.

### How to Merge

```bash
# Make sure both branches are up to date
git checkout demo
git pull origin demo

git checkout staging
git pull origin staging

# Merge staging into demo
git checkout demo
git merge staging

# Resolve any conflicts (likely in .gitignore, README.md)
# After resolving:
git add .
git commit -m "merge: integrate full-stack from staging into demo"
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

Keep `demo` for GitHub Pages (frontend-only with localStorage fallback) and `staging` for full-stack development. The frontend already has an **API-first with localStorage fallback** design — it works both ways automatically.

---

## What's Done

| Feature | Version | Details |
|---|---|---|
| REST API | v1.0 | 19 route files, ~125+ endpoints |
| SQLite Database | v1.0 | Persistent, auto-seed, repository pattern |
| In-Memory DB | v1.0 | Available as alternative adapter |
| JWT Authentication | v1.0 | Login, register, token refresh via 7-day expiry |
| Role-Based Access | v1.0 | 6 roles (62 total page routes), per-route middleware enforcement |
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
| **Test Suite** | **v1.3** | **106 tests across 4 suites (Jest 30) — DB, API, middleware, services** |
| **Demo Mode Login** | **v1.4** | **Offline login fallback for GitHub Pages — hardcoded demo credentials, `demo_` token, localStorage-only mode** |
| **Stripe Frontend Integration** | **v1.4** | **Frontend payment gateway wired to backend Stripe API (FPX bank redirect, card, GrabPay), simulation fallback** |

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
| `admin` | `admin123456` | Admin (System Admin) | — |
| `operator` | `op123456` | Operator (Site Operator) | — |
| `sarah` | `tenant123` | Tenant | Sarah Lim |
| `landlord` | `landlord123` | Landlord | Dato Lee Wei |
| `vendor` | `vendor123` | Vendor | AirCool Services |
| `agent` | `agent123` | Agent | — |

---

## License

ISC
