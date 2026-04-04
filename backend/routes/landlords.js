// ============ LANDLORDS API ============
const express = require('express');
const router = express.Router();

module.exports = function(db) {

  router.get('/', async (req, res) => {
    try { res.json(await db.getAll('landlords')); }
    catch(e) { res.status(500).json({ error: e.message }); }
  });

  router.get('/:name', async (req, res) => {
    try {
      const ll = await db.getById('landlords', decodeURIComponent(req.params.name));
      if (!ll) return res.status(404).json({ error: 'Landlord not found' });
      res.json(ll);
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  // GET /api/landlords/:name/report — Owner report data
  router.get('/:name/report', async (req, res) => {
    try {
      const name = decodeURIComponent(req.params.name);
      const ll = await db.getById('landlords', name);
      if (!ll) return res.status(404).json({ error: 'Landlord not found' });

      const props = await db.getAll('props');
      const bills = await db.getAll('bills');
      const meters = await db.getAll('electric_meters');
      const waterMeters = await db.getAll('water_meters');
      const expenses = await db.getAllStore('property_expenses');
      const rates = await db.getAllStore('utility_rates');

      // Filter to landlord's properties
      const llProps = props.filter(p => ll.props.some(lp => p.n.includes(lp)));

      const report = {
        landlord: ll,
        properties: llProps.map(p => {
          const propBills = bills.filter(b => b.prop === p.n);
          const propMeters = meters.filter(m => m.unit === p.n);
          const propWater = waterMeters.filter(m => m.unit === p.n);
          const propExpenses = expenses[p.n] || {};

          const totalElectricKwh = propMeters.reduce((s, m) => s + m.kwh, 0);
          const totalWaterM3 = propWater.reduce((s, m) => s + m.m3, 0);

          return {
            name: p.n,
            revenue: p.rev,
            occupancy: p.o,
            rooms: p.r,
            bills: propBills,
            electricUsage: totalElectricKwh,
            waterUsage: totalWaterM3,
            expenses: propExpenses
          };
        }),
        rates
      };
      res.json(report);
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  router.post('/', async (req, res) => {
    try {
      const { n, props, units } = req.body;
      if (!n) return res.status(400).json({ error: 'Name is required' });
      const ll = { n, props: props || [], units: units || 0, occ: 0, rev: 'RM 0', payout: 'RM 0' };
      await db.create('landlords', ll);
      res.status(201).json(ll);
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  router.put('/:name', async (req, res) => {
    try {
      const updated = await db.update('landlords', decodeURIComponent(req.params.name), req.body);
      if (!updated) return res.status(404).json({ error: 'Landlord not found' });
      res.json(updated);
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  router.delete('/:name', async (req, res) => {
    try {
      const ok = await db.delete('landlords', decodeURIComponent(req.params.name));
      if (!ok) return res.status(404).json({ error: 'Landlord not found' });
      res.json({ success: true });
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  return router;
};
