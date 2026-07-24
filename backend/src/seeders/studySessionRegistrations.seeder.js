const { StudySessionRegistration } = require('../models');
const { seedRows } = require('./helpers');

const registrationStatuses = ['approved', 'pending', 'rejected'];

async function seedStudySessionRegistrations(studySessions, students, transaction) {
  const rows = [];

  studySessions.forEach((session, sessionIndex) => {
    for (let offset = 1; offset <= 3; offset += 1) {
      const candidate = students[(sessionIndex + offset) % students.length];

      if (candidate.user_id === session.host_student_id) {
        continue;
      }

      rows.push({
        study_session_id: session.id,
        student_id: candidate.user_id,
        status: registrationStatuses[(sessionIndex + offset) % registrationStatuses.length],
      });
    }
  });

  return seedRows(
    StudySessionRegistration,
    rows,
    ['study_session_id', 'student_id'],
    transaction,
  );
}

module.exports = seedStudySessionRegistrations;
