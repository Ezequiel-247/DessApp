const express = require('express');
const router = express.Router();
const voteController = require('../controllers/voteController');
const { validateVoteData } = require('../middlewares/voteMiddleware');
const authenticate = require('../middlewares/authMiddleware');

router.post('/', authenticate, validateVoteData, voteController.create);

module.exports = router;
