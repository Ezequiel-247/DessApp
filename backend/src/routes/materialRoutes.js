const express = require('express');
const router = express.Router();
const materialController = require('../controllers/materialController');
const { validateMaterialData } = require('../middlewares/materialMiddleware');

// Rutas de moderación (Admin) — deben ir ANTES de /:id para no colisionar
router.get('/admin/reported', materialController.getReported);
router.patch('/admin/:id/resolve-report', materialController.resolveReport);

// Rutas estándar
router.get('/', materialController.getAll);
router.get('/student/:student_id', materialController.getByStudentId);
router.get('/:id', materialController.getById);
router.post('/', validateMaterialData, materialController.create);
router.post('/:id/report', materialController.reportMaterial);
router.put('/:id', validateMaterialData, materialController.update);
router.patch('/:id', validateMaterialData, materialController.update);
router.delete('/:id', materialController.delete);

module.exports = router;