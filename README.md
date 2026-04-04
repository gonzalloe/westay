# WeStay — Co-Living Property Management Platform

> Frontend-only SPA for managing co-living properties, tenants, billing, IoT devices, and maintenance workflows.

**Branch: `demo`** — Frontend-only, deployed to [GitHub Pages](https://gonzalloe.github.io/westay/) for stakeholder demo.
**Branch: `backend-dev`** — Full-stack version with Express 5 + SQLite + JWT Auth backend. See that branch's README for backend details.

---

## Table of Contents

- [Live Demo](#live-demo)
- [Quick Start](#quick-start)
- [Tech Stack](#tech-stack)
- [Architecture Overview](#architecture-overview)
- [File Inventory](#file-inventory)
- [Roles & Pages (46 total)](#roles--pages-46-total)
- [Data Entities (22 types)](#data-entities-22-types)
- [Key Features](#key-features)
- [Security & Utilities](#security--utilities)
- [How to Merge `backend-dev` into `demo`](#how-to-merge-backend-dev-into-demo)
- [What's Done](#whats-done)
- [What's NOT Done Yet](#whats-not-done-yet)
- [Development Notes](#development-notes)

---

## Live Demo

**GitHub Pages:** [https://gonzalloe.github.io/westay/](https://gonzalloe.github.io/westay/)

Login with any email/password — it's a demo. Choose a role (Operator, Tenant, Landlord, Vendor, Agent) to see different dashboards.

---

## Quick Start

```bash
# Clone the repo
git clone https://github.com/gonzalloe/westay.git
cd westay

# Just open index.html in a browser — no build step, no server needed
# Or use any static file server:
npx serve .
# => http://localhost:3000
```

Zero dependencies. No npm install, no bundler, no framework. Pure vanilla JS + CSS.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **HTML** | Single `index.html` app shell |
| **CSS** | Custom dark theme with CSS variables, Inter font, Font Awesome 6.5 icons |
| **JavaScript** | 10 vanilla JS files, zero modules, zero dependencies |
| **Data** | In-memory JS arrays + localStorage persistence (Base64 obfuscated) |
| **Hosting** | GitHub Pages (static) |

### External Resources (CDN)

```
Google Fonts    — Inter (300–800 weights)
Font Awesome    — 6.5.0 (icons)
```

Content Security Policy is enforced via `<meta>` tag — scripts restricted to `self + unsafe-inline`.

---

## Architecture Overview

```
project-root/
├── index.html           # App shell: login, sidebar, header, AI chatbot
├── styles.css           # Dark theme, role theming, all components
├── data.js              # All data entities, utility rates, AI responses
├── roles.js             # 5 role configs: label, color, user, nav structure
├── helpers.js           # UI component builders, report previews, print
├── interactions.js      # Security, persistence, toast, modal, panel, search
├── crud.js              # Add/edit/delete modals, detail side-panels
├── automations.js       # 4 automation workflows + IoT meters + smart locks
├── features-new.js      # Owner reports, utility bills, payment gateway, photos
├── pages-operator.js    # 14 operator page render functions
├── pages-roles.js       # 32 tenant/landlord/vendor/agent page functions
└── app.js               # Router, login, sidebar, AI chatbot, shortcuts
```

### How it works

1. **Login Page** — Select a role, enter any credentials, click Sign In
2. **Router** — `PAGE_MAP` maps `{role: {pageId: renderFunction}}`. `navigateTo(pageId)` renders the page.
3. **Pages** — Each page is a JS function returning an HTML string
4. **Persistence** — `saveData()` writes all data to `localStorage` (Base64 encoded). `loadData()` restores on page load.
5. **Theming** — `body.role-{x}` sets `--role-color` and `--role-bg` CSS variables per role

### Script Load Order (matters!)

```
1. data.js           — data model (must be first)
2. roles.js          — role config (depends on data)
3. helpers.js        — UI components
4. interactions.js   — security, persistence, modals
5. crud.js           — CRUD operations
6. automations.js    — IoT, automation engine
7. features-new.js   — payment gateway, owner reports, etc.
8. pages-operator.js — operator pages
9. pages-roles.js    — other role pages
10. app.js           — router, login, chatbot (must be last)
```

---

## File Inventory

| File | Lines | Purpose |
|---|---|---|
| `index.html` | 128 | App shell: login page, sidebar, header, main content, AI chatbot, script tags |
| `styles.css` | 395 | Dark theme, role theming, layout, components, responsive |
| `data.js` | 174 | All data entities, utility rates, AI chatbot responses |
| `roles.js` | 128 | 5 role configurations: label, color, user, nav structure |
| `helpers.js` | 500 | UI component builders, report previews, print functions |
| `interactions.js` | 236 | Security, persistence, toast, modal, panel, notifications, search, filter, CSV export |
| `crud.js` | 304 | Add/edit/delete modals and detail side-panel views for all entities |
| `automations.js` | 813 | 4 automation workflows + electric/water meters + smart lock manager |
| `features-new.js` | 1138 | Owner reports, utility bills, payment gateway, photo system, check-in/out |
| `pages-operator.js` | 542 | 14 operator page render functions + IoT device list |
| `pages-roles.js` | 446 | Tenant (10) + Landlord (7) + Vendor (7) + Agent (8) page render functions |
| `app.js` | 458 | Router, login, sidebar builder, afterRender hooks, AI chatbot, logout, keyboard shortcuts |

**Total: ~4,862 lines of code** across 12 files.

---

## Roles & Pages (46 total)

### Operator (14 pages)

| Page ID | Section | Description |
|---|---|---|
| `dashboard` | MAIN | Portfolio overview — KPIs, revenue chart, occupancy bars, tickets, activity |
| `properties` | MAIN | Property card grid with add/click-to-detail |
| `tenants` | MAIN | Tenant table with check-in/out evidence, TA links, filter/export/preview |
| `landlords` | MAIN | Landlord table with revenue/expense/net payout, owner reports |
| `contracts` | MAIN | Tenancy agreements with auto-generate TA |
| `billing` | OPERATIONS | Invoice management with utility bills, generate invoices, pay/export |
| `maintenance` | OPERATIONS | Ticket list with priority stats, filter/export, photo attachments |
| `vendors` | OPERATIONS | Vendor cards with jobs/rating |
| `iot` | OPERATIONS | IoT device dashboard: smart locks, fingerprint manager, electric sub-meters |
| `leads` | GROWTH | Leads/CRM table with status transitions |
| `community` | GROWTH | Community events + feed |
| `ai` | GROWTH | AI Insights: pricing engine, tenant risk scoring, automation workflows |
| `reports` | REPORTS | 5 report types with preview/export/print |
| `settings` | REPORTS | General config, notifications, automation toggles, data export/reset |

### Tenant (10 pages)

| Page ID | Section | Description |
|---|---|---|
| `dashboard` | MY HOME | Personal overview: rent due, days remaining, quick actions, bills, events |
| `my-unit` | MY HOME | Unit details, deposit info, check-in/out evidence |
| `my-bills` | MY HOME | Unified rent + utility bills with payment gateway, pay-all, export |
| `my-contract` | MY HOME | View tenancy agreement document |
| `maintenance` | SERVICES | Submit/track maintenance requests with photo upload |
| `smart-access` | SERVICES | Smart lock control (lock/unlock) + access log |
| `utilities` | SERVICES | Meter readings (electric/water/internet), sub-meter status |
| `community` | COMMUNITY | Community feed + events |
| `events` | COMMUNITY | Community events list |
| `marketplace` | COMMUNITY | Placeholder — coming soon |

### Landlord (7 pages)

| Page ID | Section | Description |
|---|---|---|
| `dashboard` | OVERVIEW | Portfolio dashboard: properties, units, occupancy, revenue, payout |
| `my-properties` | OVERVIEW | Filtered property cards (own properties only) |
| `financials` | OVERVIEW | Revenue breakdown, management fee (20%), net payout, history |
| `tenancy-overview` | DETAILS | Tenants in landlord's properties |
| `maintenance-log` | DETAILS | Tickets on landlord's properties |
| `payouts` | DETAILS | Same as financials (alias) |
| `reports` | OTHER | Owner report, revenue, occupancy, maintenance, NPS + monthly auto-report records |

### Vendor (7 pages)

| Page ID | Section | Description |
|---|---|---|
| `dashboard` | WORK | Work order overview with status counts |
| `work-orders` | WORK | Vendor's work orders with status transitions |
| `schedule` | WORK | Timeline of upcoming jobs |
| `invoices` | FINANCE | Submit/view vendor invoices |
| `payments` | FINANCE | Same as invoices (alias) |
| `profile` | OTHER | Company profile info |
| `ratings` | OTHER | Reviews & ratings from clients |

### Agent (8 pages)

| Page ID | Section | Description |
|---|---|---|
| `dashboard` | SALES | Lead/viewing/application/commission overview |
| `leads` | SALES | Full leads table with status actions, export |
| `listings` | SALES | Available vacant rooms per property with share button |
| `viewings` | SALES | Upcoming viewings list |
| `applications` | PIPELINE | Tenant applications with approve/remind |
| `commission` | PIPELINE | Commission stats + history table |
| `contacts` | OTHER | Placeholder — coming soon |
| `performance` | OTHER | KPIs: team rank, conversion rate, response time, client rating |

---

## Data Entities (22 types)

| Entity | Variable | Records | Key Fields |
|---|---|---|---|
| Properties | `PROPS` | 8 | name, occupancy%, rooms, color, icon, address, revenue, type |
| Tenants | `TENANTS` | 8 | name, property+room, rent, status, lease end, phone, deposit |
| Tickets | `TICKETS` | 5 | id, title, location, priority, icon, color, time, reported by, status |
| Bills/Invoices | `BILLS` | 9 | id, tenant, amount, status, date, property |
| Vendors | `VENDORS` | 5 | name, type, jobs, rating, status, color, phone |
| Work Orders | `WORK_ORDERS` | 5 | id, desc, location, vendor, status, priority, amount, date |
| Leads | `LEADS` | 5 | name, phone, source, property, status, date, budget |
| Landlords | `LANDLORDS` | 5 | name, properties[], units, occupancy, revenue, payout |
| Contracts | `CONTRACTS` | 4 | id, tenant, property, start, end, rent, status, deposit |
| Utility Rates | `UTILITY_RATES` | 4 types | electric (RM0.218/kWh), water (RM0.57/m³), internet (RM30), sewerage (RM8) |
| Electric Meters | `ELECTRIC_METERS` | 26 | tenant, unit, room, meterId, status, kwh, lastRead |
| Water Meters | `WATER_METERS` | 26 | tenant, unit, room, meterId, m³, lastRead |
| Property Expenses | `PROPERTY_EXPENSES` | 8 props | mgmtFee, maintenance, internet, cleaning, insurance, misc per property |
| Utility Bills | `UTILITY_BILLS` | 2 | id, tenant, unit, room, period, electric/water/internet/sewerage, total, status |
| Check-In/Out Records | `CHECKINOUT_RECORDS` | 2 | id, tenant, unit, type, date, inspector, status, notes, photos[] |
| Ticket Photos | `TICKET_PHOTOS` | 3 tickets | maps ticket ID to filename arrays |
| Smart Lock Registry | `SMART_LOCK_REGISTRY` | 8 | tenant, unit, fingerprints, status, leaseEnd |
| IoT Locks | `IOT_LOCKS` | 16 | name, property, status, battery%, lastAccess, type, firmware |
| Notifications | `NOTIFS` | 5 | id, icon, color, title, desc, time, read |
| Automation State | `AUTOMATIONS` | 4 keys | enabled, lastRun, schedule, log[] |
| AI Responses | `AI_RESPONSES` | 13 keys | keyword-matched response strings |
| Colors | `COLORS` | 8 | hex color strings for consistent theming |

All data is demo/seed data. On first load, localStorage is empty and in-memory arrays are used. Mutations persist to localStorage via `saveData()`.

---

## Key Features

### 🤖 AI Chatbot
- Floating FAB button with slide-out chat panel
- Keyword-based response matching (13 topics: occupancy, revenue, overdue, maintenance, reports, contracts, smart locks, electric, utility, photos, check-in/out, automations)
- Input sanitized, rate-limited (1s cooldown), max 500 chars
- Simulated "typing" indicator with 800–1400ms delay

### 🔐 IoT & Smart Locks
- **16 IoT lock devices** across 8 properties with battery level, firmware, lock/unlock status
- **Smart Lock Fingerprint Manager**: auto-disables fingerprints on lease expiry, manual enable/disable
- **Electric Sub-Meter Manager**: 26 per-room meters, manual and auto cut/reconnect
- **Water Sub-Meters**: 26 per-room meters, parallel structure to electric

### ⚡ 4 Automation Workflows
1. **Auto-Generate Monthly Report** — comprehensive portfolio report on 1st of month
2. **Auto-Generate Tenancy Agreement** — creates TA documents 30 days before lease expiry
3. **Smart Lock Fingerprint Auto-Disable** — revokes access when tenancy ends
4. **Late Payment Auto Electric Cut** — disconnects only the overdue tenant's room sub-meter 7 days after due date; auto-reconnects on payment

### 💳 Payment Gateway (Simulated)
- 4 payment methods: FPX Online Banking (12 Malaysian banks), Credit/Debit Card, E-Wallet (TnG/GrabPay/Boost), DuitNow QR
- Form validation, processing animation, receipt generation
- Bulk "Pay All" for tenants
- Auto-triggers electric reconnect + smart lock re-enable on payment

### 📊 Reporting Engine
- **5 Operator Reports:** Revenue, Occupancy, Maintenance Summary, Tenant NPS, Financial P&L
- **Owner Report (per-landlord):** Homelette-style income/expense/net rental per-property breakdown with room-level detail and utility income
- **Tenant Billing Statement:** Combined rent + utility summary
- **Landlord-filtered reports:** Revenue and Occupancy scoped to owner's properties
- All reports support: Preview modal, CSV export, Print/PDF (opens new window)

### 📋 Check-In/Check-Out System
- Photo-documented unit inspections during tenant transitions
- Create inspection, attach photos, mark complete
- Operator sees all records; tenant sees only their own

### 📷 Photo Attachments
- Tickets can have photo attachments (add/remove/view)
- Check-in/out records can have photo attachments
- Simulated file names (demo mode — no actual upload server)

### 💡 Utility Bill Generation
- Auto-calculates from per-room electric + water meter readings
- Adds flat-rate internet (RM30) and sewerage (RM8)
- Uses TNB domestic tariff rates (RM0.218/kWh)

---

## Security & Utilities

| Utility | File | Purpose |
|---|---|---|
| `escHtml()` | interactions.js | XSS prevention — escapes HTML entities in all user-facing output |
| `sanitizeInput()` | interactions.js | Strips `<script>`, `onerror=`, `javascript:`, `data:text/html` from inputs |
| `rateLimited()` | interactions.js | Cooldown-based rate limiter (toast 500ms, search 150ms, AI chat 1s) |
| `debounce()` | interactions.js | Debounce wrapper (200ms on search) |
| `obfuscate()`/`deobfuscate()` | interactions.js | Base64 encoding for localStorage data |
| `saveData()`/`loadData()` | interactions.js | Persists 12 data arrays + TICKET_PHOTOS to localStorage |
| CSP Policy | index.html `<meta>` | Content Security Policy restricting scripts/styles sources |
| CSP Violation Log | interactions.js | Logs `securitypolicyviolation` events to console |

### Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+K` | Focus global search |
| `Escape` | Close modal, side panel, search, notifications, AI chatbot |

### Mobile Support

- Hamburger menu with sidebar overlay on small screens
- Auto-closes sidebar on navigation
- Responsive card grids

---

## How to Merge `backend-dev` into `demo`

When the backend is ready for production, merge `backend-dev` into `demo`:

```bash
# Make sure you're on demo
git checkout demo

# Merge backend-dev
git merge backend-dev

# Resolve any conflicts (README.md will conflict — keep backend-dev version)
# Then push
git push origin demo
```

### Post-Merge Checklist

| # | Task | Details |
|---|---|---|
| 1 | ✅ Update GitHub Pages | If using GitHub Pages, the merge adds `server.js` + `backend/` which won't break static hosting (Pages serves `index.html` as-is). But the API won't work on Pages. |
| 2 | 🔄 Deploy backend | Deploy to a hosting platform (Railway, Render, Fly.io, VPS) for the API. |
| 3 | 🔄 Update API base URL | In the frontend JS, update `fetch()` calls to point to the deployed backend URL. |
| 4 | 🔄 Environment variables | Set `JWT_SECRET`, `DB_PATH`, etc. on the server. |
| 5 | 🔄 Switch data mode | Frontend currently uses localStorage fallback. Backend-connected mode uses `fetch()` to `/api/*`. |

### Changing the Database in Future

The `backend-dev` branch uses a **Repository/Adapter pattern**. To swap the database:

1. Create a new adapter in `backend/db/` that extends `DatabaseInterface` (13 methods)
2. Update `backend/db/index.js` to return your new adapter
3. See `backend-dev` README for full guide on MySQL, PostgreSQL, and MongoDB adapters

---

## What's Done

### ✅ Frontend (this branch)

| Category | Features |
|---|---|
| **Architecture** | Single-page app, 10 JS files, dark theme, 5-role system, mobile responsive |
| **Operator** | Full 14-page dashboard with KPIs, charts, alerts, CRUD, reports |
| **Tenant** | 10-page portal: bills, payments, maintenance requests, smart access, utilities |
| **Landlord** | 7-page portal: portfolio, financials, owner reports, maintenance log |
| **Vendor** | 7-page portal: work orders, schedule, invoices, profile, ratings |
| **Agent** | 8-page portal: leads, listings, viewings, applications, commission, performance |
| **IoT** | Smart locks (16 devices), fingerprint manager, electric sub-meters (26 per-room), water meters |
| **Automations** | 4 workflows: auto-report, auto-TA, smart lock disable, electric cut |
| **Payment** | Simulated gateway: FPX, card, e-wallet, DuitNow QR |
| **Reports** | 5 operator reports + owner report + tenant billing + landlord-filtered reports |
| **Search** | Global search across tenants, properties, tickets, bills |
| **Notifications** | In-app notification panel with unread badges |
| **AI Chatbot** | Keyword-based assistant with 13 topic responses |
| **Security** | XSS escaping, input sanitization, rate limiting, CSP, localStorage obfuscation |
| **Data** | 22 entity types with ~130+ demo records |

### ✅ Backend (on `backend-dev` branch)

| Category | Features |
|---|---|
| **Server** | Express 5 on port 3456 |
| **Database** | SQLite via sql.js (persistent, WAL mode) |
| **Auth** | JWT + bcrypt, 5 demo accounts, role-based middleware |
| **API** | ~90 REST endpoints across 12 route files |
| **Seed Data** | 16+ entity tables with demo data |

---

## What's NOT Done Yet

### 🔴 Critical (Must Have for Production)

| Feature | Details |
|---|---|
| **Real Authentication** | Demo branch uses fake login (any credentials work). `backend-dev` has real JWT auth. Merge needed. |
| **Real Server** | Demo branch is frontend-only. Needs `backend-dev` merge + deployment. |
| **Environment Variables** | Hardcoded JWT secret in backend. Need `dotenv` for secrets. |
| **Input Validation** | No validation library (e.g., Joi, Zod). Route handlers do minimal checks. |
| **HTTPS** | No SSL/TLS. Required for production. Use reverse proxy (Nginx) or hosting platform. |

### 🟡 Important (Should Have Before Launch)

| Feature | Details |
|---|---|
| **File Upload** | Ticket photos are filename strings only — no actual file upload/storage. Need multer + S3/local storage. |
| **Email/SMS Notifications** | In-app only. No Nodemailer, Twilio, or similar integration. |
| **Rate Limiting (Server)** | No `express-rate-limit` on backend. API is open to abuse. |
| **API Pagination** | All list endpoints return full arrays. Need `?page=1&limit=20` for large datasets. |
| **Error Handling** | Basic try/catch. No centralized error handler, no structured error codes. |
| **Logging** | `console.log` only. Need Winston or Pino for structured logging. |
| **Test Suite** | Zero tests. Need Jest or Mocha for unit + integration tests. |

### 🟢 Nice to Have

| Feature | Details |
|---|---|
| **API Documentation** | No Swagger/OpenAPI spec. README covers it but auto-generated docs would be better. |
| **WebSocket for Real-Time** | No live updates. Notifications, IoT status, etc. are poll-based. |
| **Tenant Self-Registration** | Tenants can't register themselves. Operator must create accounts. |
| **Report Export (PDF/Excel)** | Reports are HTML-only. PDF/Excel export would be useful. |
| **Multi-Language** | English only. Consider i18n for Malay/Chinese. |
| **Audit Log** | No change tracking. Would help with accountability. |
| **Docker** | No Dockerfile. Would simplify deployment. |
| **CI/CD** | No GitHub Actions. Would automate testing + deployment. |

---

## Development Notes

### Conventions

- **onclick handlers:** Use escaped single quotes `\'` inside double-quoted HTML attributes (never `\"`)
- **Security:** All user input → `sanitizeInput()`, all HTML output → `escHtml()`
- **Rate limiting:** Toast (500ms), search (150ms debounce), AI chatbot (1s)
- **Data persistence:** Base64 obfuscated via `obfuscate()`/`deobfuscate()`
- **No build step:** Zero tooling. Edit files, refresh browser.

### Demo Accounts (backend-dev branch)

| Username | Password | Role |
|---|---|---|
| `operator` | `op123456` | Operator (Admin) |
| `sarah` | `tenant123` | Tenant — Sarah Lim |
| `landlord` | `landlord123` | Landlord — Dato Lee Wei |
| `vendor` | `vendor123` | Vendor — AirCool Services |
| `agent` | `agent123` | Agent |

(On `demo` branch, any credentials work — demo mode.)

### 8 Properties (Malaysia — Kampar, Perak)

| Property | Type | Rooms | Occupancy |
|---|---|---|---|
| Tsing Hua | Student | 60 | 95% |
| Beijing | Student | 48 | 92% |
| Cambridge | Student | 52 | 88% |
| Imperial | Student | 44 | 94% |
| Harvard | Student | 40 | 90% |
| Oxford | Student | 36 | 85% |
| Westlake Villa | Premium | 32 | 96% |
| Manchester | Student | 30 | 88% |

---

## License

ISC
