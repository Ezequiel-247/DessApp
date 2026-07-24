const { Notification } = require('../models');

const notificationController = {
  getAll: async (req, res) => {
    try {
      const { userId, read } = req.query;
      const where = {};
      where.id_user = userId || req.user.id;
      if (read !== undefined) where.read = read === 'true';
      const notifications = await Notification.findAll({ where });
      res.status(200).json({ data: notifications });
    } catch (error) {
      res.status(500).json({ error: 'Error fetching notifications', details: error.message });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const notification = await Notification.findByPk(id);
      if (!notification) {
        return res.status(404).json({ error: 'Notification not found' });
      }
      res.status(200).json({ data: notification });
    } catch (error) {
      res.status(500).json({ error: 'Error fetching notification', details: error.message });
    }
  },

  create: async (req, res) => {
    try {
      const data = req.body;
      const payload = {
        id_user: data.id_user || data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        target_type: data.target_type ?? data.targetType ?? null,
        target_id: data.target_id ?? data.targetId ?? null,
        read: data.read !== undefined ? data.read : false,
      };
      const newNotification = await Notification.create(payload);
      res.status(201).json({ message: 'Notification created successfully', data: newNotification });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ error: 'Notification already exists' });
      }
      res.status(500).json({ error: 'Error creating notification', details: error.message });
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const data = req.body;
      const payload = {};
      if (data.type !== undefined) payload.type = data.type;
      if (data.title !== undefined) payload.title = data.title;
      if (data.message !== undefined) payload.message = data.message;
      if (data.target_type !== undefined || data.targetType !== undefined) {
        payload.target_type = data.target_type ?? data.targetType;
      }
      if (data.target_id !== undefined || data.targetId !== undefined) {
        payload.target_id = data.target_id ?? data.targetId;
      }
      if (data.read !== undefined) payload.read = data.read;

      if (Object.keys(payload).length === 0) {
        return res.status(400).json({ error: 'No fields provided for update' });
      }

      const [updatedRows] = await Notification.update(payload, { where: { id } });
      if (updatedRows === 0) {
        return res.status(404).json({ error: 'Notification not found or no changes made' });
      }

      const updatedNotification = await Notification.findByPk(id);
      res.status(200).json({ message: 'Notification updated successfully', data: updatedNotification });
    } catch (error) {
      res.status(500).json({ error: 'Error updating notification', details: error.message });
    }
  },

  markAllAsRead: async (req, res) => {
    try {
      const idUser = req.body.userId || req.body.id_user || req.user.id;
      const [updatedRows] = await Notification.update(
        { read: true },
        {
          where: {
            id_user: idUser,
            read: false,
          },
        },
      );

      res.status(200).json({
        message: 'All notifications marked as read',
        data: { updated: updatedRows },
      });
    } catch (error) {
      res.status(500).json({ error: 'Error marking notifications as read', details: error.message });
    }
  },

  unreadCount: async (req, res) => {
    try {
      const idUser = req.query.userId || req.user.id;
      const count = await Notification.count({
        where: {
          id_user: idUser,
          read: false,
        },
      });

      res.status(200).json({ data: { count } });
    } catch (error) {
      res.status(500).json({ error: 'Error fetching unread notifications count', details: error.message });
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const deletedRows = await Notification.destroy({ where: { id } });
      if (deletedRows === 0) {
        return res.status(404).json({ error: 'Notification not found' });
      }
      res.status(200).json({ message: `Notification with id: ${id} deleted successfully` });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ error: 'Notification already exists' });
      }
      res.status(500).json({ error: 'Error updating notification', details: error.message });
    }
  },
};

module.exports = notificationController;
