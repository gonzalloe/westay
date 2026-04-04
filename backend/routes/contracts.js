// ============ CONTRACTS API ============
const express = require('express');
const router = express.Router();
const { validate, stripFields } = require('../middleware/validate');
const paginate = require('../middleware/paginate');

module.exports = function(db) {

  router.get('/', async (req, res) => {
    try {
      let contracts;
      if (req.query.s || req.query.tenant) {
        const filter = {};
        if (req.query.s) filter.s = req.query.s;
        if (req.query.tenant) filter.tenant = req.query.tenant;
        contracts = await db.query('contracts', filter);
      } else {
        contracts = await db.getAll('contracts');
      }
      res.json(paginate(contracts, req));
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  router.get('/:id', async (req, res) => {
    try {
      const c = await db.getById('contracts', req.params.id);
      if (!c) return res.status(404).json({ error: 'Contract not found' });
      res.json(c);
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  router.post('/', validate({
    tenant: { required: true, type: 'string', maxLen: 100 },
    prop: { required: true, type: 'string', maxLen: 200 },
    start: { type: 'string', maxLen: 20 },
    end: { type: 'string', maxLen: 20 },
    rent: { maxLen: 20 },
    dep: { type: 'string', maxLen: 20 }
  }), async (req, res) => {
    try {
      const { tenant, prop, start, end, rent, dep } = req.body;
      const all = await db.getAll('contracts');
      const r = parseInt(String(rent).replace(/[^\d]/g, '')) || 0;
      const contract = {
        id: 'TA-2026-' + String(all.length + 48).padStart(3, '0'),
        tenant, prop, start: start || new Date().toISOString().slice(0, 10),
        end: end || '', rent: 'RM ' + r, s: 'Pending Signature',
        dep: dep || ('RM ' + (r * 2))
      };
      await db.create('contracts', contract);
      res.status(201).json(contract);
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  router.put('/:id', stripFields('id'), async (req, res) => {
    try {
      const updated = await db.update('contracts', req.params.id, req.body);
      if (!updated) return res.status(404).json({ error: 'Contract not found' });
      res.json(updated);
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  // PATCH /api/contracts/:id/sign — E-sign contract
  router.patch('/:id/sign', async (req, res) => {
    try {
      const updated = await db.update('contracts', req.params.id, { s: 'Active' });
      if (!updated) return res.status(404).json({ error: 'Contract not found' });
      res.json(updated);
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  router.delete('/:id', async (req, res) => {
    try {
      const ok = await db.delete('contracts', req.params.id);
      if (!ok) return res.status(404).json({ error: 'Contract not found' });
      res.json({ success: true });
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  return router;
};
