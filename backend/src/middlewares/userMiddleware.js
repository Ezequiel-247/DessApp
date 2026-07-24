const validator = require('validator');

const validateUserData = (req, res, next) => {
  const { email, password, name, lastname, role, is_active } = req.body;

  if (email !== undefined) {
    if (!validator.isEmail(email)) {
      return res.status(400).json({ error: 'Bad Request', message: 'Valid email is required' });
    }
  } else if (req.method === 'POST') {
    return res.status(400).json({ error: 'Bad Request', message: 'Valid email is required' });
  }

  if (req.method === 'POST') {
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Bad Request', message: 'Password is required and must be at least 6 characters long' });
    }
  } else if (req.method === 'PUT') {
    if (password !== undefined && password.length < 6) {
      return res.status(400).json({ error: 'Bad Request', message: 'Password must be at least 6 characters long if provided' });
    }
  }

  if (name !== undefined) {
    if (name.trim().length < 2) {
      return res.status(400).json({ error: 'Bad Request', message: 'Name must be at least 2 characters long' });
    }
  } else if (req.method === 'POST') {
    return res.status(400).json({ error: 'Bad Request', message: 'Name is required and must be at least 2 characters long' });
  }

  if (lastname !== undefined) {
    if (lastname.trim().length < 2) {
      return res.status(400).json({ error: 'Bad Request', message: 'Lastname must be at least 2 characters long' });
    }
  } else if (req.method === 'POST') {
    return res.status(400).json({ error: 'Bad Request', message: 'Lastname is required and must be at least 2 characters long' });
  }

  if (role && !['student', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'Bad Request', message: 'Invalid role. Must be "student" or "admin"' });
  }

  if (is_active !== undefined && typeof is_active !== 'boolean') {
    return res.status(400).json({ error: 'Bad Request', message: 'is_active must be a boolean' });
  }

  next();
};

module.exports = {
  validateUserData,
};