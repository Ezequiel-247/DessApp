const express = require('express');
const router = express.Router();
const customStudyPlanController = require('../controllers/customStudyPlanController');
const { validateCustomStudyPlanData, validateCustomStudyPlanUpdateData } = require('../middlewares/customStudyPlanMiddleware');

router.get('/', customStudyPlanController.getAll);
router.get('/:id', customStudyPlanController.getById);
router.post('/', validateCustomStudyPlanData, customStudyPlanController.create);
router.get('/:id/deviation', customStudyPlanController.getDeviation);
router.post('/clone/:id', customStudyPlanController.clone);
router.put('/:id', validateCustomStudyPlanUpdateData, customStudyPlanController.update);
router.patch('/:id', validateCustomStudyPlanUpdateData, customStudyPlanController.update);
router.delete('/:id', customStudyPlanController.delete);

module.exports = router;
