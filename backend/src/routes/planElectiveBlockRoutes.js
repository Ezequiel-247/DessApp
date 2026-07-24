const express = require('express');
const router = express.Router({ mergeParams: true });
const planElectiveBlockController = require('../controllers/planElectiveBlockController');
const { validateElectiveBlockData, validateElectiveBlockUpdateData, validateElectiveBlockSubjectData } = require('../middlewares/planBlockMiddleware');
const authenticate = require('../middlewares/authMiddleware');
const requireRole = require('../middlewares/roleMiddleware');

router.get('/', planElectiveBlockController.getAll);
router.get('/:id', planElectiveBlockController.getById);
router.post('/', authenticate, requireRole('admin'), validateElectiveBlockData, planElectiveBlockController.create);
router.put('/:id', authenticate, requireRole('admin'), validateElectiveBlockUpdateData, planElectiveBlockController.update);
router.delete('/:id', authenticate, requireRole('admin'), planElectiveBlockController.delete);

router.get('/:blockId/subjects', planElectiveBlockController.getBlockSubjects);
router.post('/:blockId/subjects', authenticate, requireRole('admin'), validateElectiveBlockSubjectData, planElectiveBlockController.addBlockSubject);
router.delete('/:blockId/subjects/:subjectId', authenticate, requireRole('admin'), planElectiveBlockController.removeBlockSubject);

module.exports = router;
