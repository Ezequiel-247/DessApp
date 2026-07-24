const { PlanElectiveBlock, PlanElectiveBlockSubject } = require('../models');

const planElectiveBlockController = {
  getAll: async (req, res) => {
    try {
      const { planId } = req.params;
      const where = {};
      if (planId) where.id_study_plan = planId;
      const blocks = await PlanElectiveBlock.findAll({
        where,
        include: [{ model: PlanElectiveBlockSubject }],
      });
      res.status(200).json({ data: blocks });
    } catch (error) {
      res.status(500).json({ error: 'Error fetching elective blocks', details: error.message });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const block = await PlanElectiveBlock.findByPk(id, {
        include: [{ model: PlanElectiveBlockSubject }],
      });
      if (!block) return res.status(404).json({ error: 'Elective block not found' });
      res.status(200).json({ data: block });
    } catch (error) {
      res.status(500).json({ error: 'Error fetching elective block', details: error.message });
    }
  },

  create: async (req, res) => {
    try {
      const { planId } = req.params;
      const { name, min_required, requires_approved_mandatory_count, suggested_year, sort_order } = req.body;
      const block = await PlanElectiveBlock.create({
        id_study_plan: planId,
        name,
        min_required: min_required !== undefined ? min_required : 1,
        requires_approved_mandatory_count: requires_approved_mandatory_count !== undefined ? requires_approved_mandatory_count : 0,
        suggested_year: suggested_year || null,
        sort_order: sort_order || null,
      });
      res.status(201).json({ message: 'Elective block created successfully', data: block });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ error: 'Elective block already exists' });
      }
      res.status(500).json({ error: 'Error creating elective block', details: error.message });
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, min_required, requires_approved_mandatory_count, suggested_year, sort_order } = req.body;
      const payload = {};
      if (name !== undefined) payload.name = name;
      if (min_required !== undefined) payload.min_required = min_required;
      if (requires_approved_mandatory_count !== undefined) payload.requires_approved_mandatory_count = requires_approved_mandatory_count;
      if (suggested_year !== undefined) payload.suggested_year = suggested_year;
      if (sort_order !== undefined) payload.sort_order = sort_order;

      const [updated] = await PlanElectiveBlock.update(payload, { where: { id } });
      if (updated === 0) return res.status(404).json({ error: 'Elective block not found or no changes made' });

      const updatedBlock = await PlanElectiveBlock.findByPk(id);
      res.status(200).json({ message: 'Elective block updated successfully', data: updatedBlock });
    } catch (error) {
      res.status(500).json({ error: 'Error updating elective block', details: error.message });
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await PlanElectiveBlock.destroy({ where: { id } });
      if (deleted === 0) return res.status(404).json({ error: 'Elective block not found' });
      res.status(200).json({ message: 'Elective block deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Error deleting elective block', details: error.message });
    }
  },

  getBlockSubjects: async (req, res) => {
    try {
      const { blockId } = req.params;
      const subjects = await PlanElectiveBlockSubject.findAll({
        where: { id_elective_block: blockId },
      });
      res.status(200).json({ data: subjects });
    } catch (error) {
      res.status(500).json({ error: 'Error fetching block subjects', details: error.message });
    }
  },

  addBlockSubject: async (req, res) => {
    try {
      const { blockId } = req.params;
      const { id_plan_subject } = req.body;
      const link = await PlanElectiveBlockSubject.create({
        id_elective_block: blockId,
        id_plan_subject,
      });
      res.status(201).json({ message: 'Subject added to elective block successfully', data: link });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ error: 'Subject already exists in this elective block' });
      }
      res.status(500).json({ error: 'Error adding subject to elective block', details: error.message });
    }
  },

  removeBlockSubject: async (req, res) => {
    try {
      const { subjectId } = req.params;
      const deleted = await PlanElectiveBlockSubject.destroy({ where: { id: subjectId } });
      if (deleted === 0) return res.status(404).json({ error: 'Block subject not found' });
      res.status(200).json({ message: 'Subject removed from elective block successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Error removing subject from elective block', details: error.message });
    }
  },
};

module.exports = planElectiveBlockController;
