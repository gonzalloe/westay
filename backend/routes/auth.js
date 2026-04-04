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

module.exports = function(db) {

  // POST /api/auth/login
  router.post('/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
      }

      const user = await db.getUserByUsername(username.toLowerCase().trim());
      if (!user) return res.status(401).json({ error: 'Invalid credentials' });

      const valid = bcrypt.compareSync(password, user.password);
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
  router.post('/register', authenticate, requireRole('operator'), async (req, res) => {
    try {
      const { username, password, role, name, email, phone, linked_entity } = req.body;
      if (!username || !password || !name) {
        return res.status(400).json({ error: 'username, password, and name required' });
      }
      const validRoles = ['operator', 'tenant', 'landlord', 'vendor', 'agent'];
      if (role && !validRoles.includes(role)) {
        return res.status(400).json({ error: 'Invalid role. Must be: ' + validRoles.join(', ') });
      }

      // Check duplicate
      const existing = await db.getUserByUsername(username.toLowerCase().trim());
      if (existing) return res.status(409).json({ error: 'Username already exists' });

      const user = await db.createUser({
        username: username.toLowerCase().trim(),
        password: bcrypt.hashSync(password, 10),
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
  router.patch('/password', authenticate, async (req, res) => {
    try {
      const { current_password, new_password } = req.body;
      if (!current_password || !new_password) {
        return res.status(400).json({ error: 'current_password and new_password required' });
      }
      if (new_password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
      }

      const user = await db.getUserById(req.user.id);
      if (!bcrypt.compareSync(current_password, user.password)) {
        return res.status(401).json({ error: 'Current password incorrect' });
      }

      await db.updateUser(req.user.id, { password: bcrypt.hashSync(new_password, 10) });
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
