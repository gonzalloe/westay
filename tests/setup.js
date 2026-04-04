// ============ TEST SETUP ============
// Shared test utilities, DB setup/teardown, auth helpers

const path = require('path');

// Mock environment
process.env.JWT_SECRET = 'test-secret-key-12345';
process.env.NODE_ENV = 'test';
process.env.PORT = '0'; // random port for tests

/**
 * Create a fresh in-memory database for testing
 * Uses the memory adapter to avoid touching real SQLite DB
 */
async function createTestDB() {
  const MemoryAdapter = require('../backend/db/memory-adapter');
  const db = new MemoryAdapter();
  // MemoryAdapter doesn't need init() — it's ready on construction
  if (typeof db.init === 'function') {
    await db.init();
  }
  return db;
}

/**
 * Seed test database with minimal demo data
 */
async function seedTestDB(db) {
  // Properties
  await db.create('props', { n: 'Cambridge House - Room 101', status: 'Occupied', type: 'Single', rent: 'RM 850', landlord: 'Dato Lee Wei' });
  await db.create('props', { n: 'Oxford Court - Room 201', status: 'Vacant', type: 'Double', rent: 'RM 1,200', landlord: 'Dato Lee Wei' });

  // Tenants
  await db.create('tenants', { n: 'Sarah Lim', p: 'Cambridge House - Room 101', s: 'active', r: 'RM 850', phone: '60123456789', email: 'sarah@test.com' });
  await db.create('tenants', { n: 'Ahmad Bin Ali', p: 'Oxford Court - Room 201', s: 'active', r: 'RM 1,200' });

  // Bills
  await db.create('bills', { id: 'INV-2604', t: 'Sarah Lim', a: 'RM 850', s: 'Pending', d: '05 Apr 2026', prop: 'Cambridge' });
  await db.create('bills', { id: 'INV-2605', t: 'Ahmad Bin Ali', a: 'RM 1,200', s: 'Paid', d: '05 Apr 2026', prop: 'Oxford' });

  // Tickets
  await db.create('tickets', { id: 'TK-001', t: 'Aircon not working', loc: 'Room 101', pr: 'High', icon: 'fa-fire', c: '#E17055', time: 'Just now', by: 'Sarah Lim', s: 'Open' });

  // Vendors
  await db.create('vendors', { n: 'AirCool Services', type: 'HVAC', phone: '60198765432', rating: 4.5, jobs: 12 });

  // Landlords
  await db.create('landlords', { n: 'Dato Lee Wei', email: 'dato@test.com', phone: '60111222333', properties: ['Cambridge House', 'Oxford Court'] });

  // Electric meters
  await db.create('electric_meters', { meterId: 'EM-101', unit: 'Cambridge House', room: 'Room 101', tenant: 'Sarah Lim', status: 'Connected', reading: 1250.5 });

  // Smart lock registry
  await db.create('smart_lock_registry', { tenant: 'Sarah Lim', unit: 'Cambridge House', status: 'Active', fingerprints: 2, leaseEnd: '2027-01-01' });

  // Contracts
  await db.create('contracts', { id: 'TA-2026-001', tenant: 'Sarah Lim', property: 'Cambridge House', status: 'Active', startDate: '2026-01-01', endDate: '2027-01-01' });

  // Notifications
  await db.create('notifs', { id: 'N-1001', title: 'Test', msg: 'Test notification', type: 'info', read: false, time: '2026-04-04T12:00:00Z' });

  return db;
}

/**
 * Generate a JWT token for testing
 */
function generateTestToken(user) {
  const jwt = require('jsonwebtoken');
  const payload = {
    id: user.id || 'test-user-1',
    username: user.username || 'operator',
    role: user.role || 'operator'
  };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
}

/**
 * Create test users
 */
function getTestUsers() {
  return {
    operator: { id: 'u-1', username: 'operator', role: 'operator' },
    tenant: { id: 'u-2', username: 'sarah', role: 'tenant', linkedEntity: 'Sarah Lim' },
    landlord: { id: 'u-3', username: 'landlord', role: 'landlord', linkedEntity: 'Dato Lee Wei' },
    vendor: { id: 'u-4', username: 'vendor', role: 'vendor', linkedEntity: 'AirCool Services' },
    agent: { id: 'u-5', username: 'agent', role: 'agent' }
  };
}

module.exports = {
  createTestDB,
  seedTestDB,
  generateTestToken,
  getTestUsers
};
