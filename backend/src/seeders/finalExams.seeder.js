const { FinalExam, User, Subject } = require('../models');
const { seedRows } = require('./helpers');

const finalExamTemplates = [
  // student6: finales pendientes de primer año (intentos desaprobados)
  {
    student_email: 'student6@example.com',
    subject_code: '793',
    grade: '2',
    year: 2026,
    semester: 1,
    status: 'desaprobado',
    attempt_number: 1,
  },
  {
    student_email: 'student6@example.com',
    subject_code: '030',
    grade: '3',
    year: 2026,
    semester: 1,
    status: 'desaprobado',
    attempt_number: 1,
  },
  // student7: finales pendientes de primer año (intentos desaprobados)
  {
    student_email: 'student7@example.com',
    subject_code: '793',
    grade: '2',
    year: 2026,
    semester: 1,
    status: 'desaprobado',
    attempt_number: 1,
  },
  {
    student_email: 'student7@example.com',
    subject_code: '030',
    grade: '4',
    year: 2026,
    semester: 1,
    status: 'desaprobado',
    attempt_number: 1,
  },
  // student8: regularizada en 752 con intento de final desaprobado
  {
    student_email: 'student8@example.com',
    subject_code: '752',
    grade: '3',
    year: 2026,
    semester: 1,
    status: 'desaprobado',
    attempt_number: 1,
  },
  // student9: electiva finalizada con final aprobado
  {
    student_email: 'student9@example.com',
    subject_code: '761',
    grade: '8',
    year: 2026,
    semester: 1,
    status: 'aprobado',
    attempt_number: 1,
  },
  // student10: regularizada en 765 con final pendiente (intento desaprobado)
  {
    student_email: 'student10@example.com',
    subject_code: '765',
    grade: '2',
    year: 2026,
    semester: 1,
    status: 'desaprobado',
    attempt_number: 1,
  },
  // student10: materia aprobada con final aprobado
  {
    student_email: 'student10@example.com',
    subject_code: '754',
    grade: '7',
    year: 2025,
    semester: 2,
    status: 'aprobado',
    attempt_number: 1,
  },
];

async function seedFinalExams(academicRecords, transaction) {
  const emails = [...new Set(finalExamTemplates.map((template) => template.student_email))];
  const codes = [...new Set(finalExamTemplates.map((template) => template.subject_code))];

  const users = await User.findAll({ where: { email: emails }, transaction });
  const subjects = await Subject.findAll({ where: { code: codes }, transaction });

  const userIdByEmail = new Map(users.map((user) => [user.email, user.id]));
  const subjectIdByCode = new Map(subjects.map((subject) => [subject.code, subject.id]));
  const recordByStudentAndSubject = new Map(
    academicRecords.map((record) => [
      `${record.id_student}:${record.id_subject}`,
      record,
    ])
  );

  const rows = finalExamTemplates.map((template) => {
    const studentId = userIdByEmail.get(template.student_email);
    const subjectId = subjectIdByCode.get(template.subject_code);
    const academicRecord = recordByStudentAndSubject.get(`${studentId}:${subjectId}`);

    return {
      id_academic_record: academicRecord?.id,
      grade: template.grade,
      year: template.year,
      semester: template.semester,
      status: template.status,
      attempt_number: template.attempt_number,
    };
  });

  const invalid = rows.find((row) => !row.id_academic_record);
  if (invalid) {
    throw new Error('No se pudo resolver academic_record para uno o más finales en finalExams.seeder');
  }

  return seedRows(FinalExam, rows, ['id_academic_record', 'year', 'semester'], transaction);
}

module.exports = seedFinalExams;
