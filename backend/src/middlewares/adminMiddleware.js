const validateAdminData = (req, res, next) => {
  const { email, password, name, lastname, cuil } = req.body;

  if (!email || typeof email !== 'string' || email.trim() === '') {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Email is required'
    });
  }

  if (!password || typeof password !== 'string' || password.trim() === '') {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Password is required'
    });
  }

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Name is required'
    });
  }

  if (!lastname || typeof lastname !== 'string' || lastname.trim() === '') {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Lastname is required'
    });
  }

  if (!cuil || typeof cuil !== 'string' || cuil.trim() === '') {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'cuil is required'
    });
  }

  next();
};

const validateAdminUpdateData = (req, res, next) => {
  const { cuil, role } = req.body;

  if (cuil !== undefined && cuil !== null && (typeof cuil !== 'string' || cuil.trim() === '')) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'cuil must be a valid string'
    });
  }

  if (role !== undefined && role !== null && (typeof role !== 'string' || role.trim() === '')) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'role must be a valid string'
    });
  }

  next();
};

module.exports = { validateAdminData, validateAdminUpdateData };
