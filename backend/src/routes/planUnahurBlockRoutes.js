const express = require('express');
const router = express.Router({ mergeParams: true });
const planUnahurBlockController = require('../controllers/planUnahurBlockController');
const { validateUnahurBlockData, validateUnahurBlockUpdateData } = require('../middlewares/planBlockMiddleware');
const authenticate = require('../middlewares/authMiddleware');
const requireRole = require('../middlewares/roleMiddleware');

router.get('/', planUnahurBlockController.getAll);
router.get('/:id', planUnahurBlockController.getById);
router.post('/', authenticate, requireRole('admin'), validateUnahurBlockData, planUnahurBlockController.create);
router.put('/:id', authenticate, requireRole('admin'), validateUnahurBlockUpdateData, planUnahurBlockController.update);
router.delete('/:id', authenticate, requireRole('admin'), planUnahurBlockController.delete);

module.exports = router;
