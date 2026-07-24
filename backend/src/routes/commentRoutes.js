const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const authenticate = require('../middlewares/authMiddleware');
const { validateCommentData } = require('../middlewares/commentMiddleware');

router.get('/', authenticate, commentController.list);
router.post('/', authenticate, validateCommentData, commentController.create);
router.delete('/:id', authenticate, commentController.delete);

module.exports = router;