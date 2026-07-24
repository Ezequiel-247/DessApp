const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');
const { validateSessionData, validateSessionUpdateData } = require('../middlewares/sessionMiddleware');

router.get('/', sessionController.getAll);
router.get('/:id', sessionController.getById);
router.post('/', validateSessionData, sessionController.create);
router.put('/:id', validateSessionUpdateData, sessionController.update);
router.patch('/:id', validateSessionUpdateData, sessionController.update);
router.delete('/:id', sessionController.delete);

module.exports = router;
