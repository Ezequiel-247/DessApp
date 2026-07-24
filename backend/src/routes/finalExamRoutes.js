const express = require('express');
const router = express.Router();
const finalExamController = require('../controllers/finalExamController');
const { validateFinalExamData, validateFinalExamUpdateData } = require('../middlewares/finalExamMiddleware');

router.get('/', finalExamController.getAll);
router.get('/:id', finalExamController.getById);
router.post('/', validateFinalExamData, finalExamController.create);
router.put('/:id', validateFinalExamUpdateData, finalExamController.update);
router.patch('/:id', validateFinalExamUpdateData, finalExamController.update);
router.delete('/:id', finalExamController.delete);

module.exports = router;
