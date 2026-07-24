const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CustomStudyPlanItem = sequelize.define('CustomStudyPlanItem', {
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
  plan_subject_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'plan_subjects',
      key: 'id',
    }
  },
  target_year: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  target_term: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  order: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('planificado', 'cursando', 'completado'),
    defaultValue: 'planificado',
  },
}, {
  tableName: 'custom_study_plan_items',
  timestamps: true,
});

module.exports = CustomStudyPlanItem;
