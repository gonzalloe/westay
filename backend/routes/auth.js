// ============ AUTH API ============
// POST /api/auth/login — Login with username/password, returns JWT
// POST /api/auth/register — Create new account (operator only, or first user)
// GET  /api/auth/me — Get current user profile
// PATCH /api/auth/password — Change password
// GET  /api/auth/users — List all users (operator only)

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { authenticate, requireRole, signToken } = require('../middleware/auth');
const { validate, stripFields } = require('../middleware/validate');

module.exports = function(db) {

  // POST /api/auth/login
  router.post('/login', validate({
    username: { required: true, type: 'string', maxLen: 50 },
    password: { required: true, type: 'string', maxLen: 128 }
  }), async (req, res) => {
    try {
      const { username, password } = req.body;

      const user = await db.getUserByUsername(username.toLowerCase().trim());
      if (!user) return res.status(401).json({ error: 'Invalid credentials' });

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

      // Update last login
      await db.updateUser(user.id, { last_login: new Date().toISOString() });

      const token = signToken({
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name,
        linked_entity: user.linked_entity
      });

      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          name: user.name,
          email: user.email,
          phone: user.phone,
          linked_entity: user.linked_entity
        }
      });
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  // POST /api/auth/register — Operator creates new users
  router.post('/register', authenticate, requireRole('operator'), validate({
    username: { required: true, type: 'string', maxLen: 50, minLen: 3 },
    password: { required: true, type: 'string', maxLen: 128, minLen: 6 },
    name: { required: true, type: 'string', maxLen: 100 },
    role: { type: 'string', allowed: ['operator', 'tenant', 'landlord', 'vendor', 'agent'] },
    email: { type: 'string', maxLen: 200 },
    phone: { type: 'string', maxLen: 20 }
  }), async (req, res) => {
    try {
      const { username, password, role, name, email, phone, linked_entity } = req.body;

      // Check duplicate
      const existing = await db.getUserByUsername(username.toLowerCase().trim());
      if (existing) return res.status(409).json({ error: 'Username already exists' });

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await db.createUser({
        username: username.toLowerCase().trim(),
        password: hashedPassword,
        role: role || 'tenant',
        name,
        email: email || null,
        phone: phone || null,
        linked_entity: linked_entity || null
      });

      res.status(201).json({
        id: user.id, username: user.username, role: user.role,
        name: user.name, email: user.email, phone: user.phone,
        linked_entity: user.linked_entity
      });
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  // GET /api/auth/me — Current user profile
  router.get('/me', authenticate, async (req, res) => {
    try {
      const user = await db.getUserById(req.user.id);
      if (!user) return res.status(404).json({ error: 'User not found' });
      res.json({
        id: user.id, username: user.username, role: user.role,
        name: user.name, email: user.email, phone: user.phone,
        linked_entity: user.linked_entity, created_at: user.created_at, last_login: user.last_login
      });
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  // PATCH /api/auth/password — Change own password
  router.patch('/password', authenticate, validate({
    current_password: { required: true, type: 'string', maxLen: 128 },
    new_password: { required: true, type: 'string', maxLen: 128, minLen: 6 }
  }), async (req, res) => {
    try {
      const { current_password, new_password } = req.body;

      const user = await db.getUserById(req.user.id);
      const valid = await bcrypt.compare(current_password, user.password);
      if (!valid) {
        return res.status(401).json({ error: 'Current password incorrect' });
      }

      const hashedPassword = await bcrypt.hash(new_password, 10);
      await db.updateUser(req.user.id, { password: hashedPassword });
      res.json({ success: true, message: 'Password changed' });
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  // GET /api/auth/users — List all users (operator only)
  router.get('/users', authenticate, requireRole('operator'), async (req, res) => {
    try {
      const users = await db.getAllUsers();
      res.json(users);
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  // DELETE /api/auth/users/:id — Delete user (operator only)
  router.delete('/users/:id', authenticate, requireRole('operator'), async (req, res) => {
    try {
      if (parseInt(req.params.id) === req.user.id) {
        return res.status(400).json({ error: 'Cannot delete your own account' });
      }
      await db.deleteUser(parseInt(req.params.id));
      res.json({ success: true });
    } catch(e) { res.status(500).json({ error: e.message }); }
  });

  return router;
};
