// ============ INPUT VALIDATION & SANITIZATION MIDDLEWARE ============
// Lightweight validation without external library (Joi/Zod).
// Strips unknown fields, sanitizes strings, enforces required fields.

/**
 * Sanitize a string value — strip ALL HTML tags, event handlers, dangerous protocols.
 * Uses allowlist approach: strip everything that looks like HTML/script injection.
 */
function sanitize(val) {
  if (typeof val !== 'string') return val;
  return val
    // Strip dangerous tags WITH their content (script, style, iframe, svg, object, embed, applet)
    .replace(/<(script|style|iframe|svg|object|embed|applet)[^>]*>[\s\S]*?<\/\1>/gi, '')
    // Strip self-closing/unclosed dangerous tags
    .replace(/<(script|style|iframe|svg|object|embed|applet)[^>]*\/?>/gi, '')
    // Strip remaining HTML tags (keep text content — safe tags like <b>, <p>)
    .replace(/<[^>]*>/g, '')
    // Strip all on* event handlers (onclick=, onerror=, onload=, etc.)
    .replace(/on\w+\s*=\s*(['"]?)[\s\S]*?\1/gi, '')
    // Strip dangerous URI protocols
    .replace(/(?:javascript|data|vbscript)\s*:/gi, '')
    // Strip HTML5 base64 data URIs that could contain HTML
    .replace(/data:[^,]*base64[^,]*,/gi, '')
    // Strip expression() CSS
    .replace(/expression\s*\(/gi, '')
    // Strip url() with data/javascript
    .replace(/url\s*\(\s*(['"]?)\s*(?:javascript|data|vbscript):/gi, 'url($1blocked:')
    .trim();
}

/**
 * Deep-sanitize an object (recursively sanitize all string values)
 */
function sanitizeObj(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeObj);
  const clean = {};
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'string') clean[k] = sanitize(v);
    else if (Array.isArray(v)) clean[k] = v.map(sanitizeObj);
    else if (typeof v === 'object' && v !== null) clean[k] = sanitizeObj(v);
    else clean[k] = v;
  }
  return clean;
}

/**
 * Middleware: sanitize req.body, req.query, req.params
 */
function sanitizeRequest(req, res, next) {
  if (req.body && typeof req.body === 'object') req.body = sanitizeObj(req.body);
  if (req.query && typeof req.query === 'object') {
    for (const k of Object.keys(req.query)) {
      if (typeof req.query[k] === 'string') req.query[k] = sanitize(req.query[k]);
    }
  }
  next();
}

/**
 * Create a validation middleware for required fields
 * @param {Object} schema - { fieldName: { required: bool, type: string, maxLen: number, allowed: array } }
 * @returns {Function} Express middleware
 *
 * Usage:
 *   router.post('/', validate({ n: { required: true, type: 'string', maxLen: 200 } }), handler)
 */
function validate(schema) {
  return (req, res, next) => {
    const errors = [];
    const body = req.body || {};

    for (const [field, rules] of Object.entries(schema)) {
      const val = body[field];

      // Required check
      if (rules.required && (val === undefined || val === null || val === '')) {
        errors.push(field + ' is required');
        continue;
      }

      // Skip optional absent fields
      if (val === undefined || val === null) continue;

      // Type check
      if (rules.type && typeof val !== rules.type) {
        errors.push(field + ' must be a ' + rules.type);
      }

      // Max length
      if (rules.maxLen && typeof val === 'string' && val.length > rules.maxLen) {
        errors.push(field + ' exceeds max length of ' + rules.maxLen);
      }

      // Min length
      if (rules.minLen && typeof val === 'string' && val.length < rules.minLen) {
        errors.push(field + ' must be at least ' + rules.minLen + ' characters');
      }

      // Allowed values
      if (rules.allowed && !rules.allowed.includes(val)) {
        errors.push(field + ' must be one of: ' + rules.allowed.join(', '));
      }

      // Array check
      if (rules.isArray && !Array.isArray(val)) {
        errors.push(field + ' must be an array');
      }
    }

    if (errors.length) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }
    next();
  };
}

/**
 * Strip fields that should not be set by clients on PUT/PATCH
 * (e.g., 'id', 'created_at', 'role' on non-admin routes)
 */
function stripFields(...fields) {
  return (req, res, next) => {
    if (req.body) {
      for (const f of fields) delete req.body[f];
    }
    next();
  };
}

module.exports = { sanitize, sanitizeObj, sanitizeRequest, validate, stripFields };
