const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ReportReason = sequelize.define('ReportReason', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: 'report_reasons',
  timestamps: true,
});

module.exports = ReportReason;
