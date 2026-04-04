// ============ IoT API (Electric Meters, Water Meters, Smart Locks, IoT Locks) ============
const express = require('express');
const router = express.Router();

module.exports = function(db) {

  // ---- ELECTRIC METERS ----
  // GET /api/iot/electric-meters
  router.get('/electric-meters', async (req, res) => {
    try {
      let meters = req.query.unit
        ? await db.query('electric_meters', { unit: req.query.unit })
        : await db.getAll('electric_meters');
      if (req.query.status) meters = meters.filter(m => m.status === req.query.status);
      res.json(meters);
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  // GET /api/iot/electric-meters/:meterId
  router.get('/electric-meters/:meterId', async (req, res) => {
    try {
      const m = await db.getById('electric_meters', req.params.meterId);
      if (!m) return res.status(404).json({ error: 'Meter not found' });
      res.json(m);
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  // PATCH /api/iot/electric-meters/:meterId/cut — Manual cut
  router.patch('/electric-meters/:meterId/cut', async (req, res) => {
    try {
      const meter = await db.getById('electric_meters', req.params.meterId);
      if (!meter) return res.status(404).json({ error: 'Meter not found' });
      if (meter.status !== 'Connected') return res.status(400).json({ error: 'Already disconnected' });
      const reason = req.body.reason || 'Manual';
      await db.update('electric_meters', req.params.meterId, { status: 'Disconnected \u2014 ' + reason });
      // Log automation
      const autoState = await db.getStore('automations', 'latePmtElectric');
      if (autoState) {
        autoState.log.push({ date: new Date().toISOString(), tenant: meter.tenant || 'Vacant', unit: meter.unit, room: meter.room, meterId: meter.meterId, action: reason + ' cut \u2014 Room ' + meter.room });
        autoState.lastRun = new Date().toISOString();
        await db.setStore('automations', 'latePmtElectric', autoState);
      }
      res.json({ ...(await db.getById('electric_meters', req.params.meterId)) });
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  // PATCH /api/iot/electric-meters/:meterId/reconnect
  router.patch('/electric-meters/:meterId/reconnect', async (req, res) => {
    try {
      const meter = await db.getById('electric_meters', req.params.meterId);
      if (!meter) return res.status(404).json({ error: 'Meter not found' });
      if (meter.status === 'Connected') return res.status(400).json({ error: 'Already connected' });
      await db.update('electric_meters', req.params.meterId, { status: 'Connected' });
      const autoState = await db.getStore('automations', 'latePmtElectric');
      if (autoState) {
        autoState.log.push({ date: new Date().toISOString(), tenant: meter.tenant || 'Vacant', unit: meter.unit, room: meter.room, meterId: meter.meterId, action: 'Reconnected \u2014 Room ' + meter.room });
        await db.setStore('automations', 'latePmtElectric', autoState);
      }
      res.json({ ...(await db.getById('electric_meters', req.params.meterId)) });
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  // POST /api/iot/electric-meters/check-late-payment — Run auto-cut check
  router.post('/electric-meters/check-late-payment', async (req, res) => {
    try {
      const autoState = await db.getStore('automations', 'latePmtElectric');
      if (!autoState || !autoState.enabled) return res.json({ cut: 0, message: 'Automation disabled' });

      const bills = await db.getAll('bills');
      const meters = await db.getAll('electric_meters');
      let cut = 0;

      for (const b of bills) {
        if (b.s !== 'Overdue') continue;
        const meter = meters.find(m => m.tenant === b.t && m.status === 'Connected');
        if (meter) {
          await db.update('electric_meters', meter.meterId, { status: 'Disconnected \u2014 Overdue Payment' });
          autoState.log.push({ date: new Date().toISOString(), tenant: b.t, unit: meter.unit, room: meter.room, meterId: meter.meterId, bill: b.id, action: 'Auto-disconnected Room ' + meter.room });
          cut++;
        }
      }
      if (cut) {
        autoState.lastRun = new Date().toISOString();
        await db.setStore('automations', 'latePmtElectric', autoState);
      }
      res.json({ cut });
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  // PATCH /api/iot/electric-meters/cut-unit/:unitName — Cut all rooms in a unit
  router.patch('/electric-meters/cut-unit/:unitName', async (req, res) => {
    try {
      const unitName = decodeURIComponent(req.params.unitName);
      const meters = await db.query('electric_meters', { unit: unitName });
      const connected = meters.filter(m => m.status === 'Connected');
      if (!connected.length) return res.json({ cut: 0 });
      const reason = req.body.reason || 'Manual (unit-wide)';
      for (const m of connected) {
        await db.update('electric_meters', m.meterId, { status: 'Disconnected \u2014 ' + reason });
      }
      res.json({ cut: connected.length });
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  // ---- WATER METERS ----
  router.get('/water-meters', async (req, res) => {
    try {
      const meters = req.query.unit
        ? await db.query('water_meters', { unit: req.query.unit })
        : await db.getAll('water_meters');
      res.json(meters);
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  router.get('/water-meters/:meterId', async (req, res) => {
    try {
      const m = await db.getById('water_meters', req.params.meterId);
      if (!m) return res.status(404).json({ error: 'Water meter not found' });
      res.json(m);
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  // ---- SMART LOCK REGISTRY (Fingerprints) ----
  router.get('/smart-locks', async (req, res) => {
    try { res.json(await db.getAll('smart_lock_registry')); }
    catch(e) { res.status(500).json({ error: e.message }); }
  });

  // PATCH /api/iot/smart-locks/:tenant/disable
  router.patch('/smart-locks/:tenant/disable', async (req, res) => {
    try {
      const tenant = decodeURIComponent(req.params.tenant);
      const lock = await db.getById('smart_lock_registry', tenant);
      if (!lock) return res.status(404).json({ error: 'Lock not found' });
      const reason = req.body.reason || 'Manual';
      await db.updateWhere('smart_lock_registry', { tenant }, { status: 'Disabled \u2014 ' + reason, fingerprints: 0 });
      const autoState = await db.getStore('automations', 'smartLockExpiry');
      if (autoState) {
        autoState.log.push({ date: new Date().toISOString(), tenant, unit: lock.unit, action: reason + ' disable' });
        await db.setStore('automations', 'smartLockExpiry', autoState);
      }
      res.json(await db.getById('smart_lock_registry', tenant));
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  // PATCH /api/iot/smart-locks/:tenant/enable
  router.patch('/smart-locks/:tenant/enable', async (req, res) => {
    try {
      const tenant = decodeURIComponent(req.params.tenant);
      const lock = await db.getById('smart_lock_registry', tenant);
      if (!lock) return res.status(404).json({ error: 'Lock not found' });
      await db.updateWhere('smart_lock_registry', { tenant }, { status: 'Active', fingerprints: 2 });
      const autoState = await db.getStore('automations', 'smartLockExpiry');
      if (autoState) {
        autoState.log.push({ date: new Date().toISOString(), tenant, unit: lock.unit, action: 'Re-enabled' });
        await db.setStore('automations', 'smartLockExpiry', autoState);
      }
      res.json(await db.getById('smart_lock_registry', tenant));
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  // POST /api/iot/smart-locks/check-expiry — Run expiry check
  router.post('/smart-locks/check-expiry', async (req, res) => {
    try {
      const autoState = await db.getStore('automations', 'smartLockExpiry');
      if (!autoState || !autoState.enabled) return res.json({ disabled: 0, message: 'Automation disabled' });

      const locks = await db.getAll('smart_lock_registry');
      const now = new Date();
      let disabled = 0;

      for (const lock of locks) {
        if (lock.status === 'Active' && lock.leaseEnd) {
          if (now >= new Date(lock.leaseEnd)) {
            await db.updateWhere('smart_lock_registry', { tenant: lock.tenant }, { status: 'Disabled \u2014 Lease Expired', fingerprints: 0 });
            autoState.log.push({ date: now.toISOString(), tenant: lock.tenant, unit: lock.unit, action: 'Fingerprint disabled' });
            disabled++;
          }
        }
      }
      if (disabled) {
        autoState.lastRun = now.toISOString();
        await db.setStore('automations', 'smartLockExpiry', autoState);
      }
      res.json({ disabled });
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  // ---- IoT LOCKS (physical lock devices) ----
  router.get('/locks', async (req, res) => {
    try {
      let locks = req.query.prop
        ? await db.query('iot_locks', { prop: req.query.prop })
        : await db.getAll('iot_locks');
      if (req.query.filter) {
        switch(req.query.filter) {
          case 'low-battery': locks = locks.filter(l => l.battery < 20); break;
          case 'unlocked': locks = locks.filter(l => l.status === 'Unlocked'); break;
        }
      }
      res.json(locks);
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  router.get('/locks/:id', async (req, res) => {
    try {
      const lock = await db.getById('iot_locks', req.params.id);
      if (!lock) return res.status(404).json({ error: 'Lock not found' });
      res.json(lock);
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  // PATCH /api/iot/locks/:id/toggle — Lock/Unlock
  router.patch('/locks/:id/toggle', async (req, res) => {
    try {
      const lock = await db.getById('iot_locks', req.params.id);
      if (!lock) return res.status(404).json({ error: 'Lock not found' });
      const newStatus = lock.status === 'Locked' ? 'Unlocked' : 'Locked';
      await db.update('iot_locks', req.params.id, { status: newStatus, lastAccess: new Date().toISOString().replace('T', ' ').slice(0, 16) });
      res.json(await db.getById('iot_locks', req.params.id));
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  return router;
};
