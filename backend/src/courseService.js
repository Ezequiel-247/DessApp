'use strict';
const { Op } = require('sequelize');
const { 
  Course, 
  CourseSchedule, 
  PlanSubject, 
  Subject,
  StudyPlan,
  sequelize,
  AcademicRecord
} = require('./models');

class CourseService {
  /**
   * Obtener oferta académica con filtros
   */
  async getAll(filters = {}, pagination = { limit: 10, offset: 0 }) {
    const { year, term, plan_id, search } = filters;
    const { limit, offset } = pagination;

    const where = {};
    if (year) where.year = year;
    if (term) where.term = term;

    const include = [
      {
        model: CourseSchedule,
        as: 'schedules'
      },
      {
        model: PlanSubject,
        as: 'plan_subject',
        where: plan_id ? { plan_id } : {},
        include: [
          {
            model: StudyPlan,
            as: 'study_plan',
            attributes: ['name', 'status']
          },
          { 
          model: Subject, 
          as: 'subject', 
          attributes: ['name'],
          where: search ? { name: { [Op.iLike]: `%${search}%` } } : {}
        }]
      }
    ];

    const { count, rows } = await Course.findAndCountAll({
      where,
      include,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['year', 'DESC'], ['term', 'ASC']],
      distinct: true // Necesario por los includes que duplican filas en el count
    });

    return {
      data: rows,
      pagination: {
        total: count,
        limit,
        offset,
        pages: Math.ceil(count / limit)
      }
    };
  }

  /**
   * Crear una cursada con sus múltiples horarios (Transaccional)
   */
  async createCourse(data) {
    const { 
      plan_subject_id, 
      commission, 
      year, 
      term, 
      capacity, 
      schedules,
      professor_name 
    } = data;

    const t = await sequelize.transaction();

    try {
      // 0. Validar que la materia pertenezca efectivamente a un plan (evita error 400 de FK)
      const planSubject = await PlanSubject.findByPk(plan_subject_id, { transaction: t });
      if (!planSubject) {
        const error = new Error(`No se encontró la materia vinculada al plan con ID ${plan_subject_id}. Verifique si está usando el ID de la relación.`);
        error.status = 404;
        throw error;
      }

      // 1. Validar si ya existe una comisión con el mismo nombre para la materia en este periodo
      const existingCourse = await Course.findOne({
        where: { plan_subject_id, commission, year, term },
        transaction: t
      });

      if (existingCourse) {
        throw new Error(`La comisión '${commission}' ya está registrada para esta materia en el periodo ${year}-${term}`);
      }

      // 2. Crear la cabecera de la cursada
      const course = await Course.create({
        plan_subject_id,
        commission,
        year,
        term,
        capacity,
        professor_name // Agregado para mayor detalle de la oferta
      }, { transaction: t });

      // 3. Validar y crear horarios
      if (schedules && schedules.length > 0) {
        await this._validateAndCreateSchedules(course.id, schedules, year, term, t);
      }

      await t.commit();

      // Retornamos el curso creado con sus relaciones
      return await Course.findByPk(course.id, {
        include: [{ model: CourseSchedule, as: 'schedules' }],
        transaction: null // Ya fuera de la transacción
      });
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  /**
   * Obtener una cursada por ID con todo su detalle
   */
  async getById(id) {
    return await Course.findByPk(id, {
      include: [
        { model: CourseSchedule, as: 'schedules' },
        {
          model: PlanSubject,
          as: 'plan_subject',
          include: [{ model: Subject, as: 'subject', attributes: ['name'] }]
        }
      ]
    });
  }

  /**
   * Actualizar cursada y horarios (Transaccional)
   */
  async updateCourse(id, data) {
    const { schedules, ...courseData } = data;
    const t = await sequelize.transaction();

    try {
      const course = await Course.findByPk(id);
      if (!course) throw new Error('Cursada no encontrada');

      await course.update(courseData, { transaction: t });

      if (schedules) {
        // Validamos conflictos excluyendo el curso actual
        await this._validateAndCreateSchedules(id, schedules, course.year, course.term, t, true);
        // Reemplazo simple: Borramos horarios viejos y creamos los nuevos
        await CourseSchedule.destroy({ where: { course_id: id }, transaction: t });
        
        const schedulesData = schedules.map(s => ({
          ...s,
          course_id: id
        }));
        await CourseSchedule.bulkCreate(schedulesData, { transaction: t });
      }

      await t.commit();
      return await this.getById(id);
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async deleteCourse(id) {
    const course = await Course.findByPk(id);
    if (!course) throw new Error('Cursada no encontrada');
    return await course.destroy();
  }

  /**
   * Obtener horarios de una materia específica en un período
   */
  async getSchedulesBySubject(planSubjectId, year) {
    return await Course.findAll({
      where: { plan_subject_id: planSubjectId, year },
      include: [{ model: CourseSchedule, as: 'schedules' }]
    });
  }

  /**
   * Requisito 4.1 Plus: Obtener oferta para un plan de estudios específico
   */
  async getOfferForPlan(planId, year, term) {
    return await Course.findAll({
      where: { year, term },
      include: [
        { model: CourseSchedule, as: 'schedules' },
        {
          model: PlanSubject,
          as: 'plan_subject',
          where: { plan_id: planId },
          include: [{ model: Subject, as: 'subject' }]
        }
      ],
      order: [[{ model: PlanSubject, as: 'plan_subject' }, 'suggested_year', 'ASC']]
    });
  }

  /**
   * Método privado para validación de conflictos de aula y creación de horarios
   */
  async _validateAndCreateSchedules(courseId, schedules, year, term, transaction, isUpdate = false) {
    for (const s of schedules) {
      const conflictWhere = {
        day_of_week: s.day_of_week,
        classroom: s.classroom,
        [Op.and]: [
          { start_time: { [Op.lt]: s.end_time } },
          { end_time: { [Op.gt]: s.start_time } }
        ]
      };

      if (isUpdate) {
        conflictWhere.course_id = { [Op.ne]: courseId };
      }

      const conflict = await CourseSchedule.findOne({
        where: conflictWhere,
        include: [{
          model: Course,
          as: 'course',
          where: { year, term }
        }],
        transaction
      });

      if (conflict) {
        throw new Error(`Conflicto de aula: ${s.classroom} ya está ocupada el ${s.day_of_week} en ese horario.`);
      }
    }

    const schedulesData = schedules.map(s => ({
      ...s,
      course_id: courseId
    }));
    await CourseSchedule.bulkCreate(schedulesData, { transaction });
  }

  /**
   * Requisito: Validar disponibilidad de cupos antes de inscribir
   */
  async hasAvailableCapacity(courseId, transaction = null) {
    const course = await Course.findByPk(courseId, { transaction });
    if (!course) return false;

    const enrolledCount = await AcademicRecord.count({
      where: { 
        course_id: courseId,
        status: 'enrolled'
      },
      transaction
    });

    return enrolledCount < course.capacity;
  }
}

module.exports = new CourseService();