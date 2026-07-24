const { PlanUnahurBlock } = require('../models');

const planUnahurBlockController = {
  getAll: async (req, res) => {
    try {
      const { planId } = req.params;
      const where = {};
      if (planId) where.id_study_plan = planId;
      const blocks = await PlanUnahurBlock.findAll({ where });
      res.status(200).json({ data: blocks });
    } catch (error) {
      res.status(500).json({ error: 'Error fetching UNAHUR blocks', details: error.message });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const block = await PlanUnahurBlock.findByPk(id);
      if (!block) return res.status(404).json({ error: 'UNAHUR block not found' });
      res.status(200).json({ data: block });
    } catch (error) {
      res.status(500).json({ error: 'Error fetching UNAHUR block', details: error.message });
    }
  },

  create: async (req, res) => {
    try {
      const { planId } = req.params;
      const { suggested_year, suggested_term, sort_order } = req.body;
      const block = await PlanUnahurBlock.create({
        id_study_plan: planId,
        suggested_year,
        suggested_term: suggested_term || null,
        sort_order: sort_order || null,
      });
      res.status(201).json({ message: 'UNAHUR block created successfully', data: block });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ error: 'UNAHUR block already exists' });
      }
      res.status(500).json({ error: 'Error creating UNAHUR block', details: error.message });
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { suggested_year, suggested_term, sort_order } = req.body;
      const payload = {};
      if (suggested_year !== undefined) payload.suggested_year = suggested_year;
      if (suggested_term !== undefined) payload.suggested_term = suggested_term;
      if (sort_order !== undefined) payload.sort_order = sort_order;

      const [updated] = await PlanUnahurBlock.update(payload, { where: { id } });
      if (updated === 0) return res.status(404).json({ error: 'UNAHUR block not found or no changes made' });

      const updatedBlock = await PlanUnahurBlock.findByPk(id);
      res.status(200).json({ message: 'UNAHUR block updated successfully', data: updatedBlock });
    } catch (error) {
      res.status(500).json({ error: 'Error updating UNAHUR block', details: error.message });
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await PlanUnahurBlock.destroy({ where: { id } });
      if (deleted === 0) return res.status(404).json({ error: 'UNAHUR block not found' });
      res.status(200).json({ message: 'UNAHUR block deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Error deleting UNAHUR block', details: error.message });
    }
  },
};

module.exports = planUnahurBlockController;
