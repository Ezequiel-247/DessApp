const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Student = require('./student');

const Comment = sequelize.define('Comment', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  target_type: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIn: [['post', 'academic_event']],
    },
  },
  target_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  id_author: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Student,
      key: 'user_id',
    },
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  likes_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  dislikes_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  total_upvotes: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  valoracion_ratio: {
    type: DataTypes.DECIMAL(10, 4),
    defaultValue: null,
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'comments',
  timestamps: false,
});

module.exports = Comment;