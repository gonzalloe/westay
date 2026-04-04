// ============ TENANTS API ============
const express = require('express');
const router = express.Router();

module.exports = function(db) {

  // GET /api/tenants — List all (optional ?status=active&prop=Cambridge)
  router.get('/', async (req, res) => {
    try {
      let tenants;
      if (Object.keys(req.query).length) {
        const filter = {};
        if (req.query.status) filter.s = req.query.status;
        if (req.query.prop) filter.p = req.query.prop;
        tenants = await db.query('tenants', filter);
      } else {
        tenants = await db.getAll('tenants');
      }
      res.json(tenants);
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  // GET /api/tenants/:name
  router.get('/:name', async (req, res) => {
    try {
      const t = await db.getById('tenants', decodeURIComponent(req.params.name));
      if (!t) return res.status(404).json({ error: 'Tenant not found' });
      res.json(t);
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  // POST /api/tenants
  router.post('/', async (req, res) => {
    try {
      const { n, p, r, phone, e: leaseEnd } = req.body;
      if (!n) return res.status(400).json({ error: 'Name is required' });
      const rent = parseInt(String(r).replace(/[^\d]/g, '')) || 0;
      const tenant = {
        n, p: p || '', r: 'RM ' + rent, s: 'pending',
        e: leaseEnd || '\u2014', phone: phone || '', dep: 'RM ' + (rent * 2)
      };
      await db.create('tenants', tenant);
      res.status(201).json(tenant);
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  // PUT /api/tenants/:name
  router.put('/:name', async (req, res) => {
    try {
      const updated = await db.update('tenants', decodeURIComponent(req.params.name), req.body);
      if (!updated) return res.status(404).json({ error: 'Tenant not found' });
      res.json(updated);
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  // DELETE /api/tenants/:name
  router.delete('/:name', async (req, res) => {
    try {
      const ok = await db.delete('tenants', decodeURIComponent(req.params.name));
      if (!ok) return res.status(404).json({ error: 'Tenant not found' });
      res.json({ success: true });
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  return router;
};
