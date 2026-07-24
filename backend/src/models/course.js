const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const PlanSubject = require('./planSubject');

const Course = sequelize.define('Course', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  plan_subject_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: PlanSubject,
      key: 'id',
    }
  },
  commission: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  term: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  capacity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 50,
  },
  professor_name: {
    type: DataTypes.STRING,
    allowNull: true,
  }
}, {
  tableName: 'courses',
  timestamps: true,
});

module.exports = Course;
