// ============ HTTPS CONFIGURATION ============
// Optional HTTPS support via self-signed or real SSL certificates
// Usage in server.js:
//   const { createHTTPSServer } = require('./backend/https');
//   const server = createHTTPSServer(app) || app.listen(PORT);
//
// Required env vars:
//   SSL_ENABLED=true
//   SSL_KEY_PATH=./certs/privkey.pem
//   SSL_CERT_PATH=./certs/fullchain.pem
//
// For development: run generateSelfSigned() to create test certs

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const crypto = require('crypto');

const CERTS_DIR = path.join(__dirname, '..', 'certs');

/**
 * Check if SSL is enabled and configured
 * @returns {boolean}
 */
function isSSLEnabled() {
  return process.env.SSL_ENABLED === 'true' && process.env.SSL_KEY_PATH && process.env.SSL_CERT_PATH;
}

/**
 * Create an HTTPS server with the configured certificates
 * Falls back to null if SSL is not enabled or certs are missing
 * @param {Express} app - Express application
 * @returns {https.Server|null}
 */
function createHTTPSServer(app) {
  if (!isSSLEnabled()) return null;

  const keyPath = path.resolve(process.env.SSL_KEY_PATH);
  const certPath = path.resolve(process.env.SSL_CERT_PATH);

  if (!fs.existsSync(keyPath)) {
    console.warn('[HTTPS] SSL key not found at:', keyPath);
    return null;
  }
  if (!fs.existsSync(certPath)) {
    console.warn('[HTTPS] SSL cert not found at:', certPath);
    return null;
  }

  try {
    const options = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath)
    };

    // Optional CA bundle
    if (process.env.SSL_CA_PATH && fs.existsSync(path.resolve(process.env.SSL_CA_PATH))) {
      options.ca = fs.readFileSync(path.resolve(process.env.SSL_CA_PATH));
    }

    return https.createServer(options, app);
  } catch (e) {
    console.error('[HTTPS] Failed to load SSL certificates:', e.message);
    return null;
  }
}

/**
 * Create HTTP -> HTTPS redirect server
 * Listens on port 80 and redirects all traffic to HTTPS
 * @param {number} httpsPort - Target HTTPS port
 * @returns {http.Server}
 */
function createRedirectServer(httpsPort) {
  return http.createServer((req, res) => {
    const host = req.headers.host ? req.headers.host.replace(/:\d+$/, '') : 'localhost';
    const location = `https://${host}:${httpsPort}${req.url}`;
    res.writeHead(301, { Location: location });
    res.end();
  });
}

/**
 * Generate self-signed certificate for development
 * Requires Node.js crypto module (built-in)
 * @returns {{ keyPath: string, certPath: string }}
 */
function generateSelfSigned() {
  if (!fs.existsSync(CERTS_DIR)) {
    fs.mkdirSync(CERTS_DIR, { recursive: true });
  }

  const keyPath = path.join(CERTS_DIR, 'dev-privkey.pem');
  const certPath = path.join(CERTS_DIR, 'dev-cert.pem');

  // Generate RSA key pair
  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  });

  // Create self-signed certificate using Node's built-in X509Certificate (Node 15+)
  // For older Node versions, fall back to writing just the key and a placeholder
  fs.writeFileSync(keyPath, privateKey);

  // Self-signed cert via openssl command (cross-platform)
  const { execSync } = require('child_process');
  try {
    execSync(
      `openssl req -new -x509 -key "${keyPath}" -out "${certPath}" -days 365 -subj "/CN=localhost/O=WeStay Dev"`,
      { stdio: 'pipe' }
    );
  } catch (e) {
    // If openssl not available, write a notice
    fs.writeFileSync(certPath, '# OpenSSL not found. Install OpenSSL or provide your own certificate.\n# Run: openssl req -new -x509 -key dev-privkey.pem -out dev-cert.pem -days 365 -subj "/CN=localhost"\n');
    console.warn('[HTTPS] openssl not found. Key generated at', keyPath);
    console.warn('[HTTPS] Generate cert manually: openssl req -new -x509 -key dev-privkey.pem -out dev-cert.pem -days 365');
    return { keyPath, certPath: null };
  }

  console.log('[HTTPS] Self-signed certificate generated:');
  console.log('  Key:', keyPath);
  console.log('  Cert:', certPath);

  return { keyPath, certPath };
}

module.exports = {
  isSSLEnabled,
  createHTTPSServer,
  createRedirectServer,
  generateSelfSigned,
  CERTS_DIR
};
