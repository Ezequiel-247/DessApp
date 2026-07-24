const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CustomStudyPlanUnahurChoice = sequelize.define('CustomStudyPlanUnahurChoice', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  id_custom_study_plan: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'custom_study_plans',
      key: 'id',
    }
  },
  id_unahur_block: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'plan_unahur_blocks',
      key: 'id',
    }
  },
  plan_subject_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'plan_subjects',
      key: 'id',
    }
  },
}, {
  tableName: 'custom_study_plan_unahur_choices',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['id_custom_study_plan', 'plan_subject_id'],
      name: 'uq_unahur_choice',
    },
  ],
});

module.exports = CustomStudyPlanUnahurChoice;
