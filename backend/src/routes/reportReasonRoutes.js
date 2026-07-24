const express = require('express');
const router = express.Router();
const reportReasonController = require('../controllers/reportReasonController');
const { validateReportReasonData, validateReportReasonUpdateData } = require('../middlewares/reportReasonMiddleware');
const authenticate = require('../middlewares/authMiddleware');
const requireRole = require('../middlewares/roleMiddleware');

router.get('/', reportReasonController.getAll);
router.get('/:id', reportReasonController.getById);
router.post('/', authenticate, requireRole('admin'), validateReportReasonData, reportReasonController.create);
router.put('/:id', authenticate, requireRole('admin'), validateReportReasonUpdateData, reportReasonController.update);
router.patch('/:id', authenticate, requireRole('admin'), validateReportReasonUpdateData, reportReasonController.update);
router.delete('/:id', authenticate, requireRole('admin'), reportReasonController.delete);

module.exports = router;
