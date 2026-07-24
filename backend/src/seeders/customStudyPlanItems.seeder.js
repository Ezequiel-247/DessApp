const { CustomStudyPlanItem } = require('../models');
const { seedRows } = require('./helpers');

async function seedCustomStudyPlanItems(customPlans, planSubjects, transaction) {
  const rows = [];

  return seedRows(CustomStudyPlanItem, rows, ['id_custom_study_plan', 'plan_subject_id'], transaction);
}

module.exports = seedCustomStudyPlanItems;