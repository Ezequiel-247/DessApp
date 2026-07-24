const express = require('express');
const router = express.Router();
const systemConfigController = require('../controllers/systemConfigController');
const { validateSystemConfigData, validateSystemConfigUpdateData } = require('../middlewares/systemConfigMiddleware');
const authenticate = require('../middlewares/authMiddleware');
const requireRole = require('../middlewares/roleMiddleware');

router.get('/', systemConfigController.getAll);
router.get('/:key', systemConfigController.getByKey);
router.post('/', authenticate, requireRole('admin'), validateSystemConfigData, systemConfigController.create);
router.put('/:key', authenticate, requireRole('admin'), validateSystemConfigUpdateData, systemConfigController.update);
router.patch('/:key', authenticate, requireRole('admin'), validateSystemConfigUpdateData, systemConfigController.update);
router.delete('/:key', authenticate, requireRole('admin'), systemConfigController.delete);

module.exports = router;
