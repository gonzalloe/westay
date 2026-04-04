// ============ SEED DEFAULT USERS ============
// Creates one account per role, linked to existing demo entities.
// All passwords are bcrypt-hashed.

const bcrypt = require('bcryptjs');

module.exports = async function seedUsers(db) {
  const hash = (pw) => bcrypt.hashSync(pw, 10);

  const users = [
    // Admin — full system access (user management, data reset, audit, etc.)
    {
      username: 'admin',
      password: hash('admin123456'),
      role: 'admin',
      name: 'System Admin',
      email: 'admin@westay.my',
      phone: '+60 12-000 0000',
      linked_entity: null
    },
    // Operator — routine operational work (properties, tenants, billing, maintenance, IoT)
    {
      username: 'operator',
      password: hash('op123456'),
      role: 'operator',
      name: 'Site Operator',
      email: 'operator@westay.my',
      phone: '+60 12-000 0001',
      linked_entity: null
    },
    // Tenant — linked to Sarah Lim
    {
      username: 'sarah',
      password: hash('tenant123'),
      role: 'tenant',
      name: 'Sarah Lim',
      email: 'sarah@westay.my',
      phone: '+60 12-345 6789',
      linked_entity: 'Sarah Lim'
    },
    // Landlord — linked to Dato Lee Wei
    {
      username: 'landlord',
      password: hash('landlord123'),
      role: 'landlord',
      name: 'Dato Lee Wei',
      email: 'lee@westay.my',
      phone: '+60 12-888 0001',
      linked_entity: 'Dato Lee Wei'
    },
    // Vendor — linked to AirCool Services
    {
      username: 'vendor',
      password: hash('vendor123'),
      role: 'vendor',
      name: 'AirCool Services',
      email: 'aircool@westay.my',
      phone: '+60 12-800 1001',
      linked_entity: 'AirCool Services'
    },
    // Agent — property agent
    {
      username: 'agent',
      password: hash('agent123'),
      role: 'agent',
      name: 'Agent Ali',
      email: 'ali@westay.my',
      phone: '+60 12-700 0001',
      linked_entity: null
    }
  ];

  for (const u of users) {
    await db.createUser(u);
  }

  console.log('[Seed] Created ' + users.length + ' default user accounts');
};
