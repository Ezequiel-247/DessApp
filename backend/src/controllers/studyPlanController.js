const { Op } = require('sequelize');
const {
  sequelize,
  StudyPlan,
  PlanSubject,
  PlanUnahurBlock,
  PlanElectiveBlock,
  PlanElectiveBlockSubject,
  PlanCreditBlock,
  PlanCreditBlockItem,
  Correlativity,
  Course,
  AcademicRecord,
  CustomStudyPlanItem,
  CustomStudyPlanElectiveChoice,
  CustomStudyPlanUnahurChoice,
} = require('../models');

const studyPlanController = {
  getAll: async (req, res) => {
    try {
      const { careerId } = req.query;
      const where = {};
      if (careerId) where.id_career = careerId;
      const plans = await StudyPlan.findAll({ where });
      res.status(200).json({ data: plans });
    } catch (error) {
      res.status(500).json({ error: 'Error fetching plans', details: error.message });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const plan = await StudyPlan.findByPk(id, {
        include: [
          { model: PlanUnahurBlock },
          { model: PlanElectiveBlock, include: [{ model: PlanElectiveBlockSubject }] },
          { model: PlanCreditBlock },
        ],
      });
      if (!plan) return res.status(404).json({ error: 'Plan not found' });
      res.status(200).json({ data: plan });
    } catch (error) {
      res.status(500).json({ error: 'Error fetching plan', details: error.message });
    }
  },

  create: async (req, res) => {
    try {
      const data = req.body;
      const payload = {
        id_career: data.id_career || data.careerId,
        name: data.name,
        status: data.status,
        years_duration: data.years_duration || data.yearsDuration || null,
        course_type: data.course_type || data.courseType || null,
        default_term: data.default_term || data.defaultTerm || null,
        min_total_credits: data.min_total_credits || data.minTotalCredits || null,

      };
      const newPlan = await StudyPlan.create(payload);
      res.status(201).json({ message: 'Plan created', data: newPlan });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ error: 'Study plan already exists' });
      }
      res.status(500).json({ error: 'Error creating plan', details: error.message });
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const data = req.body;
      const payload = {
        name: data.name,
        status: data.status,
        years_duration: data.years_duration || data.yearsDuration,
        course_type: data.course_type || data.courseType,
        default_term: data.default_term || data.defaultTerm,
        min_total_credits: data.min_total_credits || data.minTotalCredits,
      };

      const [updated] = await StudyPlan.update(payload, { where: { id } });
      if (updated === 0) return res.status(404).json({ error: 'Plan not found or no changes' });
      const updatedPlan = await StudyPlan.findByPk(id);
      res.status(200).json({ message: 'Plan updated', data: updatedPlan });
    } catch (error) {
      res.status(500).json({ error: 'Error updating plan', details: error.message });
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await StudyPlan.destroy({ where: { id } });
      if (deleted === 0) return res.status(404).json({ error: 'Plan not found' });
      res.status(200).json({ message: `Plan ${id} deleted` });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ error: 'Study plan already exists' });
      }
      res.status(500).json({ error: 'Error updating plan', details: error.message });
    }
  },

  replace: async (req, res) => {
    try {
      const { id } = req.params;
      const { plan: planData, subjects, unahur_blocks, elective_blocks, credit_blocks } = req.body;

      const result = await sequelize.transaction(async (t) => {
        const plan = await StudyPlan.findByPk(id, { transaction: t });
        if (!plan) {
          const e = new Error('Plan not found');
          e.statusCode = 404;
          throw e;
        }

        await plan.update({
          name: planData.name,
          status: planData.status,
          years_duration: planData.years_duration ?? plan.years_duration,
          course_type: planData.course_type ?? plan.course_type,
          default_term: planData.default_term ?? plan.default_term,
          min_total_credits: planData.min_total_credits ?? plan.min_total_credits,
        }, { transaction: t });

        const existingSubjects = await PlanSubject.findAll({
          where: { id_study_plan: id },
          transaction: t,
        });
        const existingBySubjectId = {};
        for (const ps of existingSubjects) {
          existingBySubjectId[ps.id_subject] = ps;
        }

        const incomingSubjectIds = (subjects || []).map(s => s.id_subject);
        const subjectsToDelete = existingSubjects.filter(ps => !incomingSubjectIds.includes(Number(ps.id_subject)));

        const blockingSubjects = [];
        for (const ps of subjectsToDelete) {
          const deps = [];
          if (await Course.count({ where: { plan_subject_id: ps.id }, transaction: t })) deps.push('courses');
          if (await AcademicRecord.count({ where: { plan_subject_id: ps.id }, transaction: t })) deps.push('academic_records');
          if (await CustomStudyPlanItem.count({ where: { plan_subject_id: ps.id }, transaction: t })) deps.push('custom_study_plan_items');
          if (await CustomStudyPlanElectiveChoice.count({ where: { plan_subject_id: ps.id }, transaction: t })) deps.push('custom_study_plan_elective_choices');
          if (await CustomStudyPlanUnahurChoice.count({ where: { plan_subject_id: ps.id }, transaction: t })) deps.push('custom_study_plan_unahur_choices');
          if (deps.length > 0) {
            blockingSubjects.push({ id: ps.id, id_subject: ps.id_subject, dependencies: deps });
          }
        }
        if (blockingSubjects.length > 0) {
          const e = new Error('Blocking dependencies');
          e.blockingSubjects = blockingSubjects;
          e.statusCode = 409;
          throw e;
        }

        for (const ps of subjectsToDelete) {
          await PlanSubject.destroy({ where: { id: ps.id }, transaction: t });
        }

        const tempIdMap = {};
        const subjectMapping = [];

        for (const s of (subjects || [])) {
          const existing = existingBySubjectId[Number(s.id_subject)];
          if (existing) {
            await existing.update({
              suggested_year: s.suggested_year,
              suggested_term: s.suggested_term,
              credits: s.credits,
              is_elective: s.is_elective || false,
              is_final_project: s.is_final_project || false,
            }, { transaction: t });
            if (s.temp_id) tempIdMap[s.temp_id] = existing.id;
          } else {
            const created = await PlanSubject.create({
              id_study_plan: id,
              id_subject: s.id_subject,
              suggested_year: s.suggested_year,
              suggested_term: s.suggested_term,
              credits: s.credits,
              is_elective: s.is_elective || false,
              is_final_project: s.is_final_project || false,
            }, { transaction: t });
            if (s.temp_id) tempIdMap[s.temp_id] = created.id;
            subjectMapping.push({ temp_id: s.temp_id, id: created.id });
          }
        }

        const allPsIds = existingSubjects.map(ps => ps.id);
        if (allPsIds.length > 0) {
          await Correlativity.destroy({
            where: {
              [Op.or]: [
                { id_plan_subject_target: { [Op.in]: allPsIds } },
                { id_required_plan_subject: { [Op.in]: allPsIds } },
              ]
            },
            transaction: t,
          });
        }

        for (const s of (subjects || [])) {
          if (s.correlative_temp_ids && s.correlative_temp_ids.length > 0) {
            const targetId = existingBySubjectId[Number(s.id_subject)]?.id || tempIdMap[s.temp_id];
            if (targetId) {
              for (const corrTempId of s.correlative_temp_ids) {
                const requiredId = tempIdMap[corrTempId];
                if (requiredId && requiredId !== targetId) {
                  await Correlativity.create({
                    id_plan_subject_target: targetId,
                    id_required_plan_subject: requiredId,
                  }, { transaction: t });
                }
              }
            }
          }
        }

        await PlanUnahurBlock.destroy({
          where: { id_study_plan: id },
          transaction: t,
        });
        for (let i = 0; i < (unahur_blocks || []).length; i++) {
          const ub = unahur_blocks[i];
          await PlanUnahurBlock.create({
            id_study_plan: id,
            suggested_year: ub.suggested_year,
            suggested_term: ub.suggested_term || null,
            sort_order: ub.sort_order ?? i,
          }, { transaction: t });
        }

        const existingEb = await PlanElectiveBlock.findAll({
          where: { id_study_plan: id },
          transaction: t,
        });
        const incomingEbNames = (elective_blocks || []).map(b => b.name);
        for (const eb of existingEb) {
          if (!incomingEbNames.includes(eb.name)) {
            await PlanElectiveBlock.destroy({ where: { id: eb.id }, transaction: t });
          }
        }
        for (const eb of (elective_blocks || [])) {
          const match = existingEb.find(e => e.name === eb.name);
          if (match) {
            await match.update({
              min_required: eb.min_required,
              requires_approved_mandatory_count: eb.requires_approved_mandatory_count || 0,
              suggested_year: eb.suggested_year || null,
              sort_order: eb.sort_order || null,
            }, { transaction: t });
            await PlanElectiveBlockSubject.destroy({
              where: { id_elective_block: match.id },
              transaction: t,
            });
            for (const stid of (eb.subject_temp_ids || [])) {
              const psId = tempIdMap[stid];
              if (psId) {
                await PlanElectiveBlockSubject.create({
                  id_elective_block: match.id,
                  id_plan_subject: psId,
                }, { transaction: t });
              }
            }
          } else {
            const created = await PlanElectiveBlock.create({
              id_study_plan: id,
              name: eb.name,
              min_required: eb.min_required,
              requires_approved_mandatory_count: eb.requires_approved_mandatory_count || 0,
              suggested_year: eb.suggested_year || null,
              sort_order: eb.sort_order || null,
            }, { transaction: t });
            for (const stid of (eb.subject_temp_ids || [])) {
              const psId = tempIdMap[stid];
              if (psId) {
                await PlanElectiveBlockSubject.create({
                  id_elective_block: created.id,
                  id_plan_subject: psId,
                }, { transaction: t });
              }
            }
          }
        }

        const existingCb = await PlanCreditBlock.findAll({
          where: { id_study_plan: id },
          transaction: t,
        });
        const incomingCbNames = (credit_blocks || []).map(b => b.name);
        for (const cb of existingCb) {
          if (!incomingCbNames.includes(cb.name)) {
            await PlanCreditBlock.destroy({ where: { id: cb.id }, transaction: t });
          }
        }
        for (const cb of (credit_blocks || [])) {
          const match = existingCb.find(e => e.name === cb.name);
          if (match) {
            await match.update({
              min_credits_required: cb.min_credits_required ?? null,
              max_credits_allowed: cb.max_credits_allowed ?? null,
              sort_order: cb.sort_order ?? null,
            }, { transaction: t });
            await PlanCreditBlockItem.destroy({
              where: { id_credit_block: match.id },
              transaction: t,
            });
            for (const act of (cb.activities || [])) {
              await PlanCreditBlockItem.create({
                id_credit_block: match.id,
                id_activity: act.id_activity,
                credits: act.credits ?? null,
              }, { transaction: t });
            }
          } else {
            const created = await PlanCreditBlock.create({
              id_study_plan: id,
              name: cb.name,
              min_credits_required: cb.min_credits_required ?? null,
              max_credits_allowed: cb.max_credits_allowed ?? null,
              sort_order: cb.sort_order ?? null,
            }, { transaction: t });
            for (const act of (cb.activities || [])) {
              await PlanCreditBlockItem.create({
                id_credit_block: created.id,
                id_activity: act.id_activity,
                credits: act.credits ?? null,
              }, { transaction: t });
            }
          }
        }

        return { subject_mapping: subjectMapping };
      });

      res.status(200).json({ message: 'Plan reemplazado exitosamente', data: result });
    } catch (error) {
      if (error.blockingSubjects) {
        return res.status(409).json({
          error: 'No se pueden eliminar materias con dependencias activas',
          blocking_subjects: error.blockingSubjects,
        });
      }
      if (error.statusCode === 404) {
        return res.status(404).json({ error: 'Plan not found' });
      }
      res.status(500).json({ error: 'Error reemplazando plan', details: error.message });
    }
  }
};

module.exports = studyPlanController;
