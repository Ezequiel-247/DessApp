const validateSubjectData = (req, res, next) => {
  const { name, code, is_unahur, weekly_hours } = req.body;

  if (!name || name.trim() === '') {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Subject name is required and must be a non-empty string'
    });
  }

  if (!code || code.trim() === '') {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Subject code is required and must be a non-empty string'
    });
  }

  if (is_unahur === undefined || is_unahur === null) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'is_unahur is required and must be a boolean'
    });
  }

  if (typeof is_unahur !== 'boolean') {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'is_unahur is required and must be a boolean'
    });
  }

  next();
};

const validateSubjectUpdateData = (req, res, next) => {
  const { name, code, is_unahur, weekly_hours } = req.body;

  if (name !== undefined && name !== null && name.trim() === '') {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Subject name must be a non-empty string'
    });
  }

  if (code !== undefined && code !== null && code.trim() === '') {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Subject code must be a non-empty string'
    });
  }

  if (is_unahur !== undefined && is_unahur !== null && typeof is_unahur !== 'boolean') {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'is_unahur must be a boolean'
    });
  }

  next();
};

module.exports = { validateSubjectData, validateSubjectUpdateData };
