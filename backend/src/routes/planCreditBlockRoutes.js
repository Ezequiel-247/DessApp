const express = require('express');
const router = express.Router({ mergeParams: true });
const planCreditBlockController = require('../controllers/planCreditBlockController');
const { validateCreditBlockData, validateCreditBlockUpdateData } = require('../middlewares/planBlockMiddleware');
const authenticate = require('../middlewares/authMiddleware');
const requireRole = require('../middlewares/roleMiddleware');

router.get('/', planCreditBlockController.getAll);
router.get('/:id', planCreditBlockController.getById);
router.post('/', authenticate, requireRole('admin'), validateCreditBlockData, planCreditBlockController.create);
router.put('/:id', authenticate, requireRole('admin'), validateCreditBlockUpdateData, planCreditBlockController.update);
router.delete('/:id', authenticate, requireRole('admin'), planCreditBlockController.delete);

module.exports = router;
