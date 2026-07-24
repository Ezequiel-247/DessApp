const { Session } = require('../models');

const sessionController = {
  getAll: async (req, res) => {
    try {
      const { userId } = req.query;
      const where = {};
      if (userId) where.id_user = userId;
      const sessions = await Session.findAll({ where });
      res.status(200).json({ data: sessions });
    } catch (error) {
      res.status(500).json({ error: 'Error fetching sessions', details: error.message });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const session = await Session.findByPk(id);
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }
      res.status(200).json({ data: session });
    } catch (error) {
      res.status(500).json({ error: 'Error fetching session', details: error.message });
    }
  },

  create: async (req, res) => {
    try {
      const data = req.body;
      const payload = {
        id_user: data.id_user || data.userId,
        token: data.token,
        expires_at: data.expires_at || data.expiresAt || null,
      };
      const newSession = await Session.create(payload);
      res.status(201).json({ message: 'Session created successfully', data: newSession });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ error: 'Session already exists' });
      }
      res.status(500).json({ error: 'Error creating session', details: error.message });
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const data = req.body;
      const payload = {
        token: data.token,
        expires_at: data.expires_at || data.expiresAt,
      };

      const [updatedRows] = await Session.update(payload, { where: { id } });
      if (updatedRows === 0) {
        return res.status(404).json({ error: 'Session not found or no changes made' });
      }

      const updatedSession = await Session.findByPk(id);
      res.status(200).json({ message: 'Session updated successfully', data: updatedSession });
    } catch (error) {
      res.status(500).json({ error: 'Error updating session', details: error.message });
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const deletedRows = await Session.destroy({ where: { id } });
      if (deletedRows === 0) {
        return res.status(404).json({ error: 'Session not found' });
      }
      res.status(200).json({ message: `Session with id: ${id} deleted successfully` });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ error: 'Session already exists' });
      }
      res.status(500).json({ error: 'Error updating session', details: error.message });
    }
  },
};

module.exports = sessionController;
