const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PlanUnahurBlock = sequelize.define('PlanUnahurBlock', {
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
  suggested_year: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  suggested_term: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  sort_order: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  tableName: 'plan_unahur_blocks',
  timestamps: true,
});

module.exports = PlanUnahurBlock;
