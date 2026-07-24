const express = require('express');
const router = express.Router();
const authenticate = require('../middlewares/authMiddleware');
const activityRecordController = require('../controllers/activityRecordController');
const { validateActivityRecordData, validateActivityRecordUpdateData } = require('../middlewares/activityRecordMiddleware');

router.get('/', authenticate, activityRecordController.getAll);
router.get('/:id', authenticate, activityRecordController.getById);
router.post('/', authenticate, validateActivityRecordData, activityRecordController.create);
router.put('/:id', authenticate, validateActivityRecordUpdateData, activityRecordController.update);
router.patch('/:id', authenticate, validateActivityRecordUpdateData, activityRecordController.update);
router.delete('/:id', authenticate, activityRecordController.delete);

module.exports = router;
