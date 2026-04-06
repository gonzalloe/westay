# WeStay — Production Readiness Audit & DIY Completion Guide

> **Generated:** 2026-04-06  
> **Branch:** `staging` (commit `e52e58f`)  
> **Status:** 94% complete — MVP-ready with gaps documented below

---

## Table of Contents

1. [Part A: What's Missing to Run Live](#part-a-whats-missing-to-run-live)
   - [🔴 CRITICAL (Must fix before launch)](#-critical-must-fix-before-launch)
   - [🟡 HIGH (Should fix before launch)](#-high-should-fix-before-launch)
   - [🟠 MEDIUM (Fix within first week)](#-medium-fix-within-first-week)
   - [🔵 LOW (Nice to have)](#-low-nice-to-have)
2. [Part B: DIY API Integration Guide](#part-b-diy-api-integration-guide)
   - [1. Stripe Payment Gateway](#1-stripe-payment-gateway-fpx--card--grabpay)
   - [2. Email Notifications (SMTP)](#2-email-notifications-smtp--nodemailer)
   - [3. WhatsApp Notifications (Meta Cloud API)](#3-whatsapp-notifications-meta-cloud-api)
   - [4. Forgot-Password Email Wiring](#4-forgot-password-email-wiring)
   - [5. SSL/HTTPS Setup](#5-sslhttps-setup)
   - [6. File Upload Routes](#6-file-upload-routes)
   - [7. Audit Logging Expansion](#7-audit-logging-expansion)
   - [8. WebSocket Event Wiring](#8-websocket-event-wiring)
   - [9. Structured Logger Adoption](#9-structured-logger-adoption)
   - [10. DB Migration & Backup Strategy](#10-db-migration--backup-strategy)
   - [11. HTTP-Level API Tests (supertest)](#11-http-level-api-tests-supertest)
   - [12. Graceful Shutdown](#12-graceful-shutdown)
   - [13. Frontend "Coming Soon" Pages](#13-frontend-coming-soon-pages)
   - [14. Process Manager (PM2)](#14-process-manager-pm2)
3. [Quick Reference: All Environment Variables](#quick-reference-all-environment-variables)
4. [Pre-Launch Checklist](#pre-launch-checklist)

---

# Part A: What's Missing to Run Live

## 🔴 CRITICAL (Must fix before launch)

### A1. `NODE_ENV` not set in `.env`

**Impact:** Error handler (`error-handler.js:14`) leaks full stack traces to API responses when `NODE_ENV !== 'production'`. Logger runs in debug mode (verbose, noisy).

**Current `.env`:** Missing `NODE_ENV` entirely.

**Fix:**
```bash
# Add to .env
NODE_ENV=production
```

**Files affected:** `backend/middleware/error-handler.js`, `backend/middleware/logger.js`

---

### A2. No graceful shutdown handler

**Impact:** When the server stops (container restart, deploy, `Ctrl+C`), SQLite may be mid-write → **database corruption**. WebSocket clients disconnect without cleanup. Open HTTP requests get aborted.

**Current `server.js`:** Zero `process.on()` handlers — no SIGTERM, no SIGINT, no uncaughtException, no unhandledRejection.

**Fix:** Add to `server.js` after the server starts (see [§12 in Part B](#12-graceful-shutdown))

---

### A3. `CORS_ORIGIN=*` (wide open)

**Impact:** Any website can make authenticated API calls on behalf of your users (CSRF-like attacks). The browser sends cookies/tokens to your API from any origin.

**Current `.env`:** `CORS_ORIGIN=*`

**Fix:**
```bash
# Replace with your actual domain(s)
CORS_ORIGIN=https://westay.my,https://www.westay.my
```

---

### A4. `JWT_SECRET` is still the dev placeholder

**Impact:** Anyone who reads the source code can forge valid JWT tokens (full admin access).

**Current `.env`:** `JWT_SECRET=westay-dev-secret-2026-change-in-production`

**Fix:**
```bash
# Generate a strong random secret (run this in terminal)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# Paste the output into .env:
JWT_SECRET=<paste 128-char hex string>
```

---

## 🟡 HIGH (Should fix before launch)

### A5. No DB backup mechanism

**Impact:** If the SQLite file gets corrupted or deleted, all data is gone. No recovery.

**Current state:** Zero backup scripts, zero cron jobs. The DB is a single file at `backend/data/westay.db`.

**Fix:** See [§10 in Part B](#10-db-migration--backup-strategy)

---

### A6. No process manager

**Impact:** If the Node.js process crashes (uncaught error, OOM), the server stays down until someone manually restarts it.

**Current state:** `npm start` runs bare `node server.js` — no auto-restart, no monitoring.

**Fix:** See [§14 in Part B](#14-process-manager-pm2)

---

### A7. `package.json` name is auto-generated

**Current:** `"name": "20260402153118"` — deployment platforms use this as the app identifier.

**Fix:**
```json
{
  "name": "westay",
  "engines": { "node": ">=18.0.0" }
}
```

---

## 🟠 MEDIUM (Fix within first week)

### A8. Audit middleware not wired to any route (except payments)

**Impact:** Only payment-related changes are tracked in the audit log. Property CRUD, tenant changes, ticket updates, bill edits — zero audit trail.

**Current state:**
- `auditMiddleware` defined in `backend/middleware/audit.js` — never imported by any route file
- Only `payments.js` imports `createAuditEntry` (manual calls, not middleware)
- 18 other route files have zero audit logging

**Fix:** See [§7 in Part B](#7-audit-logging-expansion)

---

### A9. Structured logger only used in 2 files

**Impact:** Route errors logged as `console.error` (no timestamps, no rotation, lost on redeploy). The structured logger exists but routes don't use it.

**Current state:**
- `logger` imported only in: `error-handler.js`, `server.js` (via `httpLogger`)
- All 19 route files use `console.log` / catch blocks with no logging
- WebSocket uses `console.log` directly

**Fix:** See [§9 in Part B](#9-structured-logger-adoption)

---

### A10. WebSocket `broadcast()` only called from 1 route

**Impact:** Real-time updates only fire for bill payments. Ticket status changes, new notifications, IoT meter cuts, new tenants — no WebSocket events.

**Current state:**
- `broadcast()` is called from: `payments.js` (bill paid event) + `notifications.js` (in-app notifs via service layer)
- NOT called from: `tickets.js`, `iot.js`, `tenants.js`, `props.js`, `contracts.js`, `work-orders.js`, `bills.js` (direct edits), `auth.js` (login events)

**Fix:** See [§8 in Part B](#8-websocket-event-wiring)

---

### A11. Upload middleware built but only used by ticket photos

**Impact:** Contract documents, inspection reports, tenant ID photos — no upload endpoints exist.

**Current state:**
- `upload.js` exports: `uploadImages`, `uploadDocuments`, `uploadAny`, `setEntityType`, `deleteUploadedFile`, `getFileInfo`
- Only `tickets.js` uses `uploadImages` (for `POST /api/tickets/:id/photos/upload`)
- `uploadDocuments`, `uploadAny`, `getFileInfo` — dead exports, never imported

**Fix:** See [§6 in Part B](#6-file-upload-routes)

---

### A12. Forgot-password doesn't actually email the temp password

**Impact:** The API resets the password but responds with "a temporary password has been sent" — it hasn't. The user is locked out.

**Current state:** `auth.js:146` has `// TODO: Wire up notification service to email the temp password`. The temp password is generated and hashed, but never sent anywhere.

**Fix:** See [§4 in Part B](#4-forgot-password-email-wiring)

---

## 🔵 LOW (Nice to have)

### A13. Frontend "Coming Soon" pages (2 pages)

- `tenantMarketplace()` — "Marketplace coming soon!" placeholder
- `agentContacts()` — "Contact management coming soon." placeholder

These work fine — just empty placeholders. Implement when needed.

### A14. Generic fallback page

`app.js:374` — Any unmapped page shows "This page is under construction." This is correct defensive behavior.

### A15. Zero HTTP-level route tests

106 tests pass, but they're all DB-level/unit tests. Zero tests use `supertest` to hit actual Express routes. This means auth flows, rate limiting, RBAC, validation — untested at the HTTP layer.

**Fix:** See [§11 in Part B](#11-http-level-api-tests-supertest)

### A16. `_save()` is synchronous (SQLite)

`sqlite-adapter.js:92` calls `fs.writeFileSync()` on every single mutation. Under load, this blocks the event loop. For MVP scale (< 50 concurrent users), this is fine. At scale, switch to WAL mode or a real DB.

---

# Part B: DIY API Integration Guide

> **Purpose:** If one day you don't have an AI agent to help, this is your step-by-step playbook to complete every remaining integration. Each section is self-contained — you can do them in any order.

---

## 1. Stripe Payment Gateway (FPX + Card + GrabPay)

### Status: ✅ Code complete, ❌ Not configured

The entire Stripe integration is built and tested in simulation mode. You just need API keys.

### What's already built
| Component | File | Status |
|---|---|---|
| Payment service layer | `backend/services/payment.js` | ✅ Complete (231 lines) |
| Route handlers (8 endpoints) | `backend/routes/payments.js` | ✅ Complete (308 lines) |
| Webhook handler | `server.js:56-98` | ✅ Complete |
| Frontend payment modal | `features-new.js` | ✅ Complete (FPX/Card/GrabPay pages) |
| CSP headers for Stripe | `server.js:36-37` | ✅ Configured |
| OpenAPI docs | `backend/routes/docs.js` | ✅ 8 endpoints documented |

### Step-by-step setup

**Step 1: Create Stripe account**
```
1. Go to https://dashboard.stripe.com/register
2. Sign up (email + password)
3. Verify your email
4. In Dashboard → Settings → Business details → set country to Malaysia
```

**Step 2: Get API keys**
```
1. Dashboard → Developers → API keys
2. Copy "Publishable key" (starts with pk_test_)
3. Copy "Secret key" (starts with sk_test_)
```

**Step 3: Enable FPX (Malaysia-specific)**
```
1. Dashboard → Settings → Payment methods
2. Find "FPX" → Enable it
3. Also enable: Card, GrabPay
```

**Step 4: Set up webhook**
```
1. Dashboard → Developers → Webhooks → Add endpoint
2. URL: https://your-domain.com/api/payments/webhook
3. Events to listen for:
   - checkout.session.completed
   - payment_intent.succeeded
   - payment_intent.payment_failed
4. Copy the "Signing secret" (starts with whsec_)
```

**Step 5: Configure `.env`**
```bash
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

**Step 6: Test**
```bash
# Start server
npm start
# Login as any user, go to Bills, click Pay
# Should redirect to Stripe checkout page

# Test cards (Stripe test mode):
# Success: 4242 4242 4242 4242
# Decline: 4000 0000 0000 0002
# FPX: Select any test bank → "Authorize test payment"
```

**Step 7: Go live**
```
1. Dashboard → activate your account (requires business verification)
2. Switch to Live mode
3. Replace pk_test_ with pk_live_
4. Replace sk_test_ with sk_live_
5. Create a new webhook endpoint with the live URL
6. Replace whsec_ with the live signing secret
```

### Stripe test credentials for Malaysia
| Method | Test Input | Result |
|---|---|---|
| Card | `4242 4242 4242 4242`, any future expiry, any CVC | Success |
| FPX | Any bank → "Authorize test payment" | Success |
| GrabPay | Click "Authorize" | Success |
| Card decline | `4000 0000 0000 0002` | Decline |

---

## 2. Email Notifications (SMTP / Nodemailer)

### Status: ✅ Code complete, ❌ Not configured

### What's already built
| Component | File | Status |
|---|---|---|
| Email transport (Nodemailer) | `backend/services/notification.js:14-29` | ✅ Complete |
| `sendEmail()` function | `backend/services/notification.js:52-70` | ✅ Complete |
| Multi-channel send | `backend/services/notification.js:191-233` | ✅ Complete |
| HTML email templates | `backend/services/notification.js:240-284` | ✅ 2 templates (rent reminder, ticket update) |
| Route handlers | `backend/routes/notifications.js` | ✅ 6 endpoints |

### Option A: Gmail (free, quick, not for production)
```bash
# .env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=xxxx-xxxx-xxxx-xxxx   # App Password, NOT your Gmail password
SMTP_FROM=WeStay <your-email@gmail.com>
```

**Get Gmail App Password:**
1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" → "Other (Custom name)" → "WeStay"
3. Copy the 16-character password
4. ⚠️ Gmail daily limit: 500 emails/day (fine for testing, bad for production)

### Option B: Mailgun (recommended for production)
```bash
# .env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=postmaster@mail.westay.my
SMTP_PASS=your-mailgun-api-key
SMTP_FROM=WeStay <noreply@mail.westay.my>
```

**Setup:**
1. Sign up at https://www.mailgun.com
2. Add your domain → verify DNS records (TXT, CNAME, MX)
3. Dashboard → SMTP credentials → copy username and password
4. Free tier: 5,000 emails/month

### Option C: SendGrid
```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=SG.xxxxxxxxxxxxx
SMTP_FROM=WeStay <noreply@westay.my>
```

### Option D: Mailtrap (testing only — catches emails, doesn't deliver)
```bash
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-mailtrap-username
SMTP_PASS=your-mailtrap-password
SMTP_FROM=WeStay <test@westay.my>
```

### Test
```bash
# Start server, then:
curl -X POST http://localhost:3456/api/notifications/email \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{"to":"test@example.com","subject":"Test","message":"Hello from WeStay"}'
```

---

## 3. WhatsApp Notifications (Meta Cloud API)

### Status: ✅ Code complete, ❌ Not configured

### What's already built
| Component | File | Status |
|---|---|---|
| WhatsApp send function | `backend/services/notification.js:83-136` | ✅ Complete |
| Template message support | Same file | ✅ Complete |
| Route handler | `backend/routes/notifications.js:67-83` | ✅ Complete |

### Step-by-step setup

**Step 1: Create Meta Developer App**
```
1. Go to https://developers.facebook.com/apps/
2. Create App → "Business" → name it "WeStay"
3. Add "WhatsApp" product
4. You'll get a temporary access token (valid 24h)
```

**Step 2: Get permanent token**
```
1. Business Settings → System Users → Add
2. Name: "WeStay Bot", Role: Admin
3. Assign assets → select your WhatsApp app
4. Generate token → select permissions: whatsapp_business_messaging
5. Copy the permanent token (never expires)
```

**Step 3: Register a phone number**
```
1. WhatsApp → Getting Started → pick a test phone number (Meta provides one)
2. Add your personal number to the "To" allowlist for testing
3. For production: register your own business number ($0/month)
```

**Step 4: Create message templates** (required for sending to users who haven't messaged you first)
```
1. WhatsApp → Message Templates → Create
2. Template name: "rent_reminder"
3. Category: "Utility"
4. Language: English
5. Body: "Hi {{1}}, your rent of {{2}} for {{3}} is due on {{4}}. Please make payment to avoid service interruptions."
6. Submit for approval (takes 1-24 hours)
```

**Step 5: Configure `.env`**
```bash
WHATSAPP_API_URL=https://graph.facebook.com/v17.0/{phone_id}/messages
WHATSAPP_API_TOKEN=EAAxxxxxxxxxxxxxxxx   # permanent token from Step 2
WHATSAPP_PHONE_ID=1234567890             # from WhatsApp → Getting Started
```

**Step 6: Test**
```bash
curl -X POST http://localhost:3456/api/notifications/whatsapp \
  -H "Authorization: Bearer <jwt>" \
  -H "Content-Type: application/json" \
  -d '{"to":"60123456789","message":"Test from WeStay"}'
```

### Costs
| Volume | Cost |
|---|---|
| First 1,000 conversations/month | Free |
| Business-initiated | $0.0396/conversation (Malaysia) |
| User-initiated | $0.0198/conversation (Malaysia) |

---

## 4. Forgot-Password Email Wiring

### Status: ❌ TODO in code

**File:** `backend/routes/auth.js:145-146`
```js
// TODO: Wire up notification service to email the temp password
```

### Fix (requires email to be configured first — see §2)

Open `backend/routes/auth.js` and replace lines 144-150:

```js
// BEFORE (current code):
      // In production, send via email. Never expose temp password in response.
      // TODO: Wire up notification service to email the temp password
      res.json({
        success: true,
        message: 'Password has been reset. If an email address is on file, a temporary password has been sent.'
      });

// AFTER:
      // Send temp password via email
      const notification = require('../services/notification');
      if (user.email && notification.isEmailConfigured()) {
        await notification.sendEmail({
          to: user.email,
          subject: 'WeStay - Password Reset',
          text: `Hi ${user.name},\n\nYour password has been reset. Your temporary password is: ${tempPass}\n\nPlease login and change it immediately.\n\n— WeStay`,
          html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
            <div style="background:#2D3436;color:white;padding:20px;text-align:center">
              <h1 style="margin:0">WeStay</h1>
              <p style="margin:5px 0 0;opacity:0.8">Password Reset</p>
            </div>
            <div style="padding:20px;border:1px solid #ddd;border-top:none">
              <p>Hi <strong>${user.name}</strong>,</p>
              <p>Your password has been reset. Your temporary password is:</p>
              <div style="background:#f0f0f0;padding:16px;border-radius:8px;text-align:center;font-size:24px;letter-spacing:3px;font-family:monospace;margin:16px 0">
                <strong>${tempPass}</strong>
              </div>
              <p style="color:#E17055;font-weight:600">⚠️ Please login and change your password immediately.</p>
              <p style="color:#666;font-size:12px;margin-top:30px">If you didn't request this reset, contact your administrator.</p>
            </div>
          </div>`
        });
      }

      res.json({
        success: true,
        message: 'If an email address is on file, a temporary password has been sent.'
      });
```

**Key points:**
- If email is configured → sends temp password via email
- If email is NOT configured → same response (no information leak)
- Temp password is never exposed in the API response
- The `user.email` must be set in the user record (check your seed data)

---

## 5. SSL/HTTPS Setup

### Status: ✅ Code complete, ❌ Not configured

### What's already built
| Component | File | Status |
|---|---|---|
| HTTPS server creation | `backend/https.js` | ✅ Complete |
| HTTP→HTTPS redirect | `backend/https.js:75-82` | ✅ Complete |
| Self-signed cert generator | `backend/https.js:89-128` | ✅ Complete |
| Server.js integration | `server.js:292-318` | ✅ Wired |

### Option A: Let's Encrypt (free, recommended)
```bash
# Install certbot
sudo apt install certbot

# Get certificate (server must be stopped)
sudo certbot certonly --standalone -d westay.my -d www.westay.my

# Configure .env
SSL_ENABLED=true
SSL_KEY_PATH=/etc/letsencrypt/live/westay.my/privkey.pem
SSL_CERT_PATH=/etc/letsencrypt/live/westay.my/fullchain.pem

# Auto-renew (add to crontab)
0 3 * * * certbot renew --quiet --pre-hook "pm2 stop westay" --post-hook "pm2 start westay"
```

### Option B: Reverse proxy (recommended if using Nginx/Caddy)
```
Don't set SSL_ENABLED in .env. Instead, let your reverse proxy handle HTTPS:

# Caddy (auto HTTPS, zero config):
westay.my {
    reverse_proxy localhost:3456
}

# Nginx:
server {
    listen 443 ssl;
    server_name westay.my;
    ssl_certificate /etc/letsencrypt/live/westay.my/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/westay.my/privkey.pem;

    location / {
        proxy_pass http://localhost:3456;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";  # Required for WebSocket
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 6. File Upload Routes

### Status: ⚠️ Middleware complete, routes mostly missing

Only `POST /api/tickets/:id/photos/upload` exists. Here's how to add the rest:

### Add contract document uploads

Open `backend/routes/contracts.js` and add:

```js
const { uploadDocuments, setEntityType, deleteUploadedFile, handleUploadError } = require('../middleware/upload');

// Inside the module.exports function, add:

// POST /api/contracts/:id/documents — Upload contract files
router.post('/:id/documents', setEntityType('contracts'), uploadDocuments.array('documents', 5), handleUploadError, async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }
    const existing = (await db.getStore('contract_docs', req.params.id)) || [];
    const newDocs = req.files.map(f => ({
      filename: f.filename,
      originalName: f.originalname,
      path: 'contracts/' + f.filename,
      size: f.size,
      mimetype: f.mimetype,
      uploadedAt: new Date().toISOString(),
      uploadedBy: req.user ? req.user.username : 'unknown'
    }));
    const updated = [...existing, ...newDocs];
    await db.setStore('contract_docs', req.params.id, updated);
    res.status(201).json(updated);
  } catch(e) { res.status(500).json({ error: 'Internal server error' }); }
});

// GET /api/contracts/:id/documents
router.get('/:id/documents', async (req, res) => {
  try {
    const docs = await db.getStore('contract_docs', req.params.id);
    res.json(docs || []);
  } catch(e) { res.status(500).json({ error: 'Internal server error' }); }
});
```

Repeat the same pattern for:
- `tenants.js` → tenant ID documents (`tenant_docs` store)
- `work-orders.js` → work order completion photos (`workorder_photos` store)
- `props.js` → property photos (`property_photos` store)

---

## 7. Audit Logging Expansion

### Status: ⚠️ Only payments.js uses audit logging

### Quick approach: Use `auditMiddleware` (automatic)

The `auditMiddleware(db, action, entity)` function auto-logs after successful responses. Add it to routes:

**Example for `props.js`:**
```js
const { auditMiddleware } = require('../middleware/audit');

// Inside the module.exports function:
router.post('/', auditMiddleware(db, 'create', 'props'), validate({...}), async (req, res) => { ... });
router.put('/:name', auditMiddleware(db, 'update', 'props'), stripFields('n'), async (req, res) => { ... });
router.delete('/:name', auditMiddleware(db, 'delete', 'props'), async (req, res) => { ... });
```

**Routes to add audit logging to:**
| Route File | Actions to Audit |
|---|---|
| `props.js` | create, update, delete |
| `tenants.js` | create, update, delete |
| `tickets.js` | create, update, delete, status_change |
| `bills.js` | create, update, delete, pay |
| `vendors.js` | create, update, delete |
| `work-orders.js` | create, update, delete, status_change |
| `leads.js` | create, update, delete |
| `landlords.js` | create, update, delete |
| `contracts.js` | create, update, delete |
| `utility-bills.js` | create, update, delete, pay |
| `iot.js` | cut, reconnect, lock_toggle |
| `auth.js` | login, register, delete_user, password_change |
| `misc.js` | data_reset, bulk_save |

---

## 8. WebSocket Event Wiring

### Status: ⚠️ Infrastructure complete, barely used

**Pattern for adding broadcast to a route:**
```js
// At the end of any POST/PUT/PATCH/DELETE handler:
const broadcast = req.app.get('broadcast');
if (broadcast) broadcast('channel', 'event', { id, ...data });
```

**Events to wire up:**

| Route | Channel | Events |
|---|---|---|
| `tickets.js` POST | `tickets` | `new` (new ticket created) |
| `tickets.js` PUT/PATCH | `tickets` | `update` (status change) |
| `bills.js` PATCH /pay | `bills` | `paid` |
| `iot.js` PATCH /cut | `iot` | `meter_cut` |
| `iot.js` PATCH /reconnect | `iot` | `meter_reconnect` |
| `iot.js` PATCH /lock-toggle | `iot` | `lock_toggle` |
| `misc.js` POST /notifs | `notifs` | `new` |
| `auth.js` POST /login | `audit` | `login` |

**Example for `tickets.js`:**
```js
// In POST / handler, after creating the ticket:
const broadcast = req.app.get('broadcast');
if (broadcast) broadcast('tickets', 'new', ticket);

// In PATCH /:id/status handler, after updating:
const broadcast = req.app.get('broadcast');
if (broadcast) broadcast('tickets', 'update', { id: req.params.id, status });
```

---

## 9. Structured Logger Adoption

### Status: ⚠️ Logger exists, only used by error handler

**Current:** 19 route files use `console.log`. The structured logger writes to rotatable files with timestamps and levels.

**Pattern:**
```js
// At the top of each route file, add:
const { logger } = require('../middleware/logger');

// Replace console.log/console.error in catch blocks (if you need detailed logs):
// BEFORE:
catch(e) { res.status(500).json({ error: 'Internal server error' }); }

// AFTER (if you want error details in log files):
catch(e) {
  logger.error('Route error', { route: req.originalUrl, method: req.method, error: e.message });
  res.status(500).json({ error: 'Internal server error' });
}
```

**Priority files to update:** `auth.js` (login attempts), `payments.js` (money), `iot.js` (device control), `websocket.js` (connection events)

---

## 10. DB Migration & Backup Strategy

### Status: ❌ Nothing exists

### Backup script (create as `backend/scripts/backup.js`)

```js
// backend/scripts/backup.js
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'westay.db');
const BACKUP_DIR = path.join(__dirname, '..', 'backups');

if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupPath = path.join(BACKUP_DIR, `westay-${timestamp}.db`);

fs.copyFileSync(DB_PATH, backupPath);
console.log(`Backup created: ${backupPath}`);

// Clean old backups (keep last 7)
const backups = fs.readdirSync(BACKUP_DIR)
  .filter(f => f.startsWith('westay-') && f.endsWith('.db'))
  .sort()
  .reverse();

for (const old of backups.slice(7)) {
  fs.unlinkSync(path.join(BACKUP_DIR, old));
  console.log(`Deleted old backup: ${old}`);
}
```

### Add to `package.json`:
```json
"scripts": {
  "backup": "node backend/scripts/backup.js"
}
```

### Cron job (production):
```bash
# Run daily at 2 AM
0 2 * * * cd /path/to/westay && npm run backup
```

### Migration strategy
The project uses a repository pattern (`backend/db/interface.js`). To switch from SQLite to PostgreSQL:

1. Create `backend/db/postgres-adapter.js` implementing the same `DatabaseInterface`
2. Change the `require()` in `backend/db/index.js` from `./sqlite-adapter` to `./postgres-adapter`
3. No route files need to change — they all go through the abstract interface

---

## 11. HTTP-Level API Tests (supertest)

### Status: ❌ Zero route-level tests

### Setup
```bash
npm install --save-dev supertest
```

### Example test file (`tests/routes.test.js`)
```js
const request = require('supertest');
const { getTestUsers, getTestToken } = require('./setup');

// You'll need to export the Express app from server.js
// Add to server.js: module.exports = app;

describe('Auth routes', () => {
  test('POST /api/auth/login — valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'admin123456' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  test('POST /api/auth/login — invalid password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'wrong' });
    expect(res.status).toBe(401);
  });

  test('GET /api/auth/me — requires auth', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  test('GET /api/auth/users — admin only', async () => {
    const token = getTestToken('operator');
    const res = await request(app)
      .get('/api/auth/users')
      .set('Authorization', 'Bearer ' + token);
    expect(res.status).toBe(403);
  });
});
```

**What to test (priority order):**
1. Auth flows (login, register, me, password change)
2. RBAC (admin-only endpoints reject operator/tenant)
3. Rate limiting (login limiter, forgot-password limiter)
4. Input validation (bad data returns 400)
5. Payment flows (mock Stripe or test 503 when not configured)

---

## 12. Graceful Shutdown

### Add to `server.js` (after the server starts, inside the async IIFE)

```js
  // ---- Graceful Shutdown ----
  function shutdown(signal) {
    logger.info('Shutdown signal received', { signal });

    // Stop accepting new connections
    server.close(() => {
      logger.info('HTTP server closed');

      // Save DB one final time
      getDB().then(db => {
        if (db && db._save) db._save();
        logger.info('Database saved');
        process.exit(0);
      }).catch(() => process.exit(1));
    });

    // Force exit after 10s if graceful shutdown hangs
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
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
    // Don't shutdown — log and continue (Node 15+ doesn't crash on this by default)
  });
```

---

## 13. Frontend "Coming Soon" Pages

Two placeholder pages exist:

**1. Tenant Marketplace** (`pages-roles.js:195-198`)
```
tenantMarketplace() → "Marketplace coming soon!"
```
To implement: Add item listing CRUD (title, price, photo, category, status) using the same pattern as tickets/tenants.

**2. Agent Contacts** (`pages-roles.js:436`)
```
agentContacts() → "Contact management coming soon."
```
To implement: Use the leads data model — contacts are essentially leads at a different stage.

---

## 14. Process Manager (PM2)

### Setup
```bash
# Install PM2 globally
npm install -g pm2

# Start WeStay
pm2 start server.js --name westay

# Enable startup script (auto-start on server reboot)
pm2 startup
pm2 save

# Useful commands
pm2 logs westay      # view logs
pm2 monit            # live dashboard
pm2 restart westay   # restart
pm2 stop westay      # stop
```

### PM2 ecosystem file (`ecosystem.config.js`)
```js
module.exports = {
  apps: [{
    name: 'westay',
    script: 'server.js',
    instances: 1,          // SQLite = single instance only
    exec_mode: 'fork',
    max_memory_restart: '512M',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3456
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    merge_logs: true
  }]
};
```

```bash
# Start with ecosystem file
pm2 start ecosystem.config.js --env production
```

---

# Quick Reference: All Environment Variables

| Variable | Required | Current | Production Value |
|---|---|---|---|
| `PORT` | Yes | `3456` | `3456` (or your choice) |
| `NODE_ENV` | **Yes** | ❌ Missing | `production` |
| `JWT_SECRET` | **Yes** | ⚠️ Dev placeholder | 64+ byte random hex |
| `DB_PATH` | Yes | `backend/data/westay.db` | Same (or absolute path) |
| `CORS_ORIGIN` | **Yes** | ⚠️ `*` | `https://westay.my` |
| `RATE_LIMIT_WINDOW_MS` | No | `900000` | `900000` |
| `RATE_LIMIT_MAX` | No | `100` | `300` |
| `LOGIN_RATE_LIMIT_*` | No | Configured | Keep defaults |
| `STRIPE_SECRET_KEY` | For payments | ❌ Commented | `sk_live_xxx` |
| `STRIPE_PUBLISHABLE_KEY` | For payments | ❌ Commented | `pk_live_xxx` |
| `STRIPE_WEBHOOK_SECRET` | For payments | ❌ Commented | `whsec_xxx` |
| `SMTP_HOST` | For email | ❌ Not set | `smtp.mailgun.org` |
| `SMTP_PORT` | For email | ❌ Not set | `587` |
| `SMTP_SECURE` | For email | ❌ Not set | `false` |
| `SMTP_USER` | For email | ❌ Not set | Your SMTP username |
| `SMTP_PASS` | For email | ❌ Not set | Your SMTP password |
| `SMTP_FROM` | For email | ❌ Not set | `WeStay <noreply@westay.my>` |
| `WHATSAPP_API_URL` | For WhatsApp | ❌ Not set | Meta Graph API URL |
| `WHATSAPP_API_TOKEN` | For WhatsApp | ❌ Not set | Permanent token |
| `WHATSAPP_PHONE_ID` | For WhatsApp | ❌ Not set | Phone number ID |
| `SSL_ENABLED` | For HTTPS | ❌ Not set | `true` (or use reverse proxy) |
| `SSL_KEY_PATH` | For HTTPS | ❌ Not set | `/etc/letsencrypt/live/.../privkey.pem` |
| `SSL_CERT_PATH` | For HTTPS | ❌ Not set | `/etc/letsencrypt/live/.../fullchain.pem` |
| `UPLOAD_MAX_SIZE` | No | Default 10MB | `10485760` |
| `UPLOAD_MAX_FILES` | No | Default 5 | `5` |
| `LOG_LEVEL` | No | Default `debug` | `info` |

---

# Pre-Launch Checklist

```
[ ] NODE_ENV=production in .env
[ ] JWT_SECRET changed to random 64+ byte hex
[ ] CORS_ORIGIN set to actual domain(s)
[ ] Graceful shutdown handlers added to server.js
[ ] package.json name fixed, engines field added
[ ] DB backup cron job configured
[ ] PM2 or equivalent process manager installed
[ ] SSL/HTTPS configured (direct or reverse proxy)
[ ] Stripe keys configured (if accepting payments)
[ ] SMTP configured (if sending emails)
[ ] WhatsApp configured (if sending messages)
[ ] Forgot-password wired to email service
[ ] Log level set to 'info' in production
[ ] Test with all 6 demo accounts
[ ] Delete demo accounts or change their passwords
[ ] Run full test suite: npm test (106 tests pass)
```
