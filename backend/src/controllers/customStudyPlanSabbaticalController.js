const { CustomStudyPlan, CustomStudyPlanSabbatical } = require('../models');

const customStudyPlanSabbaticalController = {
  getAll: async (req, res) => {
    try {
      const { planId } = req.params;
      const sabbaticals = await CustomStudyPlanSabbatical.findAll({
        where: { id_custom_study_plan: planId },
        order: [['year', 'ASC'], ['term', 'ASC']],
      });
      res.status(200).json({ data: sabbaticals });
    } catch (error) {
      res.status(500).json({ error: 'Error fetching sabbatical periods', details: error.message });
    }
  },

  create: async (req, res) => {
    try {
      const { planId } = req.params;
      const { year, terms } = req.body;

      const plan = await CustomStudyPlan.findByPk(planId);
      if (!plan) {
        return res.status(404).json({ error: 'Custom study plan not found' });
      }

      // findOrCreate por término: si el período ya estaba marcado como sabático, no falla, lo devuelve tal cual.
      const rows = await Promise.all(
        terms.map((term) =>
          CustomStudyPlanSabbatical.findOrCreate({
            where: { id_custom_study_plan: planId, year, term },
          }).then(([row]) => row)
        )
      );

      res.status(201).json({ message: 'Sabbatical period created successfully', data: rows });
    } catch (error) {
      res.status(500).json({ error: 'Error creating sabbatical period', details: error.message });
    }
  },

  delete: async (req, res) => {
    try {
      const { planId } = req.params;
      const { year, term } = req.query;

      const where = { id_custom_study_plan: planId, year };
      if (term !== undefined) where.term = term;

      const deletedCount = await CustomStudyPlanSabbatical.destroy({ where });
      if (deletedCount === 0) {
        return res.status(404).json({ error: 'Sabbatical period not found' });
      }

      res.status(200).json({ message: 'Sabbatical period(s) deleted successfully', deletedCount });
    } catch (error) {
      res.status(500).json({ error: 'Error deleting sabbatical period', details: error.message });
    }
  },
};

module.exports = customStudyPlanSabbaticalController;
