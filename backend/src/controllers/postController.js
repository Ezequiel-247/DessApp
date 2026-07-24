const { Post, User } = require('../models');
const notificationService = require('../services/notificationService');

const formatUserName = (user) => {
  const fullName = `${user?.name || ''} ${user?.lastname || ''}`.trim();
  return fullName || 'Un contacto';
};

const notifyConnectionsForNewPost = async ({ authorId, title, requesterUser }) => {
  try {
    const connectionIds = await notificationService.getAcceptedConnectionIds(authorId);
    if (!connectionIds.length) {
      return;
    }

    let authorName = formatUserName(requesterUser);
    if (authorName === 'Un contacto') {
      const author = await User.findByPk(authorId, { attributes: ['name', 'lastname'] });
      authorName = formatUserName(author);
    }

    await Promise.all(connectionIds.map((connectedUserId) =>
      notificationService.createNotification({
        userId: connectedUserId,
        type: 'connection_post',
        title: 'Nuevo posteo de tu conexion',
        message: `${authorName} publico: ${title}`,
      })
    ));
  } catch (error) {
    console.error('Error creating connection post notifications:', error);
  }
};

const postController = {
  getAll: async (req, res) => {
    try {
      const { authorId } = req.query;
      const where = {};
      if (authorId) where.id_author = authorId;
      const posts = await Post.findAll({ where });
      res.status(200).json({ data: posts });
    } catch (error) {
      res.status(500).json({ error: 'Error fetching posts', details: error.message });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const post = await Post.findByPk(id);
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }
      res.status(200).json({ data: post });
    } catch (error) {
      res.status(500).json({ error: 'Error fetching post', details: error.message });
    }
  },

  create: async (req, res) => {
    try {
      const data = req.body;
      const authenticatedUserId = req.user?.id;
      const payload = {
        id_author: authenticatedUserId || data.id_author || data.authorId,
        title: data.title,
        content: data.content,
        images: Array.isArray(data.images) ? data.images : [],
        created_at: data.created_at || data.createdAt || new Date(),
      };
      const newPost = await Post.create(payload);

      Promise.resolve(notifyConnectionsForNewPost({
        authorId: payload.id_author,
        title: payload.title,
        requesterUser: req.user,
      })).catch((error) => console.error('Error notifying connections for post:', error));

      res.status(201).json({ message: 'Post created successfully', data: newPost });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ error: 'Post already exists' });
      }
      res.status(500).json({ error: 'Error creating post', details: error.message });
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const data = req.body;
      const requesterId = Number(req.user?.id);

      const existingPost = await Post.findByPk(id);
      if (!existingPost) {
        return res.status(404).json({ error: 'Post not found' });
      }

      if (!Number.isNaN(requesterId) && Number(existingPost.id_author) !== requesterId) {
        return res.status(403).json({ error: 'Forbidden: you can only update your own posts' });
      }

      const payload = {
        title: data.title,
        content: data.content,
      };

      const [updatedRows] = await Post.update(payload, { where: { id } });
      if (updatedRows === 0) {
        return res.status(404).json({ error: 'Post not found or no changes made' });
      }

      const updatedPost = await Post.findByPk(id);
      res.status(200).json({ message: 'Post updated successfully', data: updatedPost });
    } catch (error) {
      res.status(500).json({ error: 'Error updating post', details: error.message });
    }
  },

  uploadPostImages: async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No se subieron imagenes' });
      }

      const urls = req.files.map((f) => f.url || `/uploads/posts/${f.filename}`);
      return res.status(200).json({ data: urls });
    } catch (error) {
      return res.status(500).json({ error: 'Error uploading images', details: error.message });
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const requesterId = Number(req.user?.id);

      const existingPost = await Post.findByPk(id);
      if (!existingPost) {
        return res.status(404).json({ error: 'Post not found' });
      }

      if (!Number.isNaN(requesterId) && Number(existingPost.id_author) !== requesterId) {
        return res.status(403).json({ error: 'Forbidden: you can only delete your own posts' });
      }

      const deletedRows = await Post.destroy({ where: { id } });
      if (deletedRows === 0) {
        return res.status(404).json({ error: 'Post not found' });
      }
      res.status(200).json({ message: `Post with id: ${id} deleted successfully` });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ error: 'Post already exists' });
      }
      res.status(500).json({ error: 'Error updating post', details: error.message });
    }
  },
};

module.exports = postController;
