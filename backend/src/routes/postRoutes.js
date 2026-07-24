const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const authenticate = require('../middlewares/authMiddleware');
const { validatePostData, validatePostUpdateData } = require('../middlewares/postMiddleware');

router.get('/', postController.getAll);
router.get('/:id', postController.getById);
router.post('/', authenticate, validatePostData, postController.create);
router.put('/:id', authenticate, validatePostUpdateData, postController.update);
router.patch('/:id', authenticate, validatePostUpdateData, postController.update);
router.delete('/:id', authenticate, postController.delete);

module.exports = router;
