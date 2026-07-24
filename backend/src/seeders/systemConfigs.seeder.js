const { SystemConfig } = require('../models');
const { seedRows } = require('./helpers');

const systemConfigs = [
  { key: 'institution_name', value: 'Universidad de Referencia DesApp' },
  { key: 'academic_year', value: '2026' },
  { key: 'support_email', value: 'soporte@desapp.edu.ar' },
  { key: 'default_language', value: 'es-AR' },
  { key: 'min_passing_grade', value: '4.0' },
  { key: 'materials_moderation', value: 'enabled' },
  { key: 'allow_public_profiles', value: 'true' },
  { key: 'semester_start', value: '2026-03-10' },
  { key: 'semester_end', value: '2026-12-15' },
  { key: 'student_support_channel', value: 'mesa-de-ayuda' },
  { key: 'pending_reports_threshold', value: '10' },
  { key: 'verified_reports_threshold', value: '3' },
];


async function seedSystemConfigs(transaction) {
  return seedRows(SystemConfig, systemConfigs, ['key'], transaction);
}

module.exports = seedSystemConfigs;
