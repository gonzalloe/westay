// ============ VENDORS API ============
const express = require('express');
const router = express.Router();
const { validate, stripFields } = require('../middleware/validate');
const paginate = require('../middleware/paginate');

module.exports = function(db) {

  router.get('/', async (req, res) => {
    try {
      const vendors = req.query.type
        ? await db.query('vendors', { type: req.query.type })
        : await db.getAll('vendors');
      res.json(paginate(vendors, req));
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  router.get('/:name', async (req, res) => {
    try {
      const v = await db.getById('vendors', decodeURIComponent(req.params.name));
      if (!v) return res.status(404).json({ error: 'Vendor not found' });
      res.json(v);
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  router.post('/', validate({
    n: { required: true, type: 'string', maxLen: 200 },
    type: { type: 'string', maxLen: 50 },
    phone: { type: 'string', maxLen: 20 }
  }), async (req, res) => {
    try {
      const { n, type, phone } = req.body;
      const colors = await db.getStore('config', 'colors');
      const all = await db.getAll('vendors');
      const vendor = { n, type: type || 'General', jobs: 0, rating: 0, s: 'active', c: colors[all.length % 8], phone: phone || '' };
      await db.create('vendors', vendor);
      res.status(201).json(vendor);
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  router.put('/:name', stripFields('n'), async (req, res) => {
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
