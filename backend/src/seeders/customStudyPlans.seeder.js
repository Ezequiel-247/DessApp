const { CustomStudyPlan } = require('../models');
const { seedRows } = require('./helpers');

const customStudyPlanTemplates = [];

async function seedCustomStudyPlans(students, transaction) {
  const rows = customStudyPlanTemplates.map((plan, index) => ({
    id_student: students[index % students.length].user_id,
    name: plan.name,
    weekly_hours: plan.weekly_hours,
  }));

  return seedRows(CustomStudyPlan, rows, ['id_student', 'name'], transaction);
}

module.exports = seedCustomStudyPlans;
