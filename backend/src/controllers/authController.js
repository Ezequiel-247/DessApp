const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { sequelize } = require('../config/database');
const User = require('../models/user');
const Student = require('../models/student');
const Career = require('../models/career');
const StudyPlan = require('../models/studyPlan');
const StudentCareerEnrollment = require('../models/studentCareerEnrollment');

const generateToken = (user) => {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

const register = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await transaction.rollback();
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, name, lastname, legajo, enrollments } = req.body;
    // Self-registration always creates students; admin creation restricted to POST /api/admins
    const userRole = 'student';

    const existingUser = await User.findOne({ where: { email }, transaction });
    if (existingUser) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Email already in use' });
    }

    const user = await User.create({
      email,
      password,
      name,
      lastname,
      role: userRole,
    }, { transaction });

    if (userRole === 'student') {
      await Student.create({
        user_id: user.id,
        legajo: legajo || null,
      }, { transaction });

      if (Array.isArray(enrollments) && enrollments.length > 0) {
        for (const enrollment of enrollments) {
          const career = await Career.findByPk(enrollment.career_id, { transaction });
          if (!career) {
            throw new Error(`Career with id ${enrollment.career_id} not found`);
          }

          if (enrollment.study_plan_id) {
            const plan = await StudyPlan.findByPk(enrollment.study_plan_id, { transaction });
            if (!plan) {
              throw new Error(`Study plan with id ${enrollment.study_plan_id} not found`);
            }
            if (Number(plan.id_career) !== Number(enrollment.career_id)) {
              throw new Error('Study plan does not belong to the selected career');
            }
          }

          const existingActive = await StudentCareerEnrollment.findOne({
            where: { student_id: user.id, career_id: enrollment.career_id, is_active: true },
            transaction,
          });
          if (existingActive) {
            throw new Error(`The student already has an active enrollment for career ${enrollment.career_id}`);
          }

          await StudentCareerEnrollment.create({
            student_id: user.id,
            career_id: enrollment.career_id,
            study_plan_id: enrollment.study_plan_id || null,
            enrolled_at: enrollment.enrolled_at,
            status: 'active',
            is_active: true,
          }, { transaction });
        }
      }
    }

    await transaction.commit();

    const token = generateToken(user);

    const userResponse = user.toJSON();
    delete userResponse.password;

    res.status(201).json({
      message: 'User registered successfully',
      user: userResponse,
      token,
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Registration Error:', error);
    if (error.message.includes('not found') || error.message.includes('already has an active enrollment') || error.message.includes('does not belong')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Server error during registration' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.scope('withPassword').findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({ error: 'Email not found' });
    }

    if (!user.is_active) {
      return res.status(401).json({ error: 'Account is inactive' });
    }

    const isValid = await user.validatePassword(password);
    if (!isValid) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    const token = generateToken(user);

    const userResponse = user.toJSON();
    delete userResponse.password;

    res.json({
      message: 'Login successful',
      user: userResponse,
      token,
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
};

const me = async (req, res) => {
  try {
    res.json({ data: req.user });
  } catch (error) {
    res.status(500).json({ error: 'Server error retrieving user data' });
  }
};

module.exports = {
  register,
  login,
  me,
};
