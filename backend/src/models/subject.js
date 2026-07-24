const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Subject = sequelize.define('Subject', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  code: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  is_unahur: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  weekly_hours: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: {
        args: [1],
        msg: 'Las horas semanales deben ser al menos 1.',
      },
    },
  },
}, {
  tableName: 'subjects',
  timestamps: true,
  paranoid: true,
});

module.exports = Subject;
