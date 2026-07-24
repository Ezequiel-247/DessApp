const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Material = require('./material');
const Post = require('./post');
const Comment = require('./comment');
const AcademicRecord = require('./academicRecord');
const Student = require('./student');

const TARGET_TYPES = ['material', 'post', 'comment', 'academic_event'];

const targetModel = (targetType) => {
  if (targetType === 'material') return Material;
  if (targetType === 'post') return Post;
  if (targetType === 'comment') return Comment;
  return AcademicRecord;
};

const Vote = sequelize.define('Vote', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  target_type: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: { isIn: [TARGET_TYPES] },
  },
  target_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  id_student: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: Student, key: 'user_id' },
  },
  is_upvote: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
  },
}, {
  tableName: 'votes',
  timestamps: true,
  indexes: [
    { unique: true, fields: ['target_type', 'target_id', 'id_student'] },
  ],
  hooks: {
    afterCreate: async (vote, options = {}) => {
      const Model = targetModel(vote.target_type);
      if (vote.is_upvote) {
        await Model.increment(
          ['total_upvotes', 'likes_count'],
          { by: 1, where: { id: vote.target_id }, transaction: options.transaction }
        );
      } else {
        await Model.increment(
          'dislikes_count',
          { by: 1, where: { id: vote.target_id }, transaction: options.transaction }
        );
      }
      await Model.update({
        valoracion_ratio: sequelize.literal(`CASE WHEN (likes_count + dislikes_count) > 0 THEN ROUND(likes_count::numeric / (likes_count + dislikes_count), 4) ELSE NULL END`),
      }, { where: { id: vote.target_id }, transaction: options.transaction });
    },
    afterUpdate: async (vote, options = {}) => {
      if (typeof vote.changed === 'function' && vote.changed('is_upvote')) {
        const Model = targetModel(vote.target_type);
        const wasUpvote = vote.previous('is_upvote');
        if (wasUpvote && !vote.is_upvote) {
          await Model.increment('dislikes_count', { by: 1, where: { id: vote.target_id }, transaction: options.transaction });
          await Model.decrement(['total_upvotes', 'likes_count'], { by: 1, where: { id: vote.target_id }, transaction: options.transaction });
        } else {
          await Model.increment(['total_upvotes', 'likes_count'], { by: 1, where: { id: vote.target_id }, transaction: options.transaction });
          await Model.decrement('dislikes_count', { by: 1, where: { id: vote.target_id }, transaction: options.transaction });
        }
        await Model.update({
          valoracion_ratio: sequelize.literal(`CASE WHEN (likes_count + dislikes_count) > 0 THEN ROUND(likes_count::numeric / (likes_count + dislikes_count), 4) ELSE NULL END`),
        }, { where: { id: vote.target_id }, transaction: options.transaction });
      }
    },
    afterDestroy: async (vote, options = {}) => {
      const Model = targetModel(vote.target_type);
      if (vote.is_upvote) {
        await Model.decrement(['total_upvotes', 'likes_count'], { by: 1, where: { id: vote.target_id }, transaction: options.transaction });
      } else {
        await Model.decrement('dislikes_count', { by: 1, where: { id: vote.target_id }, transaction: options.transaction });
      }
      await Model.update({
        valoracion_ratio: sequelize.literal(`CASE WHEN (likes_count + dislikes_count) > 0 THEN ROUND(likes_count::numeric / (likes_count + dislikes_count), 4) ELSE NULL END`),
      }, { where: { id: vote.target_id }, transaction: options.transaction });
    },
  },
});

module.exports = Vote;
