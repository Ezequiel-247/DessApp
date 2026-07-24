require('dotenv').config();

const { sequelize } = require('../models');
const seedSystemConfigs = require('./systemConfigs.seeder');
const seedUsers = require('./users.seeder');
const seedStudents = require('./students.seeder');
const seedInstitutes = require('./institutes.seeder');
const seedCareers = require('./careers.seeder');
const seedStudyPlans = require('./studyPlans.seeder');
const seedSubjects = require('./subjects.seeder');
const seedPlanSubjects = require('./planSubjects.seeder');
const seedPlanUnahurBlocks = require('./planUnahurBlocks.seeder');
const seedPlanElectiveBlocks = require('./planElectiveBlocks.seeder');
const seedPlanElectiveBlockSubjects = require('./planElectiveBlockSubjects.seeder');
const seedPlanCreditBlocks = require('./planCreditBlocks.seeder');
const seedActivities = require('./activities.seeder');
const seedPlanCreditBlockItems = require('./planCreditBlockItems.seeder');
const seedCorrelativities = require('./correlativities.seeder');
const seedCourses = require('./courses.seeder');
const seedAcademicRecords = require('./academicRecords.seeder');
const seedActivityRecords = require('./activityRecords.seeder');
const seedFinalExams = require('./finalExams.seeder');
const seedMaterials = require('./materials.seeder');
const seedMaterialVotes = require('./materialVotes.seeder');
const { seedPostVotes, seedCommentVotes } = seedMaterialVotes;
const seedAdmins = require('./admins.seeder');
const seedCustomStudyPlans = require('./customStudyPlans.seeder');
const seedCustomStudyPlanItems = require('./customStudyPlanItems.seeder');
const seedStudentCareerEnrollments = require('./studentCareerEnrollments.seeder');
const seedInstanceSubjects = require('./instanceSubjects.seeder');
const seedConnections = require('./connections.seeder');
const seedNotifications = require('./notifications.seeder');
const seedSessions = require('./sessions.seeder');
const seedReportReasons = require('./reportReasons.seeder');
const seedReports = require('./reports.seeder');
const seedPosts = require('./posts.seeder');
const seedComments = require('./comments.seeder');
const seedStudySessions = require('./studySessions.seeder');
const seedStudySessionRegistrations = require('./studySessionRegistrations.seeder');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function connectWithRetry(retries = 10, delayMs = 2000) {
  let lastError;
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      await sequelize.authenticate();
      return;
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        console.log(`Waiting for PostgreSQL to be ready (attempt ${attempt}/${retries})...`);
        await sleep(delayMs);
      }
    }
  }
  throw lastError;
}

async function seedDatabase() {
  await connectWithRetry();
  await sequelize.sync({ force: true });

  const systemConfigs = await seedSystemConfigs();
  console.log(`  ${systemConfigs.length} system configs`);

  const users = await seedUsers();
  console.log(`  ${users.length} users`);

  const students = await seedStudents(users);
  console.log(`  ${students.length} students`);

  const institutes = await seedInstitutes();
  console.log(`  ${institutes.length} institutes`);

  const careers = await seedCareers(institutes);
  console.log(`  ${careers.length} careers`);

  const studyPlans = await seedStudyPlans(careers);
  console.log(`  ${studyPlans.length} study plans`);

  const subjects = await seedSubjects();
  console.log(`  ${subjects.length} subjects`);

  const planSubjects = await seedPlanSubjects(studyPlans, subjects);
  console.log(`  ${planSubjects.length} plan subjects`);

  const unahurBlocks = await seedPlanUnahurBlocks(studyPlans);
  console.log(`  ${unahurBlocks.length} unahur blocks`);

  const electiveBlocks = await seedPlanElectiveBlocks(studyPlans);
  console.log(`  ${electiveBlocks.length} elective blocks`);

  const electiveBlockSubjects = await seedPlanElectiveBlockSubjects(electiveBlocks, planSubjects);
  console.log(`  ${electiveBlockSubjects.length} elective block subjects`);

  const creditBlocks = await seedPlanCreditBlocks(studyPlans);
  console.log(`  ${creditBlocks.length} credit blocks`);

  const activities = await seedActivities();
  console.log(`  ${activities.length} activities`);

  const planCreditBlockItems = await seedPlanCreditBlockItems(creditBlocks, activities);
  console.log(`  ${planCreditBlockItems.length} plan credit block items`);

  const correlativities = await seedCorrelativities(planSubjects);
  console.log(`  ${correlativities.length} correlativities`);

  const courses = await seedCourses(planSubjects);
  console.log(`  ${courses.length} courses and schedules`);

  const academicRecords = await seedAcademicRecords(students, planSubjects);
  console.log(`  ${academicRecords.length} academic records (subjects)`);

  const activityRecords = await seedActivityRecords(students, activities, planCreditBlockItems);
  console.log(`  ${activityRecords.length} activity records`);

  const finalExams = await seedFinalExams(academicRecords);
  console.log(`  ${finalExams.length} final exams`);

  const materials = await seedMaterials(students, subjects);
  console.log(`  ${materials.length} materials`);

  const materialVotes = await seedMaterialVotes(materials, students);
  console.log(`  ${materialVotes.length} material votes`);

  const admins = await seedAdmins(users);
  console.log(`  ${admins.length} admins`);

  const customStudyPlans = await seedCustomStudyPlans(students);
  console.log(`  ${customStudyPlans.length} custom study plans`);

  const customStudyPlanItems = await seedCustomStudyPlanItems(customStudyPlans, planSubjects);
  console.log(`  ${customStudyPlanItems.length} custom study plan items`);

  const studentCareerEnrollments = await seedStudentCareerEnrollments(students, careers, studyPlans);
  console.log(`  ${studentCareerEnrollments.length} student career enrollments`);

  const instanceSubjects = await seedInstanceSubjects(subjects);
  console.log(`  ${instanceSubjects.length} instance subjects`);

  const connections = await seedConnections(users);
  console.log(`  ${connections.length} connections`);

  const notifications = await seedNotifications(users);
  console.log(`  ${notifications.length} notifications`);

  const sessions = await seedSessions(users);
  console.log(`  ${sessions.length} sessions`);

  const reportReasons = await seedReportReasons();
  console.log(`  ${reportReasons.length} report reasons`);

  const reports = await seedReports(users, materials, reportReasons);
  console.log(`  ${reports.length} reports`);

  const posts = await seedPosts(students);
  console.log(`  ${posts.length} posts`);

  const postVotes = await seedPostVotes(posts, students);
  console.log(`  ${postVotes.length} post votes`);

  const comments = await seedComments(posts, students);
  console.log(`  ${comments.length} comments`);

  const commentVotes = await seedCommentVotes(comments, students);
  console.log(`  ${commentVotes.length} comment votes`);

  const studySessions = await seedStudySessions(students, subjects);
  console.log(`  ${studySessions.length} study sessions`);

  const studySessionRegistrations = await seedStudySessionRegistrations(studySessions, students);
  console.log(`  ${studySessionRegistrations.length} study session registrations`);

  console.log('Seed completed successfully.');
}

module.exports = { seedDatabase };

if (require.main === module) {
  seedDatabase().catch(async (error) => {
    const connectionRefused =
      error?.code === 'ECONNREFUSED' ||
      error?.parent?.code === 'ECONNREFUSED' ||
      error?.original?.code === 'ECONNREFUSED' ||
      /ECONNREFUSED/.test(error?.message || '');

    if (connectionRefused) {
      console.error('Seed failed: the database is not running or is not reachable.');
      console.error('Run `npm run db:up` or `npm run db:prepare` first.');
    } else {
      console.error('Seed failed:', error.message);
    }
    try {
      await sequelize.close();
    } catch (closeError) {
      console.error('Error closing database connection:', closeError.message);
    }
    process.exit(1);
  });
}
