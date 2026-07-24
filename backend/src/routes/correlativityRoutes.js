const express = require('express');
const router = express.Router();
const correlativityController = require('../controllers/correlativityController');
const { validateCorrelativityData, validateCorrelativityUpdateData } = require('../middlewares/correlativityMiddleware');
const authenticate = require('../middlewares/authMiddleware');
const requireRole = require('../middlewares/roleMiddleware');

router.get('/', correlativityController.getAll);
router.get('/:id', correlativityController.getById);
router.post('/', authenticate, requireRole('admin'), validateCorrelativityData, correlativityController.create);
router.put('/:id', authenticate, requireRole('admin'), validateCorrelativityUpdateData, correlativityController.update);
router.patch('/:id', authenticate, requireRole('admin'), validateCorrelativityUpdateData, correlativityController.update);
router.delete('/:id', authenticate, requireRole('admin'), correlativityController.delete);

module.exports = router;
