const validatePlanSubjectData = (req, res, next) => {
  const { id_study_plan, id_subject, suggested_year, suggested_term } = req.body;

  if (!id_study_plan || !Number.isInteger(Number(id_study_plan))) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'id_study_plan is required and must be a valid integer'
    });
  }

  if (!id_subject || !Number.isInteger(Number(id_subject))) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'id_subject is required and must be a valid integer'
    });
  }

  if (suggested_year === undefined || suggested_year === null || !Number.isInteger(Number(suggested_year))) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'suggested_year is required and must be a valid integer'
    });
  }

  if (suggested_term === undefined || suggested_term === null || !Number.isInteger(Number(suggested_term))) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'suggested_term is required and must be a valid integer'
    });
  }

  const credits = req.body.credits;
  if (credits !== undefined && credits !== null && (!Number.isInteger(Number(credits)) || Number(credits) < 0)) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'credits must be a non-negative integer'
    });
  }

  next();
};

const validatePlanSubjectUpdateData = (req, res, next) => {
  const { id_study_plan, id_subject, suggested_year, suggested_term } = req.body;

  if (id_study_plan !== undefined && id_study_plan !== null && !Number.isInteger(Number(id_study_plan))) {
    return res.status(400).json({ error: 'Bad Request', message: 'id_study_plan must be a valid integer' });
  }

  if (id_subject !== undefined && id_subject !== null && !Number.isInteger(Number(id_subject))) {
    return res.status(400).json({ error: 'Bad Request', message: 'id_subject must be a valid integer' });
  }

  if (suggested_year !== undefined && suggested_year !== null && !Number.isInteger(Number(suggested_year))) {
    return res.status(400).json({ error: 'Bad Request', message: 'suggested_year must be a valid integer' });
  }

  if (suggested_term !== undefined && suggested_term !== null && !Number.isInteger(Number(suggested_term))) {
    return res.status(400).json({ error: 'Bad Request', message: 'suggested_term must be a valid integer' });
  }

  const credits = req.body.credits;
  if (credits !== undefined && credits !== null && (!Number.isInteger(Number(credits)) || Number(credits) < 0)) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'credits must be a non-negative integer'
    });
  }

  next();
};

module.exports = { validatePlanSubjectData, validatePlanSubjectUpdateData };
