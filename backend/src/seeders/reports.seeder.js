const { Report } = require('../models');
const { seedRows } = require('./helpers');

async function seedReports(users, materials, reportReasons, transaction) {
  const rows = [];

  if (materials.length > 0) {
    rows.push({
      id_reporter: users[1].id,
      id_content: materials[1].id,
      content_type: 'material',
      id_reason: reportReasons[1].id,
      status: 'pending',
    });
  }

  return seedRows(Report, rows, ['id_reporter', 'id_content'], transaction);
}

module.exports = seedReports;
