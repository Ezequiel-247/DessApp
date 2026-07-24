const { Connection } = require('../models');
const { seedRows } = require('./helpers');

const connectionTemplates = [
  { user_index: 1, connected_index: 2, status: 'accepted' },
  { user_index: 1, connected_index: 3, status: 'accepted' },
  { user_index: 2, connected_index: 3, status: 'accepted' },
  { user_index: 3, connected_index: 4, status: 'pending' },
  { user_index: 4, connected_index: 5, status: 'accepted' },
  { user_index: 5, connected_index: 6, status: 'accepted' },
  { user_index: 6, connected_index: 7, status: 'accepted' },
  { user_index: 7, connected_index: 8, status: 'accepted' },
  { user_index: 8, connected_index: 9, status: 'accepted' },
];

async function seedConnections(users, transaction) {
  const rows = connectionTemplates.map((conn) => ({
    id_user: users[conn.user_index].id,
    id_connected_user: users[conn.connected_index].id,
    status: conn.status,
  }));

  return seedRows(Connection, rows, ['id_user', 'id_connected_user'], transaction);
}

module.exports = seedConnections;
