const { ActivityRecord, Activity } = require('../models');
const activityRecordService = require('../activityRecordService');

const activityRecordController = {
  getAll: async (req, res) => {
    try {
      const { studentId } = req.query;
      const records = studentId
        ? await activityRecordService.getActivityRecords(studentId)
        : await ActivityRecord.findAll({
            include: [{ model: Activity, attributes: ['id', 'name'] }],
            order: [['year', 'DESC'], ['semester', 'DESC']],
          });
      res.status(200).json({ data: records });
    } catch (error) {
      res.status(500).json({ error: 'Error fetching activity records', details: error.message });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const record = await ActivityRecord.findByPk(id, {
        include: [{ model: Activity, attributes: ['id', 'name'] }],
      });
      if (!record) {
        return res.status(404).json({ error: 'Activity record not found' });
      }
      res.status(200).json({ data: record });
    } catch (error) {
      res.status(500).json({ error: 'Error fetching activity record', details: error.message });
    }
  },

  create: async (req, res) => {
    try {
      const record = await activityRecordService.createActivityRecord(req.body, req.user.id);
      res.status(201).json({ message: 'Activity record created successfully', data: record });
    } catch (error) {
      if (error.name === 'DomainError') {
        return res.status(error.statusCode || 422).json({ error: error.message });
      }
      res.status(500).json({ error: 'Error creating activity record', details: error.message });
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const record = await activityRecordService.updateActivityRecord(id, req.body, req.user.id);
      res.status(200).json({ message: 'Activity record updated successfully', data: record });
    } catch (error) {
      if (error.name === 'DomainError') {
        return res.status(error.statusCode || 422).json({ error: error.message });
      }
      res.status(500).json({ error: 'Error updating activity record', details: error.message });
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await activityRecordService.deleteActivityRecord(id, req.user.id);
      res.status(200).json(result);
    } catch (error) {
      if (error.name === 'DomainError') {
        return res.status(error.statusCode || 422).json({ error: error.message });
      }
      res.status(500).json({ error: 'Error deleting activity record', details: error.message });
    }
  }
};

module.exports = activityRecordController;
