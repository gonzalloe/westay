// ============ VENDORS API ============
const express = require('express');
const router = express.Router();

module.exports = function(db) {

  router.get('/', async (req, res) => {
    try {
      const vendors = req.query.type
        ? await db.query('vendors', { type: req.query.type })
        : await db.getAll('vendors');
      res.json(vendors);
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  router.get('/:name', async (req, res) => {
    try {
      const v = await db.getById('vendors', decodeURIComponent(req.params.name));
      if (!v) return res.status(404).json({ error: 'Vendor not found' });
      res.json(v);
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  router.post('/', async (req, res) => {
    try {
      const { n, type, phone } = req.body;
      if (!n) return res.status(400).json({ error: 'Name is required' });
      const colors = await db.getStore('config', 'colors');
      const all = await db.getAll('vendors');
      const vendor = { n, type: type || 'General', jobs: 0, rating: 0, s: 'active', c: colors[all.length % 8], phone: phone || '' };
      await db.create('vendors', vendor);
      res.status(201).json(vendor);
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  router.put('/:name', async (req, res) => {
    try {
      const updated = await db.update('vendors', decodeURIComponent(req.params.name), req.body);
      if (!updated) return res.status(404).json({ error: 'Vendor not found' });
      res.json(updated);
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  router.delete('/:name', async (req, res) => {
    try {
      const ok = await db.delete('vendors', decodeURIComponent(req.params.name));
      if (!ok) return res.status(404).json({ error: 'Vendor not found' });
      res.json({ success: true });
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  return router;
};
