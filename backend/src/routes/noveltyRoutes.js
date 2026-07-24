const express = require('express');
const router = express.Router();
const noveltyController = require('../controllers/noveltyController');
const authenticate = require('../middlewares/authMiddleware');

router.get('/', authenticate, noveltyController.getFeed);

module.exports = router;