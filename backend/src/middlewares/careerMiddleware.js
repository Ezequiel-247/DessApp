const validateCareerData = (req, res, next) => {
  const { name, id_institute, degree_title, duration, code } = req.body;

  if (!name || name.trim() === '') {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Career name is required'
    });
  }

  if (name.trim().length < 2) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Career name must be at least 2 characters long'
    });
  }

  if (!id_institute) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'id_institute is required'
    });
  }

  if (!Number.isInteger(Number(id_institute))) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'id_institute must be a valid integer'
    });
  }

  if (!degree_title || typeof degree_title !== 'string' || degree_title.trim() === '') {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'degree_title is required'
    });
  }

  if (duration === undefined || duration === null || !Number.isInteger(Number(duration))) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'duration is required and must be a valid integer'
    });
  }

  if (!code || typeof code !== 'string' || code.trim() === '') {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'code is required'
    });
  }

  next();
};

const validateCareerUpdateData = (req, res, next) => {
  const { name, id_institute, degree_title, duration, code } = req.body;

  if (name !== undefined && name !== null && (name.trim() === '' || name.trim().length < 2)) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Career name must be at least 2 characters long'
    });
  }

  if (id_institute && !Number.isInteger(Number(id_institute))) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'id_institute must be a valid integer'
    });
  }

  if (degree_title !== undefined && degree_title !== null && (typeof degree_title !== 'string' || degree_title.trim() === '')) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'degree_title must be a valid string'
    });
  }

  if (duration !== undefined && duration !== null && !Number.isInteger(Number(duration))) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'duration must be a valid integer'
    });
  }

  if (code !== undefined && code !== null && (typeof code !== 'string' || code.trim() === '')) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'code must be a valid string'
    });
  }

  next();
};

module.exports = { validateCareerData, validateCareerUpdateData };
