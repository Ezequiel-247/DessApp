const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const PlanSubject = require('./planSubject');

const Correlativity = sequelize.define('Correlativity', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  id_plan_subject_target: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: PlanSubject,
      key: 'id',
    }
  },
  id_required_plan_subject: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: PlanSubject,
      key: 'id',
    }
  },
  type: {
    type: DataTypes.STRING,
    allowNull: true,
  }
}, {
  tableName: 'correlativities',
  timestamps: false,
});

module.exports = Correlativity;
