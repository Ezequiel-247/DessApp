const express = require('express');
const router = express.Router();
const subjectController = require('../controllers/subjectController');
const { validateSubjectData, validateSubjectUpdateData } = require('../middlewares/subjectMiddleware');
const authenticate = require('../middlewares/authMiddleware');
const requireRole = require('../middlewares/roleMiddleware');

router.get('/', subjectController.getAll);
router.get('/student/:studentId', subjectController.getByStudent);
router.get('/:id', subjectController.getById);
router.post('/', authenticate, requireRole('admin', 'student'), validateSubjectData, subjectController.create);
router.put('/:id', authenticate, requireRole('admin'), validateSubjectUpdateData, subjectController.update);
router.patch('/:id', authenticate, requireRole('admin'), validateSubjectUpdateData, subjectController.update);
router.delete('/:id', authenticate, requireRole('admin'), subjectController.delete);

module.exports = router;
