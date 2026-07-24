const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Student = require('./student');
const Career = require('./career');
const StudyPlan = require('./studyPlan');

const StudentCareerEnrollment = sequelize.define('StudentCareerEnrollment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  student_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Student,
      key: 'user_id',
    },
  },
  career_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Career,
      key: 'id',
    },
  },
  enrolled_at: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  completed_at: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'active',
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  study_plan_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: StudyPlan,
      key: 'id',
    },
  },
}, {
  tableName: 'student_career_enrollments',
  timestamps: true,
});

module.exports = StudentCareerEnrollment;
