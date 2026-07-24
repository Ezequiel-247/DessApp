const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PlanCreditBlock = sequelize.define('PlanCreditBlock', {
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
  min_credits_required: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  max_credits_allowed: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  sort_order: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  tableName: 'plan_credit_blocks',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['id_study_plan', 'name'],
    },
  ],
});

module.exports = PlanCreditBlock;
