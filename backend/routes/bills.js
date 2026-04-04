// ============ BILLS API ============
const express = require('express');
const router = express.Router();
const { validate, stripFields } = require('../middleware/validate');
const paginate = require('../middleware/paginate');

module.exports = function(db) {

  // GET /api/bills — List all (optional ?s=Pending&t=Sarah+Lim)
  router.get('/', async (req, res) => {
    try {
      let bills;
      if (req.query.s || req.query.t) {
        const filter = {};
        if (req.query.s) filter.s = req.query.s;
        if (req.query.t) filter.t = req.query.t;
        bills = await db.query('bills', filter);
      } else {
        bills = await db.getAll('bills');
      }
      res.json(paginate(bills, req));
    } catch(e) { res.status(500).json({ error: 'Internal server error' }); }
  });

  // GET /api/bills/:id
  router.get('/:id', async (req, res) => {
    try {
      const b = await db.getById('bills', req.params.id);
      if (!b) return res.status(404).json({ error: 'Bill not found' });
      res.json(b);
    } catch(e) { res.status(500).json({ error: 'Internal server error' }); }
  });

  // POST /api/bills — Create bill
  router.post('/', validate({
    t: { required: true, type: 'string', maxLen: 100 },
    a: { type: 'string', maxLen: 30 },
    d: { type: 'string', maxLen: 30 },
    prop: { type: 'string', maxLen: 200 }
  }), async (req, res) => {
    try {
      const { t, a, d, prop } = req.body;
      const all = await db.getAll('bills');
      const bill = {
        id: 'INV-' + (2604 + all.length),
        t, a: a || 'RM 0', s: 'Pending',
        d: d || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        prop: prop || ''
      };
      await db.create('bills', bill);
      res.status(201).json(bill);
    } catch(e) { res.status(500).json({ error: 'Internal server error' }); }
  });

  // PUT /api/bills/:id
  router.put('/:id', stripFields('id'), async (req, res) => {
    try {
      const updated = await db.update('bills', req.params.id, req.body);
      if (!updated) return res.status(404).json({ error: 'Bill not found' });
      res.json(updated);
    } catch(e) { res.status(500).json({ error: 'Internal server error' }); }
  });

  // PATCH /api/bills/:id/pay — Pay a bill (with auto-reconnect logic)
  router.patch('/:id/pay', async (req, res) => {
    try {
      const bill = await db.getById('bills', req.params.id);
      if (!bill) return res.status(404).json({ error: 'Bill not found' });
      if (bill.s === 'Paid') return res.status(400).json({ error: 'Already paid' });

      // Mark as paid
      await db.update('bills', req.params.id, { s: 'Paid' });

      const result = { bill: { ...bill, s: 'Paid' }, reconnected: null, lockReEnabled: null };

      // Auto-reconnect electric meter for this tenant's room
      const meters = await db.getAll('electric_meters');
      const meter = meters.find(m => m.tenant === bill.t && m.status !== 'Connected');
      if (meter) {
        await db.update('electric_meters', meter.meterId, { status: 'Connected' });
        result.reconnected = { meterId: meter.meterId, room: meter.room, unit: meter.unit };
        // Log automation
        const autoState = await db.getStore('automations', 'latePmtElectric');
        if (autoState) {
          autoState.log.push({ date: new Date().toISOString(), tenant: bill.t, unit: meter.unit, room: meter.room, meterId: meter.meterId, action: 'Auto-reconnected after payment' });
          await db.setStore('automations', 'latePmtElectric', autoState);
        }
      }

      // Auto re-enable smart lock fingerprint
      const locks = await db.getAll('smart_lock_registry');
      const lock = locks.find(l => l.tenant === bill.t && l.status.includes('Disabled') && !l.status.includes('Lease Expired'));
      if (lock) {
        await db.updateWhere('smart_lock_registry', { tenant: bill.t }, { status: 'Active', fingerprints: 2 });
        result.lockReEnabled = { tenant: bill.t, unit: lock.unit };
      }

      res.json(result);
    } catch(e) { res.status(500).json({ error: 'Internal server error' }); }
  });

  // POST /api/bills/generate — Generate invoices for all active tenants
  router.post('/generate', async (req, res) => {
    try {
      const tenants = await db.getAll('tenants');
      const bills = await db.getAll('bills');
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const m = months[new Date().getMonth()];
      let count = 0;

      for (const t of tenants) {
        if (t.s === 'active' && !bills.find(b => b.t === t.n && b.s === 'Pending')) {
          await db.create('bills', {
            id: 'INV-' + (2604 + bills.length + count),
            t: t.n, a: t.r, s: 'Pending',
            d: '05 ' + m + ' 2026',
            prop: t.p.split(' ')[0]
          });
          count++;
        }
      }
      res.json({ generated: count });
    } catch(e) { res.status(500).json({ error: 'Internal server error' }); }
  });

  // DELETE /api/bills/:id
  router.delete('/:id', async (req, res) => {
    try {
      const ok = await db.delete('bills', req.params.id);
      if (!ok) return res.status(404).json({ error: 'Bill not found' });
      res.json({ success: true });
    } catch(e) { res.status(500).json({ error: 'Internal server error' }); }
  });

  return router;
};
