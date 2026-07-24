const { PlanCreditBlock, PlanCreditBlockItem, Activity } = require('../models');

const planCreditBlockController = {
  getAll: async (req, res) => {
    try {
      const { planId } = req.params;
      const where = {};
      if (planId) where.id_study_plan = planId;
      const blocks = await PlanCreditBlock.findAll({
        where,
        include: [{ model: PlanCreditBlockItem, as: 'items', include: [{ model: Activity }] }],
      });
      res.status(200).json({ data: blocks });
    } catch (error) {
      res.status(500).json({ error: 'Error fetching credit blocks', details: error.message });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const block = await PlanCreditBlock.findByPk(id);
      if (!block) return res.status(404).json({ error: 'Credit block not found' });
      res.status(200).json({ data: block });
    } catch (error) {
      res.status(500).json({ error: 'Error fetching credit block', details: error.message });
    }
  },

  create: async (req, res) => {
    try {
      const { planId } = req.params;
      const { name, min_credits_required, max_credits_allowed, sort_order } = req.body;
      const block = await PlanCreditBlock.create({
        id_study_plan: planId,
        name,
        min_credits_required: min_credits_required || null,
        max_credits_allowed: max_credits_allowed || null,
        sort_order: sort_order || null,
      });
      res.status(201).json({ message: 'Credit block created successfully', data: block });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ error: 'Credit block already exists' });
      }
      res.status(500).json({ error: 'Error creating credit block', details: error.message });
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, min_credits_required, max_credits_allowed, sort_order } = req.body;
      const payload = {};
      if (name !== undefined) payload.name = name;
      if (min_credits_required !== undefined) payload.min_credits_required = min_credits_required;
      if (max_credits_allowed !== undefined) payload.max_credits_allowed = max_credits_allowed;
      if (sort_order !== undefined) payload.sort_order = sort_order;

      const [updated] = await PlanCreditBlock.update(payload, { where: { id } });
      if (updated === 0) return res.status(404).json({ error: 'Credit block not found or no changes made' });

      const updatedBlock = await PlanCreditBlock.findByPk(id);
      res.status(200).json({ message: 'Credit block updated successfully', data: updatedBlock });
    } catch (error) {
      res.status(500).json({ error: 'Error updating credit block', details: error.message });
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await PlanCreditBlock.destroy({ where: { id } });
      if (deleted === 0) return res.status(404).json({ error: 'Credit block not found' });
      res.status(200).json({ message: 'Credit block deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Error deleting credit block', details: error.message });
    }
  },
};

module.exports = planCreditBlockController;
