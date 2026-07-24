const express = require('express');
const router = express.Router();
const careerController = require('../controllers/careerController');
const { validateCareerData, validateCareerUpdateData } = require('../middlewares/careerMiddleware');
const authenticate = require('../middlewares/authMiddleware');
const requireRole = require('../middlewares/roleMiddleware');

router.get('/', careerController.getAll);
router.get('/:id', careerController.getById);
router.post('/', authenticate, requireRole('admin'), validateCareerData, careerController.create);
router.put('/:id', authenticate, requireRole('admin'), validateCareerUpdateData, careerController.update);
router.patch('/:id', authenticate, requireRole('admin'), validateCareerUpdateData, careerController.update);
router.delete('/:id', authenticate, requireRole('admin'), careerController.delete);

module.exports = router;
