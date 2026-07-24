const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./user');

const ActivityRecord = sequelize.define('ActivityRecord', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  id_student: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id',
    }
  },
  id_activity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'activities',
      key: 'id',
    }
  },
  plan_credit_block_item_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'plan_credit_block_items',
      key: 'id',
    }
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  semester: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  grade: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  tableName: 'activities_records',
  timestamps: true,
});

module.exports = ActivityRecord;
