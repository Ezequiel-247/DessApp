const ALLOWED_STATUSES = ['enrolled', 'approved', 'failed', 'equivalencia'];

const validateActivityRecordData = (req, res, next) => {
  const { id_student, id_activity, year, semester, status, grade } = req.body;

  if (!id_student || !Number.isInteger(Number(id_student))) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'id_student is required and must be a valid integer'
    });
  }

  if (!id_activity || !Number.isInteger(Number(id_activity))) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'id_activity is required and must be a valid integer'
    });
  }

  if (year !== undefined && year !== null && !Number.isInteger(Number(year))) {
    return res.status(400).json({ error: 'Bad Request', message: 'year must be a valid integer' });
  }

  if (semester !== undefined && semester !== null && ![1, 2].includes(Number(semester))) {
    return res.status(400).json({ error: 'Bad Request', message: 'semester must be 1 or 2' });
  }

  if (!status || typeof status !== 'string') {
    return res.status(400).json({ error: 'Bad Request', message: 'status is required and must be a string' });
  }

  if (!ALLOWED_STATUSES.includes(status)) {
    return res.status(400).json({
      error: 'Bad Request',
      message: `status must be one of: ${ALLOWED_STATUSES.join(', ')}`
    });
  }

  if (status === 'enrolled' && grade !== undefined && grade !== null) {
    return res.status(400).json({ error: 'Bad Request', message: 'grade must not be provided when status is enrolled' });
  }

  next();
};

const validateActivityRecordUpdateData = (req, res, next) => {
  const { id_student, id_activity, year, semester, status, grade } = req.body;

  if (id_student !== undefined && id_student !== null && !Number.isInteger(Number(id_student))) {
    return res.status(400).json({ error: 'Bad Request', message: 'id_student must be a valid integer' });
  }

  if (id_activity !== undefined && id_activity !== null && !Number.isInteger(Number(id_activity))) {
    return res.status(400).json({ error: 'Bad Request', message: 'id_activity must be a valid integer' });
  }

  if (year !== undefined && year !== null && !Number.isInteger(Number(year))) {
    return res.status(400).json({ error: 'Bad Request', message: 'year must be a valid integer' });
  }

  if (semester !== undefined && semester !== null && ![1, 2].includes(Number(semester))) {
    return res.status(400).json({ error: 'Bad Request', message: 'semester must be 1 or 2' });
  }

  if (status !== undefined && status !== null) {
    if (typeof status !== 'string') {
      return res.status(400).json({ error: 'Bad Request', message: 'status must be a string' });
    }
    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: `status must be one of: ${ALLOWED_STATUSES.join(', ')}`
      });
    }
  }

  if (grade !== undefined && grade !== null && status === 'enrolled') {
    return res.status(400).json({ error: 'Bad Request', message: 'grade must not be provided when status is enrolled' });
  }

  next();
};

module.exports = { validateActivityRecordData, validateActivityRecordUpdateData };
