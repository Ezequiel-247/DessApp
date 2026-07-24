const { Vote, Material, Post, Comment, AcademicRecord, User } = require('../models');
const notificationService = require('../services/notificationService');

const targetModels = { material: Material, post: Post, comment: Comment, academic_event: AcademicRecord };

const formatUserName = (user) => {
  const fullName = `${user?.name || ''} ${user?.lastname || ''}`.trim();
  return fullName || 'Un contacto';
};

const targetLabel = (targetType) => {
  if (targetType === 'post') return 'tu post';
  if (targetType === 'comment') return 'tu comentario';
  if (targetType === 'material') return 'tu material';
  return 'tu publicacion';
};

const notifyVoteOnConnectedContent = async ({ ownerId, voterId, voterUser, targetType, targetId, isUpvote }) => {
  try {
    const connected = await notificationService.areUsersConnected(voterId, ownerId);
    if (!connected) {
      return;
    }

    let voterName = formatUserName(voterUser);
    if (voterName === 'Un contacto') {
      const voter = await User.findByPk(voterId, { attributes: ['name', 'lastname'] });
      voterName = formatUserName(voter);
    }

    const actionLabel = isUpvote ? 'like' : 'dislike';

    await notificationService.createNotification({
      userId: ownerId,
      type: 'content_vote',
      title: isUpvote ? 'Recibiste un like' : 'Recibiste un dislike',
      message: `${voterName} te dio ${actionLabel} en ${targetLabel(targetType)}.`,
      targetType,
      targetId,
    });
  } catch (error) {
    console.error('Error creating vote notification:', error);
  }
};

const voteController = {
  create: async (req, res) => {
    try {
      const { target_type, target_id, is_upvote } = req.body;
      const id_student = req.user.id;

      const Model = targetModels[target_type];
      if (!Model) return res.status(400).json({ error: 'Invalid target_type' });

      const target = await Model.findByPk(target_id);
      if (!target) {
        return res.status(404).json({ error: `${target_type} not found` });
      }

      const authorId = target_type === 'academic_event' ? target.id_student : target.id_author;
      if (Number(authorId) === Number(id_student)) {
        return res.status(403).json({ error: `You cannot vote on your own ${target_type}` });
      }

      const existingVote = await Vote.findOne({
        where: { target_type, target_id, id_student },
      });

      if (existingVote) {
        if (existingVote.is_upvote === (is_upvote ?? true)) {
          await existingVote.destroy();
          return res.status(200).json({ message: 'Vote removed successfully', action: 'removed' });
        }
        existingVote.is_upvote = is_upvote ?? true;
        await existingVote.save();

        Promise.resolve(notifyVoteOnConnectedContent({
          ownerId: authorId,
          voterId: id_student,
          voterUser: req.user,
          targetType: target_type,
          targetId: target_id,
          isUpvote: existingVote.is_upvote,
        })).catch((notifyError) => console.error('Error notifying updated vote:', notifyError));

        return res.status(200).json({ message: 'Vote updated successfully', data: existingVote, action: 'updated' });
      }

      const newVote = await Vote.create({ target_type, target_id, id_student, is_upvote: is_upvote ?? true });

      Promise.resolve(notifyVoteOnConnectedContent({
        ownerId: authorId,
        voterId: id_student,
        voterUser: req.user,
        targetType: target_type,
        targetId: target_id,
        isUpvote: newVote.is_upvote,
      })).catch((notifyError) => console.error('Error notifying new vote:', notifyError));

      res.status(201).json({ message: 'Vote created successfully', data: newVote, action: 'added' });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ error: 'Student has already voted on this content' });
      }
      res.status(500).json({ error: 'Error creating vote', details: error.message });
    }
  },
};

module.exports = voteController;
