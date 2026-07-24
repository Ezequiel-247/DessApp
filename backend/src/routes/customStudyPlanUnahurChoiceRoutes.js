const express = require('express');
const router = express.Router({ mergeParams: true });
const customStudyPlanUnahurChoiceController = require('../controllers/customStudyPlanUnahurChoiceController');
const {
  validateUnahurChoiceData,
  validateUnahurChoiceDeleteQuery,
} = require('../middlewares/customStudyPlanUnahurChoiceMiddleware');

router.get('/', customStudyPlanUnahurChoiceController.getAll);
router.post('/', validateUnahurChoiceData, customStudyPlanUnahurChoiceController.create);
router.delete('/', validateUnahurChoiceDeleteQuery, customStudyPlanUnahurChoiceController.delete);

module.exports = router;
