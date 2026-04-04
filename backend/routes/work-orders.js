// ============ WORK ORDERS API ============
const express = require('express');
const router = express.Router();
const { validate, stripFields } = require('../middleware/validate');
const paginate = require('../middleware/paginate');

module.exports = function(db) {

  router.get('/', async (req, res) => {
    try {
      let orders;
      if (req.query.s || req.query.vendor) {
        const filter = {};
        if (req.query.s) filter.s = req.query.s;
        if (req.query.vendor) filter.vendor = req.query.vendor;
        orders = await db.query('work_orders', filter);
      } else {
        orders = await db.getAll('work_orders');
      }
      res.json(paginate(orders, req));
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  router.get('/:id', async (req, res) => {
    try {
      const wo = await db.getById('work_orders', req.params.id);
      if (!wo) return res.status(404).json({ error: 'Work order not found' });
      res.json(wo);
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  router.post('/', validate({
    desc: { required: true, type: 'string', maxLen: 500 },
    loc: { type: 'string', maxLen: 200 },
    vendor: { type: 'string', maxLen: 200 },
    pr: { type: 'string', allowed: ['High', 'Medium', 'Low'] },
    amt: { type: 'string', maxLen: 30 }
  }), async (req, res) => {
    try {
      const { desc, loc, vendor, pr, amt } = req.body;
      const all = await db.getAll('work_orders');
      const wo = {
        id: 'WO-' + (101 + all.length),
        desc, loc: loc || '', vendor: vendor || '',
        s: 'Pending', pr: pr || 'Medium', amt: amt || 'RM 0',
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      };
      await db.create('work_orders', wo);
      res.status(201).json(wo);
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  router.put('/:id', stripFields('id'), async (req, res) => {
    try {
      const updated = await db.update('work_orders', req.params.id, req.body);
      if (!updated) return res.status(404).json({ error: 'Work order not found' });
      res.json(updated);
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  // PATCH /api/work-orders/:id/status — Status transition
  router.patch('/:id/status', validate({
    status: { required: true, type: 'string', allowed: ['Pending', 'In Progress', 'Completed', 'Cancelled'] }
  }), async (req, res) => {
    try {
      const { status } = req.body;
      const wo = await db.getById('work_orders', req.params.id);
      if (!wo) return res.status(404).json({ error: 'Work order not found' });

      await db.update('work_orders', req.params.id, { s: status });

      // If completed, increment vendor job count
      if (status === 'Completed' && wo.vendor) {
        const vendor = await db.getById('vendors', wo.vendor);
        if (vendor) {
          await db.update('vendors', wo.vendor, { jobs: vendor.jobs + 1 });
        }
      }
      res.json({ ...(await db.getById('work_orders', req.params.id)) });
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  router.delete('/:id', async (req, res) => {
    try {
      const ok = await db.delete('work_orders', req.params.id);
      if (!ok) return res.status(404).json({ error: 'Work order not found' });
      res.json({ success: true });
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  return router;
};
