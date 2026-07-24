const { ReportReason } = require('../models');
const { seedRows } = require('./helpers');

const reportReasons = [
  { name: 'Spam', description: 'Contenido publicitario no deseado' },
  { name: 'Contenido ofensivo', description: 'Lenguaje inapropiado u ofensivo' },
  { name: 'Material incorrecto', description: 'El material no corresponde a la materia' },
];

async function seedReportReasons(transaction) {
  return seedRows(ReportReason, reportReasons, ['name'], transaction);
}

module.exports = seedReportReasons;
