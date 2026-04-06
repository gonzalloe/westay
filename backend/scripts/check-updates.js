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
  fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2));

  // ============================================================
  // PRINT REPORT
  // ============================================================
  const W = report.summary.warnings;
  console.log('');
  console.log('  ╔══════════════════════════════════════════════╗');
  console.log('  ║   WeStay — Dependency & Service Report       ║');
  console.log('  ║   ' + report.timestamp.slice(0, 19).replace('T', ' ') + '                     ║');
  console.log('  ╚══════════════════════════════════════════════╝');

  // Node
  console.log('\n  ── Node.js ──');
  const nodeIcon = report.node.status === 'current' ? '✅' : report.node.status === 'EOL' ? '🔴' : '🟡';
  console.log('  ' + nodeIcon + ' ' + report.node.current + (report.node.latestLTS ? '  (latest LTS: ' + report.node.latestLTS + ')' : ''));

  // Packages
  console.log('\n  ── npm Packages ──');
  if (report.packages.outdated.length === 0) {
    console.log('  ✅ All ' + Object.keys(deps).length + ' packages up to date');
  } else {
    console.log('  📦 ' + report.summary.total_outdated + ' outdated:  ' + report.summary.major + ' major | ' + report.summary.minor + ' minor | ' + report.summary.patch + ' patch');
    for (const p of report.packages.outdated) {
      const icon = p.severity === 'major' ? '🔴' : p.severity === 'minor' ? '🟡' : '🔵';
      const flag = p.securityCritical ? ' ⚠️' : '';
      console.log('     ' + icon + ' ' + p.name + ': ' + p.current + ' → ' + p.latest + ' (' + p.severity + ')' + flag);
    }
  }

  // Vulnerabilities
  const vulnCount = report.summary.critical_vuln + report.summary.high_vuln;
  if (vulnCount > 0) {
    console.log('  🚨 ' + vulnCount + ' vulnerability(ies):');
    for (const v of report.packages.vulnerabilities) {
      if (v.severity === 'critical' || v.severity === 'high') {
        console.log('     - ' + v.package + ': ' + v.title + ' [' + v.severity + ']' + (v.fixAvailable ? ' (fix available)' : ''));
      }
    }
  } else {
    console.log('  ✅ No known vulnerabilities');
  }

  // Stripe
  console.log('\n  ── Stripe ──');
  if (report.services.stripe.installedSdk) {
    const sIcon = report.services.stripe.sdkStatus === 'up to date' ? '✅' : report.services.stripe.sdkStatus.startsWith('MAJOR') ? '🔴' : '🟡';
    console.log('  ' + sIcon + ' SDK: v' + report.services.stripe.installedSdk + (report.services.stripe.latestSdk ? '  (latest: v' + report.services.stripe.latestSdk + ')' : ''));
    console.log('     Configured: ' + (report.services.stripe.configured ? 'Yes' : 'No'));
  } else {
    console.log('  ℹ️  Not installed');
  }

  // Services
  console.log('\n  ── Services ──');
  console.log('  Email:    ' + (report.services.email.configured ? '✅ ' + report.services.email.host : '❌ Not configured'));
  console.log('  WhatsApp: ' + (report.services.whatsapp.configured ? '✅ Configured' + (report.services.whatsapp.apiVersion ? ' (' + report.services.whatsapp.apiVersion + ')' : '') : '❌ Not configured'));
  console.log('  SSL:      ' + (report.services.ssl.enabled ? '✅ Enabled' + (report.services.ssl.daysLeft != null ? ' (' + report.services.ssl.daysLeft + ' days left)' : '') : '⚪ Disabled'));

  // Warnings summary
  if (W.length > 0) {
    console.log('\n  ── ⚠️  Action Required (' + W.length + ') ──');
    for (const w of W) console.log('  • ' + w);
    console.log('\n  To update packages:  npm update');
    console.log('  To fix vulns:        npm audit fix');
  }

  console.log('\n  Full JSON report: ' + REPORT_FILE);
  console.log('  ════════════════════════════════════════════════\n');

  if (report.summary.critical_vuln > 0) process.exit(1);
}

checkUpdates();
