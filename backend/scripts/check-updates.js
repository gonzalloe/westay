#!/usr/bin/env node
// ============ DEPENDENCY & SERVICE UPDATE CHECKER ============
// Platform-agnostic — works on any VPS (Hetzner, Hostinger, DigitalOcean, etc.)
//
// Checks:
//   1. npm packages — outdated versions + security vulnerabilities
//   2. Node.js — current vs latest LTS (from nodejs.org)
//   3. Stripe — SDK version vs latest on npm + API version deprecation
//   4. External services — SMTP, WhatsApp config, SSL cert expiry
//
// Run manually:  node backend/scripts/check-updates.js
// Cron (MYT 3AM Monday): 0 19 * * 0 cd /path/to/westay && node backend/scripts/check-updates.js
//   (UTC 19:00 Sunday = MYT 03:00 Monday, Malaysia is UTC+8)
//
// ⚠️  READ-ONLY — never installs, updates, or restarts anything. Zero downtime.

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const REPORT_DIR = path.join(__dirname, '..', 'logs');
const REPORT_FILE = path.join(REPORT_DIR, 'update-report.json');
const PROJECT_ROOT = path.join(__dirname, '..', '..');
const PKG_PATH = path.join(PROJECT_ROOT, 'package.json');

try { require('dotenv').config({ path: path.join(PROJECT_ROOT, '.env') }); } catch (e) {}

// ---- Find npm binary ----
function findNpm() {
  try {
    execSync('npm --version', { encoding: 'utf8', timeout: 5000, stdio: 'pipe' });
    return 'npm';
  } catch (e) {
    const nodeDir = path.dirname(process.execPath);
    const candidates = [
      process.platform === 'win32' ? path.join(nodeDir, 'npm.cmd') : path.join(nodeDir, 'npm'),
      path.join(PROJECT_ROOT, 'node_modules', '.bin', process.platform === 'win32' ? 'npm.cmd' : 'npm')
    ];
    for (const c of candidates) { if (fs.existsSync(c)) return '"' + c + '"'; }
    return 'npm';
  }
}

const NPM = findNpm();

function run(cmd) {
  try { return execSync(cmd, { encoding: 'utf8', timeout: 30000, cwd: PROJECT_ROOT, stdio: 'pipe' }); }
  catch (e) { return e.stdout || e.stderr || ''; }
}

async function fetchJSON(url) {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(10000) });
    return r.ok ? await r.json() : null;
  } catch (e) { return null; }
}

function classifyUpdate(current, latest) {
  if (!current || !latest || current === 'N/A') return 'patch';
  const c = current.split('.').map(Number), l = latest.split('.').map(Number);
  if (l[0] > c[0]) return 'major';
  if (l[1] > c[1]) return 'minor';
  return 'patch';
}

// ============================================================
async function checkUpdates() {
  const pkg = JSON.parse(fs.readFileSync(PKG_PATH, 'utf8'));
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };

  const report = {
    timestamp: new Date().toISOString(),
    node: {},
    packages: { outdated: [], vulnerabilities: [] },
    services: { stripe: {}, email: {}, whatsapp: {}, ssl: {} },
    summary: { total_outdated: 0, major: 0, minor: 0, patch: 0, critical_vuln: 0, high_vuln: 0, warnings: [] }
  };

  // Package urgency classification
  const URGENCY = {
    // 🔴 CRITICAL — auth & security headers — update within 24h
    jsonwebtoken: { urgency: 'CRITICAL', sla: '24 hours', reason: 'JWT auth tokens' },
    bcryptjs:     { urgency: 'CRITICAL', sla: '24 hours', reason: 'password hashing' },
    helmet:       { urgency: 'CRITICAL', sla: '24 hours', reason: 'HTTP security headers' },
    // 🟡 HIGH — money, framework, DB — update within 1 week
    express:            { urgency: 'HIGH', sla: '1 week', reason: 'web framework' },
    stripe:             { urgency: 'HIGH', sla: '1 week', reason: 'payment gateway' },
    'sql.js':           { urgency: 'HIGH', sla: '1 week', reason: 'database engine' },
    'express-rate-limit':{ urgency: 'HIGH', sla: '1 week', reason: 'brute-force protection' },
    // 🟠 MEDIUM — feature libs — update within 1 month
    nodemailer: { urgency: 'MEDIUM', sla: '1 month', reason: 'email sending' },
    multer:     { urgency: 'MEDIUM', sla: '1 month', reason: 'file uploads' },
    cors:       { urgency: 'MEDIUM', sla: '1 month', reason: 'CORS handling' },
    // 🔵 LOW — stable utilities — update quarterly
    dotenv: { urgency: 'LOW', sla: 'quarterly', reason: 'env config loader' },
    // ⚪ DEV — not in production
    jest: { urgency: 'DEV', sla: 'whenever', reason: 'test framework (dev only)' }
  };
  const URGENCY_ICON = { CRITICAL: '🔴', HIGH: '🟡', MEDIUM: '🟠', LOW: '🔵', DEV: '⚪' };
  const SECURITY_CRITICAL = ['express', 'jsonwebtoken', 'bcryptjs', 'helmet', 'stripe', 'nodemailer'];

  // ---- 1. Node.js version ----
  console.log('  [1/5] Checking Node.js...');
  report.node.current = process.version;
  const nodeMajor = parseInt(process.version.slice(1));
  const nodeData = await fetchJSON('https://nodejs.org/dist/index.json');
  if (nodeData) {
    const lts = nodeData.find(v => v.lts);
    if (lts) {
      report.node.latestLTS = lts.version;
      report.node.ltsName = lts.lts;
      const ltsMajor = parseInt(lts.version.slice(1));
      if (nodeMajor < ltsMajor - 2) {
        report.node.status = 'EOL';
        report.summary.warnings.push('Node ' + process.version + ' is EOL — upgrade to ' + lts.version);
      } else if (nodeMajor < ltsMajor) {
        report.node.status = 'outdated';
        report.summary.warnings.push('Node ' + process.version + ' — newer LTS available: ' + lts.version);
      } else {
        report.node.status = 'current';
      }
    }
  } else {
    report.node.latestLTS = 'unknown (offline)';
    report.node.status = nodeMajor >= 22 ? 'likely current' : 'check manually';
  }

  // ---- 2. npm outdated ----
  console.log('  [2/5] Checking npm packages...');
  const outdatedRaw = run(NPM + ' outdated --json');
  try {
    const outdated = JSON.parse(outdatedRaw);
    for (const [name, info] of Object.entries(outdated)) {
      const current = info.current || 'N/A', wanted = info.wanted || 'N/A', latest = info.latest || 'N/A';
      const severity = classifyUpdate(current, latest);
      const isCritical = SECURITY_CRITICAL.includes(name);
      report.packages.outdated.push({ name, current, wanted, latest, severity, securityCritical: isCritical });
      report.summary.total_outdated++;
      report.summary[severity]++;
      if (isCritical && severity !== 'patch') {
        report.summary.warnings.push(name + ' ' + current + ' → ' + latest + ' (' + severity + ') — security-critical');
      }
    }
  } catch (e) {}

  // ---- 3. npm audit ----
  console.log('  [3/5] Checking security vulnerabilities...');
  const auditRaw = run(NPM + ' audit --json');
  try {
    const audit = JSON.parse(auditRaw);
    if (audit.vulnerabilities) {
      for (const [name, vuln] of Object.entries(audit.vulnerabilities)) {
        const title = vuln.via && vuln.via[0] ? (vuln.via[0].title || String(vuln.via[0])) : 'Unknown';
        report.packages.vulnerabilities.push({ package: name, severity: vuln.severity, title, fixAvailable: !!vuln.fixAvailable });
        if (vuln.severity === 'critical') report.summary.critical_vuln++;
        if (vuln.severity === 'high') report.summary.high_vuln++;
      }
    }
  } catch (e) {}

  // ---- 4. Stripe SDK + API version ----
  console.log('  [4/5] Checking Stripe...');
  const stripeVer = deps.stripe ? deps.stripe.replace(/[\^~]/, '') : null;
  if (stripeVer) {
    report.services.stripe.installedSdk = stripeVer;

    // Check latest from npm registry
    const npmInfo = await fetchJSON('https://registry.npmjs.org/stripe/latest');
    if (npmInfo) {
      report.services.stripe.latestSdk = npmInfo.version;
      const curMajor = parseInt(stripeVer), latMajor = parseInt(npmInfo.version);
      if (curMajor < latMajor) {
        report.services.stripe.sdkStatus = 'MAJOR update (' + stripeVer + ' → ' + npmInfo.version + ')';
        report.summary.warnings.push('Stripe SDK major update: v' + stripeVer + ' → v' + npmInfo.version + ' — check https://github.com/stripe/stripe-node/blob/master/CHANGELOG.md');
      } else if (stripeVer !== npmInfo.version) {
        report.services.stripe.sdkStatus = 'update available (' + npmInfo.version + ')';
      } else {
        report.services.stripe.sdkStatus = 'up to date';
      }
    }

    report.services.stripe.configured = !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== 'sk_test_your_key_here');
    report.services.stripe.note = 'Stripe deprecates API versions ~2 years after release. Dashboard: https://dashboard.stripe.com/developers';
  } else {
    report.services.stripe = { installed: false };
  }

  // ---- 5. External services ----
  console.log('  [5/5] Checking services...');

  // Email
  const emailOk = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
  report.services.email = { configured: emailOk, host: process.env.SMTP_HOST || 'not set' };
  if (!emailOk) report.services.email.warning = 'Not configured — forgot-password + rent reminders will fail silently';

  // WhatsApp
  const waOk = !!(process.env.WHATSAPP_API_URL && process.env.WHATSAPP_API_TOKEN);
  report.services.whatsapp = { configured: waOk };
  if (waOk) {
    // Meta Graph API has versioned URLs — check if using old version
    const url = process.env.WHATSAPP_API_URL || '';
    const verMatch = url.match(/\/v(\d+)\.\d+\//);
    if (verMatch) {
      const apiVer = parseInt(verMatch[1]);
      report.services.whatsapp.apiVersion = 'v' + verMatch[1];
      if (apiVer < 19) {
        report.services.whatsapp.warning = 'Meta Graph API v' + verMatch[1] + ' may be deprecated — update to v20.0+';
        report.summary.warnings.push('WhatsApp API v' + verMatch[1] + ' — consider updating to latest (v20.0+)');
      }
    }
  } else {
    report.services.whatsapp.warning = 'Not configured — WhatsApp notifications disabled';
  }

  // SSL cert expiry
  report.services.ssl = { enabled: process.env.SSL_ENABLED === 'true' };
  if (report.services.ssl.enabled && process.env.SSL_CERT_PATH) {
    try {
      const certPath = path.resolve(process.env.SSL_CERT_PATH);
      if (fs.existsSync(certPath)) {
        const expiry = run('openssl x509 -enddate -noout -in "' + certPath + '"');
        const match = expiry.match(/notAfter=(.+)/);
        if (match) {
          const d = new Date(match[1]);
          const days = Math.floor((d - new Date()) / 86400000);
          report.services.ssl.expiresAt = d.toISOString();
          report.services.ssl.daysLeft = days;
          if (days < 7) {
            report.summary.warnings.push('🚨 SSL cert expires in ' + days + ' days!');
          } else if (days < 30) {
            report.summary.warnings.push('SSL cert expires in ' + days + ' days — renew soon');
          }
        }
      }
    } catch (e) {}
  }

  // ---- Save report ----
  if (!fs.existsSync(REPORT_DIR)) fs.mkdirSync(REPORT_DIR, { recursive: true });

  // ---- Build actionable items ----
  const actions = []; // { urgency, icon, title, detail, commands[] }

  // Node.js
  if (report.node.status === 'EOL') {
    actions.push({
      urgency: 'CRITICAL', icon: '🔴', title: 'Node.js ' + report.node.current + ' is END OF LIFE',
      detail: 'No more security patches. Upgrade to ' + (report.node.latestLTS || 'latest LTS') + '.',
      commands: [
        'nvm install --lts && nvm alias default node    # if using nvm',
        'curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt install -y nodejs    # Ubuntu/Debian',
        'npm rebuild && npm test && pm2 restart westay   # after upgrade'
      ]
    });
  } else if (report.node.status === 'outdated') {
    actions.push({
      urgency: 'LOW', icon: '🔵', title: 'Node.js ' + report.node.current + ' — newer LTS available: ' + report.node.latestLTS,
      detail: 'Current version still supported. Upgrade when convenient.',
      commands: ['nvm install --lts && nvm alias default node && npm rebuild && npm test && pm2 restart westay']
    });
  }

  // Outdated packages
  for (const p of report.packages.outdated) {
    const u = URGENCY[p.name] || { urgency: 'LOW', sla: 'quarterly', reason: p.name };
    // Escalate urgency for major updates on critical packages
    let effectiveUrgency = u.urgency;
    if (p.severity === 'major' && (u.urgency === 'CRITICAL' || u.urgency === 'HIGH')) {
      effectiveUrgency = 'CRITICAL';
    }
    const icon = URGENCY_ICON[effectiveUrgency] || '⚪';
    const isMajor = p.severity === 'major';

    actions.push({
      urgency: effectiveUrgency,
      icon,
      title: p.name + '  ' + p.current + ' → ' + p.latest + '  (' + p.severity + ' update)',
      detail: u.reason + ' — update within ' + u.sla + (isMajor ? '  ⚠️ MAJOR: read changelog before updating!' : ''),
      commands: isMajor
        ? [
            '# ⚠️ Major version — check changelog for breaking changes first',
            'npm install ' + p.name + '@latest',
            'npm test    # ALL 106 tests must pass',
            'pm2 restart westay'
          ]
        : [
            'npm update ' + p.name,
            'npm test',
            'pm2 restart westay'
          ]
    });
  }

  // Vulnerabilities
  for (const v of report.packages.vulnerabilities) {
    if (v.severity === 'critical' || v.severity === 'high') {
      actions.push({
        urgency: 'CRITICAL', icon: '🔴',
        title: 'SECURITY: ' + v.package + ' — ' + v.title + ' [' + v.severity + ']',
        detail: 'Known vulnerability' + (v.fixAvailable ? ' — automated fix available' : ' — manual fix needed'),
        commands: v.fixAvailable
          ? ['npm audit fix', 'npm test', 'pm2 restart westay']
          : ['npm audit', '# Check advisory details and update manually', 'npm install ' + v.package + '@latest', 'npm test', 'pm2 restart westay']
      });
    }
  }

  // Stripe SDK
  if (report.services.stripe.installedSdk && report.services.stripe.latestSdk) {
    const curMajor = parseInt(report.services.stripe.installedSdk);
    const latMajor = parseInt(report.services.stripe.latestSdk);
    if (curMajor < latMajor) {
      actions.push({
        urgency: 'HIGH', icon: '🟡',
        title: 'Stripe SDK  v' + report.services.stripe.installedSdk + ' → v' + report.services.stripe.latestSdk + '  (MAJOR)',
        detail: 'Payment SDK major update — may have breaking changes. Update within 1 week.',
        commands: [
          '# Read changelog: https://github.com/stripe/stripe-node/blob/master/CHANGELOG.md',
          'npm install stripe@latest',
          'npm test',
          '# Test payment: curl http://localhost:3456/api/payments/status -H "Authorization: Bearer <token>"',
          'pm2 restart westay'
        ]
      });
    } else if (report.services.stripe.installedSdk !== report.services.stripe.latestSdk) {
      actions.push({
        urgency: 'MEDIUM', icon: '🟠',
        title: 'Stripe SDK  v' + report.services.stripe.installedSdk + ' → v' + report.services.stripe.latestSdk + '  (minor/patch)',
        detail: 'Non-breaking update for payment SDK.',
        commands: ['npm update stripe', 'npm test', 'pm2 restart westay']
      });
    }
  }

  // Stripe API version reminder
  if (report.services.stripe.configured) {
    actions.push({
      urgency: 'INFO', icon: 'ℹ️',
      title: 'Stripe API version — check manually',
      detail: 'Stripe deprecates API versions ~2 years after release.',
      commands: [
        '# Check your API version: https://dashboard.stripe.com/developers',
        '# Compare with latest: https://stripe.com/docs/upgrades#api-versions',
        '# To upgrade: Dashboard → Developers → API version → Upgrade'
      ]
    });
  }

  // WhatsApp API version
  if (report.services.whatsapp.configured && report.services.whatsapp.warning) {
    actions.push({
      urgency: 'MEDIUM', icon: '🟠',
      title: 'WhatsApp Meta Graph API — version outdated',
      detail: report.services.whatsapp.warning,
      commands: [
        '# In .env, update the version in WHATSAPP_API_URL:',
        '# FROM: https://graph.facebook.com/v17.0/{phone_id}/messages',
        '# TO:   https://graph.facebook.com/v21.0/{phone_id}/messages',
        '# Check latest: https://developers.facebook.com/docs/graph-api/changelog',
        'pm2 restart westay'
      ]
    });
  }

  // SSL cert
  if (report.services.ssl.enabled && report.services.ssl.daysLeft != null) {
    if (report.services.ssl.daysLeft < 7) {
      actions.push({
        urgency: 'CRITICAL', icon: '🔴',
        title: 'SSL certificate expires in ' + report.services.ssl.daysLeft + ' days!',
        detail: 'HTTPS will stop working when cert expires. Renew immediately.',
        commands: [
          'sudo certbot renew',
          '# Or replace cert files at SSL_CERT_PATH and SSL_KEY_PATH',
          'pm2 restart westay'
        ]
      });
    } else if (report.services.ssl.daysLeft < 30) {
      actions.push({
        urgency: 'HIGH', icon: '🟡',
        title: 'SSL certificate expires in ' + report.services.ssl.daysLeft + ' days',
        detail: 'Schedule renewal within the next 2 weeks.',
        commands: ['sudo certbot renew', 'pm2 restart westay']
      });
    }
  }

  // Sort actions by urgency
  const URGENCY_ORDER = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, DEV: 4, INFO: 5 };
  actions.sort((a, b) => (URGENCY_ORDER[a.urgency] || 9) - (URGENCY_ORDER[b.urgency] || 9));

  // Add actions to report
  report.actions = actions;
  fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2));

  // ============================================================
  // PRINT REPORT
  // ============================================================
  console.log('');
  console.log('  ╔══════════════════════════════════════════════════════════╗');
  console.log('  ║   WeStay — Dependency & Service Update Report            ║');
  console.log('  ║   ' + report.timestamp.slice(0, 19).replace('T', ' ') + '                               ║');
  console.log('  ╚══════════════════════════════════════════════════════════╝');

  // ── Status Overview ──
  console.log('\n  ── Status Overview ──');
  const nodeIcon = report.node.status === 'current' ? '✅' : report.node.status === 'EOL' ? '🔴' : '🟡';
  console.log('  Node.js:    ' + nodeIcon + ' ' + report.node.current + (report.node.latestLTS && report.node.latestLTS !== 'unknown (offline)' ? '  (LTS: ' + report.node.latestLTS + ')' : ''));
  console.log('  Packages:   ' + (report.packages.outdated.length === 0 ? '✅ All ' + Object.keys(deps).length + ' up to date' : '📦 ' + report.summary.total_outdated + ' outdated'));
  console.log('  Vulns:      ' + (report.summary.critical_vuln + report.summary.high_vuln === 0 ? '✅ None' : '🚨 ' + (report.summary.critical_vuln + report.summary.high_vuln) + ' found'));
  console.log('  Stripe SDK: ' + (report.services.stripe.sdkStatus === 'up to date' ? '✅ v' + report.services.stripe.installedSdk : report.services.stripe.installedSdk ? '📦 ' + report.services.stripe.sdkStatus : '⚪ N/A'));
  console.log('  Email:      ' + (report.services.email.configured ? '✅ ' + report.services.email.host : '❌ Not configured'));
  console.log('  WhatsApp:   ' + (report.services.whatsapp.configured ? '✅ Configured' + (report.services.whatsapp.apiVersion ? ' (' + report.services.whatsapp.apiVersion + ')' : '') : '❌ Not configured'));
  console.log('  SSL:        ' + (report.services.ssl.enabled ? '✅ ' + (report.services.ssl.daysLeft != null ? report.services.ssl.daysLeft + ' days left' : 'Enabled') : '⚪ Disabled'));

  // ── Action Items ──
  const realActions = actions.filter(a => a.urgency !== 'INFO');
  if (realActions.length === 0 && actions.filter(a => a.urgency === 'INFO').length === 0) {
    console.log('\n  ✅ Everything is up to date. No action required.\n');
  } else {
    if (realActions.length > 0) {
      console.log('\n  ══ ACTION ITEMS (' + realActions.length + ') — sorted by urgency ══\n');
      for (let i = 0; i < realActions.length; i++) {
        const a = realActions[i];
        console.log('  ─────────────────────────────────────────────');
        console.log('  ' + a.icon + ' [' + a.urgency + '] ' + a.title);
        console.log('     ' + a.detail);
        console.log('     ┌─ How to update:');
        for (const cmd of a.commands) {
          console.log('     │  ' + cmd);
        }
        console.log('     └─');
      }
    }

    // Info items (no urgency, just reminders)
    const infoActions = actions.filter(a => a.urgency === 'INFO');
    if (infoActions.length > 0) {
      console.log('\n  ── Reminders ──');
      for (const a of infoActions) {
        console.log('  ' + a.icon + ' ' + a.title);
        console.log('     ' + a.detail);
        for (const cmd of a.commands) {
          console.log('     ' + cmd);
        }
      }
    }
  }

  // ── General procedure ──
  if (realActions.length > 0) {
    console.log('\n  ══ GENERAL UPDATE PROCEDURE ══');
    console.log('  1. Back up DB:     cp backend/data/westay.db backend/data/westay-backup-$(date +%Y%m%d).db');
    console.log('  2. Update:         npm update <package>   OR   npm install <package>@latest');
    console.log('  3. Test:           npm test   (106 tests must pass)');
    console.log('  4. Restart:        pm2 restart westay');
    console.log('  5. Verify:         curl http://localhost:3456/api/auth/login -X POST -H "Content-Type: application/json" -d \'{"username":"admin","password":"admin123456"}\'');
    console.log('  6. Rollback:       npm install <package>@<old-version> && pm2 restart westay');
  }

  console.log('\n  Full JSON report: ' + REPORT_FILE);
  console.log('  Detailed guide:   versionCheck.md');
  console.log('  ══════════════════════════════════════════════════════════\n');

  if (report.summary.critical_vuln > 0) process.exit(1);
}

checkUpdates();
