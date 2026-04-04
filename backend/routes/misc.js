// ============ CHECK-IN/OUT, NOTIFICATIONS, AUTOMATIONS, CONFIG APIs ============
const express = require('express');
const router = express.Router();
const { requireRole } = require('../middleware/auth');
const { validate, stripFields } = require('../middleware/validate');
const paginate = require('../middleware/paginate');

module.exports = function(db) {

  // ========== CHECK-IN/OUT RECORDS ==========
  router.get('/checkinout', async (req, res) => {
    try {
      const records = req.query.tenant
        ? await db.query('checkinout_records', { tenant: req.query.tenant })
        : await db.getAll('checkinout_records');
      res.json(paginate(records, req));
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  router.get('/checkinout/:id', async (req, res) => {
    try {
      const r = await db.getById('checkinout_records', req.params.id);
      if (!r) return res.status(404).json({ error: 'Record not found' });
      res.json(r);
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  router.post('/checkinout', validate({
    tenant: { required: true, type: 'string', maxLen: 100 },
    unit: { type: 'string', maxLen: 100 },
    type: { type: 'string', allowed: ['check-in', 'check-out'] },
    inspector: { type: 'string', maxLen: 100 },
    notes: { type: 'string', maxLen: 2000 }
  }), async (req, res) => {
    try {
      const { tenant, unit, type, inspector, notes, photos } = req.body;
      const all = await db.getAll('checkinout_records');
      const record = {
        id: 'CIO-' + String(all.length + 1).padStart(3, '0'),
        tenant, unit: unit || '', type: type || 'check-in',
        date: new Date().toISOString().slice(0, 10),
        inspector: inspector || 'Site Operator',
        status: 'In Progress', notes: notes || '', photos: photos || []
      };
      await db.create('checkinout_records', record);
      res.status(201).json(record);
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  router.put('/checkinout/:id', stripFields('id'), async (req, res) => {
    try {
      const updated = await db.update('checkinout_records', req.params.id, req.body);
      if (!updated) return res.status(404).json({ error: 'Record not found' });
      res.json(updated);
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  // PATCH /api/misc/checkinout/:id/complete
  router.patch('/checkinout/:id/complete', async (req, res) => {
    try {
      const updated = await db.update('checkinout_records', req.params.id, { status: 'Completed' });
      if (!updated) return res.status(404).json({ error: 'Record not found' });
      res.json(updated);
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  // ========== NOTIFICATIONS ==========
  router.get('/notifs', async (req, res) => {
    try { res.json(paginate(await db.getAll('notifs'), req)); }
    catch(e) { res.status(500).json({ error: e.message }); }
  });

  router.post('/notifs', validate({
    title: { type: 'string', maxLen: 200 },
    desc: { type: 'string', maxLen: 500 },
    icon: { type: 'string', maxLen: 50 },
    c: { type: 'string', maxLen: 20 }
  }), async (req, res) => {
    try {
      const { icon, c, title, desc } = req.body;
      const notif = { id: Date.now(), icon: icon || 'fa-bell', c: c || '#6C5CE7', title: title || '', desc: desc || '', time: 'Just now', read: false };
      await db.create('notifs', notif);
      res.status(201).json(notif);
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  router.patch('/notifs/:id/read', async (req, res) => {
    try {
      const updated = await db.update('notifs', parseInt(req.params.id), { read: true });
      if (!updated) return res.status(404).json({ error: 'Notification not found' });
      res.json(updated);
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  router.patch('/notifs/read-all', async (req, res) => {
    try {
      const notifs = await db.getAll('notifs');
      for (const n of notifs) {
        if (!n.read) await db.update('notifs', n.id, { read: true });
      }
      res.json({ success: true });
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  // ========== AUTOMATIONS ==========
  router.get('/automations', async (req, res) => {
    try { res.json(await db.getAllStore('automations')); }
    catch(e) { res.status(500).json({ error: e.message }); }
  });

  router.get('/automations/:key', async (req, res) => {
    try {
      const state = await db.getStore('automations', req.params.key);
      if (!state) return res.status(404).json({ error: 'Automation not found' });
      res.json(state);
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  // PATCH /api/misc/automations/:key/toggle
  router.patch('/automations/:key/toggle', async (req, res) => {
    try {
      const state = await db.getStore('automations', req.params.key);
      if (!state) return res.status(404).json({ error: 'Automation not found' });
      state.enabled = !state.enabled;
      await db.setStore('automations', req.params.key, state);
      res.json(state);
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  // ========== CONFIG / STORES ==========
  // GET /api/misc/config/:key — Get any config store entry
  router.get('/config/:key', async (req, res) => {
    try {
      const val = await db.getStore('config', req.params.key);
      if (val === null) return res.status(404).json({ error: 'Config not found' });
      res.json(val);
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  // GET /api/misc/property-expenses
  router.get('/property-expenses', async (req, res) => {
    try { res.json(await db.getAllStore('property_expenses')); }
    catch(e) { res.status(500).json({ error: e.message }); }
  });

  // GET /api/misc/property-expenses/:prop
  router.get('/property-expenses/:prop', async (req, res) => {
    try {
      const exp = await db.getStore('property_expenses', decodeURIComponent(req.params.prop));
      if (!exp) return res.status(404).json({ error: 'Not found' });
      res.json(exp);
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  // PUT /api/misc/property-expenses/:prop
  router.put('/property-expenses/:prop', async (req, res) => {
    try {
      await db.setStore('property_expenses', decodeURIComponent(req.params.prop), req.body);
      res.json(req.body);
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  // ========== DATA RESET (ADMIN ONLY — destructive) ==========
  router.post('/reset', requireRole('admin'), async (req, res) => {
    try {
      const seed = require('../db/seed');
      const seedUsers = require('../db/seed-users');
      if (db.resetDB) await db.resetDB();
      await seed(db);
      // Only re-seed users if none exist after reset
      if (db.hasUsers && !(await db.hasUsers())) {
        await seedUsers(db);
      }
      res.json({ success: true, message: 'All data reset to demo state' });
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  // ========== BULK DATA (for frontend initial load — replaces loadData()) ==========
  router.get('/all-data', async (req, res) => {
    try {
      res.json({
        PROPS: await db.getAll('props'),
        TENANTS: await db.getAll('tenants'),
        TICKETS: await db.getAll('tickets'),
        BILLS: await db.getAll('bills'),
        VENDORS: await db.getAll('vendors'),
        WORK_ORDERS: await db.getAll('work_orders'),
        LEADS: await db.getAll('leads'),
        LANDLORDS: await db.getAll('landlords'),
        CONTRACTS: await db.getAll('contracts'),
        UTILITY_BILLS: await db.getAll('utility_bills'),
        CHECKINOUT_RECORDS: await db.getAll('checkinout_records'),
        TICKET_PHOTOS: await db.getAllStore('ticket_photos'),
        SMART_LOCK_REGISTRY: await db.getAll('smart_lock_registry'),
        ELECTRIC_METERS: await db.getAll('electric_meters'),
        WATER_METERS: await db.getAll('water_meters'),
        IOT_LOCKS: await db.getAll('iot_locks'),
        NOTIFS: await db.getAll('notifs'),
        PROPERTY_EXPENSES: await db.getAllStore('property_expenses'),
        UTILITY_RATES: await db.getAllStore('utility_rates'),
        AUTOMATIONS: await db.getAllStore('automations'),
        COLORS: await db.getStore('config', 'colors'),
        AI_RESPONSES: await db.getStore('config', 'ai_responses')
      });
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  // ========== BULK SAVE (ADMIN ONLY — destructive) ==========
  router.post('/save-data', requireRole('admin'), async (req, res) => {
    try {
      const d = req.body;
      const mapping = {
        PROPS: 'props', TENANTS: 'tenants', TICKETS: 'tickets', BILLS: 'bills',
        VENDORS: 'vendors', WORK_ORDERS: 'work_orders', LEADS: 'leads',
        LANDLORDS: 'landlords', CONTRACTS: 'contracts', UTILITY_BILLS: 'utility_bills',
        CHECKINOUT_RECORDS: 'checkinout_records'
      };
      for (const [key, collection] of Object.entries(mapping)) {
        if (d[key]) await db.replaceAll(collection, d[key]);
      }
      // TICKET_PHOTOS is an object store
      if (d.TICKET_PHOTOS) {
        const current = await db.getAllStore('ticket_photos');
        // Clear and replace
        for (const k of Object.keys(current)) await db.deleteStore('ticket_photos', k);
        for (const [k, v] of Object.entries(d.TICKET_PHOTOS)) await db.setStore('ticket_photos', k, v);
      }
      res.json({ success: true });
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  return router;
};
