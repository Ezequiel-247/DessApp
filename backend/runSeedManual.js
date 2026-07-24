require('dotenv').config();
const { sequelize } = require('./src/models');
const { seedDatabase } = require('./src/seeders/seedDatabase');
const { AcademicRecord, PlanSubject, Subject } = require('./src/models');

async function main() {
  try {
    console.log('Force syncing and seeding...');
    await seedDatabase();
    
    console.log('Querying academic records immediately after seeding...');
    const allRecs = await AcademicRecord.findAll({
      include: [{ model: PlanSubject, as: 'plan_subject', include: [{ model: Subject, as: 'subject' }] }]
    });
    allRecs.forEach(r => {
      console.log(`ID: ${r.id}, Student: ${r.id_student}, Subject: ${r.plan_subject.subject.name}, Grade: ${r.grade}, Status: ${r.status}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Manual seed failed:', error);
    process.exit(1);
  }
}

main();
