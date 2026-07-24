const {
  CustomStudyPlan,
  CustomStudyPlanUnahurChoice,
  PlanUnahurBlock,
  PlanSubject,
  Subject,
} = require('../models');

const customStudyPlanUnahurChoiceController = {
  getAll: async (req, res) => {
    try {
      const { planId } = req.params;
      const choices = await CustomStudyPlanUnahurChoice.findAll({
        where: { id_custom_study_plan: planId },
      });
      res.status(200).json({ data: choices });
    } catch (error) {
      res.status(500).json({ error: 'Error fetching UNAHUR choices', details: error.message });
    }
  },

  create: async (req, res) => {
    try {
      const { planId } = req.params;
      const { id_unahur_block, plan_subject_id } = req.body;

      const plan = await CustomStudyPlan.findByPk(planId);
      if (!plan) {
        return res.status(404).json({ error: 'Custom study plan not found' });
      }

      const block = await PlanUnahurBlock.findByPk(id_unahur_block);
      if (!block) {
        return res.status(404).json({ error: 'UNAHUR block not found' });
      }

      const planSubject = await PlanSubject.findByPk(plan_subject_id, {
        include: [{ model: Subject, as: 'subject' }],
      });
      if (!planSubject || !planSubject.subject?.is_unahur) {
        return res.status(400).json({ error: 'La materia no es una materia UNAHUR' });
      }
      if (planSubject.id_study_plan !== block.id_study_plan) {
        return res.status(400).json({ error: 'La materia no pertenece al plan de estudio de este bloque' });
      }

      const existing = await CustomStudyPlanUnahurChoice.findOne({
        where: { id_custom_study_plan: planId, plan_subject_id },
      });
      if (!existing) {
        const currentCount = await CustomStudyPlanUnahurChoice.count({
          where: { id_custom_study_plan: planId, id_unahur_block },
        });
        if (currentCount >= 1) {
          return res.status(409).json({
            error: 'Ya elegiste una materia UNAHUR para este período.',
          });
        }
      }

      const [choice] = await CustomStudyPlanUnahurChoice.findOrCreate({
        where: { id_custom_study_plan: planId, plan_subject_id },
        defaults: { id_unahur_block },
      });

      res.status(201).json({ message: 'UNAHUR choice created successfully', data: choice });
    } catch (error) {
      res.status(500).json({ error: 'Error creating UNAHUR choice', details: error.message });
    }
  },

  delete: async (req, res) => {
    try {
      const { planId } = req.params;
      const { plan_subject_id } = req.query;

      const deletedCount = await CustomStudyPlanUnahurChoice.destroy({
        where: { id_custom_study_plan: planId, plan_subject_id },
      });
      if (deletedCount === 0) {
        return res.status(404).json({ error: 'UNAHUR choice not found' });
      }

      res.status(200).json({ message: 'UNAHUR choice deleted successfully', deletedCount });
    } catch (error) {
      res.status(500).json({ error: 'Error deleting UNAHUR choice', details: error.message });
    }
  },
};

module.exports = customStudyPlanUnahurChoiceController;
