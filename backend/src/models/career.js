const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Institute = require('./institute');

const Career = sequelize.define('Career', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  id_institute: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Institute,
      key: 'id',
    }
  },
  degree_title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  code: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: 'careers',
  timestamps: true,
});

module.exports = Career;
