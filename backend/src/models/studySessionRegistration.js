const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const StudySession = require('./studySession');
const Student = require('./student');

const StudySessionRegistration = sequelize.define('StudySessionRegistration', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  study_session_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: StudySession,
      key: 'id',
    }
  },
  student_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Student,
      key: 'user_id',
    }
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    allowNull: false,
    defaultValue: 'pending',
  }
}, {
  tableName: 'study_session_registrations',
  timestamps: true,
});

module.exports = StudySessionRegistration;
