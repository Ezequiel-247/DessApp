const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./user');
const Subject = require('./subject');

const AcademicRecord = sequelize.define('AcademicRecord', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  id_student: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id',
    }
  },
  id_subject: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Subject,
      key: 'id',
    }
  },
  plan_subject_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  course_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  semester: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  grade: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  regularity_expires_at: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  total_upvotes: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  likes_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  dislikes_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  valoracion_ratio: {
    type: DataTypes.FLOAT,
    defaultValue: null,
  },
}, {
  tableName: 'academic_records',
  timestamps: true,
});

module.exports = AcademicRecord;
