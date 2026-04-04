// ============ SQLITE DATABASE ADAPTER ============
// Implements DatabaseInterface using sql.js (pure JS SQLite).
// Data persists to backend/data/westay.db — survives server restarts.
// Drop-in replacement for memory-adapter.js

const DatabaseInterface = require('./interface');
const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DB_DIR, 'westay.db');

class SqliteAdapter extends DatabaseInterface {
  constructor() {
    super();
    this.db = null;
    this.SQL = null;
    // ID field mapping per collection (same as memory-adapter)
    this.idFields = {
      props: 'n',
      tenants: 'n',
      tickets: 'id',
      bills: 'id',
      vendors: 'n',
      work_orders: 'id',
      leads: 'n',
      landlords: 'n',
      contracts: 'id',
      utility_bills: 'id',
      checkinout_records: 'id',
      smart_lock_registry: 'tenant',
      electric_meters: 'meterId',
      water_meters: 'meterId',
      iot_locks: 'id',
      notifs: 'id',
      audit_log: 'id',
      users: 'id'
    };
  }

  async init() {
    if (this.db) return;
    this.SQL = await initSqlJs();

    // Ensure data directory exists
    if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

    // Load existing DB or create new
    if (fs.existsSync(DB_PATH)) {
      const buffer = fs.readFileSync(DB_PATH);
      this.db = new this.SQL.Database(buffer);
    } else {
      this.db = new this.SQL.Database();
    }

    // Create core tables
    this.db.run(`CREATE TABLE IF NOT EXISTS collections (
      name TEXT NOT NULL,
      id_value TEXT NOT NULL,
      data TEXT NOT NULL,
      PRIMARY KEY (name, id_value)
    )`);

    this.db.run(`CREATE TABLE IF NOT EXISTS stores (
      store TEXT NOT NULL,
      key TEXT NOT NULL,
      value TEXT NOT NULL,
      PRIMARY KEY (store, key)
    )`);

    // Users table for auth
    this.db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'tenant',
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      linked_entity TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      last_login TEXT
    )`);

    this._save();
  }

  _save() {
    const data = this.db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }

  _getIdField(collection) {
    return this.idFields[collection] || 'id';
  }

  // ---- Collection operations ----

  async getAll(collection) {
    const stmt = this.db.prepare('SELECT data FROM collections WHERE name = ?');
    stmt.bind([collection]);
    const results = [];
    while (stmt.step()) {
      results.push(JSON.parse(stmt.getAsObject().data));
    }
    stmt.free();
    return results;
  }

  async getById(collection, id) {
    const stmt = this.db.prepare('SELECT data FROM collections WHERE name = ? AND id_value = ?');
    stmt.bind([collection, String(id)]);
    let result = null;
    if (stmt.step()) {
      result = JSON.parse(stmt.getAsObject().data);
    }
    stmt.free();
    return result;
  }

  async query(collection, filter) {
    const all = await this.getAll(collection);
    return all.filter(record => {
      return Object.keys(filter).every(key => {
        if (filter[key] === undefined || filter[key] === null || filter[key] === '') return true;
        if (Array.isArray(record[key])) {
          return record[key].some(v => String(v).toLowerCase().includes(String(filter[key]).toLowerCase()));
        }
        return String(record[key]).toLowerCase().includes(String(filter[key]).toLowerCase());
      });
    });
  }

  async create(collection, data) {
    const idField = this._getIdField(collection);
    const idValue = String(data[idField] || Date.now());
    this.db.run(
      'INSERT OR REPLACE INTO collections (name, id_value, data) VALUES (?, ?, ?)',
      [collection, idValue, JSON.stringify(data)]
    );
    this._save();
    return data;
  }

  async update(collection, id, updates) {
    const existing = await this.getById(collection, id);
    if (!existing) return null;
    const updated = Object.assign(existing, updates);
    const idField = this._getIdField(collection);
    const idValue = String(updated[idField]);
    this.db.run(
      'UPDATE collections SET data = ? WHERE name = ? AND id_value = ?',
      [JSON.stringify(updated), collection, String(id)]
    );
    // If the ID field changed, update the id_value too
    if (String(id) !== idValue) {
      this.db.run(
        'UPDATE collections SET id_value = ? WHERE name = ? AND id_value = ?',
        [idValue, collection, String(id)]
      );
    }
    this._save();
    return updated;
  }

  async delete(collection, id) {
    const result = this.db.run(
      'DELETE FROM collections WHERE name = ? AND id_value = ?',
      [collection, String(id)]
    );
    this._save();
    return this.db.getRowsModified() > 0;
  }

  async updateWhere(collection, filter, updates) {
    const all = await this.getAll(collection);
    const record = all.find(r =>
      Object.keys(filter).every(k => r[k] === filter[k])
    );
    if (!record) return null;
    const idField = this._getIdField(collection);
    return this.update(collection, record[idField], updates);
  }

  async deleteWhere(collection, filter) {
    const all = await this.getAll(collection);
    const toDelete = all.filter(r =>
      Object.keys(filter).every(k => r[k] === filter[k])
    );
    for (const r of toDelete) {
      const idField = this._getIdField(collection);
      await this.delete(collection, r[idField]);
    }
    return toDelete.length;
  }

  async replaceAll(collection, data) {
    this.db.run('DELETE FROM collections WHERE name = ?', [collection]);
    const idField = this._getIdField(collection);
    const stmt = this.db.prepare(
      'INSERT INTO collections (name, id_value, data) VALUES (?, ?, ?)'
    );
    for (const item of data) {
      const idValue = String(item[idField] || Date.now() + Math.random());
      stmt.run([collection, idValue, JSON.stringify(item)]);
    }
    stmt.free();
    this._save();
  }

  // ---- Store (key-value) operations ----

  async getStore(store, key) {
    const stmt = this.db.prepare('SELECT value FROM stores WHERE store = ? AND key = ?');
    stmt.bind([store, key]);
    let result = null;
    if (stmt.step()) {
      result = JSON.parse(stmt.getAsObject().value);
    }
    stmt.free();
    return result;
  }

  async setStore(store, key, value) {
    this.db.run(
      'INSERT OR REPLACE INTO stores (store, key, value) VALUES (?, ?, ?)',
      [store, key, JSON.stringify(value)]
    );
    this._save();
  }

  async getAllStore(store) {
    const stmt = this.db.prepare('SELECT key, value FROM stores WHERE store = ?');
    stmt.bind([store]);
    const result = {};
    while (stmt.step()) {
      const row = stmt.getAsObject();
      result[row.key] = JSON.parse(row.value);
    }
    stmt.free();
    return result;
  }

  async deleteStore(store, key) {
    this.db.run('DELETE FROM stores WHERE store = ? AND key = ?', [store, key]);
    this._save();
  }

  // ---- User operations (auth-specific) ----

  async createUser(user) {
    this.db.run(
      `INSERT INTO users (username, password, role, name, email, phone, linked_entity)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [user.username, user.password, user.role || 'tenant', user.name,
       user.email || null, user.phone || null, user.linked_entity || null]
    );
    this._save();
    return this.getUserByUsername(user.username);
  }

  async getUserByUsername(username) {
    const stmt = this.db.prepare('SELECT * FROM users WHERE username = ?');
    stmt.bind([username]);
    let user = null;
    if (stmt.step()) {
      user = stmt.getAsObject();
    }
    stmt.free();
    return user;
  }

  async getUserById(id) {
    const stmt = this.db.prepare('SELECT * FROM users WHERE id = ?');
    stmt.bind([id]);
    let user = null;
    if (stmt.step()) {
      user = stmt.getAsObject();
    }
    stmt.free();
    return user;
  }

  async updateUser(id, updates) {
    // Whitelist: only allow known user table columns to prevent SQL injection
    const ALLOWED_COLUMNS = ['username', 'password', 'role', 'name', 'email', 'phone', 'linked_entity', 'last_login'];
    const sets = [];
    const vals = [];
    for (const [k, v] of Object.entries(updates)) {
      if (!ALLOWED_COLUMNS.includes(k)) continue; // silently skip unknown columns
      sets.push(k + ' = ?');
      vals.push(v);
    }
    if (sets.length === 0) return this.getUserById(id);
    vals.push(id);
    this.db.run(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, vals);
    this._save();
    return this.getUserById(id);
  }

  async getAllUsers() {
    const stmt = this.db.prepare('SELECT id, username, role, name, email, phone, linked_entity, created_at, last_login FROM users');
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  }

  async deleteUser(id) {
    this.db.run('DELETE FROM users WHERE id = ?', [id]);
    this._save();
    return true;
  }

  // ---- DB Management ----

  async isSeeded() {
    const stmt = this.db.prepare('SELECT COUNT(*) as cnt FROM collections WHERE name = ?');
    stmt.bind(['props']);
    let count = 0;
    if (stmt.step()) count = stmt.getAsObject().cnt;
    stmt.free();
    return count > 0;
  }

  async hasUsers() {
    const stmt = this.db.prepare('SELECT COUNT(*) as cnt FROM users');
    let count = 0;
    if (stmt.step()) count = stmt.getAsObject().cnt;
    stmt.free();
    return count > 0;
  }

  async resetDB() {
    this.db.run('DELETE FROM collections');
    this.db.run('DELETE FROM stores');
    this._save();
  }
}

module.exports = SqliteAdapter;
