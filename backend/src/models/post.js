const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Student = require('./student');

const Post = sequelize.define('Post', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  id_author: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Student,
      key: 'user_id',
    }
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  created_at: {
    type: DataTypes.DATE,
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
  images: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
}, {
  tableName: 'posts',
  timestamps: false,
});

module.exports = Post;
