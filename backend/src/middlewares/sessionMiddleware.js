const validateSessionData = (req, res, next) => {
  const { id_user } = req.body;

  if (!id_user || !Number.isInteger(Number(id_user))) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'id_user is required and must be a valid integer'
    });
  }

  next();
};

const validateSessionUpdateData = (req, res, next) => {
  next();
};

module.exports = { validateSessionData, validateSessionUpdateData };
