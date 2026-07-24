const { CustomStudyPlan, CustomStudyPlanItem, CustomStudyPlanSabbatical, CustomStudyPlanElectiveChoice, CustomStudyPlanUnahurChoice, PlanSubject, Subject, StudentCareerEnrollment, sequelize } = require('../models');
const deviationService = require('../services/deviationService');

const planIncludes = [
  { model: CustomStudyPlanItem, as: 'items', include: [
    { model: PlanSubject, as: 'plan_subject', include: [{ model: Subject, as: 'subject' }] },
  ]},
  { model: CustomStudyPlanSabbatical, as: 'sabbaticals' },
  { model: CustomStudyPlanElectiveChoice, as: 'elective_choices' },
  { model: CustomStudyPlanUnahurChoice, as: 'unahur_choices' },
];

const customStudyPlanController = {
  getAll: async (req, res) => {
    try {
      const { studentId, enrollmentId } = req.query;
      const where = {};
      if (studentId) where.id_student = studentId;
      const plans = await CustomStudyPlan.findAll({ where, include: planIncludes });

      // `custom_study_plans` no tiene columna propia de carrera/inscripción — un alumno
      // con más de una carrera activa (ej. TUP + Ingeniería Ambiental) tiene todos sus
      // planes guardados en la misma bolsa, sin distinción. Para no mezclarlos en el
      // selector del planificador, se infiere la carrera de cada plan a partir del
      // `id_study_plan` de los `plan_subject` de sus items — mismo criterio que ya usa
      // `academicRecordService` (ver `getAcademicYearBreakdown`) para no necesitar una
      // columna de carrera en `academic_records` tampoco.
      if (enrollmentId) {
        const enrollment = await StudentCareerEnrollment.findByPk(enrollmentId);
        const studyPlanId = enrollment?.study_plan_id;

        if (studyPlanId) {
          const filtered = plans.filter(plan =>
            plan.items.some(item => item.plan_subject?.id_study_plan === studyPlanId)
          );
          return res.status(200).json({ data: filtered });
        }
      }

      res.status(200).json({ data: plans });
    } catch (error) {
      res.status(500).json({ error: 'Error fetching custom study plans', details: error.message });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const plan = await CustomStudyPlan.findByPk(id, { include: planIncludes });
      if (!plan) {
        return res.status(404).json({ error: 'Custom study plan not found' });
      }
      res.status(200).json({ data: plan });
    } catch (error) {
      res.status(500).json({ error: 'Error fetching custom study plan', details: error.message });
    }
  },

  create: async (req, res) => {
    try {
      const data = req.body;
      const payload = {
        id_student: data.id_student || data.studentId,
        name: data.name,
        weekly_hours: data.weekly_hours || data.weeklyHours,
      };
      const newPlan = await CustomStudyPlan.create(payload);

      if (Array.isArray(data.items) && data.items.length > 0) {
        const items = data.items.map(item => ({
          id_custom_study_plan: newPlan.id,
          plan_subject_id: item.plan_subject_id,
          target_year: item.target_year,
          target_term: item.target_term,
          order: item.order || null,
          status: item.status || 'planificado',
        }));
        await CustomStudyPlanItem.bulkCreate(items);
      }

      const plan = await CustomStudyPlan.findByPk(newPlan.id, { include: planIncludes });
      res.status(201).json({ message: 'Custom study plan created successfully', data: plan });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ error: 'Custom study plan already exists' });
      }
      res.status(500).json({ error: 'Error creating custom study plan', details: error.message });
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const data = req.body;
      const payload = {
        name: data.name,
        weekly_hours: data.weekly_hours || data.weeklyHours,
      };

      const [updatedRows] = await CustomStudyPlan.update(payload, { where: { id } });
      if (updatedRows === 0) {
        return res.status(404).json({ error: 'Custom study plan not found or no changes made' });
      }

      if (Array.isArray(data.items)) {
        await CustomStudyPlanItem.destroy({ where: { id_custom_study_plan: id } });
        if (data.items.length > 0) {
          const items = data.items.map(item => ({
            id_custom_study_plan: id,
            plan_subject_id: item.plan_subject_id,
            target_year: item.target_year,
            target_term: item.target_term,
            order: item.order || null,
            status: item.status || 'planificado',
          }));
          await CustomStudyPlanItem.bulkCreate(items);
        }
      }

      const updatedPlan = await CustomStudyPlan.findByPk(id, { include: planIncludes });
      res.status(200).json({ message: 'Custom study plan updated successfully', data: updatedPlan });
    } catch (error) {
      res.status(500).json({ error: 'Error updating custom study plan', details: error.message });
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const deletedRows = await CustomStudyPlan.destroy({ where: { id } });
      if (deletedRows === 0) {
        return res.status(404).json({ error: 'Custom study plan not found' });
      }
      res.status(200).json({ message: `Custom study plan with id: ${id} deleted successfully` });
    } catch (error) {
      res.status(500).json({ error: 'Error deleting custom study plan', details: error.message });
    }
  },

  getDeviation: async (req, res) => {
    try {
      const { id } = req.params;
      const studentId = req.query.studentId;
      if (!studentId) {
        return res.status(400).json({ error: 'studentId query parameter is required' });
      }
      const result = await deviationService.getDeviationMetrics(studentId, id);
      res.status(200).json({ data: result });
    } catch (error) {
      if (error.message === 'Custom study plan not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message === 'Plan does not belong to this student') {
        return res.status(403).json({ error: error.message });
      }
      res.status(500).json({ error: 'Error calculating deviation metrics', details: error.message });
    }
  },

  clone: async (req, res) => {
    try {
      const { id } = req.params;
      const data = req.body;

      const source = await CustomStudyPlan.findByPk(id, {
        include: [
          { model: CustomStudyPlanItem, as: 'items' },
          { model: CustomStudyPlanSabbatical, as: 'sabbaticals' },
          { model: CustomStudyPlanElectiveChoice, as: 'elective_choices' },
          { model: CustomStudyPlanUnahurChoice, as: 'unahur_choices' },
        ]
      });
      if (!source) {
        return res.status(404).json({ error: 'Source custom study plan not found' });
      }

      const newPlan = await CustomStudyPlan.create({
        id_student: data.id_student || source.id_student,
        name: data.name || `${source.name} (copia)`,
        weekly_hours: data.weekly_hours || source.weekly_hours,
      });

      if (source.items && source.items.length > 0) {
        const items = source.items.map(item => ({
          id_custom_study_plan: newPlan.id,
          plan_subject_id: item.plan_subject_id,
          target_year: item.target_year,
          target_term: item.target_term,
          order: item.order,
          status: 'planificado',
        }));
        await CustomStudyPlanItem.bulkCreate(items);
      }

      if (source.sabbaticals && source.sabbaticals.length > 0) {
        const sabbaticals = source.sabbaticals.map(sabbatical => ({
          id_custom_study_plan: newPlan.id,
          year: sabbatical.year,
          term: sabbatical.term,
        }));
        await CustomStudyPlanSabbatical.bulkCreate(sabbaticals);
      }

      if (source.elective_choices && source.elective_choices.length > 0) {
        const electiveChoices = source.elective_choices.map(choice => ({
          id_custom_study_plan: newPlan.id,
          id_elective_block: choice.id_elective_block,
          plan_subject_id: choice.plan_subject_id,
        }));
        await CustomStudyPlanElectiveChoice.bulkCreate(electiveChoices);
      }

      if (source.unahur_choices && source.unahur_choices.length > 0) {
        const unahurChoices = source.unahur_choices.map(choice => ({
          id_custom_study_plan: newPlan.id,
          id_unahur_block: choice.id_unahur_block,
          plan_subject_id: choice.plan_subject_id,
        }));
        await CustomStudyPlanUnahurChoice.bulkCreate(unahurChoices);
      }

      const plan = await CustomStudyPlan.findByPk(newPlan.id, { include: planIncludes });
      res.status(201).json({ message: 'Custom study plan cloned successfully', data: plan });
    } catch (error) {
      res.status(500).json({ error: 'Error cloning custom study plan', details: error.message });
    }
  },
};

module.exports = customStudyPlanController;
