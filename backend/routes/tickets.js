// ============ TICKETS API ============
const express = require('express');
const router = express.Router();

module.exports = function(db) {

  // GET /api/tickets — List all (optional ?pr=High&s=Open)
  router.get('/', async (req, res) => {
    try {
      let tickets;
      if (Object.keys(req.query).length) {
        tickets = await db.query('tickets', req.query);
      } else {
        tickets = await db.getAll('tickets');
      }
      res.json(tickets);
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  // GET /api/tickets/:id
  router.get('/:id', async (req, res) => {
    try {
      const tk = await db.getById('tickets', req.params.id);
      if (!tk) return res.status(404).json({ error: 'Ticket not found' });
      res.json(tk);
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  // POST /api/tickets
  router.post('/', async (req, res) => {
    try {
      const { t, loc, pr, by } = req.body;
      if (!t) return res.status(400).json({ error: 'Title is required' });
      const all = await db.getAll('tickets');
      const ic = { High: 'fa-fire', Medium: 'fa-exclamation-circle', Low: 'fa-info-circle' };
      const cc = { High: '#E17055', Medium: '#FDCB6E', Low: '#00B894' };
      const priority = pr || 'Medium';
      const ticket = {
        id: 'TK-' + String(all.length + 1).padStart(3, '0'),
        t, loc: loc || 'Not specified', pr: priority,
        icon: ic[priority], c: cc[priority],
        time: 'Just now', by: by || 'User', s: 'Open'
      };
      await db.create('tickets', ticket);
      res.status(201).json(ticket);
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  // PUT /api/tickets/:id — Update ticket (including status changes)
  router.put('/:id', async (req, res) => {
    try {
      if (req.body.s) req.body.time = 'Just now';
      const updated = await db.update('tickets', req.params.id, req.body);
      if (!updated) return res.status(404).json({ error: 'Ticket not found' });
      res.json(updated);
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  // PATCH /api/tickets/:id/status — Status transition shortcut
  router.patch('/:id/status', async (req, res) => {
    try {
      const { status } = req.body;
      if (!status) return res.status(400).json({ error: 'Status is required' });
      const updated = await db.update('tickets', req.params.id, { s: status, time: 'Just now' });
      if (!updated) return res.status(404).json({ error: 'Ticket not found' });
      res.json(updated);
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  // DELETE /api/tickets/:id
  router.delete('/:id', async (req, res) => {
    try {
      const ok = await db.delete('tickets', req.params.id);
      if (!ok) return res.status(404).json({ error: 'Ticket not found' });
      res.json({ success: true });
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  // --- Ticket Photos ---
  // GET /api/tickets/:id/photos
  router.get('/:id/photos', async (req, res) => {
    try {
      const photos = await db.getStore('ticket_photos', req.params.id);
      res.json(photos || []);
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  // POST /api/tickets/:id/photos — Add photos
  router.post('/:id/photos', async (req, res) => {
    try {
      const { filenames } = req.body;
      if (!filenames || !filenames.length) return res.status(400).json({ error: 'filenames required' });
      const existing = (await db.getStore('ticket_photos', req.params.id)) || [];
      const updated = [...existing, ...filenames];
      await db.setStore('ticket_photos', req.params.id, updated);
      res.json(updated);
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  // DELETE /api/tickets/:id/photos/:index
  router.delete('/:id/photos/:index', async (req, res) => {
    try {
      const photos = (await db.getStore('ticket_photos', req.params.id)) || [];
      const idx = parseInt(req.params.index);
      if (idx < 0 || idx >= photos.length) return res.status(404).json({ error: 'Photo not found' });
      photos.splice(idx, 1);
      await db.setStore('ticket_photos', req.params.id, photos);
      res.json(photos);
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  return router;
};
