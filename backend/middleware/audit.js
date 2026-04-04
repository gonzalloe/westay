// ============ AUDIT LOG MIDDLEWARE ============
// Tracks all data changes: create, update, delete, login, system events
// Stores audit entries in the 'audit_log' collection via the DB adapter
// Usage: auditLog(db)(req, action, entity, entityId, details)
//   or as middleware: router.post('/', auditMiddleware(db, 'create', 'props'), handler)

/**
 * Create an audit log entry
 * @param {Object} db - Database adapter instance
 * @param {Object} options
 * @param {string} options.action - 'create' | 'update' | 'delete' | 'login' | 'password_change' | 'status_change' | 'data_reset' | 'bulk_save'
 * @param {string} options.entity - Entity type: 'props', 'tenants', 'bills', etc.
 * @param {string} [options.entityId] - ID of the affected entity
 * @param {Object} [options.details] - Additional context (old values, new values, etc.)
 * @param {Object} [options.user] - req.user object { id, username, role }
 * @param {string} [options.ip] - Request IP address
 */
async function createAuditEntry(db, options) {
  const entry = {
    id: 'AUD-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
    timestamp: new Date().toISOString(),
    action: options.action || 'unknown',
    entity: options.entity || null,
    entityId: options.entityId || null,
    userId: options.user ? options.user.id : null,
    username: options.user ? options.user.username : 'system',
    role: options.user ? options.user.role : 'system',
    ip: options.ip || null,
    details: options.details || null
  };

  try {
    await db.create('audit_log', entry);
  } catch (e) {
    // Audit failures should never break the main request
    console.error('[AUDIT] Failed to write audit log:', e.message);
  }

  return entry;
}

/**
 * Express middleware factory: auto-logs after a successful response
 * Attach AFTER your route handler with a response interceptor
 * @param {Object} db - Database adapter
 * @param {string} action - Action type
 * @param {string} entity - Entity name
 * @returns {Function} Express middleware
 */
function auditMiddleware(db, action, entity) {
  return (req, res, next) => {
    // Store original json method to intercept response
    const originalJson = res.json.bind(res);

    res.json = function (body) {
      // Only log on successful responses (2xx)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const entityId = req.params.id || req.params.name || req.params.meterId || req.params.key ||
          (body && (body.id || body.n || body.meterId)) || null;

        createAuditEntry(db, {
          action,
          entity,
          entityId: entityId ? String(entityId) : null,
          user: req.user || null,
          ip: req.ip || req.connection.remoteAddress,
          details: action === 'create' ? { created: summarize(body) }
            : action === 'update' ? { updated: summarize(req.body) }
            : action === 'delete' ? { deleted: entityId }
            : action === 'login' ? { username: req.body.username }
            : null
        });
      }

      return originalJson(body);
    };

    next();
  };
}

/**
 * Summarize an object for audit (keep it small — max 500 chars)
 */
function summarize(obj) {
  if (!obj) return null;
  try {
    const str = JSON.stringify(obj);
    return str.length > 500 ? str.slice(0, 500) + '...' : str;
  } catch (e) {
    return '[unserializable]';
  }
}

/**
 * Query audit log with filters
 * @param {Object} db - Database adapter
 * @param {Object} filters - { action, entity, userId, from, to, limit }
 * @returns {Promise<Array>}
 */
async function queryAuditLog(db, filters) {
  let logs = await db.getAll('audit_log');

  // Sort by timestamp descending (newest first)
  logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  if (filters.action) {
    logs = logs.filter(l => l.action === filters.action);
  }
  if (filters.entity) {
    logs = logs.filter(l => l.entity === filters.entity);
  }
  if (filters.userId) {
    logs = logs.filter(l => String(l.userId) === String(filters.userId));
  }
  if (filters.username) {
    logs = logs.filter(l => l.username === filters.username);
  }
  if (filters.from) {
    const fromDate = new Date(filters.from);
    logs = logs.filter(l => new Date(l.timestamp) >= fromDate);
  }
  if (filters.to) {
    const toDate = new Date(filters.to);
    logs = logs.filter(l => new Date(l.timestamp) <= toDate);
  }

  // Default limit: 100
  const limit = parseInt(filters.limit) || 100;
  return logs.slice(0, limit);
}

module.exports = { createAuditEntry, auditMiddleware, queryAuditLog };
