const { Session } = require('../models');
const { seedRows } = require('./helpers');

async function seedSessions(users, transaction) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 1);

  const rows = [
    {
      id_user: users[0].id,
      token: 'seed-session-token-admin',
      expires_at: futureDate,
    },
  ];

  return seedRows(Session, rows, ['id_user'], transaction);
}

module.exports = seedSessions;
