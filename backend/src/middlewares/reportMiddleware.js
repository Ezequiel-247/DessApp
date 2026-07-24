const validateReportData = (req, res, next) => {
  const { id_reporter } = req.body;

  if (!id_reporter || !Number.isInteger(Number(id_reporter))) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'id_reporter is required and must be a valid integer'
    });
  }

  next();
};

const validateReportUpdateData = (req, res, next) => {
  next();
};

module.exports = { validateReportData, validateReportUpdateData };
