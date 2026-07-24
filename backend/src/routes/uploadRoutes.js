const express = require('express');
const router = express.Router();
const authenticate = require('../middlewares/authMiddleware');
const uploadPostImagesMiddleware = require('../middlewares/postImageUploadMiddleware');
const postController = require('../controllers/postController');

router.post('/post-images', authenticate, uploadPostImagesMiddleware, postController.uploadPostImages);

module.exports = router;
