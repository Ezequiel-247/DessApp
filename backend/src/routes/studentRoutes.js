const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const authenticate = require('../middlewares/authMiddleware');
const uploadAvatarMiddleware = require('../middlewares/studentAvatarUploadMiddleware');
const { validateStudentCreateData, validateStudentUpdateData } = require('../middlewares/studentMiddleware');
const { validateEnrollmentData, validateEnrollmentUpdateData } = require('../middlewares/studentCareerEnrollmentMiddleware');

router.get('/', studentController.getAll);
router.get('/:id/profile', authenticate, studentController.getProfile);
router.get('/:id', studentController.getById);
router.post('/', validateStudentCreateData, studentController.create);
router.put('/:id', validateStudentUpdateData, studentController.update);
router.patch('/:id', validateStudentUpdateData, studentController.update);
router.post('/:id/avatar', authenticate, uploadAvatarMiddleware, studentController.uploadAvatar);
router.delete('/:id', studentController.delete);

router.get('/:id/plan-subjects', studentController.getPlanSubjects);
router.get('/:id/academic-summary', studentController.getAcademicSummary);
router.get('/:id/academic-year-breakdown', studentController.getAcademicYearBreakdown);
router.get('/:id/exam-eligibility', studentController.getExamEligibility);
router.get('/:id/subject-eligibility', studentController.getSubjectEligibility);
router.get('/:id/activity-eligibility', studentController.getActivityEligibility);
router.get('/:id/pending-finals', studentController.getPendingFinalExams);
router.get('/:id/planner-data', studentController.getPlannerData);
router.post('/:id/save-plan', authenticate, studentController.savePlan);
router.get('/:id/enrollments', studentController.getEnrollments);
router.post('/:id/enrollments', validateEnrollmentData, studentController.addEnrollment);
router.put('/:id/enrollments/:enrollmentId', validateEnrollmentUpdateData, studentController.updateEnrollment);
router.patch('/:id/enrollments/:enrollmentId', validateEnrollmentUpdateData, studentController.updateEnrollment);
router.delete('/:id/enrollments/:enrollmentId', studentController.deleteEnrollment);

module.exports = router;
