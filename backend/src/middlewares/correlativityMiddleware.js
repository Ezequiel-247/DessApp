const validateCorrelativityData = (req, res, next) => {
  const { id_plan_subject_target, id_required_plan_subject, type } = req.body;

  if (!id_plan_subject_target || !Number.isInteger(Number(id_plan_subject_target))) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'id_plan_subject_target is required and must be a valid integer'
    });
  }

  if (!id_required_plan_subject || !Number.isInteger(Number(id_required_plan_subject))) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'id_required_plan_subject is required and must be a valid integer'
    });
  }

  if (type !== undefined && type !== null && typeof type !== 'string') {
    return res.status(400).json({ error: 'Bad Request', message: 'type must be a string' });
  }

  next();
};

const validateCorrelativityUpdateData = (req, res, next) => {
  const { id_plan_subject_target, id_required_plan_subject, type } = req.body;

  if (id_plan_subject_target !== undefined && id_plan_subject_target !== null && !Number.isInteger(Number(id_plan_subject_target))) {
    return res.status(400).json({ error: 'Bad Request', message: 'id_plan_subject_target must be a valid integer' });
  }

  if (id_required_plan_subject !== undefined && id_required_plan_subject !== null && !Number.isInteger(Number(id_required_plan_subject))) {
    return res.status(400).json({ error: 'Bad Request', message: 'id_required_plan_subject must be a valid integer' });
  }

  if (type !== undefined && type !== null && typeof type !== 'string') {
    return res.status(400).json({ error: 'Bad Request', message: 'type must be a string' });
  }

  next();
};

module.exports = { validateCorrelativityData, validateCorrelativityUpdateData };
