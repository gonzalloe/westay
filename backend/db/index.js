// ============ DATABASE INITIALIZATION ============
// Swap adapter by changing the require() below.
// Options: './memory-adapter' (dev, no persistence) or './sqlite-adapter' (persistent)

const SqliteAdapter = require('./sqlite-adapter');
const seed = require('./seed');
const seedUsers = require('./seed-users');

let db = null;

async function getDB() {
  if (db) return db;

  // --- Change this line to swap database adapters ---
  // const MemoryAdapter = require('./memory-adapter');
  // db = new MemoryAdapter();
  db = new SqliteAdapter();
  await db.init();

  // Seed demo data if DB is empty
  if (!(await db.isSeeded())) {
    await seed(db);
    console.log('[DB] Seeded demo data');
  }

  // Seed default users if none exist
  if (!(await db.hasUsers())) {
    await seedUsers(db);
    console.log('[DB] Seeded default users');
  }

  return db;
}

module.exports = { getDB };
