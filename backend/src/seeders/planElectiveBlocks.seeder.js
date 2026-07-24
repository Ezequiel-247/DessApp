const { PlanElectiveBlock } = require('../models');
const { seedRows } = require('./helpers');

async function seedPlanElectiveBlocks(studyPlans, transaction) {
  const rows = [
    { id_study_plan: studyPlans[0].id, name: 'Bloque Electivo I', min_required: 1, requires_approved_mandatory_count: 0, suggested_year: 4, sort_order: 1 },
    { id_study_plan: studyPlans[0].id, name: 'Bloque Electivo II', min_required: 2, requires_approved_mandatory_count: 0, suggested_year: 4, sort_order: 2 },
    { id_study_plan: studyPlans[1].id, name: 'Bloque Electivo Único', min_required: 2, requires_approved_mandatory_count: 0, suggested_year: 5, sort_order: 1 },
    { id_study_plan: studyPlans[2].id, name: 'Electiva I - TUP', min_required: 1, requires_approved_mandatory_count: 0, suggested_year: 2, sort_order: 1 },
    { id_study_plan: studyPlans[2].id, name: 'Electiva II - TUP', min_required: 1, requires_approved_mandatory_count: 0, suggested_year: 2, sort_order: 2 },
  ];

  return seedRows(PlanElectiveBlock, rows, ['id_study_plan', 'name'], transaction);
}

module.exports = seedPlanElectiveBlocks;
