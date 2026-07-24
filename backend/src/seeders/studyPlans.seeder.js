const { StudyPlan } = require('../models');
const { seedRows } = require('./helpers');

const studyPlanTemplates = [
  {
    name: 'Plan 2026 - Computacion',
    career_name: 'Licenciatura en Ciencias de la Computacion',
    status: 'vigente',
    years_duration: 4,
    course_type: 'cuatrimestral',
    default_term: 1,
    min_total_credits: null,
  },
  {
    name: 'Plan 2026 - Ambiente',
    career_name: 'Ingenieria Ambiental',
    status: 'vigente',
    years_duration: 5,
    course_type: 'cuatrimestral',
    default_term: 1,
    min_total_credits: null,
  },
  {
    name: 'Plan 2025 - Tecnicatura Universitaria en Programación',
    career_name: 'Tecnicatura Universitaria en Programación',
    status: 'vigente',
    years_duration: 3,
    course_type: 'cuatrimestral',
    default_term: 1,
    min_total_credits: 35,
  },
];

async function seedStudyPlans(careers, transaction) {
  const careerByName = new Map(careers.map((career) => [career.name, career]));

  const rows = studyPlanTemplates.map((plan) => ({
    id_career: careerByName.get(plan.career_name)?.id,
    name: plan.name,
    status: plan.status,
    years_duration: plan.years_duration,
    course_type: plan.course_type,
    default_term: plan.default_term,
    min_total_credits: plan.min_total_credits,
  }));

  const invalid = rows.find((row) => !row.id_career);
  if (invalid) {
    throw new Error(`No se encontró career para study plan: ${invalid.name}`);
  }

  return seedRows(StudyPlan, rows, ['id_career', 'name'], transaction);
}

module.exports = seedStudyPlans;
