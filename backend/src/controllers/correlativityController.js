const { Correlativity, PlanSubject, Subject } = require('../models');

const correlativityController = {
  getAll: async (req, res) => {
    try {
      const where = {};
      if (req.query.id_plan_subject_target) {
        where.id_plan_subject_target = req.query.id_plan_subject_target;
      }
      const correlativities = await Correlativity.findAll({
        where,
        include: [
          { model: PlanSubject, as: 'targetPlanSubject' },
          { model: PlanSubject, as: 'requiredPlanSubject', include: [{ model: Subject, as: 'subject' }] }
        ]
      });
      res.status(200).json({ data: correlativities });
    } catch (error) {
      res.status(500).json({ error: 'Error fetching correlativities', details: error.message });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const correlativity = await Correlativity.findByPk(id, {
        include: [
          { model: PlanSubject, as: 'targetPlanSubject' },
          { model: PlanSubject, as: 'requiredPlanSubject' }
        ]
      });
      if (!correlativity) {
        return res.status(404).json({ error: 'Correlativity not found' });
      }
      res.status(200).json({ data: correlativity });
    } catch (error) {
      res.status(500).json({ error: 'Error fetching correlativity', details: error.message });
    }
  },

  create: async (req, res) => {
    try {
      const data = req.body;
      const newCorrelativity = await Correlativity.create(data);
      res.status(201).json({ message: 'Correlativity created successfully', data: newCorrelativity });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ error: 'Correlativity already exists' });
      }
      res.status(500).json({ error: 'Error creating correlativity', details: error.message });
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const data = req.body;

      const [updatedRows] = await Correlativity.update(data, { where: { id } });
      if (updatedRows === 0) {
        return res.status(404).json({ error: 'Correlativity not found or no changes made' });
      }

      const updatedCorrelativity = await Correlativity.findByPk(id);
      res.status(200).json({ message: 'Correlativity updated successfully', data: updatedCorrelativity });
    } catch (error) {
      res.status(500).json({ error: 'Error updating correlativity', details: error.message });
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const deletedRows = await Correlativity.destroy({ where: { id } });
      if (deletedRows === 0) {
        return res.status(404).json({ error: 'Correlativity not found' });
      }
      res.status(200).json({ message: `Correlativity with id: ${id} deleted successfully` });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ error: 'Correlativity already exists' });
      }
      res.status(500).json({ error: 'Error updating correlativity', details: error.message });
    }
  }
};

module.exports = correlativityController;
