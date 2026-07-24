const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PlanCreditBlockItem = sequelize.define('PlanCreditBlockItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  id_credit_block: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'plan_credit_blocks',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  },
  id_activity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'activities',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  },
  credits: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  tableName: 'plan_credit_block_items',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['id_credit_block', 'id_activity'],
    },
  ],
});

module.exports = PlanCreditBlockItem;
