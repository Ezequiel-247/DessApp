const express = require('express');
const router = express.Router({ mergeParams: true });
const customStudyPlanElectiveChoiceController = require('../controllers/customStudyPlanElectiveChoiceController');
const {
  validateElectiveChoiceData,
  validateElectiveChoiceDeleteQuery,
} = require('../middlewares/customStudyPlanElectiveChoiceMiddleware');

router.get('/', customStudyPlanElectiveChoiceController.getAll);
router.post('/', validateElectiveChoiceData, customStudyPlanElectiveChoiceController.create);
router.delete('/', validateElectiveChoiceDeleteQuery, customStudyPlanElectiveChoiceController.delete);

module.exports = router;
