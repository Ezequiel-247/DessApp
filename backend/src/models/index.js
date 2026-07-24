const { sequelize } = require('../config/database');
const Career = require('./career');
const SystemConfig = require('./systemconfig');
const User = require('./user');
const Student = require('./student');
const Admin = require('./admin');
const Institute = require('./institute');
const StudyPlan = require('./studyPlan');
const Subject = require('./subject');
const PlanSubject = require('./planSubject');
const PlanUnahurBlock = require('./planUnahurBlock');
const PlanElectiveBlock = require('./planElectiveBlock');
const PlanElectiveBlockSubject = require('./planElectiveBlockSubject');
const PlanCreditBlock = require('./planCreditBlock');
const PlanCreditBlockItem = require('./planCreditBlockItem');
const Activity = require('./activity');
const ActivityRecord = require('./activityRecord');
const Correlativity = require('./correlativity');
const AcademicRecord = require('./academicRecord');
const FinalExam = require('./finalExam');
const StudentCareerEnrollment = require('./studentCareerEnrollment');
const Material = require('./material');
const Vote = require('./vote');
const CustomStudyPlan = require('./customStudyPlan');
const CustomStudyPlanItem = require('./customStudyPlanItem');
const CustomStudyPlanSabbatical = require('./customStudyPlanSabbatical');
const CustomStudyPlanElectiveChoice = require('./customStudyPlanElectiveChoice');
const CustomStudyPlanUnahurChoice = require('./customStudyPlanUnahurChoice');
const InstanceSubject = require('./instanceSubject');
const Connection = require('./connection');
const Notification = require('./notification');
const Session = require('./session');
const Report = require('./report');
const ReportReason = require('./reportReason');
const Post = require('./post');
const Comment = require('./comment');
const Course = require('./course');
const CourseSchedule = require('./courseSchedule');
const StudySession = require('./studySession');
const StudySessionRegistration = require('./studySessionRegistration');

// User <-> Student (1:1)
User.hasOne(Student, { foreignKey: 'user_id', as: 'student', onDelete: 'CASCADE' });
Student.belongsTo(User, { foreignKey: 'user_id' });

// User <-> Admin (1:1)
User.hasOne(Admin, { foreignKey: 'id_users', as: 'admin', onDelete: 'CASCADE' });
Admin.belongsTo(User, { foreignKey: 'id_users' });

// Admin self-ref (creator)
Admin.belongsTo(Admin, { foreignKey: 'id_of_creator', as: 'creator' });
Admin.hasMany(Admin, { foreignKey: 'id_of_creator', as: 'createdAdmins' });

// Institute <-> Career (1:N)
Institute.hasMany(Career, { foreignKey: 'id_institute' });
Career.belongsTo(Institute, { foreignKey: 'id_institute' });

// Career <-> StudyPlan (1:N)
Career.hasMany(StudyPlan, { foreignKey: 'id_career' });
StudyPlan.belongsTo(Career, { foreignKey: 'id_career' });

// StudyPlan <-> Subject (N:M through PlanSubject)
StudyPlan.belongsToMany(Subject, {
  through: PlanSubject,
  foreignKey: 'id_study_plan',
  otherKey: 'id_subject',
});

Subject.belongsToMany(StudyPlan, {
  through: PlanSubject,
  foreignKey: 'id_subject',
  otherKey: 'id_study_plan',
});

// PlanSubject <-> Subject (N:1)
PlanSubject.belongsTo(Subject, { foreignKey: 'id_subject', as: 'subject' });
Subject.hasMany(PlanSubject, { foreignKey: 'id_subject', as: 'plan_subjects' });

// StudyPlan <-> PlanSubject (N:1)
PlanSubject.belongsTo(StudyPlan, { foreignKey: 'id_study_plan', onDelete: 'CASCADE' });
StudyPlan.hasMany(PlanSubject, { foreignKey: 'id_study_plan', onDelete: 'CASCADE' });

// StudyPlan <-> PlanUnahurBlock (1:N)
StudyPlan.hasMany(PlanUnahurBlock, { foreignKey: 'id_study_plan', onDelete: 'CASCADE' });
PlanUnahurBlock.belongsTo(StudyPlan, { foreignKey: 'id_study_plan' });

// StudyPlan <-> PlanElectiveBlock (1:N)
StudyPlan.hasMany(PlanElectiveBlock, { foreignKey: 'id_study_plan', onDelete: 'CASCADE' });
PlanElectiveBlock.belongsTo(StudyPlan, { foreignKey: 'id_study_plan' });

// PlanElectiveBlock <-> PlanElectiveBlockSubject (1:N)
PlanElectiveBlock.hasMany(PlanElectiveBlockSubject, { foreignKey: 'id_elective_block', onDelete: 'CASCADE' });
PlanElectiveBlockSubject.belongsTo(PlanElectiveBlock, { foreignKey: 'id_elective_block' });

// PlanSubject <-> PlanElectiveBlockSubject (1:N)
PlanSubject.hasMany(PlanElectiveBlockSubject, { foreignKey: 'id_plan_subject' });
PlanElectiveBlockSubject.belongsTo(PlanSubject, { foreignKey: 'id_plan_subject', as: 'plan_subject' });

// StudyPlan <-> PlanCreditBlock (1:N)
StudyPlan.hasMany(PlanCreditBlock, { foreignKey: 'id_study_plan', onDelete: 'CASCADE' });
PlanCreditBlock.belongsTo(StudyPlan, { foreignKey: 'id_study_plan' });

// PlanCreditBlock <-> PlanCreditBlockItem (1:N)
PlanCreditBlock.hasMany(PlanCreditBlockItem, { foreignKey: 'id_credit_block', as: 'items', onDelete: 'CASCADE' });
PlanCreditBlockItem.belongsTo(PlanCreditBlock, { foreignKey: 'id_credit_block' });

// Activity <-> PlanCreditBlockItem (1:N)
Activity.hasMany(PlanCreditBlockItem, { foreignKey: 'id_activity', onDelete: 'CASCADE' });
PlanCreditBlockItem.belongsTo(Activity, { foreignKey: 'id_activity' });

// PlanCreditBlock <-> Activity (N:M through PlanCreditBlockItem)
PlanCreditBlock.belongsToMany(Activity, {
  through: PlanCreditBlockItem,
  foreignKey: 'id_credit_block',
  otherKey: 'id_activity',
});

Activity.belongsToMany(PlanCreditBlock, {
  through: PlanCreditBlockItem,
  foreignKey: 'id_activity',
  otherKey: 'id_credit_block',
});

// User <-> ActivityRecord (1:N)
User.hasMany(ActivityRecord, { foreignKey: 'id_student' });
ActivityRecord.belongsTo(User, { foreignKey: 'id_student' });

// Student <-> ActivityRecord (1:N)
Student.hasMany(ActivityRecord, { foreignKey: 'id_student', as: 'activity_records' });

// Activity <-> ActivityRecord (1:N)
Activity.hasMany(ActivityRecord, { foreignKey: 'id_activity' });
ActivityRecord.belongsTo(Activity, { foreignKey: 'id_activity' });

// PlanCreditBlockItem <-> ActivityRecord (1:N)
PlanCreditBlockItem.hasMany(ActivityRecord, { foreignKey: 'plan_credit_block_item_id' });
ActivityRecord.belongsTo(PlanCreditBlockItem, { foreignKey: 'plan_credit_block_item_id' });

// PlanSubject <-> PlanSubject (N:M self-ref through Correlativity)
PlanSubject.belongsToMany(PlanSubject, {
  as: 'RequiredSubjects',
  through: Correlativity,
  foreignKey: 'id_plan_subject_target',
  otherKey: 'id_required_plan_subject',
});

PlanSubject.belongsToMany(PlanSubject, {
  as: 'RequirementFor',
  through: Correlativity,
  foreignKey: 'id_required_plan_subject',
  otherKey: 'id_plan_subject_target',
});

// Correlativity direct belongsTo for includes from Correlativity model
Correlativity.belongsTo(PlanSubject, { foreignKey: 'id_plan_subject_target', as: 'targetPlanSubject', onDelete: 'CASCADE' });
Correlativity.belongsTo(PlanSubject, { foreignKey: 'id_required_plan_subject', as: 'requiredPlanSubject', onDelete: 'CASCADE' });

// User <-> AcademicRecord (1:N)
User.hasMany(AcademicRecord, { foreignKey: 'id_student' });
AcademicRecord.belongsTo(User, { foreignKey: 'id_student' });

// Student <-> AcademicRecord (1:N)
Student.hasMany(AcademicRecord, { foreignKey: 'id_student', as: 'academic_records' });

// Subject <-> AcademicRecord (1:N)
Subject.hasMany(AcademicRecord, { foreignKey: 'id_subject' });
AcademicRecord.belongsTo(Subject, { foreignKey: 'id_subject' });

// AcademicRecord <-> PlanSubject (N:1)
AcademicRecord.belongsTo(PlanSubject, { foreignKey: 'plan_subject_id', as: 'plan_subject' });
PlanSubject.hasMany(AcademicRecord, { foreignKey: 'plan_subject_id' });

// AcademicRecord <-> Course (N:1)
AcademicRecord.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });
Course.hasMany(AcademicRecord, { foreignKey: 'course_id' });

// Course <-> PlanSubject (N:1)
Course.belongsTo(PlanSubject, { foreignKey: 'plan_subject_id', as: 'plan_subject' });
PlanSubject.hasMany(Course, { foreignKey: 'plan_subject_id' });

// Course <-> CourseSchedule (1:N)
Course.hasMany(CourseSchedule, { foreignKey: 'course_id', as: 'schedules', onDelete: 'CASCADE' });
CourseSchedule.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });

// AcademicRecord <-> FinalExam (1:N)
AcademicRecord.hasMany(FinalExam, {
  foreignKey: 'id_academic_record',
  as: 'final_exams',
  onDelete: 'CASCADE'
});
FinalExam.belongsTo(AcademicRecord, { foreignKey: 'id_academic_record' });

// Student <-> Material (1:N)
Student.hasMany(Material, { foreignKey: 'id_author' });
Material.belongsTo(Student, { foreignKey: 'id_author' });

// Subject <-> Material (1:N)
Subject.hasMany(Material, { foreignKey: 'id_subject' });
Material.belongsTo(Subject, { foreignKey: 'id_subject' });

// Material <-> Vote (1:N polymorphic)
Material.hasMany(Vote, { foreignKey: 'target_id', scope: { target_type: 'material' }, constraints: false });
Vote.belongsTo(Material, { foreignKey: 'target_id', constraints: false });

// Post <-> Vote (1:N polymorphic)
Post.hasMany(Vote, { foreignKey: 'target_id', scope: { target_type: 'post' }, constraints: false });
Vote.belongsTo(Post, { foreignKey: 'target_id', constraints: false });

// AcademicRecord <-> Vote (1:N polymorphic)
AcademicRecord.hasMany(Vote, { foreignKey: 'target_id', scope: { target_type: 'academic_event' }, constraints: false });
Vote.belongsTo(AcademicRecord, { foreignKey: 'target_id', constraints: false });

// Student <-> Vote (1:N)
Student.hasMany(Vote, { foreignKey: 'id_student', onDelete: 'CASCADE' });
Vote.belongsTo(Student, { foreignKey: 'id_student' });

// Subject <-> InstanceSubject (1:N)
Subject.hasMany(InstanceSubject, { foreignKey: 'id_subject' });
InstanceSubject.belongsTo(Subject, { foreignKey: 'id_subject' });

// Student <-> CustomStudyPlan (1:N)
Student.hasMany(CustomStudyPlan, { foreignKey: 'id_student' });
CustomStudyPlan.belongsTo(Student, { foreignKey: 'id_student' });

// CustomStudyPlan <-> CustomStudyPlanItem (1:N)
CustomStudyPlan.hasMany(CustomStudyPlanItem, { foreignKey: 'id_custom_study_plan', as: 'items', onDelete: 'CASCADE' });
CustomStudyPlanItem.belongsTo(CustomStudyPlan, { foreignKey: 'id_custom_study_plan' });

// CustomStudyPlanItem <-> PlanSubject (N:1)
CustomStudyPlanItem.belongsTo(PlanSubject, { foreignKey: 'plan_subject_id', as: 'plan_subject' });
PlanSubject.hasMany(CustomStudyPlanItem, { foreignKey: 'plan_subject_id' });

// CustomStudyPlan <-> CustomStudyPlanSabbatical (1:N)
CustomStudyPlan.hasMany(CustomStudyPlanSabbatical, { foreignKey: 'id_custom_study_plan', as: 'sabbaticals', onDelete: 'CASCADE' });
CustomStudyPlanSabbatical.belongsTo(CustomStudyPlan, { foreignKey: 'id_custom_study_plan' });

// CustomStudyPlan <-> CustomStudyPlanElectiveChoice (1:N)
CustomStudyPlan.hasMany(CustomStudyPlanElectiveChoice, { foreignKey: 'id_custom_study_plan', as: 'elective_choices', onDelete: 'CASCADE' });
CustomStudyPlanElectiveChoice.belongsTo(CustomStudyPlan, { foreignKey: 'id_custom_study_plan' });

// CustomStudyPlanElectiveChoice <-> PlanElectiveBlock (N:1)
CustomStudyPlanElectiveChoice.belongsTo(PlanElectiveBlock, { foreignKey: 'id_elective_block' });
PlanElectiveBlock.hasMany(CustomStudyPlanElectiveChoice, { foreignKey: 'id_elective_block' });

// CustomStudyPlanElectiveChoice <-> PlanSubject (N:1)
CustomStudyPlanElectiveChoice.belongsTo(PlanSubject, { foreignKey: 'plan_subject_id', as: 'plan_subject' });
PlanSubject.hasMany(CustomStudyPlanElectiveChoice, { foreignKey: 'plan_subject_id' });

// CustomStudyPlan <-> CustomStudyPlanUnahurChoice (1:N)
CustomStudyPlan.hasMany(CustomStudyPlanUnahurChoice, { foreignKey: 'id_custom_study_plan', as: 'unahur_choices', onDelete: 'CASCADE' });
CustomStudyPlanUnahurChoice.belongsTo(CustomStudyPlan, { foreignKey: 'id_custom_study_plan' });

// CustomStudyPlanUnahurChoice <-> PlanUnahurBlock (N:1)
CustomStudyPlanUnahurChoice.belongsTo(PlanUnahurBlock, { foreignKey: 'id_unahur_block' });
PlanUnahurBlock.hasMany(CustomStudyPlanUnahurChoice, { foreignKey: 'id_unahur_block' });

// CustomStudyPlanUnahurChoice <-> PlanSubject (N:1)
CustomStudyPlanUnahurChoice.belongsTo(PlanSubject, { foreignKey: 'plan_subject_id', as: 'plan_subject' });
PlanSubject.hasMany(CustomStudyPlanUnahurChoice, { foreignKey: 'plan_subject_id' });

// Student <-> StudentCareerEnrollment (1:N)
Student.hasMany(StudentCareerEnrollment, { foreignKey: 'student_id', as: 'enrollments' });
StudentCareerEnrollment.belongsTo(Student, { foreignKey: 'student_id' });

// Career <-> StudentCareerEnrollment (1:N)
Career.hasMany(StudentCareerEnrollment, { foreignKey: 'career_id', as: 'enrollments' });
StudentCareerEnrollment.belongsTo(Career, { foreignKey: 'career_id', as: 'career' });

// StudyPlan <-> StudentCareerEnrollment (1:N)
StudyPlan.hasMany(StudentCareerEnrollment, { foreignKey: 'study_plan_id', as: 'enrollments' });
StudentCareerEnrollment.belongsTo(StudyPlan, { foreignKey: 'study_plan_id', as: 'studyPlan' });

// User <-> Connection (1:N, two FKs)
User.hasMany(Connection, { foreignKey: 'id_user', as: 'connections' });
Connection.belongsTo(User, { foreignKey: 'id_user', as: 'user' });

User.hasMany(Connection, { foreignKey: 'id_connected_user', as: 'connectedBy' });
Connection.belongsTo(User, { foreignKey: 'id_connected_user', as: 'connectedUser' });

// User <-> Notification (1:N)
User.hasMany(Notification, { foreignKey: 'id_user' });
Notification.belongsTo(User, { foreignKey: 'id_user' });

// User <-> Session (1:N)
User.hasMany(Session, { foreignKey: 'id_user' });
Session.belongsTo(User, { foreignKey: 'id_user' });

// User (reporter) <-> Report (1:N)
User.hasMany(Report, { foreignKey: 'id_reporter', as: 'reports' });
Report.belongsTo(User, { foreignKey: 'id_reporter', as: 'reporter' });

// User (resolver) <-> Report (1:N)
User.hasMany(Report, { foreignKey: 'resolved_by_id', as: 'resolvedReports' });
Report.belongsTo(User, { foreignKey: 'resolved_by_id', as: 'resolver' });

// ReportReason <-> Report (1:N)
ReportReason.hasMany(Report, { foreignKey: 'id_reason' });
Report.belongsTo(ReportReason, { foreignKey: 'id_reason' });

// Student <-> Post (1:N)
Student.hasMany(Post, { foreignKey: 'id_author' });
Post.belongsTo(Student, { foreignKey: 'id_author' });

// Student <-> Comment (1:N)
Student.hasMany(Comment, { foreignKey: 'id_author' });
Comment.belongsTo(Student, { foreignKey: 'id_author' });

// Student (Host) <-> StudySession (1:N)
Student.hasMany(StudySession, { foreignKey: 'host_student_id', as: 'hosted_sessions', onDelete: 'CASCADE' });
StudySession.belongsTo(Student, { foreignKey: 'host_student_id', as: 'host' });

// Subject <-> StudySession (1:N)
Subject.hasMany(StudySession, { foreignKey: 'subject_id', as: 'study_sessions', onDelete: 'CASCADE' });
StudySession.belongsTo(Subject, { foreignKey: 'subject_id', as: 'subject' });

// StudySession <-> StudySessionRegistration (1:N)
StudySession.hasMany(StudySessionRegistration, { foreignKey: 'study_session_id', as: 'registrations', onDelete: 'CASCADE' });
StudySessionRegistration.belongsTo(StudySession, { foreignKey: 'study_session_id', as: 'session' });

// Student (Participant) <-> StudySessionRegistration (1:N)
Student.hasMany(StudySessionRegistration, { foreignKey: 'student_id', as: 'session_registrations', onDelete: 'CASCADE' });
StudySessionRegistration.belongsTo(Student, { foreignKey: 'student_id', as: 'student' });

module.exports = {
  sequelize,
  Career,
  SystemConfig,
  User,
  Student,
  Institute,
  StudyPlan,
  Subject,
  PlanSubject,
  PlanUnahurBlock,
  PlanElectiveBlock,
  PlanElectiveBlockSubject,
  PlanCreditBlock,
  PlanCreditBlockItem,
  Activity,
  ActivityRecord,
  Correlativity,
  AcademicRecord,
  FinalExam,
  Admin,
  StudentCareerEnrollment,
  Material,
  Vote,
  CustomStudyPlan,
  CustomStudyPlanItem,
  CustomStudyPlanSabbatical,
  CustomStudyPlanElectiveChoice,
  CustomStudyPlanUnahurChoice,
  InstanceSubject,
  Connection,
  Notification,
  Session,
  Report,
  ReportReason,
  Post,
  Comment,
  Course,
  CourseSchedule,
  StudySession,
  StudySessionRegistration,
};
