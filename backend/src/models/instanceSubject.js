const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Subject = require('./subject');

const InstanceSubject = sequelize.define('InstanceSubject', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  id_subject: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Subject,
      key: 'id',
    }
  },
  comision: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  professor: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  schedule: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  classroom: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  is_exam: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  regularity_expires_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  term: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  tableName: 'instance_subjects',
  timestamps: true,
});

module.exports = InstanceSubject;
