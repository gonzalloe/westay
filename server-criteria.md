# WeStay — Production Server Selection Criteria

A comprehensive checklist for evaluating hosting providers before going live.

---

## 1. Must-Have (Deal-breakers)

These are non-negotiable. If any is ❌, skip the provider.

| # | Criteria | Requirement | Why |
|---|---|---|---|
| 1.1 | **Persistent filesystem** | Required | SQLite DB file + uploaded files + logs live on disk. Ephemeral FS = data loss on restart |
| 1.2 | **WebSocket support** | Required | Real-time notifications, ticket updates, IoT status, audit feed — all via `/ws` (HTTP Upgrade, same port) |
| 1.3 | **Long-running process** | Required | Express server must stay alive 24/7. Serverless/edge functions are incompatible |
| 1.4 | **Node.js 20+ with WASM** | Required | sql.js loads `sql-wasm.wasm` at runtime. Node 18+ has built-in WASM support |
| 1.5 | **Writable disk** | Required | Every DB mutation writes to disk (`backend/data/westay.db`), multer saves uploads to `backend/uploads/` |

---

## 2. Performance & Latency

| # | Criteria | Minimum | Recommended | Notes |
|---|---|---|---|---|
| 2.1 | **Datacenter location** | Any Asia DC | **Singapore** | Tenants are in Malaysia — US/EU servers add 200-300ms RTT. Every 100ms degrades UX |
| 2.2 | **RAM** | 256 MB | 512 MB+ | sql.js loads entire DB into memory (~1-5 MB typical). More tenants = more memory |
| 2.3 | **CPU** | 1 shared vCPU | 1 dedicated vCPU | Very light workload — no heavy computation, no image processing |
| 2.4 | **Disk type** | SSD | **NVMe SSD** | SQLite writes are synchronous — slow disk = slow API responses |
| 2.5 | **Disk space** | 500 MB | 1 GB+ | Code (~3 MB) + node_modules (~120 MB) + DB + uploads + logs (up to 150 MB rotation) |
| 2.6 | **Network speed** | 100 Mbps | 1 Gbps | Matters for file uploads and concurrent WebSocket connections |
| 2.7 | **Bandwidth** | 100 GB/month | Unlimited | SPA is lightweight; API traffic is minimal at co-living scale |

---

## 3. Reliability & Uptime

| # | Criteria | Minimum | Notes |
|---|---|---|---|
| 3.1 | **Uptime SLA** | 99.9% | = max 8.7 hours downtime/year. Tenants paying rent need the portal available |
| 3.2 | **Auto-restart on crash** | Required | PM2, Docker, systemd, or platform-managed process recovery |
| 3.3 | **Backups** | Weekly | Automated backup of SQLite file (`backend/data/westay.db`). One corrupt write without backup = total data loss |
| 3.4 | **Backup restore** | Tested | Backups are useless if you can't restore. Test the restore process before going live |
| 3.5 | **DDoS protection** | Basic | Should be included. The app handles tenant PII and payment references |
| 3.6 | **Redundant network** | Preferred | Multiple uplinks reduce single-point-of-failure risk |

---

## 4. Cost & Commitment

| # | Criteria | What to Evaluate | Red Flags |
|---|---|---|---|
| 4.1 | **Monthly cost** | Should be under $10/mo for current scale | Paying $20+/mo for a small co-living app is overkill |
| 4.2 | **Billing model** | Pay-as-you-go vs prepaid lock-in | 2-year lock-in with high renewal price |
| 4.3 | **Promo vs renewal price** | Check the renewal rate, not just the intro rate | $6.49/mo → $11.99/mo on renewal is a 85% increase |
| 4.4 | **Hidden costs** | Bandwidth overage, volume storage per GB, SSL, domain, backup add-ons | "Free" tiers with surprise charges |
| 4.5 | **Scaling cost curve** | How much to double RAM or add a second instance? | Linear pricing is ideal; exponential is a trap |
| 4.6 | **Exit cost** | Can you leave without losing money? | Non-refundable prepaid contracts |

---

## 5. Security

| # | Criteria | Requirement | Notes |
|---|---|---|---|
| 5.1 | **SSL/TLS (HTTPS)** | Required | Free auto-renewing certs (Let's Encrypt or platform-provided). Non-negotiable for auth + payments |
| 5.2 | **Firewall** | Required | Restrict ports — only 80 (HTTP redirect) + 443 (HTTPS) should be public |
| 5.3 | **Isolation** | Preferred | VPS (dedicated resources) > shared container. DB contains tenant PII + payment references |
| 5.4 | **SSH key authentication** | Required (VPS) | Password SSH login = brute-force target. Key-only access is the minimum |
| 5.5 | **OS-level security** | Required (VPS) | Unattended security updates (`unattended-upgrades` on Ubuntu) |
| 5.6 | **Encryption at rest** | Preferred | Protects data if physical disk is compromised |
| 5.7 | **Network isolation** | Preferred | Private networking between services (if multi-service in future) |

---

## 6. Operations & Developer Experience

| # | Criteria | Ideal | Acceptable | Notes |
|---|---|---|---|---|
| 6.1 | **Deploy workflow** | Git push auto-deploy | Manual SSH + `git pull` + `pm2 restart` | How fast can you ship a hotfix at 2 AM? |
| 6.2 | **Deploy rollback** | One-click rollback | Manual `git revert` + redeploy | Broken deploy = downtime without rollback |
| 6.3 | **Log access** | Real-time tail + searchable history | SSH + `pm2 logs` | WeStay has structured logging with file rotation in `backend/logs/` |
| 6.4 | **Monitoring & alerts** | Built-in dashboard + email/SMS alerts | DIY (Uptime Kuma, cron health checks) | Get notified when server is down, disk full, or memory spiking |
| 6.5 | **Support quality** | 24/7 live support | Good documentation + community | When something breaks at 3 AM, is there someone to help? |
| 6.6 | **Documentation** | Comprehensive + Node.js examples | Basic getting-started guide | Good docs = faster troubleshooting |
| 6.7 | **Staging/preview** | Built-in preview environments | Separate staging server | Test before deploying to production |

---

## 7. Future-Proofing & Scalability

| # | Criteria | What to Evaluate | Notes |
|---|---|---|---|
| 7.1 | **Vertical scaling** | Can you upgrade RAM/CPU without migration? | In-place resize is ideal; migration = downtime |
| 7.2 | **Horizontal scaling** | Can you add a second server + load balancer? | Needed when outgrowing SQLite → PostgreSQL (multi-server) |
| 7.3 | **Managed DB add-on** | Does the provider offer managed PostgreSQL? | Simplifies the SQLite → Postgres migration path |
| 7.4 | **Container/Docker support** | Can you run Docker if needed? | Useful for reproducible deploys and CI/CD |
| 7.5 | **CI/CD integration** | GitHub Actions / GitLab CI compatibility | Automate testing + deployment pipeline |
| 7.6 | **Vendor lock-in risk** | How hard is it to leave the provider? | VPS = easy (clone and go). PaaS = varies. Proprietary APIs = hard |
| 7.7 | **Multi-region** | Can you deploy to multiple DCs? | Not needed now, but useful for future expansion beyond Malaysia |

---

## Provider Comparison Matrix

| Criteria | Railway | Hetzner | Hostinger | DigitalOcean | Fly.io |
|---|---|---|---|---|---|
| **Must-haves (1.x)** | ✅ All | ✅ All | ✅ All | ✅ All | ✅ All |
| **Singapore DC** | ❌ | ✅ | ✅ | ✅ | ✅ |
| **RAM** | 512 MB | 2 GB | 4 GB | 512 MB | 256 MB |
| **Disk** | Volumes (per GB) | 20 GB NVMe | 50 GB NVMe | 10 GB SSD | 1 GB volume |
| **Monthly cost** | ~$5 | €3.29 (~$3.60) | $6.49 (2yr lock) | $4 | Free |
| **Lock-in** | None | None | 2 years | None | None |
| **Deploy speed** | ⭐ Instant | Manual | Manual | Manual | Medium |
| **Backups** | Manual | €0.72/mo | Free weekly | $1/mo | Manual |
| **24/7 Support** | ❌ Docs only | ❌ Docs only | ✅ Live chat | ✅ Ticket | ❌ Community |
| **Managed Postgres** | ✅ Add-on | ❌ | ❌ | ✅ $15/mo | ✅ (Fly Postgres) |
| **Vendor lock-in** | Medium | Low | Low | Low | Medium |
| **Best for** | Zero DevOps | Best value | Most resources | Balanced | Free MVP |

---

## Decision Framework

Answer these questions to pick the right provider:

### Q1: Are you going live with paying tenants soon?
- **Yes** → VPS (Hetzner, Hostinger, or DigitalOcean). Better value, Singapore DC, full control
- **No, still testing** → Railway or Fly.io free tier. Don't commit money yet

### Q2: Do you want zero server management?
- **Yes** → Railway (~$5/mo). Git push deploy, no SSH, no Linux
- **No, I can manage a VPS** → Hetzner (€3.29/mo) or DigitalOcean ($4/mo)

### Q3: Is latency to Malaysian users critical?
- **Yes** → Must have Singapore DC: Hetzner, Hostinger, DigitalOcean, or Fly.io
- **No** → Railway (US/EU) is fine for internal/demo use

### Q4: Do you need managed PostgreSQL later?
- **Yes** → Railway or DigitalOcean (both offer managed Postgres add-ons)
- **No / Will use Neon** → Any provider works. Neon is a separate managed Postgres service

### Q5: What's your budget commitment level?
- **Zero upfront** → Fly.io (free) or Railway (pay-as-you-go)
- **Monthly, no lock-in** → Hetzner or DigitalOcean
- **2-year prepaid for better value** → Hostinger

---

## Production Readiness Checklist

Before going live on any provider:

- [ ] `JWT_SECRET` — Strong random string (min 32 chars): `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- [ ] `NODE_ENV=production`
- [ ] `CORS_ORIGIN` — Set to actual domain (not `*`)
- [ ] HTTPS enabled (reverse proxy or platform SSL)
- [ ] Persistent storage confirmed (SQLite file, uploads, logs on durable disk/volume)
- [ ] Process manager configured (PM2 / Docker / platform-managed)
- [ ] Backup schedule active (daily `cp` of `backend/data/westay.db` minimum)
- [ ] Backup restore tested at least once
- [ ] Firewall configured (only ports 80 + 443 open)
- [ ] SSH key-only auth (if VPS)
- [ ] Domain + DNS A record pointing to server IP
- [ ] Health check endpoint or uptime monitor configured
- [ ] Log rotation confirmed (`backend/logs/` won't fill disk)

---

## 🏆 Recommended: Cheapest & Good Options

### Option 1: Railway (Easiest — PaaS)

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

### Option 2: Hetzner Cloud VPS (Cheapest — IaaS)

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

### Option 3: DigitalOcean Droplet (Balanced)

**Cost: $4/month** | 512 MB RAM, 10 GB disk | Good docs & community

Same setup as Hetzner but with DigitalOcean's ecosystem (monitoring, backups, firewall UI).

```bash
# Create a $4/month Droplet: Basic, Regular, 512 MB / 1 vCPU / 10 GB SSD
# Choose: Singapore datacenter (sgp1) — closest to Malaysia
# Then follow the same steps as Hetzner above
```

### Option 4: Fly.io (Free Tier — Edge)

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

---

*Last updated: 2026-04-04*
