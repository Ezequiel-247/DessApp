const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const validateCreateSession = [
  body('subject_id').isInt().withMessage('subject_id debe ser un entero'),
  body('title').notEmpty().withMessage('El título es requerido'),
  body('type').isIn(['virtual', 'presencial']).withMessage('El tipo debe ser virtual o presencial'),
  body('meeting_link').if(body('type').equals('virtual')).notEmpty().withMessage('El link es requerido para sesiones virtuales'),
  body('location').if(body('type').equals('presencial')).notEmpty().withMessage('La ubicación es requerida para sesiones presenciales'),
  body('date_time').isISO8601().toDate().withMessage('La fecha y hora deben ser válidas'),
  body('duration_hours').isInt({ min: 0 }).withMessage('Las horas de duración deben ser un número válido'),
  body('duration_minutes').isInt({ min: 0, max: 59 }).withMessage('Los minutos deben estar entre 0 y 59'),
  body('max_slots').optional({ nullable: true }).isInt({ min: 1 }).withMessage('Los cupos deben ser mayores a 0'),
  body('approval_required').isBoolean().withMessage('approval_required debe ser booleano'),
  handleValidationErrors
];

module.exports = {
  validateCreateSession
};
