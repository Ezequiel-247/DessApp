const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PlanElectiveBlock = sequelize.define('PlanElectiveBlock', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  id_study_plan: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'study_plans',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  min_required: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  requires_approved_mandatory_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  suggested_year: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  sort_order: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  tableName: 'plan_elective_blocks',
  timestamps: true,
});

module.exports = PlanElectiveBlock;
