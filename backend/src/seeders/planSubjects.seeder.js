const { PlanSubject } = require('../models');
const { seedRows } = require('./helpers');

const TUP_PLAN_NAME = 'Plan 2025 - Tecnicatura Universitaria en Programación';

const planSubjectTemplates = [
  // Ingeniería en Computación (Plan 0) — 11 registros
  { plan_index: 0, subject_index: 0, suggested_year: 1, suggested_term: 1, credits: 6, weekly_hours: 6 },
  { plan_index: 0, subject_index: 1, suggested_year: 1, suggested_term: 1, credits: 4, weekly_hours: 6 },
  { plan_index: 0, subject_index: 2, suggested_year: 1, suggested_term: 1, credits: 4, weekly_hours: 4 },
  { plan_index: 0, subject_index: 3, suggested_year: 1, suggested_term: 2, credits: 6, weekly_hours: 6 },
  { plan_index: 0, subject_index: 4, suggested_year: 1, suggested_term: 2, credits: 4, weekly_hours: 6 },
  { plan_index: 0, subject_index: 5, suggested_year: 2, suggested_term: 1, credits: 4, weekly_hours: 6 },
  { plan_index: 0, subject_index: 6, suggested_year: 2, suggested_term: 1, credits: 4, weekly_hours: 6 },
  { plan_index: 0, subject_index: 7, suggested_year: 2, suggested_term: 2, credits: 4, weekly_hours: 6 },
  { plan_index: 0, subject_index: 8, suggested_year: 3, suggested_term: 1, credits: 4, weekly_hours: 6 },
  { plan_index: 0, subject_index: 9, suggested_year: 3, suggested_term: 2, credits: 4, weekly_hours: 6 },
  { plan_index: 0, subject_index: 10, suggested_year: 4, suggested_term: 2, credits: 8, weekly_hours: 8, is_final_project: true },
  // Ingeniería Ambiental (Plan 1) — 13 registros
  { plan_index: 1, subject_index: 0, suggested_year: 1, suggested_term: 1, credits: 6, weekly_hours: 6 },
  { plan_index: 1, subject_index: 16, suggested_year: 1, suggested_term: 1, credits: 4, weekly_hours: 4 },
  { plan_index: 1, subject_index: 17, suggested_year: 1, suggested_term: 1, credits: 4, weekly_hours: 4 },
  { plan_index: 1, subject_index: 3, suggested_year: 1, suggested_term: 2, credits: 6, weekly_hours: 6 },
  { plan_index: 1, subject_index: 18, suggested_year: 1, suggested_term: 2, credits: 4, weekly_hours: 4 },
  { plan_index: 1, subject_index: 19, suggested_year: 2, suggested_term: 1, credits: 4, weekly_hours: 4 },
  { plan_index: 1, subject_index: 20, suggested_year: 2, suggested_term: 1, credits: 4, weekly_hours: 4 },
  { plan_index: 1, subject_index: 21, suggested_year: 2, suggested_term: 2, credits: 4, weekly_hours: 4 },
  { plan_index: 1, subject_index: 22, suggested_year: 3, suggested_term: 1, credits: 6, weekly_hours: 6 },
  { plan_index: 1, subject_index: 23, suggested_year: 3, suggested_term: 2, credits: 4, weekly_hours: 4 },
  { plan_index: 1, subject_index: 24, suggested_year: 4, suggested_term: 1, credits: 4, weekly_hours: 4 },
  { plan_index: 1, subject_index: 25, suggested_year: 5, suggested_term: 1, credits: 4, weekly_hours: 4 },
  { plan_index: 1, subject_index: 26, suggested_year: 5, suggested_term: 2, credits: 8, weekly_hours: 8, is_final_project: true },
  // Electivas Computación (Plan 0) — 5 registros
  { plan_index: 0, subject_index: 11, suggested_year: 4, suggested_term: 1, credits: null, is_elective: true, weekly_hours: 4 },
  { plan_index: 0, subject_index: 12, suggested_year: 4, suggested_term: 1, credits: null, is_elective: true, weekly_hours: 4 },
  { plan_index: 0, subject_index: 13, suggested_year: 4, suggested_term: 2, credits: null, is_elective: true, weekly_hours: 4 },
  { plan_index: 0, subject_index: 14, suggested_year: 4, suggested_term: 2, credits: null, is_elective: true, weekly_hours: 4 },
  { plan_index: 0, subject_index: 15, suggested_year: 5, suggested_term: 1, credits: null, is_elective: true, weekly_hours: 4 },
  // Electivas Ambiente (Plan 1) — 4 registros
  { plan_index: 1, subject_index: 27, suggested_year: 5, suggested_term: 1, credits: null, is_elective: true, weekly_hours: 4 },
  { plan_index: 1, subject_index: 28, suggested_year: 5, suggested_term: 1, credits: null, is_elective: true, weekly_hours: 4 },
  { plan_index: 1, subject_index: 29, suggested_year: 5, suggested_term: 2, credits: null, is_elective: true, weekly_hours: 4 },
  { plan_index: 1, subject_index: 30, suggested_year: 5, suggested_term: 2, credits: null, is_elective: true, weekly_hours: 4 },
  // Materias UNAHUR (Plan 0) — catálogo abierto para el bloque UNAHUR de año 4
  { plan_index: 0, subject_index: 31, suggested_year: 4, suggested_term: 1, credits: null, weekly_hours: 4 },
  { plan_index: 0, subject_index: 32, suggested_year: 4, suggested_term: 1, credits: null, weekly_hours: 4 },
  { plan_index: 0, subject_index: 33, suggested_year: 4, suggested_term: 1, credits: null, weekly_hours: 4 },
  { plan_index: 0, subject_index: 34, suggested_year: 4, suggested_term: 1, credits: null, weekly_hours: 4 },
  // Materias UNAHUR (Plan 1) — catálogo abierto para los bloques UNAHUR de año 4 y 5
  { plan_index: 1, subject_index: 31, suggested_year: 4, suggested_term: 1, credits: null, weekly_hours: 4 },
  { plan_index: 1, subject_index: 32, suggested_year: 4, suggested_term: 1, credits: null, weekly_hours: 4 },
  { plan_index: 1, subject_index: 33, suggested_year: 5, suggested_term: 1, credits: null, weekly_hours: 4 },
  { plan_index: 1, subject_index: 34, suggested_year: 5, suggested_term: 1, credits: null, weekly_hours: 4 },
  // TUP 2025 (Plan 2) - Obligatorias
  { plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación', subject_code: '788', suggested_year: 1, suggested_term: 1, credits: 6 },
  { plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación', subject_code: '790', suggested_year: 1, suggested_term: 1, credits: 6 },
  { plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación', subject_code: '789', suggested_year: 1, suggested_term: 1, credits: 6 },
  { plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación', subject_code: '004', suggested_year: 1, suggested_term: 1, credits: 4 },
  { plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación', subject_code: '791', suggested_year: 1, suggested_term: 2, credits: 6 },
  { plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación', subject_code: '792', suggested_year: 1, suggested_term: 2, credits: 6 },
  { plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación', subject_code: '793', suggested_year: 1, suggested_term: 2, credits: 6 },
  { plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación', subject_code: '030', suggested_year: 1, suggested_term: 2, credits: 4 },
  { plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación', subject_code: '754', suggested_year: 2, suggested_term: 1, credits: 6 },
  { plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación', subject_code: '753', suggested_year: 2, suggested_term: 1, credits: 6 },
  { plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación', subject_code: '752', suggested_year: 2, suggested_term: 1, credits: 6 },
  { plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación', subject_code: '765', suggested_year: 2, suggested_term: 2, credits: 6 },
  { plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación', subject_code: '043', suggested_year: 2, suggested_term: 2, credits: 4 },
  { plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación', subject_code: '758', suggested_year: 3, suggested_term: 1, credits: 6 },
  { plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación', subject_code: '759', suggested_year: 3, suggested_term: 1, credits: 6 },
  { plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación', subject_code: '760', suggested_year: 3, suggested_term: 2, credits: 6 },
  // TUP 2025 (Plan 2) - Electivas
  { plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación', subject_code: '761', suggested_year: 2, suggested_term: 1, credits: null, is_elective: true },
  { plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación', subject_code: '766', suggested_year: 2, suggested_term: 1, credits: null, is_elective: true },
  { plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación', subject_code: 'INF_COMP10', suggested_year: 2, suggested_term: 1, credits: null, is_elective: true },
  { plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación', subject_code: 'INF_COMP5', suggested_year: 2, suggested_term: 1, credits: null, is_elective: true },
  { plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación', subject_code: '756', suggested_year: 2, suggested_term: 2, credits: null, is_elective: true },
  { plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación', subject_code: '795', suggested_year: 2, suggested_term: 2, credits: null, is_elective: true },
  { plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación', subject_code: '757', suggested_year: 2, suggested_term: 2, credits: null, is_elective: true },
  // TUP 2025 (Plan 2) - UNAHUR catálogo abierto
  { plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación', subject_code: 'AU_2', suggested_year: 2, suggested_term: 1, credits: null },
  { plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación', subject_code: 'AU_11', suggested_year: 2, suggested_term: 1, credits: null },
  { plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación', subject_code: 'AU_12', suggested_year: 2, suggested_term: 1, credits: null },
  { plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación', subject_code: 'AU_3', suggested_year: 2, suggested_term: 1, credits: null },
  { plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación', subject_code: 'AU_4', suggested_year: 2, suggested_term: 1, credits: null },
  { plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación', subject_code: 'AU_5', suggested_year: 2, suggested_term: 1, credits: null },
  { plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación', subject_code: 'AU_6', suggested_year: 2, suggested_term: 1, credits: null },
  { plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación', subject_code: 'AU_7', suggested_year: 2, suggested_term: 1, credits: null },
  { plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación', subject_code: 'AU_8', suggested_year: 2, suggested_term: 1, credits: null },
  { plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación', subject_code: 'AU_9', suggested_year: 2, suggested_term: 1, credits: null },
  { plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación', subject_code: 'AU_1', suggested_year: 2, suggested_term: 1, credits: null },
  { plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación', subject_code: 'AU_10', suggested_year: 2, suggested_term: 1, credits: null },
  { plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación', subject_code: 'AU_13', suggested_year: 2, suggested_term: 1, credits: null },
  { plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación', subject_code: 'AU_14', suggested_year: 2, suggested_term: 1, credits: null },
  { plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación', subject_code: 'AU_15', suggested_year: 2, suggested_term: 1, credits: null },
  { plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación', subject_code: 'AU_17', suggested_year: 2, suggested_term: 1, credits: null },
  { plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación', subject_code: 'AU_16', suggested_year: 2, suggested_term: 1, credits: null },
  { plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación', subject_code: 'AU_20', suggested_year: 2, suggested_term: 1, credits: null },
  { plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación', subject_code: 'AU_18', suggested_year: 2, suggested_term: 1, credits: null },
  { plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación', subject_code: 'AU_19', suggested_year: 2, suggested_term: 1, credits: null },
  { plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación', subject_code: 'AU_21', suggested_year: 2, suggested_term: 1, credits: null },
  { plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación', subject_code: 'AU_22', suggested_year: 2, suggested_term: 1, credits: null },
  { plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación', subject_code: 'AU_30', suggested_year: 2, suggested_term: 1, credits: null },
  { plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación', subject_code: 'AU_32', suggested_year: 2, suggested_term: 1, credits: null },
  { plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación', subject_code: 'AU_33', suggested_year: 2, suggested_term: 1, credits: null },
  { plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación', subject_code: 'AU_28', suggested_year: 2, suggested_term: 1, credits: null },
  { plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación', subject_code: 'AU_27', suggested_year: 2, suggested_term: 1, credits: null },
  { plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación', subject_code: 'AU_26', suggested_year: 2, suggested_term: 1, credits: null },
  { plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación', subject_code: 'AU_31', suggested_year: 2, suggested_term: 1, credits: null },
  { plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación', subject_code: 'AU_25', suggested_year: 2, suggested_term: 1, credits: null },
  { plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación', subject_code: 'AU_24', suggested_year: 2, suggested_term: 1, credits: null },
  { plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación', subject_code: 'AU_23', suggested_year: 2, suggested_term: 1, credits: null },
  { plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación', subject_code: 'AU_34', suggested_year: 2, suggested_term: 1, credits: null },
  { plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación', subject_code: 'AU_35', suggested_year: 2, suggested_term: 1, credits: null },
  { plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación', subject_code: 'AU_36', suggested_year: 2, suggested_term: 1, credits: null },
  { plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación', subject_code: 'AU_37', suggested_year: 2, suggested_term: 1, credits: null },
  { plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación', subject_code: 'AU_39', suggested_year: 2, suggested_term: 1, credits: null },
  { plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación', subject_code: 'AU_40', suggested_year: 2, suggested_term: 1, credits: null },
  { plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación', subject_code: 'AU_41', suggested_year: 2, suggested_term: 1, credits: null },
  { plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación', subject_code: 'AU_42', suggested_year: 2, suggested_term: 1, credits: null },
  { plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación', subject_code: 'AU_43', suggested_year: 2, suggested_term: 1, credits: null },
  { plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación', subject_code: 'AU_44', suggested_year: 2, suggested_term: 1, credits: null },
  { plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación', subject_code: 'AU_45', suggested_year: 2, suggested_term: 1, credits: null },
  { plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación', subject_code: 'AU_46', suggested_year: 2, suggested_term: 1, credits: null },
  { plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación', subject_code: 'AU_47', suggested_year: 2, suggested_term: 1, credits: null },
  { plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación', subject_code: 'AU_48', suggested_year: 2, suggested_term: 1, credits: null },
  { plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación', subject_code: 'AU_49', suggested_year: 2, suggested_term: 1, credits: null },
  { plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación', subject_code: 'AU_50', suggested_year: 2, suggested_term: 1, credits: null },
  { plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación', subject_code: 'AU_52', suggested_year: 2, suggested_term: 1, credits: null },
  { plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación', subject_code: 'AU_51', suggested_year: 2, suggested_term: 1, credits: null },
  { plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación', subject_code: 'AU_53', suggested_year: 2, suggested_term: 1, credits: null },
  { plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación', subject_code: 'AU_54', suggested_year: 2, suggested_term: 1, credits: null },
  { plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación', subject_code: 'AU_55', suggested_year: 2, suggested_term: 1, credits: null },
  { plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación', subject_code: 'AU_56', suggested_year: 2, suggested_term: 1, credits: null },
  { plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación', subject_code: 'AU_61', suggested_year: 2, suggested_term: 1, credits: null },
];

function resolveStudyPlan(studyPlans, template) {
  if (typeof template.plan_index === 'number') {
    return studyPlans[template.plan_index];
  }

  if (template.plan_name) {
    return studyPlans.find((plan) => plan.name === template.plan_name);
  }

  return null;
}

function resolveSubject(subjects, template) {
  if (typeof template.subject_index === 'number') {
    return subjects[template.subject_index];
  }

  if (template.subject_code) {
    return subjects.find((subject) => subject.code === template.subject_code);
  }

  return null;
}

async function seedPlanSubjects(studyPlans, subjects, transaction) {
  const rows = planSubjectTemplates.map((template) => ({
    id_study_plan: resolveStudyPlan(studyPlans, template)?.id,
    id_subject: resolveSubject(subjects, template)?.id,
    suggested_year: template.suggested_year,
    suggested_term: template.suggested_term,
    credits: template.credits,
    is_elective:
      template.is_elective ||
      (template.plan_name === TUP_PLAN_NAME &&
        typeof template.subject_code === 'string' &&
        template.subject_code.startsWith('AU_')) ||
      false,
    is_final_project: template.is_final_project || false,
  }));

  const invalid = rows.find((row) => !row.id_study_plan || !row.id_subject);
  if (invalid) {
    throw new Error('No se pudo resolver id_study_plan o id_subject en planSubjects.seeder');
  }

  return seedRows(PlanSubject, rows, ['id_study_plan', 'id_subject'], transaction);
}

module.exports = seedPlanSubjects;
