const validateEnrollmentData = (req, res, next) => {
  const { career_id, enrolled_at, status, is_active, study_plan_id } = req.body;

  if (!career_id || !Number.isInteger(Number(career_id))) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'career_id is required and must be a valid integer'
    });
  }

  if (enrolled_at !== undefined && enrolled_at !== null && isNaN(Date.parse(enrolled_at))) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'enrolled_at must be a valid date'
    });
  }

  if (status !== undefined && status !== null && (typeof status !== 'string' || status.trim() === '')) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'status must be a non-empty string'
    });
  }

  if (is_active !== undefined && is_active !== null && typeof is_active !== 'boolean') {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'is_active must be a boolean'
    });
  }

  if (study_plan_id !== undefined && study_plan_id !== null && !Number.isInteger(Number(study_plan_id))) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'study_plan_id must be a valid integer'
    });
  }

  next();
};

const validateEnrollmentUpdateData = (req, res, next) => {
  const { career_id, enrolled_at, status, is_active, study_plan_id } = req.body;

  if (career_id !== undefined && career_id !== null && !Number.isInteger(Number(career_id))) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'career_id must be a valid integer'
    });
  }

  if (enrolled_at !== undefined && enrolled_at !== null && isNaN(Date.parse(enrolled_at))) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'enrolled_at must be a valid date'
    });
  }

  if (status !== undefined && status !== null && (typeof status !== 'string' || status.trim() === '')) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'status must be a non-empty string'
    });
  }

  if (is_active !== undefined && is_active !== null && typeof is_active !== 'boolean') {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'is_active must be a boolean'
    });
  }

  if (study_plan_id !== undefined && study_plan_id !== null && !Number.isInteger(Number(study_plan_id))) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'study_plan_id must be a valid integer'
    });
  }

  next();
};

module.exports = { validateEnrollmentData, validateEnrollmentUpdateData };
