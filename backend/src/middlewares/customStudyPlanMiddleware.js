const validateCustomStudyPlanData = (req, res, next) => {
  const { id_student, name } = req.body;

  if (!id_student || !Number.isInteger(Number(id_student))) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'id_student is required and must be a valid integer'
    });
  }

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'name is required'
    });
  }

  next();
};

const validateCustomStudyPlanUpdateData = (req, res, next) => {
  const { name } = req.body;

  if (name !== undefined && name !== null && (typeof name !== 'string' || name.trim() === '')) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'name must be a valid string'
    });
  }

  next();
};

module.exports = { validateCustomStudyPlanData, validateCustomStudyPlanUpdateData };
