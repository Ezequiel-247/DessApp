const { ReportReason } = require('../models');

const reportReasonController = {
  getAll: async (req, res) => {
    try {
      const reasons = await ReportReason.findAll();
      res.status(200).json({ data: reasons });
    } catch (error) {
      res.status(500).json({ error: 'Error fetching report reasons', details: error.message });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const reason = await ReportReason.findByPk(id);
      if (!reason) {
        return res.status(404).json({ error: 'Report reason not found' });
      }
      res.status(200).json({ data: reason });
    } catch (error) {
      res.status(500).json({ error: 'Error fetching report reason', details: error.message });
    }
  },

  create: async (req, res) => {
    try {
      const data = req.body;
      const payload = {
        name: data.name,
        description: data.description,
      };
      const newReason = await ReportReason.create(payload);
      res.status(201).json({ message: 'Report reason created successfully', data: newReason });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ error: 'Report reason already exists' });
      }
      res.status(500).json({ error: 'Error creating report reason', details: error.message });
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const data = req.body;
      const payload = {
        name: data.name,
        description: data.description,
      };

      const [updatedRows] = await ReportReason.update(payload, { where: { id } });
      if (updatedRows === 0) {
        return res.status(404).json({ error: 'Report reason not found or no changes made' });
      }

      const updatedReason = await ReportReason.findByPk(id);
      res.status(200).json({ message: 'Report reason updated successfully', data: updatedReason });
    } catch (error) {
      res.status(500).json({ error: 'Error updating report reason', details: error.message });
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const deletedRows = await ReportReason.destroy({ where: { id } });
      if (deletedRows === 0) {
        return res.status(404).json({ error: 'Report reason not found' });
      }
      res.status(200).json({ message: `Report reason with id: ${id} deleted successfully` });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ error: 'Report reason already exists' });
      }
      res.status(500).json({ error: 'Error updating report reason', details: error.message });
    }
  },
};

module.exports = reportReasonController;
