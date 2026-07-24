const { Correlativity, StudyPlan, Subject } = require('../models');
const { seedRows } = require('./helpers');

const correlativityTemplates = [
  // Ingeniería en Computación (Plan 0)
  { main: 3, required: 0, type: 'regularidad' }, // MAT-102 ← MAT-101
  { main: 4, required: 1, type: 'aprobacion' },  // PROG-102 ← PROG-101
  { main: 5, required: 4, type: 'aprobacion' },  // AED-201 ← PROG-102
  { main: 7, required: 2, type: 'regularidad' }, // SO-202 ← ORG-101
  { main: 8, required: 5, type: 'aprobacion' },  // IS-301 ← AED-201
  { main: 9, required: 7, type: 'finalizada' },  // RED-302 ← SO-202
  { main: 10, required: 8, type: 'finalizada' }, // PF-402 ← IS-301
  // Electivas Computación (Plan 0) — requieren MAT-101 + PROG-101
  { main: 24, required: 0, type: 'regularidad' }, // ECOM-01 ← MAT-101
  { main: 24, required: 1, type: 'regularidad' }, // ECOM-01 ← PROG-101
  { main: 25, required: 0, type: 'regularidad' }, // ECOM-02 ← MAT-101
  { main: 25, required: 1, type: 'regularidad' }, // ECOM-02 ← PROG-101
  { main: 26, required: 0, type: 'regularidad' }, // ECOM-03 ← MAT-101
  { main: 26, required: 1, type: 'regularidad' }, // ECOM-03 ← PROG-101
  { main: 27, required: 0, type: 'regularidad' }, // ECOM-04 ← MAT-101
  { main: 27, required: 1, type: 'regularidad' }, // ECOM-04 ← PROG-101
  { main: 28, required: 0, type: 'regularidad' }, // ECOM-05 ← MAT-101
  { main: 28, required: 1, type: 'regularidad' }, // ECOM-05 ← PROG-101
  // Ingeniería Ambiental (Plan 1)
  { main: 14, required: 11, type: 'regularidad' }, // MAT-102 ← MAT-101
  { main: 15, required: 12, type: 'aprobacion' },  // QUI-102 ← QUI-101
  { main: 16, required: 13, type: 'regularidad' }, // ECO-201 ← BIO-101
  { main: 18, required: 15, type: 'aprobacion' },  // MIC-202 ← QUI-102
  { main: 19, required: 14, type: 'aprobacion' },  // OPE-301 ← MAT-102
  { main: 21, required: 16, type: 'finalizada' },  // CON-401 ← ECO-201
  { main: 22, required: 21, type: 'regularidad' }, // TPF-501 ← CON-401
  { main: 23, required: 22, type: 'aprobacion' },  // PF-502 ← TPF-501
  // TUP 2025 - todas de tipo aprobacion
  {
    plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación',
    main_subject_code: '791',
    required_subject_code: '789',
    type: 'aprobacion',
  },
  {
    plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación',
    main_subject_code: '792',
    required_subject_code: '789',
    type: 'aprobacion',
  },
  {
    plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación',
    main_subject_code: '793',
    required_subject_code: '788',
    type: 'aprobacion',
  },
  {
    plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación',
    main_subject_code: '754',
    required_subject_code: '793',
    type: 'aprobacion',
  },
  {
    plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación',
    main_subject_code: '753',
    required_subject_code: '792',
    type: 'aprobacion',
  },
  {
    plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación',
    main_subject_code: '752',
    required_subject_code: '792',
    type: 'aprobacion',
  },
  {
    plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación',
    main_subject_code: '765',
    required_subject_code: '753',
    type: 'aprobacion',
  },
  {
    plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación',
    main_subject_code: '043',
    required_subject_code: '030',
    type: 'aprobacion',
  },
  {
    plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación',
    main_subject_code: '761',
    required_subject_code: '752',
    type: 'aprobacion',
  },
  {
    plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación',
    main_subject_code: '766',
    required_subject_code: '752',
    type: 'aprobacion',
  },
  {
    plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación',
    main_subject_code: 'INF_COMP10',
    required_subject_code: '752',
    type: 'aprobacion',
  },
  {
    plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación',
    main_subject_code: 'INF_COMP10',
    required_subject_code: '754',
    type: 'aprobacion',
  },
  {
    plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación',
    main_subject_code: 'INF_COMP10',
    required_subject_code: '753',
    type: 'aprobacion',
  },
  {
    plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación',
    main_subject_code: 'INF_COMP5',
    required_subject_code: '752',
    type: 'aprobacion',
  },
  {
    plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación',
    main_subject_code: 'INF_COMP5',
    required_subject_code: '754',
    type: 'aprobacion',
  },
  {
    plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación',
    main_subject_code: 'INF_COMP5',
    required_subject_code: '753',
    type: 'aprobacion',
  },
  {
    plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación',
    main_subject_code: '756',
    required_subject_code: '790',
    type: 'aprobacion',
  },
  {
    plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación',
    main_subject_code: '795',
    required_subject_code: '790',
    type: 'aprobacion',
  },
  {
    plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación',
    main_subject_code: '757',
    required_subject_code: '790',
    type: 'aprobacion',
  },
  {
    plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación',
    main_subject_code: '758',
    required_subject_code: '765',
    type: 'aprobacion',
  },
  {
    plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación',
    main_subject_code: '759',
    required_subject_code: '765',
    type: 'aprobacion',
  },
  {
    plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación',
    main_subject_code: '759',
    required_subject_code: '754',
    type: 'aprobacion',
  },
  {
    plan_name: 'Plan 2025 - Tecnicatura Universitaria en Programación',
    main_subject_code: '760',
    required_subject_code: '765',
    type: 'aprobacion',
  },
];

async function seedCorrelativities(planSubjects, transaction) {
  const planNames = [...new Set(correlativityTemplates.map((t) => t.plan_name).filter(Boolean))];
  const subjectCodes = [...new Set(correlativityTemplates.flatMap((t) => [t.main_subject_code, t.required_subject_code]).filter(Boolean))];

  const studyPlans = await StudyPlan.findAll({
    where: { name: planNames },
    transaction,
  });
  const subjects = await Subject.findAll({
    where: { code: subjectCodes },
    transaction,
  });

  const studyPlanIdByName = new Map(studyPlans.map((plan) => [plan.name, plan.id]));
  const subjectIdByCode = new Map(subjects.map((subject) => [subject.code, subject.id]));
  const planSubjectByPair = new Map(
    planSubjects.map((planSubject) => [
      `${planSubject.id_study_plan}:${planSubject.id_subject}`,
      planSubject.id,
    ])
  );

  const rows = correlativityTemplates.map((template) => ({
    id_plan_subject_target: typeof template.main === 'number'
      ? planSubjects[template.main]?.id
      : planSubjectByPair.get(`${studyPlanIdByName.get(template.plan_name)}:${subjectIdByCode.get(template.main_subject_code)}`),
    id_required_plan_subject: typeof template.required === 'number'
      ? planSubjects[template.required]?.id
      : planSubjectByPair.get(`${studyPlanIdByName.get(template.plan_name)}:${subjectIdByCode.get(template.required_subject_code)}`),
    type: template.type,
  }));

  const invalid = rows.find((row) => !row.id_plan_subject_target || !row.id_required_plan_subject);
  if (invalid) {
    throw new Error('No se pudo resolver correlatividad en correlativities.seeder');
  }

  return seedRows(Correlativity, rows, ['id_plan_subject_target', 'id_required_plan_subject'], transaction);
}

module.exports = seedCorrelativities;
