const express = require('express');
const router = express.Router();
const planSubjectController = require('../controllers/planSubjectController');
const { validatePlanSubjectData, validatePlanSubjectUpdateData } = require('../middlewares/planSubjectMiddleware');
const authenticate = require('../middlewares/authMiddleware');
const requireRole = require('../middlewares/roleMiddleware');

router.get('/', planSubjectController.getAll);
router.get('/:id', planSubjectController.getById);
router.post('/', authenticate, requireRole('admin', 'student'), validatePlanSubjectData, planSubjectController.create);
router.put('/:id', authenticate, requireRole('admin'), validatePlanSubjectUpdateData, planSubjectController.update);
router.patch('/:id', authenticate, requireRole('admin'), validatePlanSubjectUpdateData, planSubjectController.update);
router.delete('/:id', authenticate, requireRole('admin'), planSubjectController.delete);

module.exports = router;
