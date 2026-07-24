const isPositiveInteger = (value) => {
  const num = Number(value);
  return Number.isInteger(num) && num > 0;
};

const validateUnahurChoiceData = (req, res, next) => {
  const { id_unahur_block, plan_subject_id } = req.body;

  if (!isPositiveInteger(id_unahur_block)) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'id_unahur_block is required and must be a valid positive integer',
    });
  }

  if (!isPositiveInteger(plan_subject_id)) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'plan_subject_id is required and must be a valid positive integer',
    });
  }

  next();
};

const validateUnahurChoiceDeleteQuery = (req, res, next) => {
  const { plan_subject_id } = req.query;

  if (!isPositiveInteger(plan_subject_id)) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'plan_subject_id query parameter is required and must be a valid positive integer',
    });
  }

  next();
};

module.exports = { validateUnahurChoiceData, validateUnahurChoiceDeleteQuery };
