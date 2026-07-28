'use strict';
const { AcademicRecord, PlanSubject, Subject, Student, StudyPlan, FinalExam, Course, CourseSchedule, StudentCareerEnrollment, PlanUnahurBlock, PlanElectiveBlock, PlanElectiveBlockSubject, PlanCreditBlock, PlanCreditBlockItem, ActivityRecord, Activity, sequelize } = require('./models');
const { Op } = require('sequelize');
const courseService = require('./courseService.js');
const { calcularMicroEstado, MICRO_ESTADOS } = require('./domain/microEstados');
const DomainError = require('./domain/domainError');

function calcularRegularidadExpiresAt(year, semester) {
  if (semester === 1) return `${year + 2}-07-31`;
  if (semester === 2) return `${year + 2}-12-31`;
  return null;
}

const STATUS_PRIORITY = {
  aprobado: 5,
  equivalencia: 4,
  pendiente: 3,
  enrolled: 2,
  desaprobado: 1,
};

class AcademicRecordService {
  /**
   * Obtiene la foja académica completa de un estudiante
   */
  async getHistoryByStudent(studentId, filters = {}) {
    const { status, sort = 'DESC', includeExams = 'true' } = filters;
    const whereClause = { student_id: studentId };

    if (status) {
      whereClause.status = status;
    }

    const include = [
      {
        model: PlanSubject,
        as: 'plan_subject',
        include: [
          { model: Subject, as: 'subject' },
          {
            model: StudyPlan,
            as: 'StudyPlan',
            attributes: ['name']
          }
        ]
      },
      {
        model: Course,
        as: 'course',
        include: [{ model: CourseSchedule, as: 'schedules' }]
      }
    ];

    if (includeExams === 'true' || includeExams === true) {
      include.push({
        model: FinalExam,
        as: 'final_exams',
        attributes: ['grade', 'exam_date', 'attempt_number', 'status']
      });
    }

    return await AcademicRecord.findAll({
      where: whereClause,
      include,
      order: [
        ['year', sort.toUpperCase()],
        ['term', sort.toUpperCase()]
      ]
    });
  }

  /**
   * Carga manual de situación académica (solo materias)
   */
  async addRecord(data) {
    return await sequelize.transaction(async (t) => {
      let { student_id, plan_subject_id, id_subject, status, grade, regularity_expires_at, year, term, course_id } = data;

      const student = await Student.findByPk(student_id, {
        include: [{
          model: StudentCareerEnrollment,
          as: 'enrollments',
          include: [{ model: StudyPlan, as: 'studyPlan' }]
        }],
        transaction: t
      });
      if (!student) throw new Error('Student not found');

      if (plan_subject_id) {
        const planSubject = await PlanSubject.findByPk(plan_subject_id, {
          include: [{ model: StudyPlan, as: 'StudyPlan' }],
          transaction: t
        });
        if (!planSubject) throw new Error('Plan subject not found');

        if (!planSubject.StudyPlan.status || planSubject.StudyPlan.status.toLowerCase() !== 'vigente') {
          throw new Error('Cannot add records to an inactive or deprecated study plan');
        }

        const plans = student.enrollments ? student.enrollments.map(e => e.studyPlan).filter(Boolean) : [];
        if (!plans.some(p => p.id === planSubject.id_study_plan)) {
          throw new Error('The student is not enrolled in the study plan this subject belongs to');
        }

        if (course_id) {
          const course = await Course.findByPk(course_id, { transaction: t });
          if (!course) throw new Error('Course not found');
          if (course.plan_subject_id !== plan_subject_id) {
            throw new Error('The selected course does not belong to this subject');
          }
          year = course.year;
          term = course.term === '1C' ? 1 : (course.term === '2C' ? 2 : 3);
        }

        if (status === 'enrolled' && course_id) {
          const hasSpace = await courseService.hasAvailableCapacity(course_id, t);
          if (!hasSpace) throw new Error('No available capacity in this course (Commission full)');
          await this._validateScheduleConflict(student_id, course_id, year, term, t);
        }

        id_subject = planSubject.id_subject;
      } else if (!id_subject) {
        throw new Error('Either plan_subject_id or id_subject is required');
      }

      // Auto-calcular regularity_expires_at si es cursada regular (nota 4-6) y no se envió
      const numGrade = grade ? parseFloat(grade) : NaN;
      if (!isNaN(numGrade) && numGrade >= 4 && numGrade <= 6 && !regularity_expires_at) {
        // Si el frontend envió "aprobado"/"approved" con nota 4-6, convertir a "pendiente" automáticamente
        if (status === 'aprobado' || status === 'approved') {
          status = 'pendiente';
        }
        if (status === 'pendiente' || status === 'pending') {
          const semester = term;
          regularity_expires_at = calcularRegularidadExpiresAt(year, semester);
        }
      }

      const record = await AcademicRecord.create({
        id_student: student_id,
        plan_subject_id: plan_subject_id || null,
        id_subject,
        course_id: course_id || null,
        status,
        grade,
        regularity_expires_at,
        year,
        semester: term,
      }, { transaction: t });

      return record;
    });
  }

  /**
   * Obtiene el resumen académico
   */
  async getAcademicSummary(userId, enrollmentId = null) {
    let enrollment;
    if (enrollmentId) {
      // Misma validación que getAcademicYearBreakdown: la inscripción pedida tiene que
      // ser del propio alumno, si no cualquiera podría ver el resumen de otro pasándole
      // un enrollmentId ajeno por query string.
      enrollment = await StudentCareerEnrollment.findByPk(enrollmentId);
      if (!enrollment || String(enrollment.student_id) !== String(userId)) {
        enrollment = null;
      }
    } else {
      const student = await Student.findOne({
        where: { user_id: userId },
        include: [{
          model: StudentCareerEnrollment,
          as: 'enrollments',
          where: { is_active: true, status: 'active' },
          required: false,
          include: [{ model: StudyPlan, as: 'studyPlan' }]
        }]
      });
      if (!student) throw new Error('Student not found');
      enrollment = student.enrollments?.[0];
    }

    if (!enrollment || !enrollment.study_plan_id) {
      return {
        average: 0,
        approved_count: 0,
        current_academic_year: await this.getCurrentAcademicYear(userId),
        total_units: 0,
        completed_units: 0,
        progress_percentage: 0,
        mandatory: { total: 0, approved: 0 },
        unahur: { total: 0, approved: 0 },
        elective: { total: 0, approved: 0, blocks: [] },
        credit: { total: 0, approved: 0, blocks: [] },
        accumulated_credits: 0,
        total_credits: 0,
        efficiency_percentage: 0,
        streak_count: 0,
      };
    }

    const planId = enrollment.study_plan_id;
    const hoyString = new Date().toISOString().split('T')[0];

    const planSubjects = await PlanSubject.findAll({
      where: { id_study_plan: planId },
      attributes: ['id', 'credits', 'id_subject'],
    });

    // Un registro académico "pertenece" a este plan si su plan_subject apunta a una materia
    // de este plan, o —para registros que quedaron atados a otro plan (ej. el alumno cambió
    // de carrera)— si la materia subyacente también existe en este plan. Mismo criterio de
    // equivalencia por materia que ya usa getAcademicYearBreakdown. Sin este filtro, el
    // promedio y la efectividad mezclaban notas de todas las carreras del alumno sin importar
    // cuál estuviera seleccionada.
    const planSubjectIdSet = new Set(planSubjects.map((ps) => ps.id));
    const planSubjectBySubjectIdSet = new Set(planSubjects.map((ps) => ps.id_subject));
    const belongsToPlan = (record) => {
      if (record.plan_subject_id) return planSubjectIdSet.has(record.plan_subject_id);
      if (record.id_subject) return planSubjectBySubjectIdSet.has(record.id_subject);
      return false;
    };

    const mandatoryTotal = await PlanSubject.count({ where: { id_study_plan: planId, is_elective: false } });

    const unahurBlocks = await PlanUnahurBlock.findAll({ where: { id_study_plan: planId } });
    const unahurTotal = unahurBlocks.length;

    const electiveBlocks = await PlanElectiveBlock.findAll({
      where: { id_study_plan: planId },
      include: [{ model: PlanElectiveBlockSubject, include: [{ model: PlanSubject, as: 'plan_subject', include: [{ model: Subject, as: 'subject' }] }] }]
    });

    const creditBlocks = await PlanCreditBlock.findAll({ where: { id_study_plan: planId } });

    const records = await AcademicRecord.findAll({
      where: { id_student: userId },
      include: [
        {
          model: PlanSubject,
          as: 'plan_subject',
          include: [{ model: Subject, as: 'subject' }]
        },
        { model: Subject },
        {
          model: FinalExam,
          as: 'final_exams',
          attributes: ['status', 'grade'],
          required: false
        }
      ]
    });

    const activityRecords = await ActivityRecord.findAll({
      where: { id_student: userId },
      include: [{ model: PlanCreditBlockItem }]
    });

    let totalGrade = 0;
    let gradedCount = 0;
    let finalizedCount = 0;
    let mandatoryApproved = 0;

    const unahurSubjectIds = new Set();
    const countedPlanSubjects = new Set();

    for (const record of records) {
      if (!this._isFinalizada(record)) continue;
      if (record.plan_subject_id) {
        if (countedPlanSubjects.has(record.plan_subject_id)) continue;
        countedPlanSubjects.add(record.plan_subject_id);
      }
      finalizedCount++;

      const planSubject = record.plan_subject;
      const subject = planSubject?.subject || record.Subject;

      if (planSubject && !planSubject.is_elective) {
        mandatoryApproved++;
      }

      if (subject && subject.is_unahur) {
        unahurSubjectIds.add(subject.id);
      }

      // El promedio sí tiene que ser específico de esta carrera (a diferencia de
      // mandatoryApproved/unahurSubjectIds arriba, que cuentan avance de plan y no
      // deberían cambiar de criterio acá).
      if (belongsToPlan(record)) {
        const grade = parseFloat(record.grade);
        if (record.grade !== null && record.grade !== undefined && !isNaN(grade)) {
          totalGrade += grade;
          gradedCount++;
        }
      }
    }

    const unahurApproved = Math.min(unahurSubjectIds.size, unahurTotal);

    const electiveResults = [];
    let electiveApproved = 0;

    for (const block of electiveBlocks) {
      const blockSubjects = block.PlanElectiveBlockSubjects || [];
      const poolSubjectIds = new Set(blockSubjects.map(bs => bs.plan_subject?.id_subject));
      let approvedFromPool = 0;

      for (const record of records) {
        if (!this._isFinalizada(record)) continue;
        const planSubject = record.plan_subject;
        if (planSubject && planSubject.subject && poolSubjectIds.has(planSubject.subject.id)) {
          approvedFromPool++;
        }
      }

      const completed = approvedFromPool >= block.min_required;
      if (completed) electiveApproved++;
      electiveResults.push({
        id: block.id,
        name: block.name,
        min_required: block.min_required,
        approved_from_pool: approvedFromPool,
        completed,
      });
    }

    const creditResults = [];
    let creditApproved = 0;

    for (const block of creditBlocks) {
      let earnedCredits = 0;
      for (const ar of activityRecords) {
        const item = ar.PlanCreditBlockItem;
        if (item && item.id_credit_block === block.id && (ar.status === 'approved' || ar.status === 'equivalencia')) {
          earnedCredits += item.credits || 0;
        }
      }

      const maxAllowed = block.max_credits_allowed != null ? block.max_credits_allowed : earnedCredits;
      const cappedCredits = Math.min(earnedCredits, maxAllowed);
      const completed = cappedCredits >= (block.min_credits_required || 0);
      if (completed) creditApproved++;
      creditResults.push({
        id: block.id,
        name: block.name,
        min_credits_required: block.min_credits_required,
        max_credits_allowed: block.max_credits_allowed,
        earned_credits: earnedCredits,
        completed,
      });
    }

    const totalUnits = mandatoryTotal + unahurTotal + electiveBlocks.length + creditBlocks.length;
    const completedUnits = mandatoryApproved + unahurApproved + electiveApproved + creditApproved;
    const progressPercentage = totalUnits > 0 ? Number(((completedUnits / totalUnits) * 100).toFixed(2)) : 0;

    // accumulated_credits y total_credits
    let accumulatedCredits = 0;
    let totalCredits = 0;
    const countedPsForCredits = new Set();
    for (const ps of planSubjects) {
      totalCredits += Number(ps.credits) || 0;
    }
    for (const record of records) {
      if (!this._isFinalizada(record)) continue;
      if (!record.plan_subject_id) continue;
      if (countedPsForCredits.has(record.plan_subject_id)) continue;
      countedPsForCredits.add(record.plan_subject_id);
      accumulatedCredits += Number(record.plan_subject?.credits) || 0;
    }

    // average_with_failures / efficiency / streak — solo con los registros de la carrera
    // seleccionada (ver belongsToPlan más arriba). Antes se calculaban con TODOS los
    // registros del alumno sin importar la carrera, por eso no cambiaban al filtrar.
    const allRawRecords = (await AcademicRecord.findAll({ where: { id_student: userId } }))
      .filter(belongsToPlan);
    let totalGradeAll = 0;
    let gradedCountAll = 0;
    for (const record of allRawRecords) {
      const grade = parseFloat(record.grade);
      if (record.grade !== null && record.grade !== undefined && !isNaN(grade)) {
        totalGradeAll += grade;
        gradedCountAll++;
      }
    }
    const averageWithFailures = gradedCountAll > 0
      ? Number((totalGradeAll / gradedCountAll).toFixed(1))
      : 0;

    // efficiency_percentage — finalizedCountForEfficiency se recalcula acá (en vez de
    // reusar finalizedCount de más arriba) porque ese ya está deduplicado por plan_subject
    // para otro propósito (avance de plan) y no está filtrado por belongsToPlan.
    const finalizedCountForEfficiency = allRawRecords.filter(r => this._isFinalizada(r)).length;
    const failedCount = allRawRecords.filter(r => r.status === 'desaprobado').length;
    const expiredCount = allRawRecords.filter(r =>
      r.status === 'pendiente' && r.regularity_expires_at && r.regularity_expires_at < hoyString
    ).length;
    const totalAttempted = finalizedCountForEfficiency + failedCount + expiredCount;
    const efficiencyPercentage = totalAttempted > 0
      ? Number(((finalizedCountForEfficiency / totalAttempted) * 100).toFixed(2))
      : 0;

    // streak_count
    const allForStreak = (await AcademicRecord.findAll({
      where: { id_student: userId },
      order: [['year', 'DESC'], ['semester', 'DESC']],
    })).filter(belongsToPlan);
    const semesterMap = new Map();
    for (const r of allForStreak) {
      const key = `${r.year}-${r.semester}`;
      if (!semesterMap.has(key)) {
        semesterMap.set(key, { year: r.year, semester: r.semester, hasFailure: false });
      }
      if (r.status === 'desaprobado' ||
          (r.status === 'pendiente' && r.regularity_expires_at && r.regularity_expires_at < hoyString)) {
        semesterMap.get(key).hasFailure = true;
      }
    }
    const sortedSemesters = Array.from(semesterMap.values())
      .sort((a, b) => b.year - a.year || b.semester - a.semester);
    let streakCount = 0;
    for (const sem of sortedSemesters) {
      if (sem.hasFailure) break;
      streakCount++;
    }

    const currentYear = await this.getCurrentAcademicYear(userId);

    return {
      average: gradedCount > 0 ? Number((totalGrade / gradedCount).toFixed(2)) : 0,
      // finalizedCountForEfficiency (no finalizedCount) — tiene que ser el mismo número
      // que ya se usó para el numerador de efficiency_percentage/total_attempted, si no
      // el frontend termina mostrando "X finalizadas de Y cursadas" con X > Y.
      approved_count: finalizedCountForEfficiency,
      current_academic_year: currentYear,
      total_units: totalUnits,
      completed_units: completedUnits,
      progress_percentage: progressPercentage,
      accumulated_credits: accumulatedCredits,
      total_credits: totalCredits,
      average_with_failures: averageWithFailures,
      total_attempted: totalAttempted,
      efficiency_percentage: efficiencyPercentage,
      streak_count: streakCount,
      mandatory: {
        total: mandatoryTotal,
        approved: mandatoryApproved,
      },
      unahur: {
        total: unahurTotal,
        approved: unahurApproved,
      },
      elective: {
        total: electiveBlocks.length,
        approved: electiveApproved,
        blocks: electiveResults,
      },
      credit: {
        total: creditBlocks.length,
        approved: creditApproved,
        blocks: creditResults,
      },
    };
  }

  /**
   * Calcula el año de cursada actual del alumno según su fecha de ingreso.
   */
  async getCurrentAcademicYear(userId) {
    const enrollment = await StudentCareerEnrollment.findOne({
      where: { student_id: userId, is_active: true, status: 'active' },
      include: [{ model: StudyPlan, as: 'studyPlan' }]
    });

    if (!enrollment || !enrollment.enrolled_at) return null;

    const enrolled = new Date(enrollment.enrolled_at);
    const now = new Date();
    const monthsDiff = (now.getFullYear() - enrolled.getFullYear()) * 12
      + (now.getMonth() - enrolled.getMonth());

    const yearsDecimal = Number((monthsDiff / 12).toFixed(1));
    const academicYear = Math.max(1, Math.floor(monthsDiff / 12) + 1);

    const month = now.getMonth();
    const currentTerm = (month >= 2 && month <= 6) ? 1 : 2;

    return {
      years_since_enrollment: yearsDecimal,
      academic_year: academicYear,
      current_term: currentTerm,
      label: `${academicYear}° Año, ${currentTerm}° Cuatrimestre`,
      short_label: `${yearsDecimal} años`,
    };
  }

  /**
   * Obtiene el desglose de materias por año del plan de estudios
   */
  async getAcademicYearBreakdown(userId, enrollmentId = null) {
    let enrollment;
    if (enrollmentId) {
      enrollment = await StudentCareerEnrollment.findByPk(enrollmentId);
      if (!enrollment || String(enrollment.student_id) !== String(userId)) {
        return [];
      }
    } else {
      const student = await Student.findOne({
        where: { user_id: userId },
        include: [{
          model: StudentCareerEnrollment,
          as: 'enrollments',
          where: { is_active: true, status: 'active' },
          required: false,
          include: [{ model: StudyPlan, as: 'studyPlan' }]
        }]
      });
      if (!student) throw new Error('Student not found');
      enrollment = student.enrollments?.[0];
    }
    if (!enrollment || !enrollment.study_plan_id) return [];

    const planId = enrollment.study_plan_id;

    const planSubjects = await PlanSubject.findAll({
      where: { id_study_plan: planId },
      include: [
        { model: Subject, as: 'subject' },
        {
          model: PlanSubject,
          as: 'RequiredSubjects',
          through: { attributes: ['type'] }
        }
      ],
      order: [['suggested_year', 'ASC'], ['suggested_term', 'ASC']]
    });

    const unahurSubjects = await Subject.findAll({
      where: { is_unahur: true },
    });

    const unahurBlocks = await PlanUnahurBlock.findAll({
      where: { id_study_plan: planId },
      order: [['suggested_year', 'ASC'], ['suggested_term', 'ASC'], ['sort_order', 'ASC']]
    });

    const electiveBlocks = await PlanElectiveBlock.findAll({
      where: { id_study_plan: planId },
      include: [{ model: PlanElectiveBlockSubject, include: [{ model: PlanSubject, as: 'plan_subject', include: [{ model: Subject, as: 'subject' }] }] }],
      order: [['suggested_year', 'ASC'], ['sort_order', 'ASC']]
    });

    const creditBlocks = await PlanCreditBlock.findAll({ where: { id_study_plan: planId } });

    const records = await AcademicRecord.findAll({
      where: { id_student: userId },
      include: [
        {
          model: PlanSubject,
          as: 'plan_subject',
          include: [{ model: Subject, as: 'subject' }]
        },
        {
          model: FinalExam,
          as: 'final_exams',
          attributes: ['status', 'grade'],
          required: false
        }
      ]
    });

    // c20: Ignorar registros reprobados o con regularidad vencida
    const hoyString = new Date().toISOString().split('T')[0];
    const validRecords = records.filter(r => {
      if (r.status === 'desaprobado') return false;
      if (r.status === 'pendiente' && r.regularity_expires_at && r.regularity_expires_at < hoyString) return false;
      return true;
    });

    const recordByPlanSubject = {};
    const recordBySubject = {};
    const pickBest = (existing, candidate) => {
      if (!existing) return candidate;
      const existingPrio = STATUS_PRIORITY[existing.status] || 0;
      const candidatePrio = STATUS_PRIORITY[candidate.status] || 0;
      return candidatePrio > existingPrio ? candidate : existing;
    };
    for (const record of validRecords) {
      if (record.plan_subject_id) {
        recordByPlanSubject[record.plan_subject_id] = pickBest(recordByPlanSubject[record.plan_subject_id], record);
      } else {
        recordBySubject[record.id_subject] = pickBest(recordBySubject[record.id_subject], record);
      }
    }

    const availableSubjects = await this._getAvailableSubjects(userId, { enrollmentId: enrollment?.id });
    const availableSet = new Set(availableSubjects.map(s => s.plan_subject_id));

    const psNameMap = {};
    for (const ps of planSubjects) {
      psNameMap[ps.id] = ps.subject?.name || '';
    }

    const unahurApprovedSet = new Set();
    for (const record of validRecords) {
      if (!this._isFinalizada(record)) continue;
      const subj = record.Subject || (record.plan_subject && record.plan_subject.subject);
      if (subj && subj.is_unahur) {
        unahurApprovedSet.add(subj.id);
      }
    }
    let unahurFilled = 0;

    const yearMap = {};

    for (const ps of planSubjects) {
      if (ps.is_elective) continue;
      const year = ps.suggested_year;
      if (!yearMap[year]) {
        yearMap[year] = { year, finalizadas: 0, regularizadas: 0, en_curso: 0, faltantes: 0, total: 0, subjects: [] };
      }
      yearMap[year].total++;

      const bestRecord = recordByPlanSubject[ps.id] || recordBySubject[ps.id_subject] || null;
      const record = this._getEffectiveRecord(bestRecord);
      const classification = this._classifySubject(record);

      if (classification === 'equivalencia') {
        yearMap[year].finalizadas++;
      } else {
        yearMap[year][classification]++;
      }
      yearMap[year].subjects.push({
        is_block: false,
        plan_subject_id: ps.id,
        subject_id: ps.id_subject,
        subject_name: ps.subject?.name || '',
        suggested_term: ps.suggested_term,
        credits: ps.credits,
        classification,
        available: availableSet.has(ps.id),
        prerequisites: this._mapPrerequisites(ps, psNameMap, recordByPlanSubject, recordBySubject),
        grade: record?.grade || null,
        status: record?.status || null,
      });
    }

    const consumedUnahurSubjectIds = new Set();

    for (const block of unahurBlocks) {
      const poolSubjects = unahurSubjects
        .map(subj => {
          const ps = planSubjects.find(p => p.id_subject === subj.id);
          const rec = this._getEffectiveRecord(recordBySubject[subj.id]);
          const classif = rec ? this._classifySubject(rec) : 'faltante';
          return {
            subject_id: subj.id,
            subject_name: subj.name,
            classification: classif,
            grade: rec?.grade || null,
            status: rec?.status || null,
            available: ps ? availableSet.has(ps.id) : true,
            prerequisites: this._mapPrerequisites(ps, psNameMap, recordByPlanSubject, recordBySubject),
            consumed: consumedUnahurSubjectIds.has(subj.id),
          };
        });
      const year = block.suggested_year;
      if (!yearMap[year]) {
        yearMap[year] = { year, finalizadas: 0, regularizadas: 0, en_curso: 0, faltantes: 0, total: 0, subjects: [] };
      }
      yearMap[year].total++;

      const classification = unahurFilled < unahurApprovedSet.size ? 'finalizada' : 'faltante';
      if (classification === 'finalizada') {
        unahurFilled++;
        const toConsume = poolSubjects.find(
          s => (s.classification === 'finalizada' || s.classification === 'equivalencia') && !s.consumed
        );
        if (toConsume) consumedUnahurSubjectIds.add(toConsume.subject_id);
      }

      yearMap[year][classification]++;
      yearMap[year].subjects.push({
        is_block: true,
        block_type: 'unahur',
        id: block.id,
        suggested_term: block.suggested_term,
        sort_order: block.sort_order,
        classification,
        pool_subjects: poolSubjects,
      });
    }

    const consumedElectiveSubjectIds = new Set();

    for (const block of electiveBlocks) {
      const year = block.suggested_year;
      if (!yearMap[year]) {
        yearMap[year] = { year, finalizadas: 0, regularizadas: 0, en_curso: 0, faltantes: 0, total: 0, subjects: [] };
      }
      yearMap[year].total++;

      const blockSubjects = block.PlanElectiveBlockSubjects || [];
      const poolSubjects = blockSubjects.map(bs => {
        const blockPs = bs.plan_subject;
        const ps = (blockPs ? (planSubjects.find(p => p.id === blockPs.id) || blockPs) : null);
        const subj = ps?.subject || null;
        const rec = ps ? this._getEffectiveRecord(recordByPlanSubject[ps.id] || recordBySubject[ps.id_subject] || null) : null;
        const classif = rec ? this._classifySubject(rec) : 'faltante';
        return {
          subject_id: ps?.id_subject,
          subject_name: subj?.name || '',
          classification: classif,
          grade: rec?.grade || null,
          status: rec?.status || null,
          credits: ps?.credits || null,
          available: ps ? availableSet.has(ps.id) : false,
          prerequisites: this._mapPrerequisites(ps, psNameMap, recordByPlanSubject, recordBySubject),
          consumed: consumedElectiveSubjectIds.has(ps?.id_subject),
        };
      });

      let approvedFromPool = 0;
      for (const ps of poolSubjects) {
        if ((ps.classification === 'finalizada' || ps.classification === 'equivalencia') && !ps.consumed) {
          approvedFromPool++;
        }
      }

      const classification = approvedFromPool >= block.min_required ? 'finalizada' : 'faltante';
      if (classification === 'finalizada') {
        let toConsume = 0;
        for (const ps of poolSubjects) {
          if (toConsume >= block.min_required) break;
          if ((ps.classification === 'finalizada' || ps.classification === 'equivalencia') && !ps.consumed) {
            consumedElectiveSubjectIds.add(ps.subject_id);
            toConsume++;
          }
        }
      }

      yearMap[year][classification]++;
      yearMap[year].subjects.push({
        is_block: true,
        block_type: 'elective',
        id: block.id,
        name: block.name,
        sort_order: block.sort_order,
        min_required: block.min_required,
        approved_from_pool: approvedFromPool,
        classification,
        pool_subjects: poolSubjects,
      });
    }

    let activityRecords = await ActivityRecord.findAll({
      where: { id_student: userId },
      include: [
        { model: PlanCreditBlockItem, include: [{ model: Activity }] },
        { model: Activity },
      ]
    });
    // c21: Ignorar actividades reprobadas
    activityRecords = activityRecords.filter(ar => ar.status !== 'failed');

    const yearEntries = Object.values(yearMap).sort((a, b) => a.year - b.year);

    if (creditBlocks.length > 0) {
      // Pre-cargar todos los PlanCreditBlockItem del plan (para pool_activities)
      const allBlockItems = await PlanCreditBlockItem.findAll({
        where: { id_credit_block: creditBlocks.map(b => b.id) },
        include: [{ model: Activity, attributes: ['id', 'name'] }],
      });
      const itemsByBlock = new Map();
      for (const item of allBlockItems) {
        const list = itemsByBlock.get(item.id_credit_block) || [];
        list.push(item);
        itemsByBlock.set(item.id_credit_block, list);
      }

      const creditSubjects = [];
      for (const block of creditBlocks) {
        const blockActivities = activityRecords.filter(ar => {
          const item = ar.PlanCreditBlockItem;
          return item && item.id_credit_block === block.id;
        });

        let earnedCredits = 0;
        const registeredActivityIds = new Set();
        for (const ar of blockActivities) {
          if (ar.status === 'approved' || ar.status === 'equivalencia') {
            earnedCredits += ar.PlanCreditBlockItem?.credits || 0;
          }
          registeredActivityIds.add(ar.id_activity);
        }
        const maxAllowed = block.max_credits_allowed != null ? block.max_credits_allowed : earnedCredits;
        const cappedCredits = Math.min(earnedCredits, maxAllowed);
        const classification = cappedCredits >= (block.min_credits_required || 0) ? 'finalizada' : 'faltante';

        // Pool activities: registradas + disponibles
        const blockItems = itemsByBlock.get(block.id) || [];
        const poolActivities = [];
        for (const item of blockItems) {
          const existingRecord = blockActivities.find(ar => ar.id_activity === item.id_activity);
          if (existingRecord) {
            poolActivities.push({
              id: existingRecord.id,
              name: existingRecord.Activity?.name || block.name,
              credits: item.credits || 0,
              classification: existingRecord.status === 'approved' ? 'finalizada' : existingRecord.status === 'equivalencia' ? 'equivalencia' : existingRecord.status === 'enrolled' ? 'en_curso' : 'faltante',
              grade: existingRecord.grade,
              status: existingRecord.status,
            });
          } else {
            poolActivities.push({
              id: item.id_activity,
              name: item.Activity?.name || block.name,
              credits: item.credits || 0,
              classification: 'faltante',
              grade: null,
              status: null,
            });
          }
        }

        creditSubjects.push({
          is_block: true,
          block_type: 'credit',
          id: block.id,
          name: block.name,
          sort_order: block.sort_order,
          min_credits_required: block.min_credits_required,
          max_credits_allowed: block.max_credits_allowed,
          earned_credits: earnedCredits,
          classification,
          activities: blockActivities.map(ar => ({
            id: ar.id,
            name: ar.Activity?.name || block.name,
            credits: ar.PlanCreditBlockItem?.credits || 0,
            classification: ar.status === 'approved' ? 'finalizada' : ar.status === 'equivalencia' ? 'equivalencia' : ar.status === 'enrolled' ? 'en_curso' : 'faltante',
            grade: ar.grade,
            status: ar.status,
          })),
          pool_activities: poolActivities,
        });
      }

      yearEntries.push({
        year: null,
        block_type: 'credit',
        finalizadas: creditSubjects.filter(s => s.classification === 'finalizada').length,
        faltantes: creditSubjects.filter(s => s.classification === 'faltante').length,
        total: creditSubjects.length,
        subjects: creditSubjects,
      });
    }

    return yearEntries;
  }

  /**
   * Obtiene el listado de materias regularizadas con final pendiente
   */
  async getPendingFinalExams(userId, _enrollmentId = null) {
    const student = await Student.findOne({ where: { user_id: userId } });
    if (!student) throw new Error('Student not found');

    // 1. Traer TODOS los registros del alumno (sin filtrar por status)
    const records = await AcademicRecord.findAll({
      where: { id_student: userId },
      include: [
        {
          model: PlanSubject,
          as: 'plan_subject',
          include: [{ model: Subject, as: 'subject' }]
        },
        { model: Subject },
        {
          model: FinalExam,
          as: 'final_exams',
          attributes: ['id', 'status', 'grade'],
          required: false,
        },
      ],
      order: [['year', 'DESC'], ['semester', 'DESC']],
    });

    // 2. Agrupar por materia y tomar el más reciente (supremacía absoluta)
    const latestBySubject = new Map();
    for (const record of records) {
      const key = record.id_subject;
      if (!latestBySubject.has(key) ||
          record.year > latestBySubject.get(key).year ||
          (record.year === latestBySubject.get(key).year && record.semester > latestBySubject.get(key).semester)) {
        latestBySubject.set(key, record);
      }
    }

    // 3. Después de agrupar, filtrar solo pendientes con grade 4-6 y sin final aprobado
    const result = [];
    const now = new Date();
    const hoyString = now.toISOString().split('T')[0];

    for (const record of latestBySubject.values()) {
      if (record.status !== 'pendiente') continue;

      const grade = parseFloat(record.grade);
      if (isNaN(grade) || grade <= 3 || grade >= 7) continue;

      const approvedFinal = (record.final_exams || []).some(fe => fe.status === 'aprobado');
      if (approvedFinal) continue;

      const failedAttempts = (record.final_exams || []).filter(fe => fe.status === 'desaprobado').length;
      const subject = record.plan_subject?.subject || record.Subject;

      const is_expired = record.regularity_expires_at
        ? record.regularity_expires_at < hoyString
        : false;

      result.push({
        academic_record_id: record.id,
        subject_id: record.id_subject,
        subject_name: subject?.name || '',
        plan_subject_id: record.plan_subject_id,
        grade: record.grade,
        year: record.year,
        regularity_expires_at: record.regularity_expires_at,
        is_expired,
        failed_attempts: failedAttempts,
      });
    }

    // Ordenar: vigentes primero, luego históricas
    result.sort((a, b) => {
      if (a.is_expired !== b.is_expired) return a.is_expired ? 1 : -1;
      return 0;
    });

    return result;
  }

  /**
   * Nuevo endpoint: GET /api/students/:id/exam-eligibility
   * Reemplaza isExamEligible() del frontend.
   * Devuelve materias pendientes (nota 4-6) agrupadas por materia (solo la más reciente),
   * excluyendo las que ya tienen final aprobado.
   */
  async getExamEligibility(studentId) {
    // 1. Traer TODOS los registros del alumno (sin filtrar por status)
    const records = await AcademicRecord.findAll({
      where: { id_student: studentId },
      include: [
        {
          model: PlanSubject,
          as: 'plan_subject',
          include: [{ model: Subject, as: 'subject' }]
        },
        { model: Subject },
        {
          model: FinalExam,
          as: 'final_exams',
          attributes: ['id', 'status', 'grade'],
          required: false,
        },
      ],
      order: [['year', 'DESC'], ['semester', 'DESC']],
    });

    // 2. Agrupar por materia y tomar el más reciente (supremacía absoluta)
    const latestBySubject = new Map();
    for (const record of records) {
      const key = record.id_subject;
      if (!latestBySubject.has(key) ||
          record.year > latestBySubject.get(key).year ||
          (record.year === latestBySubject.get(key).year && record.semester > latestBySubject.get(key).semester)) {
        latestBySubject.set(key, record);
      }
    }

    // 3. Después de agrupar, filtrar solo pendientes con grade 4-6 y sin final aprobado
    const result = [];
    const now = new Date();
    const hoyString = now.toISOString().split('T')[0];

    for (const record of latestBySubject.values()) {
      if (record.status !== 'pendiente') continue;

      const grade = parseFloat(record.grade);
      if (isNaN(grade) || grade <= 3 || grade >= 7) continue;

      const approvedFinal = (record.final_exams || []).some(fe => fe.status === 'aprobado');
      if (approvedFinal) continue;

      const failedAttempts = (record.final_exams || []).filter(fe => fe.status === 'desaprobado').length;
      const subject = record.plan_subject?.subject || record.Subject;

      const is_expired = record.regularity_expires_at
        ? record.regularity_expires_at < hoyString
        : false;

      result.push({
        academic_record_id: record.id,
        subject_id: record.id_subject,
        subject_name: subject?.name || '',
        plan_subject_id: record.plan_subject_id,
        grade: record.grade,
        year: record.year,
        regularity_expires_at: record.regularity_expires_at,
        is_expired,
        failed_attempts: failedAttempts,
        eligibility: 'examen',
      });
    }

    return result;
  }

  /**
   * Nuevo endpoint: GET /api/students/:id/subject-eligibility
   * Reemplaza getRegularidadType() del frontend.
   * Para cada materia del plan activo, determina si el estudiante puede
   * registrar una cursada (regularidad), un final (examen), o ninguna (null).
   */
  async getSubjectEligibility(studentId, enrollmentId = null) {
    const student = await Student.findOne({ where: { user_id: studentId } });
    if (!student) throw new Error('Student not found');

    let enrollment;
    if (enrollmentId) {
      enrollment = await StudentCareerEnrollment.findByPk(enrollmentId);
      if (!enrollment || String(enrollment.student_id) !== String(studentId)) {
        return [];
      }
    } else {
      enrollment = await StudentCareerEnrollment.findOne({
        where: { student_id: studentId, is_active: true, status: 'active' },
      });
    }

    if (!enrollment || !enrollment.study_plan_id) {
      return [];
    }

    const planSubjects = await PlanSubject.findAll({
      where: { id_study_plan: enrollment.study_plan_id },
      include: [
        { model: Subject, as: 'subject' },
        {
          model: PlanSubject,
          as: 'RequiredSubjects',
          through: { attributes: ['type'] },
          include: [{ model: Subject, as: 'subject' }],
        },
      ],
    });

    const records = await AcademicRecord.findAll({
      where: { id_student: studentId },
      include: [
        {
          model: FinalExam,
          as: 'final_exams',
          attributes: ['id', 'status', 'grade'],
          required: false,
        },
      ],
      order: [['year', 'DESC'], ['semester', 'DESC']],
    });

    // Mapa de subjectId -> último registro
    const latestRecordBySubject = new Map();
    for (const record of records) {
      const existing = latestRecordBySubject.get(record.id_subject);
      if (!existing ||
          record.year > existing.year ||
          (record.year === existing.year && record.semester > existing.semester)) {
        latestRecordBySubject.set(record.id_subject, record);
      }
    }

    const now = new Date();
    const hoyString = now.toISOString().split('T')[0];

    // statusMap por plan_subject_id (para validación de correlatividades)
    const bestRecordByPlanSubject = {};
    for (const record of records) {
      if (!record.plan_subject_id) continue;
      const existing = bestRecordByPlanSubject[record.plan_subject_id];
      if (!existing) {
        bestRecordByPlanSubject[record.plan_subject_id] = record;
      } else {
        const existingPrio = STATUS_PRIORITY[existing.status] || 0;
        const candidatePrio = STATUS_PRIORITY[record.status] || 0;
        if (candidatePrio > existingPrio) {
          bestRecordByPlanSubject[record.plan_subject_id] = record;
        }
      }
    }

    const statusMap = {};
    for (const ps of planSubjects) {
      const r = bestRecordByPlanSubject[ps.id] || null;
      statusMap[ps.id] = {
        isFinalizada: r ? this._isFinalizada(r) : false,
        isRegularizada: r ? this._isRegularizada(r) : false,
        hasApprovedFinal: r && r.final_exams &&
          r.final_exams.some(fe => fe.status === 'aprobado'),
        record: r,
      };
    }

    const result = [];

    for (const ps of planSubjects) {
      const subject = ps.subject;
      if (!subject) continue;

      const latestRecord = latestRecordBySubject.get(subject.id);
      let eligibility = null;
      let blocked_reason = null;

      if (!latestRecord) {
        // Nunca cursada
        eligibility = 'regularidad';
      } else if (latestRecord.status === 'enrolled') {
        eligibility = null;
        blocked_reason = 'La materia está en curso';
      } else if (latestRecord.status === 'equivalencia') {
        eligibility = null;
        blocked_reason = 'La materia tiene equivalencia';
      } else if (latestRecord.status === 'aprobado') {
        const grade = parseFloat(latestRecord.grade);
        if (!isNaN(grade) && grade >= 7) {
          eligibility = null;
          blocked_reason = 'La materia está promocionada (nota ≥ 7)';
        } else {
          eligibility = 'examen';
        }
      } else if (latestRecord.status === 'pendiente') {
        const grade = parseFloat(latestRecord.grade);
        if (isNaN(grade)) {
          eligibility = 'regularidad';
        } else if (grade >= 4 && grade <= 6) {
          const hasApprovedFinal = (latestRecord.final_exams || []).some(fe => fe.status === 'aprobado');
          if (hasApprovedFinal) {
            eligibility = null;
            blocked_reason = 'La materia ya tiene examen final aprobado';
          } else {
            const is_expired = latestRecord.regularity_expires_at
              ? latestRecord.regularity_expires_at < hoyString
              : false;
            if (is_expired) {
              eligibility = 'regularidad';
            } else {
              eligibility = 'examen';
            }
          }
        } else if (grade < 4) {
          eligibility = 'regularidad';
        } else {
          eligibility = null;
          blocked_reason = 'Estado inconsistente';
        }
      } else if (latestRecord.status === 'desaprobado') {
        eligibility = 'regularidad';
      } else {
        eligibility = null;
        blocked_reason = 'Estado no reconocido';
      }

      // Validar correlatividades solo si la materia está disponible para cursar
      if (eligibility === 'regularidad') {
        const requirements = ps.RequiredSubjects || [];
        let allMet = true;
        const missingNames = [];

        for (const req of requirements) {
          const reqStatus = statusMap[req.id];
          const subjectName = req.subject ? req.subject.name : 'Materia requerida';

          if (!reqStatus) {
            allMet = false;
            missingNames.push(subjectName);
            continue;
          }

          const corrType = req.Correlativity ? req.Correlativity.type : null;
          if (!this._meetsRequirement(reqStatus, corrType)) {
            allMet = false;
            missingNames.push(subjectName);
          }
        }

        if (!allMet) {
          eligibility = null;
          blocked_reason = `Correlativas pendientes: ${missingNames.join(', ')}`;
        }
      }

      result.push({
        subject_id: subject.id,
        subject_name: subject.name,
        plan_subject_id: ps.id,
        eligibility,
        blocked_reason,
        latest_academic_record: latestRecord ? {
          id: latestRecord.id,
          status: latestRecord.status,
          regularity_expires_at: latestRecord.regularity_expires_at,
        } : null,
      });
    }

    return result;
  }

  _getEffectiveRecord(record) {
    if (!record || record.status === 'desaprobado') return null;
    return record;
  }

  _classifySubject(record) {
    const estado = calcularMicroEstado(record);
    const map = {
      [MICRO_ESTADOS.FINALIZADA]: 'finalizada',
      [MICRO_ESTADOS.REGULARIZADA]: 'regularizada',
      [MICRO_ESTADOS.EN_CURSO]: 'en_curso',
      [MICRO_ESTADOS.FALTANTE]: 'faltante',
      [MICRO_ESTADOS.EQUIVALENCIA]: 'equivalencia',
      [MICRO_ESTADOS.VENCIDA]: 'faltante',
    };
    return map[estado] || 'faltante';
  }

  _isFinalizada(record) {
    const estado = calcularMicroEstado(record);
    return estado === MICRO_ESTADOS.FINALIZADA || estado === MICRO_ESTADOS.EQUIVALENCIA;
  }

  _isRegularizada(record) {
    return calcularMicroEstado(record) === MICRO_ESTADOS.REGULARIZADA;
  }

  _meetsRequirement(status, corrType) {
    switch (corrType) {
      case 'regularidad':
        return status.isFinalizada || status.isRegularizada;
      case 'aprobacion':
      case null:
        return status.isFinalizada;
      case 'finalizada':
        return status.isFinalizada && status.hasApprovedFinal;
      default:
        return status.isFinalizada;
    }
  }

  async _getAvailableSubjects(userId, options = {}) {
    const { simulatedFinalizadas = [], enrollmentId } = options;

    let enrollment;
    if (enrollmentId) {
      enrollment = await StudentCareerEnrollment.findByPk(enrollmentId);
      if (!enrollment || String(enrollment.student_id) !== String(userId)) {
        return [];
      }
    } else {
      enrollment = await StudentCareerEnrollment.findOne({
        where: { student_id: userId, is_active: true, status: 'active' }
      });
    }
    if (!enrollment || !enrollment.study_plan_id) return [];

    const planSubjects = await PlanSubject.findAll({
      where: { id_study_plan: enrollment.study_plan_id },
      include: [
        { model: Subject, as: 'subject' },
        {
          model: PlanSubject,
          as: 'RequiredSubjects',
          through: { attributes: ['type'] }
        }
      ]
    });

    const records = await AcademicRecord.findAll({
      where: { id_student: userId },
      include: [{ model: FinalExam, as: 'final_exams' }]
    });

    const bestRecordByPlanSubject = {};
    for (const record of records) {
      if (!record.plan_subject_id) continue;
      const existing = bestRecordByPlanSubject[record.plan_subject_id];
      if (!existing) {
        bestRecordByPlanSubject[record.plan_subject_id] = record;
      } else {
        const existingPrio = STATUS_PRIORITY[existing.status] || 0;
        const candidatePrio = STATUS_PRIORITY[record.status] || 0;
        if (candidatePrio > existingPrio) {
          bestRecordByPlanSubject[record.plan_subject_id] = record;
        }
      }
    }

    const statusMap = {};
    for (const ps of planSubjects) {
      const record = bestRecordByPlanSubject[ps.id] || null;
      statusMap[ps.id] = {
        isFinalizada: record ? this._isFinalizada(record) : false,
        isRegularizada: record ? this._isRegularizada(record) : false,
        hasApprovedFinal: record && record.final_exams &&
          record.final_exams.some(fe => fe.status === 'aprobado'),
        record
      };
    }

    for (const psId of simulatedFinalizadas) {
      if (statusMap[psId]) {
        statusMap[psId].isFinalizada = true;
        statusMap[psId].isRegularizada = false;
        statusMap[psId].hasApprovedFinal = true;
      }
    }

    const available = [];
    for (const ps of planSubjects) {
      const status = statusMap[ps.id];
      if (status.isFinalizada || status.isRegularizada) continue;

      const requirements = ps.RequiredSubjects || [];
      let allMet = true;

      for (const req of requirements) {
        const reqStatus = statusMap[req.id];
        if (!reqStatus) { allMet = false; break; }
        const corrType = req.Correlativity ? req.Correlativity.type : null;
        if (!this._meetsRequirement(reqStatus, corrType)) {
          allMet = false;
          break;
        }
      }

      if (allMet) {
        available.push({
          plan_subject_id: ps.id,
          subject_id: ps.id_subject,
          subject_name: ps.subject ? ps.subject.name : null,
          suggested_year: ps.suggested_year,
          suggested_term: ps.suggested_term,
          credits: ps.credits,
          weekly_hours: ps.subject?.weekly_hours || null,
        });
      }
    }

    return available;
  }

  /**
   * Registra un nuevo examen final
   */
  async addFinalExam(data, authenticatedStudentId) {
    const { id_academic_record, grade, year, semester } = data;

    const record = await AcademicRecord.findByPk(id_academic_record);
    if (!record) {
      throw new DomainError('Registro académico no encontrado', 404);
    }

    if (authenticatedStudentId && record.id_student !== authenticatedStudentId) {
      throw new DomainError('No autorizado: solo podés registrar finales en tus propios registros', 403);
    }

    // "aprobado" con nota 4-6 es una cursada regularizada a la que todavía le falta
    // el final (ver clasificación en planningAlgorithm.ts) — no está realmente
    // terminada. Las validaciones de más abajo (final aprobado en otra cursada,
    // nota >= 7 promocionada) ya cubren los casos que sí deben bloquearse.
    const currentGradeNum = record.grade !== null && record.grade !== undefined ? parseFloat(record.grade) : NaN;
    const isRegularizadaPendienteFinal = !isNaN(currentGradeNum) && currentGradeNum >= 4 && currentGradeNum <= 6;
    if (record.status === 'aprobado' && !isRegularizadaPendienteFinal) {
      throw new DomainError('Esta materia ya está aprobada', 409);
    }

    // Validar consistencia cronológica
    const newerRecords = await AcademicRecord.findAll({
      where: {
        id_subject: record.id_subject,
        id_student: record.id_student,
        id: { [Op.ne]: record.id },
        [Op.or]: [
          { year: { [Op.gt]: record.year } },
          { year: record.year, semester: { [Op.gt]: record.semester } }
        ]
      }
    });

    if (newerRecords.length > 0) {
      throw new DomainError(
        'Existen registros de cursada posteriores al ciclo que intentas cerrar. Por favor, revisá y gestioná tus registros desde la tabla de historial.',
        422
      );
    }

    // Validar que no exista un final aprobado en ninguna cursada de esta materia
    const anyApprovedFinal = await FinalExam.findOne({
      include: [{
        model: AcademicRecord,
        where: { id_subject: record.id_subject, id_student: record.id_student },
        attributes: [],
      }],
      where: { status: 'aprobado' },
    });
    if (anyApprovedFinal) {
      throw new DomainError('Esta materia ya tiene un examen final aprobado en una cursada anterior.', 409);
    }

    // Validar que la cursada no esté promocionada (nota >= 7)
    if (record.grade && !isNaN(parseFloat(record.grade)) && parseFloat(record.grade) >= 7) {
      throw new DomainError('La materia ya está promocionada (nota ≥ 7). No necesita examen final.', 400);
    }

    // Blindaje cronológico: fecha del examen vs cursada origen (combinado year+semester)
    if (year || semester) {
      const examYear = year || record.year;
      const examSemester = semester || record.semester;
      const examCombined = examYear + (examSemester - 1) / 2;
      const recordCombined = record.year + (record.semester - 1) / 2;
      if (examCombined < recordCombined) {
        throw new DomainError('El año y cuatrimestre del examen no puede ser anterior al año y cuatrimestre de cursada.', 400);
      }
    }

    // Blindaje cronológico: contra el final más reciente de la misma materia
    const latestFinal = await FinalExam.findOne({
      include: [{
        model: AcademicRecord,
        where: { id_subject: record.id_subject, id_student: record.id_student },
        attributes: [],
      }],
      order: [['year', 'DESC'], ['semester', 'DESC']],
    });
    if (latestFinal) {
      const examYear = year || record.year;
      const examSemester = semester || record.semester;
      const newCombined = examYear + (examSemester - 1) / 2;
      const latestCombined = latestFinal.year + (latestFinal.semester - 1) / 2;
      if (newCombined < latestCombined && Number(grade) >= 4) {
        throw new DomainError(
          'Inconsistencia cronológica: No puedes registrar un examen final aprobado en una fecha anterior a eventos existentes de esta materia.',
          422
        );
      }
    }

    const previousAttempts = await FinalExam.count({ where: { id_academic_record: id_academic_record } });

    const final = await FinalExam.create({
      id_academic_record: id_academic_record,
      grade,
      year: year || record.year,
      semester: semester || record.semester,
      attempt_number: previousAttempts + 1,
      status: Number(grade) >= 4 ? 'aprobado' : 'desaprobado',
    });

    return final;
  }

  async bulkLoad(records) {
    return await AcademicRecord.bulkCreate(records);
  }

  async deleteRecord(id) {
    const record = await AcademicRecord.findByPk(id, {
      include: [{ model: PlanSubject, as: 'plan_subject' }],
    });
    if (!record) throw new DomainError('Registro académico no encontrado', 404);

    // Verificar que no sea correlativa de otra materia ya registrada
    if (record.plan_subject_id) {
      const planSubject = await PlanSubject.findByPk(record.plan_subject_id, {
        include: [{
          model: PlanSubject,
          as: 'RequirementFor',
          through: { attributes: [] },
        }],
      });

      if (planSubject && planSubject.RequirementFor.length > 0) {
        const dependentIds = planSubject.RequirementFor.map(ps => ps.id);
        const hasDependentRecords = await AcademicRecord.findOne({
          where: {
            id_student: record.id_student,
            plan_subject_id: dependentIds,
          },
        });

        if (hasDependentRecords) {
          throw new DomainError(
            'No se puede eliminar la materia porque existen registros posteriores que dependen de ella. Eliminá primero las materias correlativas avanzadas.',
            400
          );
        }
      }
    }

    await record.destroy();
    return { message: `Registro académico ${id} eliminado correctamente` };
  }

  _mapPrerequisites(ps, psNameMap, recordByPlanSubject, recordBySubject) {
    if (!ps) return [];
    return (ps.RequiredSubjects || []).map(req => ({
      subject_name: psNameMap[req.id] || '',
      required_status: req.Correlativity?.type === 'regularidad' ? 'regularizada' : 'finalizada',
      current_status: (recordByPlanSubject[req.id] || recordBySubject[req.id_subject] || null)
        ? this._classifySubject(recordByPlanSubject[req.id] || recordBySubject[req.id_subject])
        : 'faltante',
    }));
  }

  async _validateScheduleConflict(studentId, courseId, year, term, transaction = null) {
    const newCourse = await Course.findByPk(courseId, {
      include: [{ model: CourseSchedule, as: 'schedules' }],
      transaction
    });
    if (!newCourse || !newCourse.schedules) return;

    const currentEnrollments = await AcademicRecord.findAll({
      where: {
        student_id: studentId,
        status: 'enrolled',
        year,
        term,
        course_id: { [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: courseId }] }
      },
      include: [{
        model: Course,
        as: 'course',
        include: [{ model: CourseSchedule, as: 'schedules' }, { model: PlanSubject, as: 'plan_subject', include: ['subject'] }]
      }],
      transaction
    });

    for (const enrollment of currentEnrollments) {
      for (const existingSched of enrollment.course.schedules) {
        for (const newSched of newCourse.schedules) {
          if (existingSched.day_of_week === newSched.day_of_week) {
            const overlap = (newSched.start_time < existingSched.end_time) &&
                            (newSched.end_time > existingSched.start_time);
            if (overlap) {
              throw new Error(`Schedule conflict: The subject overlaps with '${enrollment.course.plan_subject.subject.name}' on ${newSched.day_of_week}`);
            }
          }
        }
      }
    }
  }
}

module.exports = new AcademicRecordService();
module.exports.DomainError = DomainError;
module.exports.calcularRegularidadExpiresAt = calcularRegularidadExpiresAt;
