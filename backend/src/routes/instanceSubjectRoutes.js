const express = require('express');
const router = express.Router();
const instanceSubjectController = require('../controllers/instanceSubjectController');
const { validateInstanceSubjectData, validateInstanceSubjectUpdateData } = require('../middlewares/instanceSubjectMiddleware');

router.get('/', instanceSubjectController.getAll);
router.get('/:id', instanceSubjectController.getById);
router.post('/', validateInstanceSubjectData, instanceSubjectController.create);
router.put('/:id', validateInstanceSubjectUpdateData, instanceSubjectController.update);
router.patch('/:id', validateInstanceSubjectUpdateData, instanceSubjectController.update);
router.delete('/:id', instanceSubjectController.delete);

module.exports = router;
