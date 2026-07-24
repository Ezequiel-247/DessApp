const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Student = require('./student');

const CustomStudyPlan = sequelize.define('CustomStudyPlan', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  id_student: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Student,
      key: 'user_id',
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  weekly_hours: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  tableName: 'custom_study_plans',
  timestamps: true,
});

module.exports = CustomStudyPlan;
