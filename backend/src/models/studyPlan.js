const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Career = require('./career');

const StudyPlan = sequelize.define('StudyPlan', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  id_career: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Career,
      key: 'id',
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  years_duration: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  course_type: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  default_term: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  min_total_credits: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },

}, {
  tableName: 'study_plans',
  timestamps: true,
});

module.exports = StudyPlan;
