const validateReportReasonData = (req, res, next) => {
  const { name } = req.body;

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'name is required'
    });
  }

  next();
};

const validateReportReasonUpdateData = (req, res, next) => {
  const { name } = req.body;

  if (name !== undefined && name !== null && (typeof name !== 'string' || name.trim() === '')) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'name must be a valid string'
    });
  }

  next();
};

module.exports = { validateReportReasonData, validateReportReasonUpdateData };
