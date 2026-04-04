// ============ AUDIT LOG API ROUTES ============
// GET  /api/audit          — Query audit logs (operator only)
// GET  /api/audit/stats    — Audit log statistics (operator only)
// GET  /api/audit/export   — Export audit logs as CSV (operator only)

const express = require('express');
const router = express.Router();
const { queryAuditLog } = require('../middleware/audit');
const paginate = require('../middleware/paginate');

module.exports = function (db) {

  // GET /api/audit — Query audit logs with filters
  // Query params: ?action=create&entity=props&userId=1&from=2026-04-01&to=2026-04-30&limit=100
  router.get('/', async (req, res) => {
    try {
      const logs = await queryAuditLog(db, {
        action: req.query.action,
        entity: req.query.entity,
        userId: req.query.userId,
        username: req.query.username,
        from: req.query.from,
        to: req.query.to,
        limit: req.query.limit
      });
      res.json(paginate(logs, req));
    } catch (e) { res.status(500).json({ error: 'Internal server error' }); }
  });

  // GET /api/audit/stats — Aggregated audit statistics
  router.get('/stats', async (req, res) => {
    try {
      const logs = await db.getAll('audit_log');
      const stats = {
        total: logs.length,
        byAction: {},
        byEntity: {},
        byUser: {},
        last24h: 0,
        last7d: 0
      };

      const now = Date.now();
      const day = 24 * 60 * 60 * 1000;

      for (const log of logs) {
        // By action
        stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1;
        // By entity
        if (log.entity) {
          stats.byEntity[log.entity] = (stats.byEntity[log.entity] || 0) + 1;
        }
        // By user
        if (log.username) {
          stats.byUser[log.username] = (stats.byUser[log.username] || 0) + 1;
        }
        // Time-based
        const age = now - new Date(log.timestamp).getTime();
        if (age < day) stats.last24h++;
        if (age < 7 * day) stats.last7d++;
      }

      res.json(stats);
    } catch (e) { res.status(500).json({ error: 'Internal server error' }); }
  });

  // GET /api/audit/export — Export as CSV
  router.get('/export', async (req, res) => {
    try {
      const logs = await queryAuditLog(db, {
        action: req.query.action,
        entity: req.query.entity,
        userId: req.query.userId,
        from: req.query.from,
        to: req.query.to,
        limit: req.query.limit || 10000
      });

      const headers = ['Timestamp', 'Action', 'Entity', 'Entity ID', 'User', 'Role', 'IP', 'Details'];
      let csv = '\uFEFF' + headers.join(',') + '\n'; // BOM for Excel UTF-8

      for (const log of logs) {
        csv += [
          log.timestamp,
          log.action,
          log.entity || '',
          log.entityId || '',
          log.username || '',
          log.role || '',
          log.ip || '',
          '"' + (log.details ? JSON.stringify(log.details).replace(/"/g, '""') : '') + '"'
        ].join(',') + '\n';
      }

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename=westay-audit-' + new Date().toISOString().slice(0, 10) + '.csv');
      res.send(csv);
    } catch (e) { res.status(500).json({ error: 'Internal server error' }); }
  });

  return router;
};
