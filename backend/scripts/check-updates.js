#!/usr/bin/env node
// ============ DEPENDENCY UPDATE CHECKER ============
// Platform-agnostic — works on any VPS (Hetzner, Hostinger, DigitalOcean, etc.)
// Run manually: node backend/scripts/check-updates.js
// Run via cron: 0 9 * * 1  (every Monday 9 AM)
//
// Reports: outdated packages, security vulnerabilities, Node.js version status
// No external dependencies — uses only npm CLI + built-in modules

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const REPORT_DIR = path.join(__dirname, '..', 'logs');
const REPORT_FILE = path.join(REPORT_DIR, 'update-report.json');
const PROJECT_ROOT = path.join(__dirname, '..', '..');

// Find npm: try PATH first, then look relative to current node binary
function findNpm() {
  try {
    execSync('npm --version', { encoding: 'utf8', timeout: 5000 });
    return 'npm';
  } catch (e) {
    // npm lives next to the node binary on most installs
    const nodeDir = path.dirname(process.execPath);
    const npmCmd = process.platform === 'win32'
      ? path.join(nodeDir, 'npm.cmd')
      : path.join(nodeDir, 'npm');
    if (fs.existsSync(npmCmd)) return '"' + npmCmd + '"';
    // Try node_modules/.bin
    const localNpm = path.join(PROJECT_ROOT, 'node_modules', '.bin', 'npm');
    if (fs.existsSync(localNpm)) return '"' + localNpm + '"';
    return 'npm'; // last resort
  }
}

const NPM = findNpm();

function run(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8', timeout: 30000, cwd: PROJECT_ROOT });
  } catch (e) {
    return e.stdout || e.stderr || '';
  }
}

function checkUpdates() {
  const report = {
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    npmVersion: run(NPM + ' --version').trim(),
    outdated: [],
    vulnerabilities: null,
    summary: { total: 0, major: 0, minor: 0, patch: 0, critical_vuln: 0, high_vuln: 0 }
  };

  // ---- 1. Check outdated packages ----
  console.log('Checking outdated packages...');
  const outdatedRaw = run(NPM + ' outdated --json 2>&1');
  try {
    const outdated = JSON.parse(outdatedRaw);
    for (const [name, info] of Object.entries(outdated)) {
      const current = info.current || 'N/A';
      const wanted = info.wanted || 'N/A';
      const latest = info.latest || 'N/A';
      const severity = getMajorDiff(current, latest);
      report.outdated.push({ name, current, wanted, latest, severity });
      report.summary.total++;
      if (severity === 'major') report.summary.major++;
      else if (severity === 'minor') report.summary.minor++;
      else report.summary.patch++;
    }
  } catch (e) {
    // npm outdated returns exit code 1 when packages are outdated — that's normal
    if (outdatedRaw.trim() === '') {
      console.log('  All packages up to date!');
    }
  }

  // ---- 2. Check security vulnerabilities ----
  console.log('Checking security vulnerabilities...');
  const auditRaw = run(NPM + ' audit --json 2>&1');
  try {
    const audit = JSON.parse(auditRaw);
    report.vulnerabilities = {
      total: audit.metadata ? audit.metadata.vulnerabilities : {},
      advisories: []
    };
    // npm 10+ format
    if (audit.vulnerabilities) {
      for (const [name, vuln] of Object.entries(audit.vulnerabilities)) {
        report.vulnerabilities.advisories.push({
          package: name,
          severity: vuln.severity,
          title: vuln.via && vuln.via[0] ? (vuln.via[0].title || vuln.via[0]) : 'Unknown',
          fixAvailable: vuln.fixAvailable || false
        });
        if (vuln.severity === 'critical') report.summary.critical_vuln++;
        if (vuln.severity === 'high') report.summary.high_vuln++;
      }
    }
  } catch (e) {
    report.vulnerabilities = { error: 'Could not parse audit output' };
  }

  // ---- 3. Check Node.js version ----
  console.log('Checking Node.js version...');
  const nodeVer = parseInt(process.version.slice(1));
  if (nodeVer < 20) {
    report.nodeWarning = `Node ${process.version} is EOL. Upgrade to Node 22 LTS.`;
  } else if (nodeVer < 22) {
    report.nodeWarning = `Node ${process.version} — consider upgrading to Node 22 LTS (active until April 2027).`;
  } else {
    report.nodeWarning = null;
  }

  // ---- Save report ----
  if (!fs.existsSync(REPORT_DIR)) fs.mkdirSync(REPORT_DIR, { recursive: true });
  fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2));

  // ---- Print summary ----
  console.log('\n========================================');
  console.log('  WeStay Dependency Update Report');
  console.log('  ' + report.timestamp);
  console.log('========================================\n');

  console.log(`  Node.js: ${report.nodeVersion}`);
  if (report.nodeWarning) console.log(`  ⚠️  ${report.nodeWarning}`);
  console.log('');

  if (report.outdated.length === 0) {
    console.log('  ✅ All packages up to date\n');
  } else {
    console.log(`  📦 ${report.summary.total} outdated package(s):`);
    console.log(`     ${report.summary.major} major | ${report.summary.minor} minor | ${report.summary.patch} patch\n`);
    for (const pkg of report.outdated) {
      const icon = pkg.severity === 'major' ? '🔴' : pkg.severity === 'minor' ? '🟡' : '🔵';
      console.log(`  ${icon} ${pkg.name}: ${pkg.current} → ${pkg.latest} (${pkg.severity})`);
    }
    console.log('');
  }

  const vulnCount = report.summary.critical_vuln + report.summary.high_vuln;
  if (vulnCount > 0) {
    console.log(`  🚨 ${vulnCount} security issue(s) (${report.summary.critical_vuln} critical, ${report.summary.high_vuln} high)`);
    for (const adv of (report.vulnerabilities.advisories || [])) {
      if (adv.severity === 'critical' || adv.severity === 'high') {
        console.log(`     - ${adv.package}: ${adv.title} [${adv.severity}]${adv.fixAvailable ? ' (fix available)' : ''}`);
      }
    }
    console.log('\n  Run: npm audit fix (or: node backend/scripts/check-updates.js)');
  } else {
    console.log('  ✅ No known security vulnerabilities');
  }

  console.log('\n  Full report: ' + REPORT_FILE);
  console.log('========================================\n');

  // Exit with code 1 if critical/high vulns found (useful for CI)
  if (report.summary.critical_vuln > 0) process.exit(1);
}

function getMajorDiff(current, latest) {
  if (!current || !latest || current === 'N/A' || latest === 'N/A') return 'patch';
  const cParts = current.split('.').map(Number);
  const lParts = latest.split('.').map(Number);
  if (lParts[0] > cParts[0]) return 'major';
  if (lParts[1] > cParts[1]) return 'minor';
  return 'patch';
}

checkUpdates();
