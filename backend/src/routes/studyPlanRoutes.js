const express = require('express');
const router = express.Router();
const studyPlanController = require('../controllers/studyPlanController');
const { validateStudyPlanData, validateStudyPlanUpdateData, validateReplacePlanData } = require('../middlewares/studyPlanMiddleware');
const authenticate = require('../middlewares/authMiddleware');
const requireRole = require('../middlewares/roleMiddleware');

router.get('/', studyPlanController.getAll);
router.get('/:id', studyPlanController.getById);
router.post('/', authenticate, requireRole('admin'), validateStudyPlanData, studyPlanController.create);
router.put('/:id', authenticate, requireRole('admin'), validateStudyPlanUpdateData, studyPlanController.update);
router.patch('/:id', authenticate, requireRole('admin'), validateStudyPlanUpdateData, studyPlanController.update);
router.delete('/:id', authenticate, requireRole('admin'), studyPlanController.delete);
router.put('/:id/replace', authenticate, requireRole('admin'), validateReplacePlanData, studyPlanController.replace);

module.exports = router;
