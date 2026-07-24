const validateAcademicRecordData = (req, res, next) => {
  const { id_student, id_subject, status } = req.body;

  if (!id_student) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'id_student is required'
    });
  }

  if (!Number.isInteger(Number(id_student))) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'id_student must be a valid integer'
    });
  }

  if (!id_subject) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'id_subject is required for subject records'
    });
  }

  if (!Number.isInteger(Number(id_subject))) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'id_subject must be a valid integer'
    });
  }

  if (!status || typeof status !== 'string' || status.trim() === '') {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'status is required'
    });
  }

  next();
};

const validateAcademicRecordUpdateData = (req, res, next) => {
  const { id_student, id_subject, status } = req.body;

  if (id_student && !Number.isInteger(Number(id_student))) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'id_student must be a valid integer'
    });
  }

  if (id_subject && !Number.isInteger(Number(id_subject))) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'id_subject must be a valid integer'
    });
  }

  if (status !== undefined && status !== null && (typeof status !== 'string' || status.trim() === '')) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'status must be a valid string'
    });
  }

  next();
};

module.exports = { validateAcademicRecordData, validateAcademicRecordUpdateData };
