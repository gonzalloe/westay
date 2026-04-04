// ============ LEADS API ============
const express = require('express');
const router = express.Router();

module.exports = function(db) {

  router.get('/', async (req, res) => {
    try {
      const leads = Object.keys(req.query).length
        ? await db.query('leads', req.query)
        : await db.getAll('leads');
      res.json(leads);
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  router.get('/:name', async (req, res) => {
    try {
      const l = await db.getById('leads', decodeURIComponent(req.params.name));
      if (!l) return res.status(404).json({ error: 'Lead not found' });
      res.json(l);
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  router.post('/', async (req, res) => {
    try {
      const { n, phone, src, prop, budget } = req.body;
      if (!n) return res.status(400).json({ error: 'Name is required' });
      const lead = {
        n, phone: phone || '', src: src || 'Website', prop: prop || '',
        s: 'New', date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        budget: budget || 'N/A'
      };
      await db.create('leads', lead);
      res.status(201).json(lead);
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  router.put('/:name', async (req, res) => {
    try {
      const updated = await db.update('leads', decodeURIComponent(req.params.name), req.body);
      if (!updated) return res.status(404).json({ error: 'Lead not found' });
      res.json(updated);
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  // PATCH /api/leads/:name/status
  router.patch('/:name/status', async (req, res) => {
    try {
      const { status } = req.body;
      if (!status) return res.status(400).json({ error: 'Status required' });
      const updated = await db.update('leads', decodeURIComponent(req.params.name), { s: status });
      if (!updated) return res.status(404).json({ error: 'Lead not found' });
      res.json(updated);
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  router.delete('/:name', async (req, res) => {
    try {
      const ok = await db.delete('leads', decodeURIComponent(req.params.name));
      if (!ok) return res.status(404).json({ error: 'Lead not found' });
      res.json({ success: true });
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  return router;
};
