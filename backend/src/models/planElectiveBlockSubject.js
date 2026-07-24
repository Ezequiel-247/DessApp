const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PlanElectiveBlockSubject = sequelize.define('PlanElectiveBlockSubject', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  id_elective_block: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'plan_elective_blocks',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  },
  id_plan_subject: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'plan_subjects',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  },
}, {
  tableName: 'plan_elective_block_subjects',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['id_elective_block', 'id_plan_subject'],
    },
  ],
});

module.exports = PlanElectiveBlockSubject;
