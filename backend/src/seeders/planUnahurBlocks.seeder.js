const { PlanUnahurBlock } = require('../models');
const { seedRows } = require('./helpers');

async function seedPlanUnahurBlocks(studyPlans, transaction) {
  const rows = [
    { id_study_plan: studyPlans[0].id, suggested_year: 4, suggested_term: null, sort_order: 1 },
    { id_study_plan: studyPlans[1].id, suggested_year: 4, suggested_term: null, sort_order: 1 },
    { id_study_plan: studyPlans[1].id, suggested_year: 5, suggested_term: null, sort_order: 2 },
    { id_study_plan: studyPlans[2].id, suggested_year: 2, suggested_term: null, sort_order: 1 },
  ];

  return seedRows(PlanUnahurBlock, rows, ['id_study_plan', 'suggested_year'], transaction);
}

module.exports = seedPlanUnahurBlocks;
