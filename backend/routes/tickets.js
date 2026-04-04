// ============ TICKETS API ============
const express = require('express');
const router = express.Router();
const { validate, stripFields } = require('../middleware/validate');
const paginate = require('../middleware/paginate');
const { uploadImages, setEntityType, deleteUploadedFile, handleUploadError } = require('../middleware/upload');

module.exports = function(db) {

  // GET /api/tickets — List all (optional ?pr=High&s=Open)
  router.get('/', async (req, res) => {
    try {
      let tickets;
      if (req.query.pr || req.query.s) {
        const filter = {};
        if (req.query.pr) filter.pr = req.query.pr;
        if (req.query.s) filter.s = req.query.s;
        tickets = await db.query('tickets', filter);
      } else {
        tickets = await db.getAll('tickets');
      }
      res.json(paginate(tickets, req));
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
  router.post('/', validate({
    t: { required: true, type: 'string', maxLen: 300 },
    loc: { type: 'string', maxLen: 200 },
    pr: { type: 'string', allowed: ['High', 'Medium', 'Low'] },
    by: { type: 'string', maxLen: 100 }
  }), async (req, res) => {
    try {
      const { t, loc, pr, by } = req.body;
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
  router.put('/:id', stripFields('id'), async (req, res) => {
    try {
      if (req.body.s) req.body.time = 'Just now';
      const updated = await db.update('tickets', req.params.id, req.body);
      if (!updated) return res.status(404).json({ error: 'Ticket not found' });
      res.json(updated);
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  // PATCH /api/tickets/:id/status — Status transition shortcut
  router.patch('/:id/status', validate({
    status: { required: true, type: 'string', allowed: ['Open', 'In Progress', 'Assigned', 'Completed', 'Closed'] }
  }), async (req, res) => {
    try {
      const { status } = req.body;
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

  // POST /api/tickets/:id/photos/upload — Upload actual image files
  router.post('/:id/photos/upload', setEntityType('tickets'), uploadImages.array('photos', 5), handleUploadError, async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
      }

      const existing = (await db.getStore('ticket_photos', req.params.id)) || [];
      const newPhotos = req.files.map(f => ({
        filename: f.filename,
        originalName: f.originalname,
        path: 'tickets/' + f.filename,
        size: f.size,
        mimetype: f.mimetype,
        uploadedAt: new Date().toISOString(),
        uploadedBy: req.user ? req.user.username : 'unknown'
      }));

      const updated = [...existing, ...newPhotos];
      await db.setStore('ticket_photos', req.params.id, updated);
      res.status(201).json(updated);
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  // POST /api/tickets/:id/photos — Add photos by filename (legacy/fallback)
  router.post('/:id/photos', validate({
    filenames: { required: true, isArray: true }
  }), async (req, res) => {
    try {
      const { filenames } = req.body;
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

      // Delete actual file if it's an object with path
      const photo = photos[idx];
      if (photo && photo.path) {
        deleteUploadedFile(photo.path);
      }

      photos.splice(idx, 1);
      await db.setStore('ticket_photos', req.params.id, photos);
      res.json(photos);
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  return router;
};
