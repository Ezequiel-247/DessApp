const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./user');

const Student = sequelize.define('Student', {
  user_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
      model: User,
      key: 'id',
    }
  },
  legajo: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: true,
  },
  public_profile: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  show_email: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  show_academic_info: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  publish_approvals: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  }
}, {
  tableName: 'students',
  timestamps: false,
});

module.exports = Student;
