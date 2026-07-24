const validateStudyPlanData = (req, res, next) => {
  const { id_career, name, status } = req.body;

  if (!id_career || !Number.isInteger(Number(id_career))) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'id_career is required and must be a valid integer'
    });
  }

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Study plan name is required and must be a non-empty string'
    });
  }

  if (!status || typeof status !== 'string' || status.trim() === '') {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Status is required and must be a non-empty string'
    });
  }

  next();
};

const validateStudyPlanUpdateData = (req, res, next) => {
  const { id_career, name, status } = req.body;

  if (id_career !== undefined && id_career !== null && !Number.isInteger(Number(id_career))) {
    return res.status(400).json({ error: 'Bad Request', message: 'id_career must be a valid integer' });
  }

  if (name !== undefined && name !== null && (typeof name !== 'string' || name.trim() === '')) {
    return res.status(400).json({ error: 'Bad Request', message: 'Study plan name must be a non-empty string' });
  }

  if (status !== undefined && status !== null && (typeof status !== 'string' || status.trim() === '')) {
    return res.status(400).json({ error: 'Bad Request', message: 'Status must be a non-empty string' });
  }

  next();
};

const validateReplacePlanData = (req, res, next) => {
  const { plan, subjects, unahur_blocks, elective_blocks, credit_blocks } = req.body;

  if (!plan || typeof plan !== 'object') {
    return res.status(400).json({ error: 'Bad Request', message: 'plan object is required' });
  }
  if (!plan.name || typeof plan.name !== 'string' || plan.name.trim() === '') {
    return res.status(400).json({ error: 'Bad Request', message: 'plan.name is required and must be a non-empty string' });
  }
  if (!plan.status || typeof plan.status !== 'string' || plan.status.trim() === '') {
    return res.status(400).json({ error: 'Bad Request', message: 'plan.status is required and must be a non-empty string' });
  }

  if (subjects && Array.isArray(subjects)) {
    for (let i = 0; i < subjects.length; i++) {
      const s = subjects[i];
      if (!s.id_subject || !Number.isInteger(Number(s.id_subject))) {
        return res.status(400).json({ error: 'Bad Request', message: `subjects[${i}].id_subject is required and must be an integer` });
      }
      if (s.suggested_year === undefined || !Number.isInteger(Number(s.suggested_year))) {
        return res.status(400).json({ error: 'Bad Request', message: `subjects[${i}].suggested_year is required and must be an integer` });
      }
      if (s.suggested_term === undefined || !Number.isInteger(Number(s.suggested_term))) {
        return res.status(400).json({ error: 'Bad Request', message: `subjects[${i}].suggested_term is required and must be an integer` });
      }
    }
  }

  if (elective_blocks && Array.isArray(elective_blocks)) {
    for (let i = 0; i < elective_blocks.length; i++) {
      const eb = elective_blocks[i];
      if (!eb.name || typeof eb.name !== 'string' || eb.name.trim() === '') {
        return res.status(400).json({ error: 'Bad Request', message: `elective_blocks[${i}].name is required and must be a non-empty string` });
      }
    }
  }

  if (credit_blocks && Array.isArray(credit_blocks)) {
    for (let i = 0; i < credit_blocks.length; i++) {
      const cb = credit_blocks[i];
      if (!cb.name || typeof cb.name !== 'string' || cb.name.trim() === '') {
        return res.status(400).json({ error: 'Bad Request', message: `credit_blocks[${i}].name is required and must be a non-empty string` });
      }
    }
  }

  next();
};

module.exports = { validateStudyPlanData, validateStudyPlanUpdateData, validateReplacePlanData };
