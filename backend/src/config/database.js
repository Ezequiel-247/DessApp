const { Sequelize } = require('sequelize');

// Render/Supabase/Neon y la mayoría de los Postgres gestionados exigen SSL
// en conexiones externas. En local (docker-compose) no hace falta.
const useSSL = process.env.DB_SSL === 'true';

const sequelize = new Sequelize(
  process.env.DB_NAME || 'desapp_db',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'password',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false, // Set to console.log for SQL debugging
    dialectOptions: useSSL
      ? { ssl: { require: true, rejectUnauthorized: false } }
      : {},
  }
);

module.exports = { sequelize };
