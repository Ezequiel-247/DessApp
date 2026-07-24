const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Course = require('./course');

const CourseSchedule = sequelize.define('CourseSchedule', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  course_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Course,
      key: 'id',
    }
  },
  day_of_week: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  start_time: {
    type: DataTypes.TIME,
    allowNull: false,
  },
  end_time: {
    type: DataTypes.TIME,
    allowNull: false,
  },
  classroom: {
    type: DataTypes.STRING,
    allowNull: true,
  }
}, {
  tableName: 'course_schedules',
  timestamps: true,
});

module.exports = CourseSchedule;
