const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const authController = require('../controllers/authController');
const authenticate = require('../middlewares/authMiddleware');

const registerValidation = [
  body('email').isEmail().withMessage('Enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('lastname').optional().notEmpty().withMessage('Lastname cannot be empty'),
  // Self-signup always creates students (admin creation restricted to POST /api/admins)
  body('role').if(body('role').exists()).equals('student').withMessage('Self-registration only allows role=student'),
  body('legajo').optional().notEmpty().withMessage('Legajo cannot be empty'),
  body('enrollments').optional().isArray().withMessage('Enrollments must be an array'),
  body('enrollments.*.career_id').optional().isInt().withMessage('career_id must be an integer'),
  body('enrollments.*.study_plan_id').optional({ values: 'null' }).isInt().withMessage('study_plan_id must be an integer'),
  body('enrollments.*.enrolled_at').optional().isISO8601().withMessage('enrolled_at must be a valid date'),
];

const loginValidation = [
  body('email').isEmail().withMessage('Enter a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
];

router.post('/register', registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);
router.get('/me', authenticate, authController.me);

module.exports = router;
