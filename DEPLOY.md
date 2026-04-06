# WeStay — Go-Live Deployment Guide

> **One document. Step 1 to Go Live. No jumping between files.**  
> Covers: server provisioning, app setup, security hardening, services, DNS, SSL, monitoring.  
> **Last updated:** 2026-04-06

---

## Table of Contents

1. [Step 1: Choose & Provision a Server](#step-1-choose--provision-a-server)
2. [Step 2: First-Time Server Setup](#step-2-first-time-server-setup)
3. [Step 3: Clone & Install WeStay](#step-3-clone--install-westay)
4. [Step 4: Configure Production .env](#step-4-configure-production-env)
5. [Step 5: Configure External Services](#step-5-configure-external-services)
6. [Step 6: Domain & DNS Setup](#step-6-domain--dns-setup)
7. [Step 7: SSL / HTTPS](#step-7-ssl--https)
8. [Step 8: Firewall](#step-8-firewall)
9. [Step 9: Process Manager (PM2)](#step-9-process-manager-pm2)
10. [Step 10: Database Backup](#step-10-database-backup)
11. [Step 11: Monitoring & Uptime](#step-11-monitoring--uptime)
12. [Step 12: Smoke Test](#step-12-smoke-test)
13. [Step 13: Go Live](#step-13-go-live)
14. [Post-Launch Maintenance](#post-launch-maintenance)
15. [Quick Reference: All Commands](#quick-reference-all-commands)

---

## Step 1: Choose & Provision a Server

### Requirements

| Requirement | Minimum | Why |
|---|---|---|
| Node.js 20+ | Required | Express 5, sql.js WASM, native `fetch()` |
| Persistent disk | Required | SQLite file + uploads + logs |
| WebSocket support | Required | Real-time events on `/ws` |
| Long-running process | Required | Not serverless — Express runs 24/7 |
| RAM | 256 MB | sql.js loads DB into memory |
| Disk | 500 MB | Code + node_modules + DB + uploads + logs |
| Datacenter | Singapore | Closest to Malaysia users |

### Recommended Providers

| Provider | Cost | RAM | Setup | Best For |
|---|---|---|---|---|
| **Hetzner CX22** | €3.29/mo (~RM 16) | 2 GB | Manual (VPS) | Best value |
| **DigitalOcean** | $4/mo | 512 MB | Manual (VPS) | Good docs, SG DC |
| **Railway** | ~$5/mo | 512 MB | Git push | Zero DevOps |
| **Fly.io** | Free | 256 MB | CLI | Free MVP |

> **Full provider comparison & selection criteria → see `server-criteria.md`**

### Provision (Hetzner example)

```
1. Go to https://console.hetzner.cloud
2. Create project → Add server
3. Location: Singapore (or Ashburn if SG unavailable)
4. Image: Ubuntu 22.04
5. Type: CX22 (2 GB RAM, 1 vCPU, 20 GB NVMe) — €3.29/mo
6. SSH key: Add your public key (don't use password auth)
7. Create
8. Note the server IP address: xxx.xxx.xxx.xxx
```

---

## Step 2: First-Time Server Setup

SSH into your new server:

```bash
ssh root@YOUR_SERVER_IP
```

### 2a. System updates

```bash
apt update && apt upgrade -y
```

### 2b. Create a non-root user (security)

```bash
adduser westay
usermod -aG sudo westay

# Copy SSH key to new user
mkdir -p /home/westay/.ssh
cp ~/.ssh/authorized_keys /home/westay/.ssh/
chown -R westay:westay /home/westay/.ssh

# Test login as westay (in a NEW terminal)
ssh westay@YOUR_SERVER_IP

# If it works, disable root SSH login:
sudo sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sudo systemctl restart sshd
```

### 2c. Install Node.js 22 LTS

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs git

# Verify
node --version   # should show v22.x.x
npm --version    # should show 10.x.x
```

### 2d. Install PM2 (process manager)

```bash
sudo npm install -g pm2
```

### 2e. Install Caddy (reverse proxy + auto-HTTPS)

```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install caddy
```

> **Why Caddy?** Auto-obtains and renews Let's Encrypt certificates. Zero SSL config. One-line reverse proxy. Free.

---

## Step 3: Clone & Install WeStay

```bash
# As the westay user:
cd /home/westay
git clone https://github.com/gonzalloe/westay.git
cd westay
git checkout staging

# Install production dependencies only
npm install --production

# Create data directories
mkdir -p backend/data backend/uploads backend/logs backend/backups
```

---

## Step 4: Configure Production .env

```bash
cp .env.example .env
nano .env
```

### Mandatory changes (CRITICAL — don't skip):

```bash
# ---- MUST CHANGE ----

# Generate a strong secret (run this, copy the output):
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# Paste it here:
JWT_SECRET=<paste-128-char-hex-here>

# Production mode (hides stack traces, sets log level to info)
NODE_ENV=production

# Your actual domain (comma-separated if multiple)
CORS_ORIGIN=https://westay.my,https://www.westay.my

# Server port
PORT=3456

# Database path
DB_PATH=backend/data/westay.db

# Log level
LOG_LEVEL=info
```

### Optional services (configure any you need):

```bash
# ---- Stripe (payments) ----
# Get keys from: https://dashboard.stripe.com/apikeys
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# ---- Email (SMTP) ----
# See server.md §2 for provider options
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=postmaster@mail.westay.my
SMTP_PASS=your-mailgun-password
SMTP_FROM=WeStay <noreply@westay.my>

# ---- WhatsApp ----
# See server.md §3 for setup
WHATSAPP_API_URL=https://graph.facebook.com/v21.0/{phone_id}/messages
WHATSAPP_API_TOKEN=EAAxxxxx
WHATSAPP_PHONE_ID=123456789
```

> **Full .env reference with all 30+ variables → see `server.md` → Quick Reference table**

---

## Step 5: Configure External Services

Only do the ones you need. Each is optional and independent.

| Service | Required? | Setup Guide | Time |
|---|---|---|---|
| **Stripe** (payments) | Only if accepting payments | `server.md` §1 | 15 min |
| **Email** (SMTP) | Only if sending emails | `server.md` §2 | 10 min |
| **WhatsApp** | Only if sending WA messages | `server.md` §3 | 30 min |

**Skip these for initial launch** — the app works without them. Payments fall back to simulation mode, emails/WhatsApp silently skip.

---

## Step 6: Domain & DNS Setup

### 6a. Buy a domain

Recommended registrars for Malaysia:
| Registrar | .my domain | .com domain |
|---|---|---|
| **Shinjiru** | RM 80/yr | RM 55/yr |
| **Exabytes** | RM 79/yr | RM 49/yr |
| **Namecheap** | — | $9/yr (~RM 40) |
| **Cloudflare** | — | $9/yr (at cost) |

### 6b. Point DNS to your server

Login to your domain registrar's DNS panel and add:

| Type | Name | Value | TTL |
|---|---|---|---|
| **A** | `@` | `YOUR_SERVER_IP` | 300 |
| **A** | `www` | `YOUR_SERVER_IP` | 300 |

Example: If your server IP is `168.119.xx.xx` and domain is `westay.my`:
```
A   @     168.119.xx.xx   300
A   www   168.119.xx.xx   300
```

### 6c. Verify DNS propagation

```bash
# From your local machine:
nslookup westay.my
# Should return your server IP

# Or use online tool:
# https://dnschecker.org/#A/westay.my
```

> **DNS propagation takes 5 min – 48 hours.** Usually under 30 min. Don't proceed to Step 7 until the DNS resolves to your server IP.

---

## Step 7: SSL / HTTPS

### Using Caddy (recommended — zero config)

Caddy auto-obtains and auto-renews Let's Encrypt certificates.

```bash
# Edit Caddyfile
sudo nano /etc/caddy/Caddyfile
```

Replace contents with:

```
westay.my, www.westay.my {
    reverse_proxy localhost:3456

    # WebSocket support (required for /ws)
    @websocket {
        header Connection *Upgrade*
        header Upgrade    websocket
    }
    reverse_proxy @websocket localhost:3456
}
```

```bash
# Restart Caddy
sudo systemctl restart caddy

# Check status
sudo systemctl status caddy
# Should show "active (running)"

# Check certificate
sudo caddy validate --config /etc/caddy/Caddyfile
```

That's it. Caddy handles:
- ✅ HTTPS on port 443
- ✅ HTTP→HTTPS redirect on port 80
- ✅ Auto-renew certificates before expiry
- ✅ WebSocket proxying

> **Alternative: Nginx or direct HTTPS** → see `server.md` §5 or `README.md` → SSL / HTTPS Setup

---

## Step 8: Firewall

```bash
# Enable UFW firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH (IMPORTANT — don't lock yourself out)
sudo ufw allow ssh

# Allow HTTP + HTTPS (for Caddy)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Verify
sudo ufw status
```

Expected output:
```
Status: active

To                         Action      From
--                         ------      ----
22/tcp                     ALLOW       Anywhere       # SSH
80/tcp                     ALLOW       Anywhere       # HTTP (Caddy redirect)
443/tcp                    ALLOW       Anywhere       # HTTPS (Caddy)
```

> **Port 3456 is NOT exposed** — Caddy proxies to it internally. This is correct and secure.

---

## Step 9: Process Manager (PM2)

```bash
cd /home/westay/westay

# Start WeStay with PM2
pm2 start server.js --name westay

# Verify it's running
pm2 status
# Should show: westay │ online │ 0%

# Enable auto-start on server reboot
pm2 startup
# Follow the command it prints (copy-paste it)
pm2 save

# Useful commands:
pm2 logs westay          # view real-time logs
pm2 logs westay --lines 50  # last 50 lines
pm2 monit                # live dashboard
pm2 restart westay       # restart
pm2 stop westay          # stop
```

### Optional: PM2 ecosystem file

```bash
nano ecosystem.config.js
```

```js
module.exports = {
  apps: [{
    name: 'westay',
    script: 'server.js',
    instances: 1,
    exec_mode: 'fork',
    max_memory_restart: '512M',
    env: {
      NODE_ENV: 'production',
      PORT: 3456
    },
    error_file: './backend/logs/pm2-error.log',
    out_file: './backend/logs/pm2-out.log',
    merge_logs: true
  }]
};
```

```bash
pm2 start ecosystem.config.js
pm2 save
```

---

## Step 10: Database Backup

### 10a. Create backup script

```bash
nano /home/westay/westay/backend/scripts/backup.sh
```

```bash
#!/bin/bash
DB_PATH="/home/westay/westay/backend/data/westay.db"
BACKUP_DIR="/home/westay/westay/backend/backups"
TIMESTAMP=$(date +%Y%m%d-%H%M)

mkdir -p "$BACKUP_DIR"
cp "$DB_PATH" "$BACKUP_DIR/westay-$TIMESTAMP.db"
echo "[$(date)] Backup created: westay-$TIMESTAMP.db"

# Keep only last 14 backups
cd "$BACKUP_DIR"
ls -t westay-*.db | tail -n +15 | xargs -r rm
echo "[$(date)] Old backups cleaned (keeping last 14)"
```

```bash
chmod +x /home/westay/westay/backend/scripts/backup.sh
```

### 10b. Test it

```bash
bash /home/westay/westay/backend/scripts/backup.sh
ls -la /home/westay/westay/backend/backups/
# Should show one .db file
```

### 10c. Schedule daily backups (2 AM MYT = 18:00 UTC)

```bash
crontab -e
```

Add:
```bash
# Daily DB backup at 2 AM MYT (18:00 UTC previous day)
0 18 * * * /home/westay/westay/backend/scripts/backup.sh >> /home/westay/westay/backend/logs/backup.log 2>&1

# Weekly dependency check at 3 AM MYT Monday (19:00 UTC Sunday)
0 19 * * 0 cd /home/westay/westay && node backend/scripts/check-updates.js >> backend/logs/update-check.log 2>&1
```

### 10d. Restore from backup (if needed)

```bash
pm2 stop westay
cp backend/backups/westay-YYYYMMDD-HHMM.db backend/data/westay.db
pm2 start westay
```

---

## Step 11: Monitoring & Uptime

### Option A: Free — UptimeRobot (recommended)

1. Go to https://uptimerobot.com (free, 50 monitors)
2. Add New Monitor:
   - Type: **HTTPS**
   - URL: `https://westay.my/api/docs`
   - Interval: **5 minutes**
   - Alert contacts: Your email + phone
3. This checks if the server is responding every 5 minutes and emails you if it's down.

### Option B: Free — Self-hosted health check

Add to crontab:
```bash
# Check every 5 min, alert if down
*/5 * * * * curl -sf https://westay.my/api/docs > /dev/null || echo "WeStay is DOWN at $(date)" | mail -s "⚠️ WeStay DOWN" your@email.com
```

> This requires `mailutils` installed: `sudo apt install -y mailutils`

### Option C: Server resource monitoring

```bash
# Check disk usage (alert if > 80%)
df -h /home/westay

# Check memory
free -m

# Check PM2 process
pm2 status

# Check recent errors
tail -20 /home/westay/westay/backend/logs/error.log
```

---

## Step 12: Smoke Test

Run these checks **before** announcing go-live. All must pass.

### 12a. Server is running

```bash
pm2 status
# westay should show "online"
```

### 12b. HTTPS works

```bash
curl -I https://westay.my
# Should return HTTP/2 200
# Should show security headers (x-frame-options, content-security-policy, etc.)
```

### 12c. API responds

```bash
curl https://westay.my/api/docs | head -1
# Should return {"openapi":"3.0.0",...}
```

### 12d. Login works (all 6 accounts)

```bash
# Admin
curl -s -X POST https://westay.my/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123456"}' | grep token
# Should return {"token":"eyJ..."}

# Repeat for: operator/op123456, sarah/tenant123, landlord/landlord123, vendor/vendor123, agent/agent123
```

### 12e. WebSocket connects

```bash
# Install wscat for testing
sudo npm install -g wscat

wscat -c wss://westay.my/ws
# Should show: Connected
# Type: {"type":"ping"}
# Should respond: {"type":"pong","timestamp":...}
# Ctrl+C to exit
```

### 12f. Frontend loads

Open `https://westay.my` in a browser. You should see the WeStay login page. Login with admin/admin123456.

### 12g. Payment gateway (if configured)

```bash
TOKEN=$(curl -s -X POST https://westay.my/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123456"}' | grep -o '"token":"[^"]*' | cut -d'"' -f4)

curl -s https://westay.my/api/payments/status \
  -H "Authorization: Bearer $TOKEN"
# Should return {"configured":true,...} if Stripe is set up
# Or {"configured":false,...} if not (this is fine)
```

### 12h. Notifications (if configured)

```bash
curl -s https://westay.my/api/notifications/status \
  -H "Authorization: Bearer $TOKEN"
# Shows which channels are configured
```

---

## Step 13: Go Live

### Pre-launch checklist

```
[x] Server provisioned and SSH works
[x] Node.js 22 LTS installed
[x] WeStay cloned and npm installed
[x] .env configured (JWT_SECRET, NODE_ENV, CORS_ORIGIN)
[x] Domain purchased and DNS A records set
[x] Caddy configured with HTTPS
[x] Firewall enabled (22, 80, 443 only)
[x] PM2 running with auto-start on reboot
[x] Daily backup cron configured
[x] Weekly dependency check cron configured
[x] Uptime monitor configured
[x] All 6 demo accounts login works
[x] WebSocket connects via wss://
[x] Frontend loads and renders correctly
[ ] ⚠️ CHANGE demo account passwords or DELETE demo accounts
[ ] ⚠️ Create real operator/admin accounts
```

### Change demo passwords (IMPORTANT)

```bash
TOKEN=$(curl -s -X POST https://westay.my/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123456"}' | grep -o '"token":"[^"]*' | cut -d'"' -f4)

# Change admin password
curl -X PATCH https://westay.my/api/auth/password \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"currentPassword":"admin123456","newPassword":"YOUR_STRONG_PASSWORD_HERE"}'
```

Repeat for all demo accounts, or delete the ones you don't need:
```bash
# Delete unused demo accounts (admin only)
curl -X DELETE https://westay.my/api/auth/users/USERID \
  -H "Authorization: Bearer $TOKEN"
```

### Announce

Your app is live at `https://westay.my` 🎉

---

## Post-Launch Maintenance

| Task | Frequency | How |
|---|---|---|
| Check update report | Weekly | `cat backend/logs/update-check.log` or read `backend/logs/update-report.json` |
| Review error log | Weekly | `tail -50 backend/logs/error.log` |
| Update packages | Monthly | Follow `versionCheck.md` procedures |
| Check disk usage | Monthly | `df -h /home/westay` |
| Test backup restore | Monthly | Copy backup → stop PM2 → restore → start → verify login |
| Renew SSL cert | Auto (Caddy) | Caddy auto-renews. If using certbot: check `certbot certificates` |
| Update Node.js | When new LTS | `nvm install --lts && npm rebuild && npm test && pm2 restart westay` |

### Deploy code updates

```bash
cd /home/westay/westay

# 1. Backup DB first
bash backend/scripts/backup.sh

# 2. Pull latest code
git pull origin staging

# 3. Install any new dependencies
npm install --production

# 4. Run tests
npm test

# 5. Restart
pm2 restart westay

# 6. Verify
curl https://westay.my/api/docs | head -1
```

---

## Quick Reference: All Commands

```bash
# ── Server Access ──
ssh westay@YOUR_SERVER_IP

# ── App Management ──
pm2 status                        # check if running
pm2 restart westay                # restart app
pm2 logs westay                   # real-time logs
pm2 logs westay --lines 100      # last 100 lines

# ── Database ──
bash backend/scripts/backup.sh    # manual backup
ls -la backend/backups/           # list backups

# ── Dependency Check ──
node backend/scripts/check-updates.js   # run update checker
cat backend/logs/update-report.json     # read last report

# ── Monitoring ──
tail -20 backend/logs/error.log   # recent errors
tail -20 backend/logs/app.log     # recent activity
df -h /home/westay                # disk usage
free -m                           # memory usage

# ── SSL ──
sudo caddy validate               # check Caddy config
sudo systemctl status caddy        # Caddy status
sudo systemctl restart caddy       # restart Caddy

# ── Firewall ──
sudo ufw status                   # firewall rules
sudo ufw allow PORT/tcp           # open a port
sudo ufw deny PORT/tcp            # close a port

# ── Deploy Update ──
bash backend/scripts/backup.sh && git pull origin staging && npm install --production && npm test && pm2 restart westay

# ── Emergency Rollback ──
pm2 stop westay
cp backend/backups/westay-LATEST.db backend/data/westay.db
git checkout PREVIOUS_COMMIT
npm install --production
pm2 start westay
```

---

## Related Documents

| Document | Purpose |
|---|---|
| `server-criteria.md` | Detailed hosting provider evaluation & comparison |
| `server.md` | Production readiness audit + DIY API integration guide |
| `versionCheck.md` | Version management for all deps + external APIs |
| `README.md` | Full project documentation, API reference, architecture |
