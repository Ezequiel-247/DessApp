const { AcademicRecord, StudyPlan, Subject } = require('../models');
const { seedRows } = require('./helpers');
const { calcularRegularidadExpiresAt } = require('../academicRecordService');

const TUP_PLAN_NAME = 'Plan 2025 - Tecnicatura Universitaria en Programación';

const studentAcademicHistory = [
  // student6@example.com - TUP primer año (6 aprobadas + 2 con final pendiente)
  { student_index: 5, subject_code: '788', status: 'aprobado', grade: '8' },
  { student_index: 5, subject_code: '790', status: 'aprobado', grade: '7' },
  { student_index: 5, subject_code: '789', status: 'aprobado', grade: '8' },
  { student_index: 5, subject_code: '004', status: 'aprobado', grade: '9' },
  { student_index: 5, subject_code: '791', status: 'aprobado', grade: '7' },
  { student_index: 5, subject_code: '792', status: 'aprobado', grade: '6' },
  { student_index: 5, subject_code: '793', status: 'pendiente', grade: '5' },
  { student_index: 5, subject_code: '030', status: 'pendiente', grade: '4' },

  // student7@example.com - TUP primer año (6 aprobadas + 2 con final pendiente)
  { student_index: 6, subject_code: '788', status: 'aprobado', grade: '7' },
  { student_index: 6, subject_code: '790', status: 'aprobado', grade: '8' },
  { student_index: 6, subject_code: '789', status: 'aprobado', grade: '7' },
  { student_index: 6, subject_code: '004', status: 'aprobado', grade: '8' },
  { student_index: 6, subject_code: '791', status: 'aprobado', grade: '7' },
  { student_index: 6, subject_code: '792', status: 'aprobado', grade: '6' },
  { student_index: 6, subject_code: '793', status: 'pendiente', grade: '4' },
  { student_index: 6, subject_code: '030', status: 'pendiente', grade: '5' },
  // student7 además cursa Ingeniería Ambiental
  { student_index: 6, plan_name: 'Plan 2026 - Ambiente', subject_code: 'QUI-101', status: 'aprobado', grade: '8' },
  { student_index: 6, plan_name: 'Plan 2026 - Ambiente', subject_code: 'BIO-101', status: 'enrolled', grade: null },

  // student8@example.com - primer año completo + UNAHUR + segundo año parcial
  { student_index: 7, subject_code: '788', status: 'aprobado', grade: '9' },
  { student_index: 7, subject_code: '790', status: 'aprobado', grade: '8' },
  { student_index: 7, subject_code: '789', status: 'aprobado', grade: '8' },
  { student_index: 7, subject_code: '004', status: 'aprobado', grade: '9' },
  { student_index: 7, subject_code: '791', status: 'aprobado', grade: '8' },
  { student_index: 7, subject_code: '792', status: 'aprobado', grade: '7' },
  { student_index: 7, subject_code: '793', status: 'aprobado', grade: '8' },
  { student_index: 7, subject_code: '030', status: 'aprobado', grade: '9' },
  { student_index: 7, subject_code: '754', status: 'aprobado', grade: '7' },
  { student_index: 7, subject_code: '753', status: 'aprobado', grade: '7' },
  { student_index: 7, subject_code: '752', status: 'pendiente', grade: '5' },
  { student_index: 7, subject_code: 'AU_11', status: 'aprobado', grade: '9' },
  { student_index: 7, subject_code: 'AU_24', status: 'aprobado', grade: '8' },
  { student_index: 7, subject_code: 'AU_55', status: 'aprobado', grade: '9' },

  // student9@example.com - avanzado + electiva + créditos
  { student_index: 8, subject_code: '788', status: 'aprobado', grade: '8' },
  { student_index: 8, subject_code: '790', status: 'aprobado', grade: '7' },
  { student_index: 8, subject_code: '789', status: 'aprobado', grade: '9' },
  { student_index: 8, subject_code: '004', status: 'aprobado', grade: '9' },
  { student_index: 8, subject_code: '791', status: 'aprobado', grade: '8' },
  { student_index: 8, subject_code: '792', status: 'aprobado', grade: '8' },
  { student_index: 8, subject_code: '793', status: 'aprobado', grade: '7' },
  { student_index: 8, subject_code: '030', status: 'aprobado', grade: '8' },
  { student_index: 8, subject_code: '754', status: 'aprobado', grade: '7' },
  { student_index: 8, subject_code: '753', status: 'aprobado', grade: '8' },
  { student_index: 8, subject_code: '752', status: 'aprobado', grade: '7' },
  { student_index: 8, subject_code: '765', status: 'aprobado', grade: '7' },
  { student_index: 8, subject_code: '043', status: 'aprobado', grade: '8' },
  { student_index: 8, subject_code: '761', status: 'aprobado', grade: '8' },
  { student_index: 8, subject_code: 'AU_2', status: 'aprobado', grade: '9' },
  { student_index: 8, subject_code: '758', status: 'enrolled', grade: null },

  // student10@example.com - variado + UNAHUR + una desaprobada + una regular con final pendiente
  { student_index: 9, subject_code: '788', status: 'aprobado', grade: '6' },
  { student_index: 9, subject_code: '790', status: 'aprobado', grade: '7' },
  { student_index: 9, subject_code: '789', status: 'aprobado', grade: '7' },
  { student_index: 9, subject_code: '004', status: 'aprobado', grade: '8' },
  { student_index: 9, subject_code: '791', status: 'aprobado', grade: '6' },
  { student_index: 9, subject_code: '792', status: 'aprobado', grade: '7' },
  { student_index: 9, subject_code: '793', status: 'aprobado', grade: '6' },
  { student_index: 9, subject_code: '030', status: 'aprobado', grade: '8' },
  { student_index: 9, subject_code: '043', status: 'aprobado', grade: '7' },
  { student_index: 9, subject_code: '754', status: 'aprobado', grade: '6' },
  { student_index: 9, subject_code: '753', status: 'aprobado', grade: '6' },
  { student_index: 9, subject_code: '752', status: 'desaprobado', grade: '2' },
  { student_index: 9, subject_code: '765', status: 'pendiente', grade: '5' },
  { student_index: 9, subject_code: 'AU_31', status: 'aprobado', grade: '9' },
  { student_index: 9, subject_code: 'AU_41', status: 'aprobado', grade: '8' },
];

function inferPeriod(planSubject, record) {
  const year = record.year || (2024 + planSubject.suggested_year);
  const semester = record.semester || planSubject.suggested_term;
  return { year, semester };
}

async function seedAcademicRecords(students, planSubjects, transaction) {
  const planNames = [...new Set([TUP_PLAN_NAME, ...studentAcademicHistory.map((record) => record.plan_name).filter(Boolean)])];
  const studyPlans = await StudyPlan.findAll({ where: { name: planNames }, transaction });
  const studyPlanByName = new Map(studyPlans.map((plan) => [plan.name, plan]));

  if (!studyPlanByName.has(TUP_PLAN_NAME)) {
    throw new Error('No se encontró el plan TUP 2025 para academicRecords');
  }

  const subjectCodes = [...new Set(studentAcademicHistory.map((record) => record.subject_code))];
  const subjects = await Subject.findAll({ where: { code: subjectCodes }, transaction });

  const subjectIdByCode = new Map(subjects.map((subject) => [subject.code, subject.id]));
  const planSubjectByPlanAndSubjectId = new Map(
    planSubjects.map((planSubject) => [`${planSubject.id_study_plan}:${planSubject.id_subject}`, planSubject])
  );

  const rows = [];

  studentAcademicHistory.forEach((record) => {
    const student = students[record.student_index];
    const studyPlan = studyPlanByName.get(record.plan_name || TUP_PLAN_NAME);
    const subjectId = subjectIdByCode.get(record.subject_code);
    const planSubject = planSubjectByPlanAndSubjectId.get(`${studyPlan?.id}:${subjectId}`);

    if (student && studyPlan && planSubject) {
      const period = inferPeriod(planSubject, record);
      // El vencimiento de la regularidad siempre se deriva del año/cuatrimestre
      // real del registro (mismo cálculo que usa academicRecordService al dar de
      // alta/editar una cursada) — nunca un literal hardcodeado, para que no quede
      // desincronizado con lo que el modal de calificaciones previsualiza.
      const regularityExpiresAt = record.status === 'pendiente'
        ? calcularRegularidadExpiresAt(period.year, period.semester)
        : null;
      rows.push({
        id_student: student.user_id,
        id_subject: planSubject.id_subject,
        plan_subject_id: planSubject.id,
        course_id: null,
        year: period.year,
        semester: period.semester,
        status: record.status,
        grade: record.grade,
        regularity_expires_at: regularityExpiresAt,
      });
    }
  });

  if (rows.length !== studentAcademicHistory.length) {
    throw new Error('No se pudieron resolver todos los registros académicos del template');
  }

  if (rows.length > 0) {
    return await seedRows(AcademicRecord, rows, ['id_student', 'id_subject'], transaction);
  }
  return [];
}

module.exports = seedAcademicRecords;
