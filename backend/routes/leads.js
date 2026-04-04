// ============ LEADS API ============
const express = require('express');
const router = express.Router();
const { validate, stripFields } = require('../middleware/validate');
const paginate = require('../middleware/paginate');

module.exports = function(db) {

  router.get('/', async (req, res) => {
    try {
      let leads;
      if (req.query.s || req.query.src) {
        const filter = {};
        if (req.query.s) filter.s = req.query.s;
        if (req.query.src) filter.src = req.query.src;
        leads = await db.query('leads', filter);
      } else {
        leads = await db.getAll('leads');
      }
      res.json(paginate(leads, req));
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  router.get('/:name', async (req, res) => {
    try {
      const l = await db.getById('leads', decodeURIComponent(req.params.name));
      if (!l) return res.status(404).json({ error: 'Lead not found' });
      res.json(l);
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  router.post('/', validate({
    n: { required: true, type: 'string', maxLen: 100 },
    phone: { type: 'string', maxLen: 20 },
    src: { type: 'string', maxLen: 50 },
    prop: { type: 'string', maxLen: 200 },
    budget: { type: 'string', maxLen: 30 }
  }), async (req, res) => {
    try {
      const { n, phone, src, prop, budget } = req.body;
      const lead = {
        n, phone: phone || '', src: src || 'Website', prop: prop || '',
        s: 'New', date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        budget: budget || 'N/A'
      };
      await db.create('leads', lead);
      res.status(201).json(lead);
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  router.put('/:name', stripFields('n'), async (req, res) => {
    try {
      const updated = await db.update('leads', decodeURIComponent(req.params.name), req.body);
      if (!updated) return res.status(404).json({ error: 'Lead not found' });
      res.json(updated);
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  // PATCH /api/leads/:name/status
  router.patch('/:name/status', validate({
    status: { required: true, type: 'string', allowed: ['New', 'Contacted', 'Viewing Scheduled', 'Negotiating', 'Converted', 'Lost'] }
  }), async (req, res) => {
    try {
      const { status } = req.body;
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
