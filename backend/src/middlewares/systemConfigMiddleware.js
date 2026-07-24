const validateSystemConfigData = (req, res, next) => {
  const { key, value } = req.body;

  if (!key || typeof key !== 'string' || key.trim() === '') {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'key is required and must be a non-empty string'
    });
  }

  if (value === undefined || value === null || (typeof value !== 'string' || value.trim() === '')) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'value is required and must be a non-empty string'
    });
  }

  next();
};

const validateSystemConfigUpdateData = (req, res, next) => {
  const { value } = req.body;

  if (value === undefined || value === null || (typeof value !== 'string' || value.trim() === '')) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'value is required and must be a non-empty string'
    });
  }

  next();
};

module.exports = { validateSystemConfigData, validateSystemConfigUpdateData };
