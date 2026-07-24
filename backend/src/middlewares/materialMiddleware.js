const validateMaterialData = (req, res, next) => {
  const { id_author, id_subject, title, file_url, status } = req.body;

  if (id_author === undefined || !Number.isInteger(Number(id_author))) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'id_author is required and must be a valid integer'
    });
  }

  if (id_subject === undefined || !Number.isInteger(Number(id_subject))) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'id_subject is required and must be a valid integer'
    });
  }

  if (!title || typeof title !== 'string' || title.trim().length < 2) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'title is required and must be at least 2 characters long'
    });
  }

  if (!file_url || typeof file_url !== 'string' || file_url.trim().length < 5) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'file_url is required and must be a valid string'
    });
  }

  if (!status || typeof status !== 'string' || status.trim().length < 2) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'status is required and must be at least 2 characters long'
    });
  }

  next();
};

module.exports = {
  validateMaterialData
};
