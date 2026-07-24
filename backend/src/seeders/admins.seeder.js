const { Admin } = require('../models');
const { seedRows } = require('./helpers');

async function seedAdmins(users, transaction) {
  const adminUser = users[0];
  const rows = [
    {
      id_users: adminUser.id,
      cuil: '20-12345678-9',
      role: 'superadmin',
    },
  ];

  return seedRows(Admin, rows, ['id_users'], transaction);
}

module.exports = seedAdmins;
