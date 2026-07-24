const { StudentCareerEnrollment } = require('../models');
const { seedRows } = require('./helpers');

const enrollmentTemplates = [
  // Estudiantes 1-5 (se mantienen en carreras originales)
  { student_index: 0, career_index: 0, status: 'active', is_active: true },
  { student_index: 1, career_index: 0, status: 'active', is_active: true },
  { student_index: 2, career_index: 1, status: 'active', is_active: true },
  { student_index: 3, career_index: 0, status: 'active', is_active: true },
  { student_index: 3, career_index: 1, status: 'active', is_active: true },
  { student_index: 4, career_index: 0, status: 'active', is_active: true },
  // Estudiantes 6-10 en TUP (career_index 2)
  { student_index: 5, career_index: 2, status: 'active', is_active: true },
  { student_index: 6, career_index: 2, status: 'active', is_active: true },
  { student_index: 7, career_index: 2, status: 'active', is_active: true },
  { student_index: 8, career_index: 2, status: 'active', is_active: true },
  { student_index: 9, career_index: 2, status: 'active', is_active: true },
  // student7 además cursa Ingeniería Ambiental
  { student_index: 6, career_index: 1, status: 'active', is_active: true },
];

async function seedStudentCareerEnrollments(students, careers, studyPlans, transaction) {
  const rows = enrollmentTemplates.map((enr) => ({
    student_id: students[enr.student_index].user_id,
    career_id: careers[enr.career_index].id,
    study_plan_id: studyPlans[enr.career_index].id,
    enrolled_at: new Date('2025-03-01'),
    status: enr.status,
    is_active: enr.is_active,
  }));

  return seedRows(StudentCareerEnrollment, rows, ['student_id', 'career_id'], transaction);
}

module.exports = seedStudentCareerEnrollments;
