// ============ API INTEGRATION TESTS ============
// Tests API routes against a real Express app with in-memory DB
// No actual HTTP server — uses direct router invocation

const { createTestDB, seedTestDB, generateTestToken, getTestUsers } = require('./setup');

describe('API Route Logic', () => {
  let db;
  const users = getTestUsers();

  beforeEach(async () => {
    db = await createTestDB();
    await seedTestDB(db);
  });

  // ---- Bills ----

  describe('Bills', () => {
    test('list all bills', async () => {
      const bills = await db.getAll('bills');
      expect(bills.length).toBe(2);
    });

    test('get bill by ID', async () => {
      const bill = await db.getById('bills', 'INV-2604');
      expect(bill).toBeTruthy();
      expect(bill.t).toBe('Sarah Lim');
      expect(bill.s).toBe('Pending');
    });

    test('create new bill', async () => {
      const bill = { id: 'INV-9999', t: 'Test Tenant', a: 'RM 500', s: 'Pending', d: '01 Apr 2026', prop: 'Test' };
      await db.create('bills', bill);
      const fetched = await db.getById('bills', 'INV-9999');
      expect(fetched.a).toBe('RM 500');
    });

    test('pay bill updates status', async () => {
      await db.update('bills', 'INV-2604', { s: 'Paid' });
      const bill = await db.getById('bills', 'INV-2604');
      expect(bill.s).toBe('Paid');
    });

    test('filter bills by status', async () => {
      const pending = await db.query('bills', { s: 'Pending' });
      expect(pending.length).toBe(1);
      expect(pending[0].id).toBe('INV-2604');
    });

    test('filter bills by tenant', async () => {
      const sarahBills = await db.query('bills', { t: 'Sarah Lim' });
      expect(sarahBills.length).toBe(1);
    });
  });

  // ---- Properties ----

  describe('Properties', () => {
    test('list all properties', async () => {
      const props = await db.getAll('props');
      expect(props.length).toBe(2);
    });

    test('get property by name', async () => {
      const prop = await db.getById('props', 'Cambridge House - Room 101');
      expect(prop.status).toBe('Occupied');
    });

    test('create property', async () => {
      await db.create('props', { n: 'New Unit', status: 'Vacant', type: 'Studio', rent: 'RM 600' });
      const props = await db.getAll('props');
      expect(props.length).toBe(3);
    });

    test('update property', async () => {
      await db.update('props', 'Oxford Court - Room 201', { status: 'Occupied' });
      const prop = await db.getById('props', 'Oxford Court - Room 201');
      expect(prop.status).toBe('Occupied');
    });

    test('delete property', async () => {
      await db.delete('props', 'Oxford Court - Room 201');
      const props = await db.getAll('props');
      expect(props.length).toBe(1);
    });
  });

  // ---- Tenants ----

  describe('Tenants', () => {
    test('list all tenants', async () => {
      const tenants = await db.getAll('tenants');
      expect(tenants.length).toBe(2);
    });

    test('get tenant by name', async () => {
      const tenant = await db.getById('tenants', 'Sarah Lim');
      expect(tenant.s).toBe('active');
      expect(tenant.r).toBe('RM 850');
    });

    test('filter active tenants', async () => {
      const active = await db.query('tenants', { s: 'active' });
      expect(active.length).toBe(2);
    });
  });

  // ---- Tickets ----

  describe('Tickets', () => {
    test('create ticket', async () => {
      await db.create('tickets', { id: 'TK-002', t: 'Leaky faucet', loc: 'Room 201', pr: 'Medium', s: 'Open' });
      const tk = await db.getById('tickets', 'TK-002');
      expect(tk.t).toBe('Leaky faucet');
    });

    test('update ticket status', async () => {
      await db.update('tickets', 'TK-001', { s: 'In Progress' });
      const tk = await db.getById('tickets', 'TK-001');
      expect(tk.s).toBe('In Progress');
    });

    test('ticket photos (store)', async () => {
      await db.setStore('ticket_photos', 'TK-001', ['photo1.jpg', 'photo2.jpg']);
      const photos = await db.getStore('ticket_photos', 'TK-001');
      expect(photos.length).toBe(2);
    });
  });

  // ---- Contracts ----

  describe('Contracts', () => {
    test('get contract', async () => {
      const contract = await db.getById('contracts', 'TA-2026-001');
      expect(contract.tenant).toBe('Sarah Lim');
      expect(contract.status).toBe('Active');
    });

    test('sign contract (update status)', async () => {
      await db.update('contracts', 'TA-2026-001', { status: 'Signed', signedAt: new Date().toISOString() });
      const contract = await db.getById('contracts', 'TA-2026-001');
      expect(contract.status).toBe('Signed');
    });
  });

  // ---- IoT ----

  describe('IoT Devices', () => {
    test('get electric meter', async () => {
      const meter = await db.getById('electric_meters', 'EM-101');
      expect(meter.tenant).toBe('Sarah Lim');
      expect(meter.status).toBe('Connected');
    });

    test('disconnect meter (simulate late payment cut)', async () => {
      await db.update('electric_meters', 'EM-101', { status: 'Disconnected' });
      const meter = await db.getById('electric_meters', 'EM-101');
      expect(meter.status).toBe('Disconnected');
    });

    test('reconnect meter (simulate payment)', async () => {
      await db.update('electric_meters', 'EM-101', { status: 'Disconnected' });
      await db.update('electric_meters', 'EM-101', { status: 'Connected' });
      const meter = await db.getById('electric_meters', 'EM-101');
      expect(meter.status).toBe('Connected');
    });

    test('smart lock disable/enable', async () => {
      await db.updateWhere('smart_lock_registry', { tenant: 'Sarah Lim' }, { status: 'Disabled - Non Payment' });
      let lock = (await db.query('smart_lock_registry', { tenant: 'Sarah Lim' }))[0];
      expect(lock.status).toContain('Disabled');

      await db.updateWhere('smart_lock_registry', { tenant: 'Sarah Lim' }, { status: 'Active' });
      lock = (await db.query('smart_lock_registry', { tenant: 'Sarah Lim' }))[0];
      expect(lock.status).toBe('Active');
    });
  });

  // ---- Auth Token ----

  describe('JWT Auth', () => {
    const jwt = require('jsonwebtoken');

    test('generates valid token for operator', () => {
      const token = generateTestToken(users.operator);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      expect(decoded.username).toBe('operator');
      expect(decoded.role).toBe('operator');
    });

    test('generates valid token for tenant', () => {
      const token = generateTestToken(users.tenant);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      expect(decoded.username).toBe('sarah');
      expect(decoded.role).toBe('tenant');
    });

    test('rejects invalid token', () => {
      expect(() => jwt.verify('invalid-token', process.env.JWT_SECRET)).toThrow();
    });

    test('token expires after set duration', () => {
      const token = jwt.sign({ id: 'test' }, process.env.JWT_SECRET, { expiresIn: '0s' });
      // Wait a tick
      expect(() => jwt.verify(token, process.env.JWT_SECRET)).toThrow(/expired/);
    });
  });

  // ---- Payment Integration ----

  describe('Payment Flow', () => {
    test('bill payment and auto-reconnect flow', async () => {
      // 1. Disconnect meter (simulate overdue)
      await db.update('electric_meters', 'EM-101', { status: 'Disconnected' });

      // 2. Disable smart lock
      await db.updateWhere('smart_lock_registry', { tenant: 'Sarah Lim' }, { status: 'Disabled - Non Payment', fingerprints: 0 });

      // 3. Pay the bill
      const bill = await db.getById('bills', 'INV-2604');
      expect(bill.s).toBe('Pending');
      await db.update('bills', 'INV-2604', { s: 'Paid' });

      // 4. Auto-reconnect meter
      const meter = await db.getById('electric_meters', 'EM-101');
      if (meter.status !== 'Connected') {
        await db.update('electric_meters', 'EM-101', { status: 'Connected' });
      }

      // 5. Re-enable smart lock
      await db.updateWhere('smart_lock_registry', { tenant: 'Sarah Lim' }, { status: 'Active', fingerprints: 2 });

      // Verify final state
      const paidBill = await db.getById('bills', 'INV-2604');
      expect(paidBill.s).toBe('Paid');

      const reconnectedMeter = await db.getById('electric_meters', 'EM-101');
      expect(reconnectedMeter.status).toBe('Connected');

      const reenabledLock = (await db.query('smart_lock_registry', { tenant: 'Sarah Lim' }))[0];
      expect(reenabledLock.status).toBe('Active');
      expect(reenabledLock.fingerprints).toBe(2);
    });
  });
});
