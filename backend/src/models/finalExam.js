const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const AcademicRecord = require('./academicRecord');

const FinalExam = sequelize.define('FinalExam', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  id_academic_record: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: AcademicRecord,
      key: 'id',
    }
  },
  grade: {
    type: DataTypes.STRING,
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
  status: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  attempt_number: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  }
}, {
  tableName: 'final_exams',
  timestamps: true,
});

module.exports = FinalExam;
