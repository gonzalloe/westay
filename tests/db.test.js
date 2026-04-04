// ============ DATABASE ADAPTER TESTS ============
// Tests the abstract database interface contract

const { createTestDB, seedTestDB } = require('./setup');

describe('Database Adapter', () => {
  let db;

  beforeEach(async () => {
    db = await createTestDB();
    await seedTestDB(db);
  });

  // ---- Collection CRUD ----

  describe('getAll', () => {
    test('returns all records from a collection', async () => {
      const props = await db.getAll('props');
      expect(Array.isArray(props)).toBe(true);
      expect(props.length).toBe(2);
    });

    test('returns empty array for empty collection', async () => {
      const result = await db.getAll('work_orders');
      expect(result).toEqual([]);
    });
  });

  describe('getById', () => {
    test('returns record by name-based ID', async () => {
      const prop = await db.getById('props', 'Cambridge House - Room 101');
      expect(prop).toBeTruthy();
      expect(prop.n).toBe('Cambridge House - Room 101');
    });

    test('returns record by auto-generated ID', async () => {
      const bill = await db.getById('bills', 'INV-2604');
      expect(bill).toBeTruthy();
      expect(bill.t).toBe('Sarah Lim');
    });

    test('returns null for non-existent ID', async () => {
      const result = await db.getById('props', 'nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('query', () => {
    test('filters records by key-value pair', async () => {
      const active = await db.query('tenants', { s: 'active' });
      expect(active.length).toBe(2);
    });

    test('filters by multiple conditions', async () => {
      const pending = await db.query('bills', { s: 'Pending', t: 'Sarah Lim' });
      expect(pending.length).toBe(1);
      expect(pending[0].id).toBe('INV-2604');
    });

    test('returns empty for no matches', async () => {
      const result = await db.query('tenants', { s: 'evicted' });
      expect(result).toEqual([]);
    });
  });

  describe('create', () => {
    test('creates a new record', async () => {
      const ticket = { id: 'TK-099', t: 'Test ticket', loc: 'Room 999', pr: 'Low', s: 'Open' };
      const result = await db.create('tickets', ticket);
      expect(result).toBeTruthy();

      const fetched = await db.getById('tickets', 'TK-099');
      expect(fetched.t).toBe('Test ticket');
    });

    test('adds to collection count', async () => {
      const before = (await db.getAll('tickets')).length;
      await db.create('tickets', { id: 'TK-NEW', t: 'New', s: 'Open' });
      const after = (await db.getAll('tickets')).length;
      expect(after).toBe(before + 1);
    });
  });

  describe('update', () => {
    test('updates existing record', async () => {
      const updated = await db.update('bills', 'INV-2604', { s: 'Paid' });
      expect(updated).toBeTruthy();
      expect(updated.s).toBe('Paid');
    });

    test('returns null for non-existent record', async () => {
      const result = await db.update('bills', 'INV-9999', { s: 'Paid' });
      expect(result).toBeNull();
    });

    test('partial update preserves other fields', async () => {
      await db.update('bills', 'INV-2604', { s: 'Paid' });
      const bill = await db.getById('bills', 'INV-2604');
      expect(bill.s).toBe('Paid');
      expect(bill.t).toBe('Sarah Lim'); // unchanged
      expect(bill.a).toBe('RM 850'); // unchanged
    });
  });

  describe('delete', () => {
    test('deletes existing record', async () => {
      const result = await db.delete('tickets', 'TK-001');
      expect(result).toBe(true);

      const fetched = await db.getById('tickets', 'TK-001');
      expect(fetched).toBeNull();
    });

    test('returns false for non-existent record', async () => {
      const result = await db.delete('tickets', 'TK-999');
      expect(result).toBe(false);
    });
  });

  describe('updateWhere', () => {
    test('updates first matching record', async () => {
      const result = await db.updateWhere('smart_lock_registry', { tenant: 'Sarah Lim' }, { status: 'Disabled' });
      expect(result).toBeTruthy();
      expect(result.status).toBe('Disabled');
    });
  });

  describe('deleteWhere', () => {
    test('deletes matching records', async () => {
      await db.create('notifs', { id: 'N-DEL1', type: 'test', read: false });
      await db.create('notifs', { id: 'N-DEL2', type: 'test', read: false });
      const count = await db.deleteWhere('notifs', { type: 'test' });
      expect(count).toBeGreaterThan(0);
    });
  });

  // ---- Key-Value Store ----

  describe('KV Store', () => {
    test('set and get store value', async () => {
      await db.setStore('config', 'theme', 'dark');
      const val = await db.getStore('config', 'theme');
      expect(val).toBe('dark');
    });

    test('get returns null for missing key', async () => {
      const val = await db.getStore('config', 'nonexistent');
      expect(val).toBeNull();
    });

    test('getAllStore returns all entries', async () => {
      await db.setStore('config', 'a', 1);
      await db.setStore('config', 'b', 2);
      const all = await db.getAllStore('config');
      expect(all).toBeTruthy();
    });

    test('deleteStore removes key', async () => {
      await db.setStore('config', 'temp', 'value');
      await db.deleteStore('config', 'temp');
      const val = await db.getStore('config', 'temp');
      expect(val).toBeNull();
    });
  });
});
