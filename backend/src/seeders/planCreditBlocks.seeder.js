const { PlanCreditBlock } = require('../models');
const { seedRows } = require('./helpers');

async function seedPlanCreditBlocks(studyPlans, transaction) {
  const rows = [
    { id_study_plan: studyPlans[0].id, name: 'Bloque de Créditos 1', min_credits_required: 3, max_credits_allowed: 6, sort_order: 1 },
    { id_study_plan: studyPlans[0].id, name: 'Bloque de Créditos 2', min_credits_required: 4, max_credits_allowed: 8, sort_order: 2 },
    { id_study_plan: studyPlans[0].id, name: 'Bloque de Créditos 3', min_credits_required: 5, max_credits_allowed: 10, sort_order: 3 },
    { id_study_plan: studyPlans[1].id, name: 'Bloque de Créditos Único', min_credits_required: 5, max_credits_allowed: 10, sort_order: 1 },
    { id_study_plan: studyPlans[2].id, name: 'TUP - Integración Curricular', min_credits_required: 8, max_credits_allowed: 16, sort_order: 1 },
    { id_study_plan: studyPlans[2].id, name: 'TUP - Formativas Académicas y Profesionales', min_credits_required: 20, max_credits_allowed: 80, sort_order: 2 },
    { id_study_plan: studyPlans[2].id, name: 'TUP - Sociales, Culturales y Deportivas', min_credits_required: 4, max_credits_allowed: 20, sort_order: 3 },
    { id_study_plan: studyPlans[2].id, name: 'TUP - Docencia e Investigación', min_credits_required: 3, max_credits_allowed: 20, sort_order: 4 },
  ];

  return seedRows(PlanCreditBlock, rows, ['id_study_plan', 'name'], transaction);
}

module.exports = seedPlanCreditBlocks;
