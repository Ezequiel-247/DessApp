const express = require('express');
const router = express.Router();
const studySessionController = require('../controllers/studySessionController');
const { validateCreateSession } = require('../middlewares/studySessionMiddleware');
const authenticate = require('../middlewares/authMiddleware');

router.use(authenticate);

router.post('/', validateCreateSession, studySessionController.create);
router.get('/', studySessionController.getAll);
router.get('/:id', studySessionController.getById);
router.put('/:id', validateCreateSession, studySessionController.update);
router.delete('/:id/cancel', studySessionController.cancel);
router.post('/:id/join', studySessionController.join);
router.post('/:id/leave', studySessionController.leave);
router.patch('/:id/registrations/:registrationId/approve', studySessionController.approveParticipant);
router.patch('/:id/registrations/:registrationId/reject', studySessionController.rejectParticipant);
router.delete('/:id/registrations/:registrationId', studySessionController.removeParticipant);

module.exports = router;
