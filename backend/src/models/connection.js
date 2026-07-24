const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./user');

const Connection = sequelize.define('Connection', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  id_user: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id',
    }
  },
  id_connected_user: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id',
    }
  },
  status: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  invitation_token: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
  },
  target_email: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: 'connections',
  timestamps: true,
});

module.exports = Connection;
