const {
  CustomStudyPlan,
  CustomStudyPlanElectiveChoice,
  PlanElectiveBlock,
  PlanElectiveBlockSubject,
} = require('../models');

const customStudyPlanElectiveChoiceController = {
  getAll: async (req, res) => {
    try {
      const { planId } = req.params;
      const choices = await CustomStudyPlanElectiveChoice.findAll({
        where: { id_custom_study_plan: planId },
      });
      res.status(200).json({ data: choices });
    } catch (error) {
      res.status(500).json({ error: 'Error fetching elective choices', details: error.message });
    }
  },

  create: async (req, res) => {
    try {
      const { planId } = req.params;
      const { id_elective_block, plan_subject_id } = req.body;

      const plan = await CustomStudyPlan.findByPk(planId);
      if (!plan) {
        return res.status(404).json({ error: 'Custom study plan not found' });
      }

      const block = await PlanElectiveBlock.findByPk(id_elective_block);
      if (!block) {
        return res.status(404).json({ error: 'Elective block not found' });
      }

      const belongsToBlock = await PlanElectiveBlockSubject.findOne({
        where: { id_elective_block, id_plan_subject: plan_subject_id },
      });
      if (!belongsToBlock) {
        return res.status(400).json({ error: 'La materia no pertenece a este bloque electivo' });
      }

      const existing = await CustomStudyPlanElectiveChoice.findOne({
        where: { id_custom_study_plan: planId, plan_subject_id },
      });
      if (!existing) {
        const currentCount = await CustomStudyPlanElectiveChoice.count({
          where: { id_custom_study_plan: planId, id_elective_block },
        });
        if (currentCount >= block.min_required) {
          return res.status(409).json({
            error: `Ya elegiste el máximo de materias para "${block.name}" (${block.min_required}).`,
          });
        }
      }

      const [choice] = await CustomStudyPlanElectiveChoice.findOrCreate({
        where: { id_custom_study_plan: planId, plan_subject_id },
        defaults: { id_elective_block },
      });

      res.status(201).json({ message: 'Elective choice created successfully', data: choice });
    } catch (error) {
      res.status(500).json({ error: 'Error creating elective choice', details: error.message });
    }
  },

  delete: async (req, res) => {
    try {
      const { planId } = req.params;
      const { plan_subject_id } = req.query;

      const deletedCount = await CustomStudyPlanElectiveChoice.destroy({
        where: { id_custom_study_plan: planId, plan_subject_id },
      });
      if (deletedCount === 0) {
        return res.status(404).json({ error: 'Elective choice not found' });
      }

      res.status(200).json({ message: 'Elective choice deleted successfully', deletedCount });
    } catch (error) {
      res.status(500).json({ error: 'Error deleting elective choice', details: error.message });
    }
  },
};

module.exports = customStudyPlanElectiveChoiceController;
