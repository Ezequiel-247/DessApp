const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CustomStudyPlanElectiveChoice = sequelize.define('CustomStudyPlanElectiveChoice', {
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
  id_elective_block: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'plan_elective_blocks',
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
  tableName: 'custom_study_plan_elective_choices',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['id_custom_study_plan', 'plan_subject_id'],
      name: 'uq_elective_choice',
    },
  ],
});

module.exports = CustomStudyPlanElectiveChoice;
