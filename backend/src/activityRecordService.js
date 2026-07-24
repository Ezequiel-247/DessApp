'use strict';
const { ActivityRecord, Activity, PlanCreditBlockItem, PlanCreditBlock, StudentCareerEnrollment, StudyPlan, sequelize } = require('./models');
const DomainError = require('./domain/domainError');

const ALLOWED_STATUSES = ['enrolled', 'approved', 'failed', 'equivalencia'];

class ActivityRecordService {
  async createActivityRecord(data, authenticatedUserId) {
    return await sequelize.transaction(async (t) => {
      const { id_student: studentId, id_activity: activityId, year, semester, grade, status, plan_credit_block_item_id } = data;

      if (Number(studentId) !== Number(authenticatedUserId)) {
        throw new DomainError('No autorizado: solo podés registrar actividades en tus propios registros', 403);
      }

      if (!status || !ALLOWED_STATUSES.includes(status)) {
        throw new DomainError(`Estado inválido: debe ser uno de ${ALLOWED_STATUSES.join(', ')}`, 400);
      }

      let resolvedItemId = plan_credit_block_item_id;
      if (!resolvedItemId) {
        const enrollment = await StudentCareerEnrollment.findOne({
          where: { student_id: studentId, is_active: true, status: 'active' },
          include: [{ model: StudyPlan, as: 'studyPlan' }],
          transaction: t,
        });
        if (!enrollment || !enrollment.study_plan_id) {
          throw new DomainError('No tenés una inscripción activa a un plan de estudios', 400);
        }

        const blockItem = await PlanCreditBlockItem.findOne({
          include: [{
            model: PlanCreditBlock,
            where: { id_study_plan: enrollment.study_plan_id },
          }],
          where: { id_activity: activityId },
          transaction: t,
        });

        if (!blockItem) {
          throw new DomainError('La actividad no pertenece a tu plan actual', 400);
        }
        resolvedItemId = blockItem.id;
      }

      const existingActive = await ActivityRecord.findOne({
        where: {
          id_student: studentId,
          id_activity: activityId,
          status: ['enrolled', 'approved', 'equivalencia'],
        },
        transaction: t,
      });
      if (existingActive) {
        throw new DomainError('Ya tenés esta actividad registrada de forma activa', 409);
      }

      let resolvedGrade = grade;
      if (status === 'approved' || status === 'equivalencia') {
        resolvedGrade = 'C';
      } else if (status === 'failed') {
        resolvedGrade = 'NC';
      } else if (status === 'enrolled') {
        resolvedGrade = null;
      }

      let resolvedYear = year;
      if (status === 'enrolled') {
        resolvedYear = new Date().getFullYear();
      }

      const record = await ActivityRecord.create({
        id_student: studentId,
        id_activity: activityId,
        plan_credit_block_item_id: resolvedItemId,
        year: resolvedYear,
        semester: semester || 1,
        grade: resolvedGrade,
        status,
      }, { transaction: t });

      const created = await ActivityRecord.findByPk(record.id, {
        include: [
          { model: Activity, attributes: ['id', 'name'] },
          { model: PlanCreditBlockItem, include: [{ model: PlanCreditBlock }] },
        ],
        transaction: t,
      });

      return created;
    });
  }

  async updateActivityRecord(id, data, authenticatedUserId) {
    return await sequelize.transaction(async (t) => {
      const record = await ActivityRecord.findByPk(id, { transaction: t });
      if (!record) {
        throw new DomainError('Registro de actividad no encontrado', 404);
      }

      if (Number(record.id_student) !== Number(authenticatedUserId)) {
        throw new DomainError('No autorizado: solo podés modificar tus propios registros', 403);
      }

      if (['approved', 'failed', 'equivalencia'].includes(record.status)) {
        throw new DomainError(
          'Los registros consolidados de actividades no pueden ser modificados. Solo se permite su eliminación.',
          400
        );
      }

      if (record.status === 'enrolled') {
        if (data.year !== undefined || data.semester !== undefined || data.activityId !== undefined || data.id_activity !== undefined) {
          throw new DomainError('Solo se permite modificar el estado de una actividad en curso.', 400);
        }

        if (!data.status) {
          throw new DomainError('Debe especificar un nuevo estado para la actividad en curso.', 400);
        }

        if (!['approved', 'failed', 'equivalencia'].includes(data.status)) {
          throw new DomainError('Transición inválida: solo se permite cambiar a approved, failed o equivalencia', 400);
        }

        let resolvedGrade;
        if (data.status === 'approved' || data.status === 'equivalencia') {
          resolvedGrade = 'C';
        } else if (data.status === 'failed') {
          resolvedGrade = 'NC';
        }

        await record.update({
          status: data.status,
          grade: resolvedGrade,
        }, { transaction: t });
      }

      const updated = await ActivityRecord.findByPk(id, {
        include: [
          { model: Activity, attributes: ['id', 'name'] },
          { model: PlanCreditBlockItem, include: [{ model: PlanCreditBlock }] },
        ],
        transaction: t,
      });

      return updated;
    });
  }

  async getActivityRecords(studentId) {
    const records = await ActivityRecord.findAll({
      where: { id_student: studentId },
      include: [
        { model: Activity, attributes: ['id', 'name'] },
        { model: PlanCreditBlockItem, include: [{ model: PlanCreditBlock }] },
      ],
      order: [['year', 'DESC'], ['semester', 'DESC']],
    });
    return records;
  }

  async getActivityEligibility(studentId) {
    const enrollment = await StudentCareerEnrollment.findOne({
      where: { student_id: studentId, is_active: true, status: 'active' },
    });
    if (!enrollment || !enrollment.study_plan_id) return [];

    const blockItems = await PlanCreditBlockItem.findAll({
      include: [{
        model: PlanCreditBlock,
        where: { id_study_plan: enrollment.study_plan_id },
      }, {
        model: Activity,
        attributes: ['id', 'name'],
      }],
    });

    const records = await ActivityRecord.findAll({
      where: { id_student: studentId },
    });

    const nonAvailable = new Set();
    for (const ar of records) {
      if (['enrolled', 'approved', 'equivalencia'].includes(ar.status)) {
        nonAvailable.add(ar.id_activity);
      }
    }

    return blockItems
      .filter(bi => !nonAvailable.has(bi.id_activity))
      .map(bi => ({
        activity_id: bi.id_activity,
        activity_name: bi.Activity?.name || '',
        credits: bi.credits,
        plan_credit_block_item_id: bi.id,
      }));
  }

  async deleteActivityRecord(id, authenticatedUserId) {
    const record = await ActivityRecord.findByPk(id);
    if (!record) {
      throw new DomainError('Registro de actividad no encontrado', 404);
    }
    if (Number(record.id_student) !== Number(authenticatedUserId)) {
      throw new DomainError('No autorizado: solo podés eliminar tus propios registros', 403);
    }
    await record.destroy();
    return { message: `Registro de actividad ${id} eliminado correctamente` };
  }
}

module.exports = new ActivityRecordService();
module.exports.DomainError = DomainError;
