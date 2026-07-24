const { Op } = require('sequelize');
const { Connection, AcademicRecord, Post, Vote, Comment, Student, User, Subject } = require('../models');

const STATUS_EVENT_MAP = {
  enrolled: 'enrollment',
  inscripto: 'enrollment',
  inscrito: 'enrollment',
  pendiente: 'enrollment',
  cursando: 'enrollment',
  regular: 'regularization',
  regularizado: 'regularization',
  regularizada: 'regularization',
  approved: 'approval',
  aprobado: 'approval',
  aprobada: 'approval',
};

const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 0) return fallback;
  return parsed;
};

const normalizeDate = (value) => {
  const date = value ? new Date(value) : new Date(0);
  if (Number.isNaN(date.getTime())) return new Date(0);
  return date;
};

const mapAcademicEventType = (status) => {
  const normalizedStatus = String(status || '').trim().toLowerCase();
  return STATUS_EVENT_MAP[normalizedStatus] || null;
};

const buildCommentCountMap = async (items) => {
  if (!Array.isArray(items) || items.length === 0) return new Map();

  const targetMap = new Map();
  items.forEach((item) => {
    if (!item?.targetType || !item?.targetId) return;
    const key = `${item.targetType}:${item.targetId}`;
    if (!targetMap.has(key)) {
      targetMap.set(key, {
        target_type: item.targetType,
        target_id: item.targetId,
      });
    }
  });

  const targets = Array.from(targetMap.values());
  if (targets.length === 0) return new Map();

  const comments = await Comment.findAll({
    where: {
      [Op.or]: targets,
    },
    attributes: ['target_type', 'target_id'],
  });

  const countMap = new Map();
  comments.forEach((comment) => {
    const key = `${comment.target_type}:${comment.target_id}`;
    countMap.set(key, (countMap.get(key) || 0) + 1);
  });

  return countMap;
};

const formatUserName = (user) => {
  const fullName = `${user?.name || ''} ${user?.lastname || ''}`.trim();
  return fullName || 'Usuario';
};

const getAcceptedContactIds = async (userId) => {
  const connections = await Connection.findAll({
    where: {
      status: 'accepted',
      [Op.or]: [
        { id_user: userId },
        { id_connected_user: userId },
      ],
    },
    attributes: ['id_user', 'id_connected_user'],
  });

  const contactIds = new Set();
  connections.forEach((connection) => {
    const raw = connection.toJSON ? connection.toJSON() : connection;
    const userA = Number(raw.id_user);
    const userB = Number(raw.id_connected_user);

    if (!Number.isNaN(userA) && userA !== Number(userId)) contactIds.add(userA);
    if (!Number.isNaN(userB) && userB !== Number(userId)) contactIds.add(userB);
  });

  return Array.from(contactIds);
};

const noveltyController = {
  getFeed: async (req, res) => {
    try {
      const userId = Number(req.user?.id || req.query.userId);
      if (!userId || Number.isNaN(userId)) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const limit = parsePositiveInt(req.query.limit, 20);
      const offset = parsePositiveInt(req.query.offset, 0);

      const contactIds = await getAcceptedContactIds(userId);

      const postAuthorIds = Array.from(new Set([userId, ...contactIds]));

      const visibleAcademicStudents = contactIds.length > 0
        ? await Student.findAll({
            where: {
              user_id: { [Op.in]: contactIds },
              publish_approvals: true,
            },
            attributes: ['user_id'],
          })
        : [];

      const visibleAcademicStudentIds = visibleAcademicStudents
        .map((student) => Number(student.user_id))
        .filter((id) => !Number.isNaN(id));

      const [academicRecords, posts] = await Promise.all([
        AcademicRecord.findAll({
          where: {
            id_student: { [Op.in]: visibleAcademicStudentIds },
          },
          include: [
            { model: User, attributes: ['id', 'name', 'lastname', 'avatar'] },
            { model: Subject, attributes: ['id', 'name', 'code'] },
          ],
        }),
        Post.findAll({
          where: { id_author: { [Op.in]: postAuthorIds } },
          include: [
            {
              model: Student,
              include: [{ model: User, attributes: ['id', 'name', 'lastname', 'avatar'] }],
            },
          ],
        }),
      ]);

      const academicVotesMap = new Map();
      const postVotesMap = new Map();

      if (academicRecords.length > 0) {
        const viewerVotes = await Vote.findAll({
          where: { target_type: 'academic_event', target_id: academicRecords.map((r) => r.id), id_student: userId },
          attributes: ['target_id', 'is_upvote'],
        });
        for (const v of viewerVotes) {
          academicVotesMap.set(v.target_id, v.is_upvote ? 'up' : 'down');
        }
      }

      if (posts.length > 0) {
        const viewerVotes = await Vote.findAll({
          where: { target_type: 'post', target_id: posts.map((p) => p.id), id_student: userId },
          attributes: ['target_id', 'is_upvote'],
        });
        for (const v of viewerVotes) {
          postVotesMap.set(v.target_id, v.is_upvote ? 'up' : 'down');
        }
      }

      const academicItems = academicRecords
        .map((record) => {
        const eventType = mapAcademicEventType(record.status);
        if (!eventType) return null;

        const author = record.User;
        const subject = record.Subject;
        const date = normalizeDate(record.updatedAt || record.createdAt);

        return {
          id: `academic-${record.id}`,
          type: 'academic_event',
          targetType: 'academic_event',
          targetId: record.id,
          eventType,
          status: record.status,
          title: subject?.name || 'Materia',
          subjectCode: subject?.code || null,
          author: {
            id: record.id_student,
            name: formatUserName(author),
            avatar: author?.avatar || null,
          },
          likes_count: record.likes_count,
          dislikes_count: record.dislikes_count,
          total_upvotes: record.total_upvotes,
          valoracion_ratio: record.valoracion_ratio,
          my_vote: academicVotesMap.get(record.id) || null,
          date: date.toISOString(),
        };
      })
        .filter(Boolean);

      const postItems = posts.map((post) => {
        const author = post.Student?.User;
        const date = normalizeDate(post.created_at);

        return {
          id: `post-${post.id}`,
          type: 'post',
          targetType: 'post',
          targetId: post.id,
          postId: post.id,
          title: post.title,
          content: post.content,
          images: post.images || [],
          author: {
            id: post.id_author,
            name: formatUserName(author),
            avatar: author?.avatar || null,
          },
          likes_count: post.likes_count,
          dislikes_count: post.dislikes_count,
          total_upvotes: post.total_upvotes,
          valoracion_ratio: post.valoracion_ratio,
          my_vote: postVotesMap.get(post.id) || null,
          date: date.toISOString(),
        };
      });

      const merged = [...academicItems, ...postItems].sort(
        (a, b) => normalizeDate(b.date).getTime() - normalizeDate(a.date).getTime()
      );

      const paginated = merged.slice(offset, offset + limit);
      const commentCountMap = await buildCommentCountMap(paginated);
      const data = paginated.map((item) => ({
        ...item,
        commentCount: commentCountMap.get(`${item.targetType}:${item.targetId}`) || 0,
      }));

      return res.status(200).json({
        data,
        pagination: {
          total: merged.length,
          limit,
          offset,
          hasMore: offset + limit < merged.length,
        },
      });
    } catch (error) {
      return res.status(500).json({ error: 'Error fetching novelties', details: error.message });
    }
  },
};

module.exports = noveltyController;