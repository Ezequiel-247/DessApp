const express = require('express');
const router = express.Router();
const academicRecordController = require('../controllers/academicRecordController');
const { validateAcademicRecordData, validateAcademicRecordUpdateData } = require('../middlewares/academicRecordMiddleware');

router.get('/', academicRecordController.getAll);
router.get('/student/:student_id', academicRecordController.getByStudentId);
router.post('/', validateAcademicRecordData, academicRecordController.create);
router.put('/student/:student_id', validateAcademicRecordUpdateData, academicRecordController.updateByStudentId);
router.put('/:id', validateAcademicRecordUpdateData, academicRecordController.update);
// Accept PATCH as well to match frontend partial update calls
router.patch('/student/:student_id', validateAcademicRecordUpdateData, academicRecordController.updateByStudentId);
router.patch('/:id', validateAcademicRecordUpdateData, academicRecordController.update);
router.delete('/student/:student_id', academicRecordController.deleteByStudentId);
router.delete('/:id', academicRecordController.delete);

module.exports = router;
