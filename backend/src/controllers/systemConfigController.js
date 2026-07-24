const { SystemConfig } = require('../models');

const systemConfigController = {
  getAll: async (req, res) => {
    try {
      const configs = await SystemConfig.findAll();
      res.status(200).json({ data: configs });
    } catch (error) {
      res.status(500).json({ error: 'Error fetching system configs', details: error.message });
    }
  },

  getByKey: async (req, res) => {
    try {
      const { key } = req.params;
      const config = await SystemConfig.findByPk(key);
      if (!config) {
        return res.status(404).json({ error: 'Configuration key not found' });
      }
      res.status(200).json({ data: config });
    } catch (error) {
      res.status(500).json({ error: 'Error fetching system config', details: error.message });
    }
  },

  create: async (req, res) => {
    try {
      const data = req.body;
      const newConfig = await SystemConfig.create(data);
      res.status(201).json({ message: 'System configuration created successfully', data: newConfig });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ error: 'System configuration already exists' });
      }
      res.status(500).json({ error: 'Error creating system config', details: error.message });
    }
  },

  update: async (req, res) => {
    try {
      const { key } = req.params;
      const { value } = req.body;

      const config = await SystemConfig.findByPk(key);
      if (!config) {
        return res.status(404).json({ error: 'Configuration key not found' });
      }

      await config.update({ value });
      res.status(200).json({ message: 'System configuration updated successfully', data: config });
    } catch (error) {
      res.status(500).json({ error: 'Error updating system config', details: error.message });
    }
  },

  delete: async (req, res) => {
    try {
      const { key } = req.params;
      const deletedRows = await SystemConfig.destroy({ where: { key } });
      if (deletedRows === 0) {
        return res.status(404).json({ error: 'Configuration key not found' });
      }
      res.status(200).json({ message: `Configuration key: ${key} deleted successfully` });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ error: 'System configuration already exists' });
      }
      res.status(500).json({ error: 'Error updating system config', details: error.message });
    }
  }
};

module.exports = systemConfigController;
