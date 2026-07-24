const validateInstanceSubjectData = (req, res, next) => {
  const { id_subject } = req.body;

  if (!id_subject || !Number.isInteger(Number(id_subject))) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'id_subject is required and must be a valid integer'
    });
  }

  next();
};

const validateInstanceSubjectUpdateData = (req, res, next) => {
  next();
};

module.exports = { validateInstanceSubjectData, validateInstanceSubjectUpdateData };
