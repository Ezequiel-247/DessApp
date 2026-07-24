const { Comment, Post, AcademicRecord, Student, User, Vote } = require('../models');
const notificationService = require('../services/notificationService');

const VALID_TARGET_TYPES = new Set(['post', 'academic_event']);

const normalizeTargetType = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  return VALID_TARGET_TYPES.has(normalized) ? normalized : null;
};

const formatUserName = (user) => {
  const fullName = `${user?.name || ''} ${user?.lastname || ''}`.trim();
  return fullName || 'Usuario';
};

const notifyPostAuthorOnComment = async ({ targetType, targetId, authorId, requesterUser }) => {
  if (targetType !== 'post') {
    return;
  }

  try {
    const post = await Post.findByPk(targetId, { attributes: ['id', 'id_author', 'title'] });
    if (!post || Number(post.id_author) === Number(authorId)) {
      return;
    }

    let commenterName = formatUserName(requesterUser);
    if (commenterName === 'Usuario') {
      const commenter = await User.findByPk(authorId, { attributes: ['name', 'lastname'] });
      commenterName = formatUserName(commenter);
    }

    await notificationService.createNotification({
      userId: post.id_author,
      type: 'post_comment',
      title: 'Nuevo comentario en tu post',
      message: `${commenterName} comento en tu post: ${post.title}`,
      targetType: 'post',
      targetId: post.id,
    });
  } catch (error) {
    console.error('Error creating comment notification:', error);
  }
};

const mapComment = (comment, myVote = null) => {
  const author = comment.Student?.User;
  return {
    id: comment.id,
    targetType: comment.target_type,
    targetId: comment.target_id,
    content: comment.content,
    author: {
      id: comment.id_author,
      name: formatUserName(author),
      avatar: author?.avatar || null,
    },
    likes_count: comment.likes_count,
    dislikes_count: comment.dislikes_count,
    total_upvotes: comment.total_upvotes,
    valoracion_ratio: comment.valoracion_ratio,
    my_vote: myVote,
    date: (comment.created_at ? new Date(comment.created_at) : new Date()).toISOString(),
  };
};

const targetExists = async (targetType, targetId) => {
  if (targetType === 'post') {
    const post = await Post.findByPk(targetId);
    return Boolean(post);
  }

  if (targetType === 'academic_event') {
    const record = await AcademicRecord.findByPk(targetId);
    return Boolean(record);
  }

  return false;
};

const commentController = {
  list: async (req, res) => {
    try {
      const targetType = normalizeTargetType(req.query.target_type || req.query.targetType);
      const targetId = Number.parseInt(req.query.target_id || req.query.targetId, 10);

      if (!targetType || Number.isNaN(targetId) || targetId <= 0) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'target_type and target_id are required',
        });
      }

      const exists = await targetExists(targetType, targetId);
      if (!exists) {
        return res.status(404).json({ error: 'Target not found' });
      }

      const comments = await Comment.findAll({
        where: {
          target_type: targetType,
          target_id: targetId,
        },
        include: [
          {
            model: Student,
            include: [{ model: User, attributes: ['id', 'name', 'lastname', 'avatar'] }],
          },
        ],
        order: [['created_at', 'ASC'], ['id', 'ASC']],
      });

      const viewerId = Number(req.user?.id);
      let myVoteMap = {};
      if (!Number.isNaN(viewerId) && comments.length > 0) {
        const votes = await Vote.findAll({
          where: { target_type: 'comment', target_id: comments.map((c) => c.id), id_student: viewerId },
          attributes: ['target_id', 'is_upvote'],
        });
        for (const v of votes) {
          myVoteMap[v.target_id] = v.is_upvote ? 'up' : 'down';
        }
      }

      return res.status(200).json({ data: comments.map((c) => mapComment(c, myVoteMap[c.id] ?? null)) });
    } catch (error) {
      return res.status(500).json({ error: 'Error fetching comments', details: error.message });
    }
  },

  create: async (req, res) => {
    try {
      const requesterId = Number(req.user?.id);
      if (Number.isNaN(requesterId)) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const targetType = normalizeTargetType(req.body.target_type || req.body.targetType);
      const targetId = Number.parseInt(req.body.target_id || req.body.targetId, 10);

      const exists = await targetExists(targetType, targetId);
      if (!exists) {
        return res.status(404).json({ error: 'Target not found' });
      }

      const newComment = await Comment.create({
        target_type: targetType,
        target_id: targetId,
        id_author: requesterId,
        content: req.body.content,
        created_at: new Date(),
      });

      const created = await Comment.findByPk(newComment.id, {
        include: [
          {
            model: Student,
            include: [{ model: User, attributes: ['id', 'name', 'lastname', 'avatar'] }],
          },
        ],
      });

      Promise.resolve(notifyPostAuthorOnComment({
        targetType,
        targetId,
        authorId: requesterId,
        requesterUser: req.user,
      })).catch((error) => console.error('Error notifying comment on post:', error));

      return res.status(201).json({
        message: 'Comment created successfully',
        data: mapComment(created),
      });
    } catch (error) {
      return res.status(500).json({ error: 'Error creating comment', details: error.message });
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const requesterId = Number(req.user?.id);

      const existingComment = await Comment.findByPk(id);
      if (!existingComment) {
        return res.status(404).json({ error: 'Comment not found' });
      }

      if (!Number.isNaN(requesterId) && Number(existingComment.id_author) !== requesterId) {
        return res.status(403).json({ error: 'Forbidden: you can only delete your own comments' });
      }

      const deletedRows = await Comment.destroy({ where: { id } });
      if (deletedRows === 0) {
        return res.status(404).json({ error: 'Comment not found' });
      }

      return res.status(200).json({ message: `Comment with id: ${id} deleted successfully` });
    } catch (error) {
      return res.status(500).json({ error: 'Error deleting comment', details: error.message });
    }
  },
};

module.exports = commentController;