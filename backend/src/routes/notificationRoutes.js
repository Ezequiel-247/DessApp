const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { validateNotificationData, validateNotificationUpdateData } = require('../middlewares/notificationMiddleware');
const authenticate = require('../middlewares/authMiddleware');

router.use(authenticate);

router.get('/', notificationController.getAll);
router.get('/unread-count', notificationController.unreadCount);
router.get('/:id', notificationController.getById);
router.post('/', validateNotificationData, notificationController.create);
router.post('/mark-all-read', notificationController.markAllAsRead);
router.put('/:id', validateNotificationUpdateData, notificationController.update);
router.patch('/:id', validateNotificationUpdateData, notificationController.update);
router.delete('/:id', notificationController.delete);

module.exports = router;
