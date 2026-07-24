const { PlanSubject } = require('../models');

const planSubjectController = {
  getAll: async (req, res) => {
    try {
      const { planId, subjectId } = req.query;
      const where = {};
      if (planId) where.id_study_plan = planId;
      if (subjectId) where.id_subject = subjectId;

      const planSubjects = await PlanSubject.findAll({ where });
      res.status(200).json({ data: planSubjects });
    } catch (error) {
      res.status(500).json({ error: 'Error fetching plan subjects', details: error.message });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const planSubject = await PlanSubject.findByPk(id);
      if (!planSubject) {
        return res.status(404).json({ error: 'Plan subject not found' });
      }
      res.status(200).json({ data: planSubject });
    } catch (error) {
      res.status(500).json({ error: 'Error fetching plan subject', details: error.message });
    }
  },

  create: async (req, res) => {
    try {
      const data = req.body;
      const payload = {
        id_study_plan: data.id_study_plan || data.planId,
        id_subject: data.id_subject || data.subjectId,
        suggested_year: data.suggested_year ?? data.suggestedYear ?? data.year ?? null,
        suggested_term: data.suggested_term ?? data.suggestedTerm ?? data.semester ?? null,
        credits: data.credits !== undefined ? data.credits : null,
        is_elective: data.is_elective !== undefined ? data.is_elective : false,
        is_final_project: data.is_final_project !== undefined ? data.is_final_project : false,
      };

      const created = await PlanSubject.create(payload);
      res.status(201).json({ message: 'Plan subject created', data: created });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ error: 'Plan subject already exists' });
      }
      res.status(500).json({ error: 'Error creating plan subject', details: error.message });
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const data = req.body;
      const payload = {
        id_study_plan: data.id_study_plan || data.planId,
        id_subject: data.id_subject || data.subjectId,
        suggested_year: data.suggested_year ?? data.suggestedYear ?? data.year ?? null,
        suggested_term: data.suggested_term ?? data.suggestedTerm ?? data.semester ?? null,
        credits: data.credits,
        is_elective: data.is_elective,
        is_final_project: data.is_final_project,
      };

      const [updatedRows] = await PlanSubject.update(payload, { where: { id } });
      if (updatedRows === 0) {
        return res.status(404).json({ error: 'Plan subject not found or no changes made' });
      }

      const updated = await PlanSubject.findByPk(id);
      res.status(200).json({ message: 'Plan subject updated', data: updated });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ error: 'Plan subject already exists' });
      }
      res.status(500).json({ error: 'Error updating plan subject', details: error.message });
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const deletedRows = await PlanSubject.destroy({ where: { id } });
      if (deletedRows === 0) {
        return res.status(404).json({ error: 'Plan subject not found' });
      }

      res.status(200).json({ message: `Plan subject ${id} deleted` });
    } catch (error) {
      res.status(500).json({ error: 'Error deleting plan subject', details: error.message });
    }
  },
};

module.exports = planSubjectController;
