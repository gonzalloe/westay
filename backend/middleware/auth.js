// ============ AUTH MIDDLEWARE ============
// JWT verification + role-based access control

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('[FATAL] JWT_SECRET environment variable is required. Set it in .env');
  process.exit(1);
}
const TOKEN_EXPIRY = '7d';

// Extract and verify JWT from Authorization header
function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = header.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, username, role, name, linked_entity }
    next();
  } catch(e) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Require specific roles
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions. Required: ' + roles.join(' or ') });
    }
    next();
  };
}

// Optional auth — sets req.user if token present, but doesn't block
function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    try {
      req.user = jwt.verify(header.slice(7), JWT_SECRET);
    } catch(e) { /* token invalid, proceed without user */ }
  }
  next();
}

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

module.exports = { authenticate, requireRole, optionalAuth, signToken, JWT_SECRET };
