require('dotenv').config();
const academicRecordService = require('./src/academicRecordService');

async function test() {
  try {
    const { AcademicRecord, PlanSubject, Subject } = require('./src/models');
    
    console.log('Testing getAcademicSummary for user 2 (Martin Gomez)...');
    const summary1 = await academicRecordService.getAcademicSummary(2);
    console.log('User 2 summary:', summary1);
    const recs2 = await AcademicRecord.findAll({
      where: { id_student: 2, status: 'aprobado' },
      include: [{ model: PlanSubject, as: 'plan_subject', include: [{ model: Subject, as: 'subject' }] }]
    });
    console.log('User 2 records:', recs2.map(r => ({ name: r.plan_subject.subject.name, grade: r.grade, status: r.status })));

    console.log('Testing getAcademicSummary for user 3 (Lucia Fernandez)...');
    const summary2 = await academicRecordService.getAcademicSummary(3);
    console.log('User 3 summary:', summary2);
    const { FinalExam } = require('./src/models');
    const allExams = await FinalExam.findAll();
    console.log('All final exams in DB:');
    allExams.forEach(e => {
      console.log(`ID: ${e.id}, Record ID: ${e.id_academic_record}, Grade: ${e.grade}, Status: ${e.status}`);
    });
    process.exit(0);
  } catch (error) {
    console.error('Test failed with error:', error);
    process.exit(1);
  }
}

test();
