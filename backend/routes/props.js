// ============ PROPERTIES API ============
const express = require('express');
const router = express.Router();

module.exports = function(db) {

  // GET /api/props — List all properties
  router.get('/', async (req, res) => {
    try {
      const props = await db.getAll('props');
      res.json(props);
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  // GET /api/props/:name — Get property by name
  router.get('/:name', async (req, res) => {
    try {
      const prop = await db.getById('props', req.params.name);
      if (!prop) return res.status(404).json({ error: 'Property not found' });
      res.json(prop);
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  // POST /api/props — Create property
  router.post('/', async (req, res) => {
    try {
      const { n, r, type, icon, addr } = req.body;
      if (!n) return res.status(400).json({ error: 'Name is required' });
      const colors = await db.getStore('config', 'colors');
      const all = await db.getAll('props');
      const prop = { n, o: 0, r: parseInt(r) || 30, c: colors[all.length % 8], icon: icon || 'fa-building', addr: addr || 'Kampar, Perak', rev: 0, type: type || 'Student' };
      await db.create('props', prop);
      res.status(201).json(prop);
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  // PUT /api/props/:name — Update property
  router.put('/:name', async (req, res) => {
    try {
      const updated = await db.update('props', req.params.name, req.body);
      if (!updated) return res.status(404).json({ error: 'Property not found' });
      res.json(updated);
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  // DELETE /api/props/:name — Delete property
  router.delete('/:name', async (req, res) => {
    try {
      const ok = await db.delete('props', req.params.name);
      if (!ok) return res.status(404).json({ error: 'Property not found' });
      res.json({ success: true });
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  return router;
};
