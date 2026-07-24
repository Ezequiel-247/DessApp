const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./user');
const ReportReason = require('./reportReason');

const Report = sequelize.define('Report', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  id_reporter: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id',
    }
  },
  id_content: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  content_type: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  id_reason: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: ReportReason,
      key: 'id',
    }
  },
  status: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  resolved_by_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: User,
      key: 'id',
    }
  },
}, {
  tableName: 'reports',
  timestamps: true,
});

module.exports = Report;
