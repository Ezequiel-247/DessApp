const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const StudyPlan = require('./studyPlan');
const Subject = require('./subject');

const PlanSubject = sequelize.define('PlanSubject', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  id_study_plan: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: StudyPlan,
      key: 'id',
    }
  },
  id_subject: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Subject,
      key: 'id',
    }
  },
  suggested_year: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  suggested_term: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  credits: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  is_elective: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  is_final_project: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
}, {
  tableName: 'plan_subjects',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['id_study_plan', 'id_subject'],
    },
  ],
});

module.exports = PlanSubject;
