const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CustomStudyPlanSabbatical = sequelize.define('CustomStudyPlanSabbatical', {
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
  year: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  term: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      isIn: [[1, 2]],
    },
  },
}, {
  tableName: 'custom_study_plan_sabbaticals',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['id_custom_study_plan', 'year', 'term'],
    },
  ],
});

module.exports = CustomStudyPlanSabbatical;
