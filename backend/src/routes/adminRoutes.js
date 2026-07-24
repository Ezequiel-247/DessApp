const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { validateAdminData, validateAdminUpdateData } = require('../middlewares/adminMiddleware');
const authenticate = require('../middlewares/authMiddleware');
const requireRole = require('../middlewares/roleMiddleware');

router.get('/', authenticate, requireRole('admin'), adminController.getAll);
router.get('/:id', authenticate, requireRole('admin'), adminController.getById);
router.post('/', authenticate, requireRole('admin'), validateAdminData, adminController.create);
router.put('/:id', authenticate, requireRole('admin'), validateAdminUpdateData, adminController.update);
router.patch('/:id', authenticate, requireRole('admin'), validateAdminUpdateData, adminController.update);
router.delete('/:id', authenticate, requireRole('admin'), adminController.delete);

module.exports = router;
