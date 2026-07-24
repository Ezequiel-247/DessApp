const express = require('express');
const router = express.Router();
const instituteController = require('../controllers/instituteController');
const { validateInstituteData, validateInstituteUpdateData } = require('../middlewares/InstituteMiddleware');
const authenticate = require('../middlewares/authMiddleware');
const requireRole = require('../middlewares/roleMiddleware');

router.get('/', instituteController.getAll);
router.post('/', authenticate, requireRole('admin'), validateInstituteData, instituteController.create);
router.put('/:id', authenticate, requireRole('admin'), validateInstituteUpdateData, instituteController.update);
router.patch('/:id', authenticate, requireRole('admin'), validateInstituteUpdateData, instituteController.update);
router.delete('/:id', authenticate, requireRole('admin'), instituteController.delete);

module.exports = router;