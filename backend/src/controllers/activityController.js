const { Activity } = require('../models');

const activityController = {
  getAll: async (req, res) => {
    try {
      const activities = await Activity.findAll({ order: [['name', 'ASC']] });
      res.status(200).json({ data: activities });
    } catch (error) {
      res.status(500).json({ error: 'Error fetching activities', details: error.message });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const activity = await Activity.findByPk(id);
      if (!activity) {
        return res.status(404).json({ error: 'Activity not found' });
      }
      res.status(200).json({ data: activity });
    } catch (error) {
      res.status(500).json({ error: 'Error fetching activity', details: error.message });
    }
  },

  create: async (req, res) => {
    try {
      const { name, code, description } = req.body;
      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Name is required' });
      }
      const activity = await Activity.create({ name: name.trim(), code: code || null, description });
      res.status(201).json({ data: activity });
    } catch (error) {
      res.status(500).json({ error: 'Error creating activity', details: error.message });
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, code, description } = req.body;
      const activity = await Activity.findByPk(id);
      if (!activity) {
        return res.status(404).json({ error: 'Activity not found' });
      }
      if (name !== undefined) activity.name = name.trim();
      if (code !== undefined) activity.code = code || null;
      if (description !== undefined) activity.description = description;
      await activity.save();
      res.status(200).json({ data: activity });
    } catch (error) {
      res.status(500).json({ error: 'Error updating activity', details: error.message });
    }
  },

  destroy: async (req, res) => {
    try {
      const { id } = req.params;
      const activity = await Activity.findByPk(id);
      if (!activity) {
        return res.status(404).json({ error: 'Activity not found' });
      }
      await activity.destroy();
      res.status(200).json({ data: { id } });
    } catch (error) {
      res.status(500).json({ error: 'Error deleting activity', details: error.message });
    }
  }
};

module.exports = activityController;
