// ============ DATABASE INTERFACE ============
// Abstract interface that any database adapter must implement.
// Swap adapters by changing the require() in db/index.js
// Future: MySQLAdapter, MongoAdapter, PostgresAdapter etc.

class DatabaseInterface {
  /**
   * Get all records from a collection
   * @param {string} collection - Collection/table name
   * @returns {Promise<Array>} All records
   */
  async getAll(collection) { throw new Error('Not implemented'); }

  /**
   * Get a single record by ID
   * @param {string} collection
   * @param {string} id - Record ID
   * @returns {Promise<Object|null>}
   */
  async getById(collection, id) { throw new Error('Not implemented'); }

  /**
   * Query records with filter criteria
   * @param {string} collection
   * @param {Object} filter - Key-value pairs to match
   * @returns {Promise<Array>}
   */
  async query(collection, filter) { throw new Error('Not implemented'); }

  /**
   * Create a new record
   * @param {string} collection
   * @param {Object} data
   * @returns {Promise<Object>} Created record
   */
  async create(collection, data) { throw new Error('Not implemented'); }

  /**
   * Update an existing record by ID
   * @param {string} collection
   * @param {string} id
   * @param {Object} updates - Partial update object
   * @returns {Promise<Object|null>} Updated record or null
   */
  async update(collection, id, updates) { throw new Error('Not implemented'); }

  /**
   * Delete a record by ID
   * @param {string} collection
   * @param {string} id
   * @returns {Promise<boolean>} Success
   */
  async delete(collection, id) { throw new Error('Not implemented'); }

  /**
   * Update first record matching a filter (for non-ID-based lookups)
   * @param {string} collection
   * @param {Object} filter
   * @param {Object} updates
   * @returns {Promise<Object|null>}
   */
  async updateWhere(collection, filter, updates) { throw new Error('Not implemented'); }

  /**
   * Delete all records matching a filter
   * @param {string} collection
   * @param {Object} filter
   * @returns {Promise<number>} Count of deleted records
   */
  async deleteWhere(collection, filter) { throw new Error('Not implemented'); }

  /**
   * Replace entire collection data (for reset)
   * @param {string} collection
   * @param {Array} data
   */
  async replaceAll(collection, data) { throw new Error('Not implemented'); }

  /**
   * Get a key-value store entry (for objects like TICKET_PHOTOS, PROPERTY_EXPENSES)
   * @param {string} store
   * @param {string} key
   * @returns {Promise<*>}
   */
  async getStore(store, key) { throw new Error('Not implemented'); }

  /**
   * Set a key-value store entry
   * @param {string} store
   * @param {string} key
   * @param {*} value
   */
  async setStore(store, key, value) { throw new Error('Not implemented'); }

  /**
   * Get entire key-value store
   * @param {string} store
   * @returns {Promise<Object>}
   */
  async getAllStore(store) { throw new Error('Not implemented'); }

  /**
   * Delete a key from store
   * @param {string} store
   * @param {string} key
   */
  async deleteStore(store, key) { throw new Error('Not implemented'); }
}

module.exports = DatabaseInterface;
