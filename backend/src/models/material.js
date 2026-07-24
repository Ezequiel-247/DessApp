const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Student = require('./student'); // Notar la minúscula respetando el nombre del archivo en el FS
const Subject = require('./subject');

const Material = sequelize.define('Material', {
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
  id_subject: {
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
  type: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  file_url: {
    type: DataTypes.STRING,
    allowNull: false,
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
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'active',
  },
  tags: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const raw = this.getDataValue('tags');
      try { return raw ? JSON.parse(raw) : []; } catch { return []; }
    },
    set(val) {
      this.setDataValue('tags', Array.isArray(val) ? JSON.stringify(val) : null);
    }
  },
}, {

  tableName: 'materials',
  timestamps: true,
});

module.exports = Material;
