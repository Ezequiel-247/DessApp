const { PlanElectiveBlockSubject, StudyPlan, Subject } = require('../models');
const { seedRows } = require('./helpers');

async function seedPlanElectiveBlockSubjects(electiveBlocks, planSubjects, transaction) {
  const templates = [
    { block_index: 0, plan_subject_index: 24 },
    { block_index: 0, plan_subject_index: 25 },
    { block_index: 1, plan_subject_index: 26 },
    { block_index: 1, plan_subject_index: 27 },
    { block_index: 1, plan_subject_index: 28 },
    { block_index: 2, plan_subject_index: 29 },
    { block_index: 2, plan_subject_index: 30 },
    { block_index: 2, plan_subject_index: 31 },
    { block_index: 2, plan_subject_index: 32 },
    { block_name: 'Electiva I - TUP', plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación', subject_code: '761' },
    { block_name: 'Electiva I - TUP', plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación', subject_code: '766' },
    { block_name: 'Electiva I - TUP', plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación', subject_code: 'INF_COMP10' },
    { block_name: 'Electiva I - TUP', plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación', subject_code: 'INF_COMP5' },
    { block_name: 'Electiva II - TUP', plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación', subject_code: '756' },
    { block_name: 'Electiva II - TUP', plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación', subject_code: '795' },
    { block_name: 'Electiva II - TUP', plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación', subject_code: '757' },
  ];

  const planNames = [...new Set(templates.map((t) => t.plan_name).filter(Boolean))];
  const subjectCodes = [...new Set(templates.map((t) => t.subject_code).filter(Boolean))];

  const studyPlans = await StudyPlan.findAll({ where: { name: planNames }, transaction });
  const subjects = await Subject.findAll({ where: { code: subjectCodes }, transaction });

  const planIdByName = new Map(studyPlans.map((p) => [p.name, p.id]));
  const subjectIdByCode = new Map(subjects.map((s) => [s.code, s.id]));
  const blockIdByName = new Map(electiveBlocks.map((b) => [b.name, b.id]));
  const planSubjectByPair = new Map(planSubjects.map((ps) => [`${ps.id_study_plan}:${ps.id_subject}`, ps.id]));

  const rows = templates.map((template) => {
    if (typeof template.plan_subject_index === 'number') {
      return {
        id_elective_block: electiveBlocks[template.block_index]?.id,
        id_plan_subject: planSubjects[template.plan_subject_index]?.id,
      };
    }

    const studyPlanId = planIdByName.get(template.plan_name);
    const subjectId = subjectIdByCode.get(template.subject_code);

    return {
      id_elective_block: blockIdByName.get(template.block_name),
      id_plan_subject: planSubjectByPair.get(`${studyPlanId}:${subjectId}`),
    };
  });

  const invalid = rows.find((row) => !row.id_elective_block || !row.id_plan_subject);
  if (invalid) {
    throw new Error('No se pudo resolver bloque electivo o plan_subject en planElectiveBlockSubjects.seeder');
  }

  return seedRows(PlanElectiveBlockSubject, rows, ['id_elective_block', 'id_plan_subject'], transaction);
}

module.exports = seedPlanElectiveBlockSubjects;
