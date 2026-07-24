const { ActivityRecord } = require('../models');
const { seedRows } = require('./helpers');

async function seedActivityRecords(students, activities, planCreditBlockItems, transaction) {
  const activityIdByName = new Map(activities.map((activity) => [activity.name, activity.id]));
  const itemByActivityId = new Map(planCreditBlockItems.map((item) => [item.id_activity, item]));

  const templates = [
    // student9@example.com
    { student_index: 8, activity_name: 'Desarrollo de Aplicaciones, en UNAHUR (CR012_033)', status: 'approved', grade: '10', year: 2025, semester: 2 },
    { student_index: 8, activity_name: 'Git (CR053)', status: 'approved', grade: '9', year: 2025, semester: 2 },
    { student_index: 8, activity_name: 'Python Day (CR_ITI_002)', status: 'approved', grade: '9', year: 2026, semester: 1 },
    { student_index: 8, activity_name: 'UNAHUR@TIC #1 - Encuentro de Informática (CR019)', status: 'approved', grade: '8', year: 2026, semester: 1 },

    // student10@example.com
    { student_index: 9, activity_name: 'Talleres especiales - Taller de Github (CR003)', status: 'approved', grade: '8', year: 2025, semester: 2 },
    { student_index: 9, activity_name: 'Vibe Coding (CR058)', status: 'approved', grade: '8', year: 2026, semester: 1 },
    { student_index: 9, activity_name: 'Actividades de Biblioteca (CR032)', status: 'approved', grade: '10', year: 2026, semester: 1 },
    { student_index: 9, activity_name: 'Participación como Estudiante Asistente (CR009)', status: 'approved', grade: '9', year: 2026, semester: 1 },
  ];

  const rows = templates.map((template) => {
    const activityId = activityIdByName.get(template.activity_name);
    const item = itemByActivityId.get(activityId);
    const student = students[template.student_index];

    return {
      id_student: student?.user_id,
      id_activity: activityId,
      plan_credit_block_item_id: item?.id,
      status: template.status,
      grade: template.grade,
      year: template.year,
      semester: template.semester,
    };
  });

  const built = rows.map((r) => {
    return {
      id_student: r.id_student,
      id_activity: r.id_activity,
      plan_credit_block_item_id: r.plan_credit_block_item_id,
      status: r.status,
      grade: r.grade,
      year: r.year,
      semester: r.semester,
    };
  });

  const invalid = built.find((row) => !row.id_student || !row.id_activity || !row.plan_credit_block_item_id);
  if (invalid) {
    throw new Error('No se pudo resolver estudiante/actividad/item en activityRecords.seeder');
  }

  return seedRows(ActivityRecord, built, ['id_student', 'plan_credit_block_item_id'], transaction);
}

module.exports = seedActivityRecords;
