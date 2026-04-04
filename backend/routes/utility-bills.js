// ============ UTILITY BILLS API ============
const express = require('express');
const router = express.Router();
const { validate, stripFields } = require('../middleware/validate');
const paginate = require('../middleware/paginate');

module.exports = function(db) {

  // GET /api/utility-bills — All (optional ?tenant=Sarah+Lim&status=Pending)
  router.get('/', async (req, res) => {
    try {
      let bills;
      if (req.query.tenant || req.query.status) {
        const filter = {};
        if (req.query.tenant) filter.tenant = req.query.tenant;
        if (req.query.status) filter.status = req.query.status;
        bills = await db.query('utility_bills', filter);
      } else {
        bills = await db.getAll('utility_bills');
      }
      res.json(paginate(bills, req));
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  // GET /api/utility-bills/:id
  router.get('/:id', async (req, res) => {
    try {
      const b = await db.getById('utility_bills', req.params.id);
      if (!b) return res.status(404).json({ error: 'Utility bill not found' });
      res.json(b);
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  // POST /api/utility-bills/generate — Auto-generate from meter readings
  router.post('/generate', async (req, res) => {
    try {
      const eMeters = await db.getAll('electric_meters');
      const wMeters = await db.getAll('water_meters');
      const rates = await db.getAllStore('utility_rates');
      const existing = await db.getAll('utility_bills');
      const now = new Date();
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const period = months[now.getMonth()] + ' ' + now.getFullYear();
      let count = 0;

      // Group by tenant (only occupied rooms)
      const tenantMeters = {};
      eMeters.filter(m => m.tenant).forEach(m => {
        if (!tenantMeters[m.tenant]) tenantMeters[m.tenant] = { electric: [], water: [], unit: m.unit, room: m.room };
        tenantMeters[m.tenant].electric.push(m);
      });
      wMeters.filter(m => m.tenant).forEach(m => {
        if (!tenantMeters[m.tenant]) tenantMeters[m.tenant] = { electric: [], water: [], unit: m.unit, room: m.room };
        tenantMeters[m.tenant].water.push(m);
      });

      for (const [tenant, data] of Object.entries(tenantMeters)) {
        // Check if already generated for this period
        if (existing.find(b => b.tenant === tenant && b.period === period)) continue;

        const eKwh = data.electric.reduce((s, m) => s + m.kwh, 0);
        const wM3 = data.water.reduce((s, m) => s + m.m3, 0);
        const eRate = rates.electric ? rates.electric.rate : 0.218;
        const wRate = rates.water ? rates.water.rate : 0.57;
        const iRate = rates.internet ? rates.internet.rate : 30;
        const sRate = rates.sewerage ? rates.sewerage.rate : 8;

        const eAmt = +(eKwh * eRate).toFixed(2);
        const wAmt = +(wM3 * wRate).toFixed(2);
        const total = +(eAmt + wAmt + iRate + sRate).toFixed(2);

        const bill = {
          id: 'UTL-' + String(now.getFullYear()).slice(2) + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(existing.length + count + 1).padStart(2, '0'),
          tenant, unit: data.unit, room: data.room, period,
          electric: { kwh: eKwh, amount: eAmt },
          water: { m3: wM3, amount: wAmt },
          internet: iRate, sewerage: sRate,
          total, status: 'Pending',
          generated: now.toISOString().slice(0, 10),
          due: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
        };
        await db.create('utility_bills', bill);
        count++;
      }
      res.json({ generated: count });
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  // PATCH /api/utility-bills/:id/pay
  router.patch('/:id/pay', async (req, res) => {
    try {
      const bill = await db.getById('utility_bills', req.params.id);
      if (!bill) return res.status(404).json({ error: 'Utility bill not found' });
      if (bill.status === 'Paid') return res.status(400).json({ error: 'Already paid' });
      await db.update('utility_bills', req.params.id, { status: 'Paid' });
      res.json({ ...bill, status: 'Paid' });
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  router.put('/:id', stripFields('id'), async (req, res) => {
    try {
      const updated = await db.update('utility_bills', req.params.id, req.body);
      if (!updated) return res.status(404).json({ error: 'Utility bill not found' });
      res.json(updated);
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  router.delete('/:id', async (req, res) => {
    try {
      const ok = await db.delete('utility_bills', req.params.id);
      if (!ok) return res.status(404).json({ error: 'Utility bill not found' });
      res.json({ success: true });
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  // GET /api/utility-bills/rates — Get utility rates
  router.get('/config/rates', async (req, res) => {
    try {
      const rates = await db.getAllStore('utility_rates');
      res.json(rates);
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  return router;
};
