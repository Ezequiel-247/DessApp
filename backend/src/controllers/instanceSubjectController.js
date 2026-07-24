const { InstanceSubject } = require('../models');

const instanceSubjectController = {
  getAll: async (req, res) => {
    try {
      const { subjectId, term } = req.query;
      const where = {};
      if (subjectId) where.id_subject = subjectId;
      if (term) where.term = term;
      const instances = await InstanceSubject.findAll({ where });
      res.status(200).json({ data: instances });
    } catch (error) {
      res.status(500).json({ error: 'Error fetching instance subjects', details: error.message });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const instance = await InstanceSubject.findByPk(id);
      if (!instance) {
        return res.status(404).json({ error: 'Instance subject not found' });
      }
      res.status(200).json({ data: instance });
    } catch (error) {
      res.status(500).json({ error: 'Error fetching instance subject', details: error.message });
    }
  },

  create: async (req, res) => {
    try {
      const data = req.body;
      const payload = {
        id_subject: data.id_subject || data.subjectId,
        comision: data.comision,
        professor: data.professor,
        schedule: data.schedule,
        classroom: data.classroom,
        is_exam: data.is_exam !== undefined ? data.is_exam : false,
        regularity_expires_at: data.regularity_expires_at || data.regularityExpiresAt || null,
        term: data.term,
      };
      const newInstance = await InstanceSubject.create(payload);
      res.status(201).json({ message: 'Instance subject created successfully', data: newInstance });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ error: 'Instance subject already exists' });
      }
      res.status(500).json({ error: 'Error creating instance subject', details: error.message });
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const data = req.body;
      const payload = {
        comision: data.comision,
        professor: data.professor,
        schedule: data.schedule,
        classroom: data.classroom,
        is_exam: data.is_exam,
        regularity_expires_at: data.regularity_expires_at || data.regularityExpiresAt,
        term: data.term,
      };

      const [updatedRows] = await InstanceSubject.update(payload, { where: { id } });
      if (updatedRows === 0) {
        return res.status(404).json({ error: 'Instance subject not found or no changes made' });
      }

      const updatedInstance = await InstanceSubject.findByPk(id);
      res.status(200).json({ message: 'Instance subject updated successfully', data: updatedInstance });
    } catch (error) {
      res.status(500).json({ error: 'Error updating instance subject', details: error.message });
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const deletedRows = await InstanceSubject.destroy({ where: { id } });
      if (deletedRows === 0) {
        return res.status(404).json({ error: 'Instance subject not found' });
      }
      res.status(200).json({ message: `Instance subject with id: ${id} deleted successfully` });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ error: 'Instance subject already exists' });
      }
      res.status(500).json({ error: 'Error updating instance subject', details: error.message });
    }
  },
};

module.exports = instanceSubjectController;
