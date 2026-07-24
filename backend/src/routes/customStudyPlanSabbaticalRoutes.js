const express = require('express');
const router = express.Router({ mergeParams: true });
const customStudyPlanSabbaticalController = require('../controllers/customStudyPlanSabbaticalController');
const {
  validateSabbaticalData,
  validateSabbaticalDeleteQuery,
} = require('../middlewares/customStudyPlanSabbaticalMiddleware');

router.get('/', customStudyPlanSabbaticalController.getAll);
router.post('/', validateSabbaticalData, customStudyPlanSabbaticalController.create);
router.delete('/', validateSabbaticalDeleteQuery, customStudyPlanSabbaticalController.delete);

module.exports = router;
