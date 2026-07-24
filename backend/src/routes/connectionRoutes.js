const express = require('express');
const router = express.Router();
const connectionController = require('../controllers/connectionController');
const authenticate = require('../middlewares/authMiddleware');
const {
	validateConnectionData,
	validateConnectionUpdateData,
	validateInviteData,
	validateInvitationResponseData,
} = require('../middlewares/connectionMiddleware');

router.post('/invite', authenticate, validateInviteData, connectionController.inviteByEmail);
router.get('/invitation/:token', authenticate, connectionController.getInvitationByToken);
router.post(
	'/invitation/:token/respond',
	authenticate,
	validateInvitationResponseData,
	connectionController.respondInvitation
);

router.get('/', connectionController.getAll);
router.get('/:id', connectionController.getById);
router.post('/', validateConnectionData, connectionController.create);
router.put('/:id', validateConnectionUpdateData, connectionController.update);
router.patch('/:id', validateConnectionUpdateData, connectionController.update);
router.delete('/:id', connectionController.delete);

module.exports = router;
