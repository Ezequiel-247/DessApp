const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { validateUserData } = require('../middlewares/userMiddleware');
const authenticate = require('../middlewares/authMiddleware');
const requireRole = require('../middlewares/roleMiddleware');

router.get('/', authenticate, requireRole('admin'), userController.getAll);
router.get('/me', userController.getMe);
router.get('/:id', authenticate, requireRole('admin'), userController.getById);
router.post('/', authenticate, requireRole('admin'), validateUserData, userController.create);
router.patch('/:id', authenticate, requireRole('admin'), userController.update);
router.patch('/:id/suspend', authenticate, requireRole('admin'), userController.suspend);
router.patch('/:id/reactivate', authenticate, requireRole('admin'), userController.reactivate);
router.delete('/:id', authenticate, requireRole('admin'), userController.delete);

module.exports = router;