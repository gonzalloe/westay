# WeStay — Version Check & Update Guide

> **Purpose:** Complete reference for everything that needs version management in this project.  
> Every item includes: what it is, why it matters, how to check, and how to update.  
> **Last updated:** 2026-04-06

---

## Table of Contents

1. [Update Rules](#update-rules)
2. [Severity Levels](#severity-levels)
3. [Version Check Schedule](#version-check-schedule)
4. [🔴 CRITICAL — Update Within 24 Hours](#-critical--update-within-24-hours)
5. [🟡 HIGH — Update Within 1 Week](#-high--update-within-1-week)
6. [🟠 MEDIUM — Update Within 1 Month](#-medium--update-within-1-month)
7. [🔵 LOW — Update Quarterly](#-low--update-quarterly)
8. [⚪ DEV-ONLY — Update When Convenient](#-dev-only--update-when-convenient)
9. [External API Versions (Not npm)](#external-api-versions-not-npm)
10. [Step-by-Step Update Procedure](#step-by-step-update-procedure)
11. [Rollback Procedure](#rollback-procedure)
12. [Update Log Template](#update-log-template)

---

## Update Rules

1. **Never update on production directly.** Update on staging → test → deploy.
2. **Never update all packages at once.** One at a time (or one severity group at a time).
3. **Always run tests after updating.** `npm test` must pass (106 tests).
4. **Always back up the DB before updating.** `cp backend/data/westay.db backend/data/westay-backup-$(date +%Y%m%d).db`
5. **Major version updates (X.0.0) may have breaking changes.** Always read the changelog first.
6. **Patch updates (x.x.X) are safe** to apply without reading changelogs.

---

## Severity Levels

| Level | Meaning | SLA |
|---|---|---|
| 🔴 CRITICAL | Security vulnerability or auth-related | Update within 24 hours |
| 🟡 HIGH | Handles money, user data, or core framework | Update within 1 week |
| 🟠 MEDIUM | Feature libraries, may affect functionality | Update within 1 month |
| 🔵 LOW | Stable utilities, rarely have issues | Update quarterly |
| ⚪ DEV-ONLY | Development tools, not in production | Update when convenient |

---

## Version Check Schedule

| When | What | How |
|---|---|---|
| **Weekly (Mon 3 AM MYT)** | Automated check | `crontab: 0 19 * * 0 node backend/scripts/check-updates.js` |
| **Monthly (1st of month)** | Manual full review | Read this document, check all items below |
| **After any security alert** | Immediate check | `npm audit` + check Stripe/Node status |

**Automated checker output:** `backend/logs/update-report.json`

---

## 🔴 CRITICAL — Update Within 24 Hours

These packages handle authentication and security headers. A vulnerability here = full system compromise.

---

### 1. `jsonwebtoken` (JWT tokens)

**Current:** `^9.0.3` | **What it does:** Signs and verifies all auth tokens

**Why critical:** A JWT vulnerability allows anyone to forge admin tokens → full access to all data.

**Check:**
```bash
npm outdated jsonwebtoken
npm audit | grep jsonwebtoken
```

**Update:**
```bash
# Patch/minor (safe):
npm update jsonwebtoken

# Major (read changelog first):
npm install jsonwebtoken@latest
npm test   # MUST pass — if login breaks, rollback immediately
```

**Test after update:**
```bash
# Login must still work:
curl -X POST http://localhost:3456/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123456"}'
# Should return { token: "..." }
```

**Changelog:** https://github.com/auth0/node-jsonwebtoken/blob/master/CHANGELOG.md

---

### 2. `bcryptjs` (Password hashing)

**Current:** `^3.0.3` | **What it does:** Hashes all user passwords

**Why critical:** A bcrypt vulnerability could expose all user passwords.

**Check:**
```bash
npm outdated bcryptjs
npm audit | grep bcryptjs
```

**Update:**
```bash
npm update bcryptjs
npm test
```

**Test after update:**
```bash
# Login with known password must work:
curl -X POST http://localhost:3456/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123456"}'
```

**⚠️ Major version warning:** If bcryptjs changes its hash format, existing passwords may stop working. Always test login after updating.

**Changelog:** https://github.com/nicolo-ribaudo/bcryptjs-built/releases

---

### 3. `helmet` (HTTP security headers)

**Current:** `^8.1.0` | **What it does:** Sets CSP, HSTS, X-Frame-Options, etc.

**Why critical:** Without proper headers, XSS and clickjacking attacks become possible.

**Check:**
```bash
npm outdated helmet
```

**Update:**
```bash
npm update helmet
npm test

# Verify headers still set:
curl -I http://localhost:3456/ | grep -i "content-security-policy\|x-frame\|strict-transport"
```

**⚠️ Major version warning:** Helmet major versions often change default CSP directives. Our CSP is custom (`server.js:29-46`), so breaking changes are less likely, but test the frontend after updating.

**Changelog:** https://github.com/helmetjs/helmet/blob/main/CHANGELOG.md

---

## 🟡 HIGH — Update Within 1 Week

These packages handle money, core HTTP, or data persistence.

---

### 4. `express` (Web framework)

**Current:** `^5.2.1` | **What it does:** The entire HTTP server

**Why high:** Express vulnerabilities can lead to DoS, request smuggling, or path traversal.

**Check:**
```bash
npm outdated express
npm audit | grep express
```

**Update:**
```bash
# Minor/patch:
npm update express

# Major (rare, we're already on v5):
# Read migration guide first: https://expressjs.com/en/guide/migrating-5.html
npm install express@latest
npm test
```

**Test after update:** Start server, hit a few endpoints, check error handling works.

**Changelog:** https://github.com/expressjs/express/blob/master/History.md

---

### 5. `stripe` (Payment gateway SDK)

**Current:** `^22.0.0` | **What it does:** All payment processing (FPX, card, GrabPay)

**Why high:** Handles real money. Stripe deprecates old SDK versions and API versions.

**Check:**
```bash
npm outdated stripe

# Check Stripe API version (your dashboard):
# https://dashboard.stripe.com/developers → API version
```

**Update:**
```bash
# Minor/patch (safe — Stripe is good about semver):
npm update stripe

# Major version (ALWAYS read changelog):
# https://github.com/stripe/stripe-node/blob/master/CHANGELOG.md
npm install stripe@latest
npm test

# Test payment flow:
curl http://localhost:3456/api/payments/status \
  -H "Authorization: Bearer <token>"
# Should return { configured: true/false, ... }
```

**⚠️ Stripe API version vs SDK version:**
- **SDK version** (npm package) = the Node.js library. Updated via `npm update`.
- **API version** (e.g. `2024-12-18`) = the Stripe server API. Updated in your Stripe Dashboard → Developers → API version.
- These are independent. You can update the SDK without changing the API version.
- Stripe sends deprecation emails ~6 months before an API version EOL.

**Dashboard:** https://dashboard.stripe.com/developers

---

### 6. `sql.js` (SQLite database engine)

**Current:** `^1.14.1` | **What it does:** The entire database (pure JS SQLite compiled to WASM)

**Why high:** Database engine — bugs can corrupt data.

**Check:**
```bash
npm outdated sql.js
```

**Update:**
```bash
npm update sql.js
npm test   # Run ALL 106 tests — DB tests are critical

# Verify DB loads:
node -e "const init = require('sql.js'); init().then(SQL => console.log('sql.js OK:', SQL.Database ? 'v' + require('sql.js/package.json').version : 'FAIL'))"
```

**⚠️ This package loads a .wasm file at runtime.** Major updates may change WASM binary location. If `sql.js` fails after update → check `node_modules/sql.js/dist/` for the WASM file.

**Changelog:** https://github.com/nicolo-ribaudo/sql.js/releases

---

### 7. `express-rate-limit` (Brute-force protection)

**Current:** `^8.3.2` | **What it does:** Rate limiting on login, forgot-password, all API routes

**Why high:** Without rate limiting, attackers can brute-force passwords.

**Check:**
```bash
npm outdated express-rate-limit
```

**Update:**
```bash
npm update express-rate-limit
npm test

# Verify rate limiter works:
# Hit login 6 times rapidly — 6th should return 429
```

**Changelog:** https://github.com/express-rate-limit/express-rate-limit/blob/main/changelog.md

---

## 🟠 MEDIUM — Update Within 1 Month

---

### 8. `nodemailer` (Email sending)

**Current:** `^8.0.4` | **What it does:** SMTP email transport (rent reminders, password reset)

**Check:**
```bash
npm outdated nodemailer
```

**Update:**
```bash
npm update nodemailer
# Test (only if SMTP is configured):
curl -X POST http://localhost:3456/api/notifications/email \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"to":"test@example.com","subject":"Test","message":"Hello"}'
```

**Changelog:** https://github.com/nodemailer/nodemailer/blob/master/CHANGELOG.md

---

### 9. `multer` (File uploads)

**Current:** `^2.1.1` | **What it does:** Handles multipart file uploads (ticket photos)

**Check:**
```bash
npm outdated multer
```

**Update:**
```bash
npm update multer
npm test
# Test file upload endpoint if used
```

**Changelog:** https://github.com/expressjs/multer/blob/master/CHANGELOG.md

---

### 10. `cors` (Cross-Origin Resource Sharing)

**Current:** `^2.8.6` | **What it does:** Controls which domains can call your API

**Check:**
```bash
npm outdated cors
```

**Update:**
```bash
npm update cors
npm test
```

**Note:** This package is extremely stable — updates are rare.

---

## 🔵 LOW — Update Quarterly

---

### 11. `dotenv` (Environment variables)

**Current:** `^17.4.0` | **What it does:** Loads `.env` file into `process.env`

**Check & Update:**
```bash
npm outdated dotenv
npm update dotenv
```

**Risk:** Almost zero. This package is trivially simple and rarely breaks.

---

## ⚪ DEV-ONLY — Update When Convenient

---

### 12. `jest` (Test framework)

**Current:** `^30.3.0` | **What it does:** Runs all 106 tests

**Check & Update:**
```bash
npm outdated jest
npm update jest
npm test   # verify tests still pass
```

**Note:** jest only runs in development/CI. It is never loaded in production.

---

## External API Versions (Not npm)

These are NOT managed by npm. They are external services with their own versioning.

---

### 13. Node.js Runtime

**Current:** v22.12.0 | **Minimum required:** v18+ (for fetch() and WASM)

**Check:**
```bash
node --version
# Compare with: https://nodejs.org/en/about/previous-releases
```

**Update (Ubuntu/Debian):**
```bash
# Using NodeSource:
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Using nvm (recommended):
nvm install 22
nvm use 22
nvm alias default 22
```

**Update (Hetzner/Hostinger VPS):**
```bash
# If using nvm:
nvm install --lts
nvm alias default node

# If using system Node:
sudo apt update && sudo apt install -y nodejs npm
```

**⚠️ After updating Node.js:**
```bash
npm rebuild        # Rebuild native modules (sql.js uses WASM, should be fine)
npm test           # Verify everything works
pm2 restart westay # Restart the server
```

**LTS Schedule:**
| Version | Status | EOL |
|---|---|---|
| Node 18 | ❌ EOL (April 2025) | Don't use |
| Node 20 | Maintenance | October 2026 |
| Node 22 | ✅ Active LTS | April 2027 |
| Node 24 | Current (not LTS yet) | TBD |

---

### 14. Stripe API Version

**What:** The server-side API version Stripe uses to process your requests. Independent from the npm SDK version.

**Check:**
```
1. Login to https://dashboard.stripe.com
2. Developers → API version (shown at top)
3. Compare with: https://stripe.com/docs/upgrades#api-versions
```

**Update:**
```
1. Dashboard → Developers → API version → Upgrade
2. Read the upgrade guide for breaking changes
3. Test payment flow (create checkout, verify, refund)
4. ⚠️ This is irreversible per account — test on a test account first
```

**Deprecation policy:** Stripe supports each API version for ~2 years. They send email warnings 6 months before deprecation.

---

### 15. WhatsApp / Meta Graph API Version

**What:** The Meta Cloud API version used for WhatsApp messaging.

**Current:** Configured in `.env` as `WHATSAPP_API_URL=https://graph.facebook.com/v17.0/{phone_id}/messages`

**Check:**
```
1. See what version is in your .env WHATSAPP_API_URL
2. Compare with: https://developers.facebook.com/docs/graph-api/changelog
3. Meta deprecates old versions ~2 years after release
```

**Update:**
```bash
# In .env, change the version number:
# FROM:
WHATSAPP_API_URL=https://graph.facebook.com/v17.0/{phone_id}/messages
# TO:
WHATSAPP_API_URL=https://graph.facebook.com/v20.0/{phone_id}/messages

# Then restart server
pm2 restart westay
```

**⚠️ Breaking changes are rare between minor versions.** But always check the changelog for the version you're upgrading to.

---

### 16. SSL Certificate Renewal

**What:** Your HTTPS certificate (Let's Encrypt, or purchased cert)

**Check:**
```bash
# Check expiry:
openssl x509 -enddate -noout -in /path/to/fullchain.pem

# Or from outside:
echo | openssl s_client -connect westay.my:443 2>/dev/null | openssl x509 -enddate -noout
```

**Update (Let's Encrypt — auto):**
```bash
# Renew manually:
sudo certbot renew

# Auto-renew cron (already should be set up):
0 3 1,15 * * certbot renew --quiet --pre-hook "pm2 stop westay" --post-hook "pm2 start westay"
```

**Update (Purchased cert):**
```
1. Buy/renew from your provider
2. Download new cert + key files
3. Replace files at SSL_CERT_PATH and SSL_KEY_PATH
4. Restart server: pm2 restart westay
```

---

## Step-by-Step Update Procedure

Use this procedure for **any** package update on production:

```bash
# 1. SSH into server
ssh user@your-server

# 2. Go to project directory
cd /path/to/westay

# 3. Back up database FIRST
cp backend/data/westay.db backend/data/westay-backup-$(date +%Y%m%d).db

# 4. Check what's outdated
npm outdated

# 5. Update ONE package at a time (example: express)
npm update express
# OR for major version:
npm install express@latest

# 6. Run tests
npm test
# All 106 tests MUST pass. If any fail → rollback (see below)

# 7. Restart server
pm2 restart westay
# OR if not using pm2:
# Kill old process, then: node server.js &

# 8. Verify server is running
curl http://localhost:3456/api/docs
# Should return OpenAPI JSON

# 9. Verify login works
curl -X POST http://localhost:3456/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123456"}'
# Should return { token: "..." }

# 10. Check logs for errors
tail -20 backend/logs/error.log
```

---

## Rollback Procedure

If something breaks after an update:

```bash
# 1. Restore the package to previous version
npm install <package>@<previous-version>
# Example: npm install express@5.2.1

# 2. Restore database if corrupted
cp backend/data/westay-backup-YYYYMMDD.db backend/data/westay.db

# 3. Restart
pm2 restart westay

# 4. Verify
npm test
curl http://localhost:3456/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123456"}'
```

**Nuclear option** (if you can't figure out what broke):
```bash
# Reset node_modules entirely
rm -rf node_modules package-lock.json
npm install
npm test
pm2 restart westay
```

---

## Update Log Template

Keep a log of updates in `backend/logs/update-history.md`:

```markdown
## 2026-04-15 — Monthly Update

| Package | From | To | Type | Tests | Notes |
|---|---|---|---|---|---|
| express | 5.2.1 | 5.2.3 | patch | ✅ 106 pass | No issues |
| stripe | 22.0.0 | 22.1.0 | minor | ✅ 106 pass | New webhook event types |
| dotenv | 17.4.0 | 17.4.1 | patch | ✅ 106 pass | — |
| Node.js | 22.12.0 | 22.14.0 | minor | ✅ 106 pass | LTS update |

**Updated by:** CC  
**Server restarted:** Yes (pm2 restart)  
**Issues:** None
```
