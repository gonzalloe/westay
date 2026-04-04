// ============ IN-MEMORY DATABASE ADAPTER ============
// Implements DatabaseInterface using plain JS arrays/objects.
// Perfect for development/testing. Swap to MySQL/Mongo later.

const DatabaseInterface = require('./interface');

class MemoryAdapter extends DatabaseInterface {
  constructor() {
    super();
    // Collections (array-based entities)
    this.collections = {};
    // Stores (object/map-based entities like TICKET_PHOTOS, PROPERTY_EXPENSES)
    this.stores = {};
    // ID field mapping per collection (some use 'id', some use 'n', etc.)
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
      automations_state: 'key'
    };
  }

  _getIdField(collection) {
    return this.idFields[collection] || 'id';
  }

  _ensureCollection(collection) {
    if (!this.collections[collection]) this.collections[collection] = [];
  }

  _ensureStore(store) {
    if (!this.stores[store]) this.stores[store] = {};
  }

  // ---- Collection operations ----

  async getAll(collection) {
    this._ensureCollection(collection);
    return [...this.collections[collection]];
  }

  async getById(collection, id) {
    this._ensureCollection(collection);
    const idField = this._getIdField(collection);
    return this.collections[collection].find(r => r[idField] === id) || null;
  }

  async query(collection, filter) {
    this._ensureCollection(collection);
    return this.collections[collection].filter(record => {
      return Object.keys(filter).every(key => {
        if (filter[key] === undefined || filter[key] === null || filter[key] === '') return true;
        // Support array-contains for fields like props (landlords have props array)
        if (Array.isArray(record[key])) {
          return record[key].some(v => String(v).toLowerCase().includes(String(filter[key]).toLowerCase()));
        }
        return String(record[key]).toLowerCase().includes(String(filter[key]).toLowerCase());
      });
    });
  }

  async create(collection, data) {
    this._ensureCollection(collection);
    this.collections[collection].push(data);
    return data;
  }

  async update(collection, id, updates) {
    this._ensureCollection(collection);
    const idField = this._getIdField(collection);
    const idx = this.collections[collection].findIndex(r => r[idField] === id);
    if (idx === -1) return null;
    Object.assign(this.collections[collection][idx], updates);
    return this.collections[collection][idx];
  }

  async delete(collection, id) {
    this._ensureCollection(collection);
    const idField = this._getIdField(collection);
    const idx = this.collections[collection].findIndex(r => r[idField] === id);
    if (idx === -1) return false;
    this.collections[collection].splice(idx, 1);
    return true;
  }

  async updateWhere(collection, filter, updates) {
    this._ensureCollection(collection);
    const record = this.collections[collection].find(r =>
      Object.keys(filter).every(k => r[k] === filter[k])
    );
    if (!record) return null;
    Object.assign(record, updates);
    return record;
  }

  async deleteWhere(collection, filter) {
    this._ensureCollection(collection);
    const before = this.collections[collection].length;
    this.collections[collection] = this.collections[collection].filter(r =>
      !Object.keys(filter).every(k => r[k] === filter[k])
    );
    return before - this.collections[collection].length;
  }

  async replaceAll(collection, data) {
    this.collections[collection] = [...data];
  }

  // ---- Store (key-value) operations ----

  async getStore(store, key) {
    this._ensureStore(store);
    return this.stores[store][key] !== undefined ? this.stores[store][key] : null;
  }

  async setStore(store, key, value) {
    this._ensureStore(store);
    this.stores[store][key] = value;
  }

  async getAllStore(store) {
    this._ensureStore(store);
    return { ...this.stores[store] };
  }

  async deleteStore(store, key) {
    this._ensureStore(store);
    delete this.stores[store][key];
  }
}

module.exports = MemoryAdapter;
