const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Student = require('./student');
const Subject = require('./subject');

const StudySession = sequelize.define('StudySession', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  host_student_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Student,
      key: 'user_id',
    }
  },
  subject_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Subject,
      key: 'id',
    }
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  type: {
    type: DataTypes.ENUM('virtual', 'presencial'),
    allowNull: false,
  },
  meeting_link: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  date_time: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  duration_hours: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  duration_minutes: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  max_slots: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  approval_required: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  status: {
    type: DataTypes.ENUM('abierta', 'cancelada', 'finalizada'),
    allowNull: false,
    defaultValue: 'abierta',
  },
  reminder_sent: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  }
}, {
  tableName: 'study_sessions',
  timestamps: true,
});

module.exports = StudySession;
