const validateNotificationData = (req, res, next) => {
  const { id_user, type, title, message } = req.body;

  if (!id_user || !Number.isInteger(Number(id_user))) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'id_user is required and must be a valid integer'
    });
  }

  if (!type || typeof type !== 'string' || type.trim() === '') {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'type is required'
    });
  }

  if (!title || typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'title is required'
    });
  }

  if (!message || typeof message !== 'string' || message.trim() === '') {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'message is required'
    });
  }

  next();
};

const validateNotificationUpdateData = (req, res, next) => {
  const { type, title, message, read } = req.body;

  if (type !== undefined && type !== null && (typeof type !== 'string' || type.trim() === '')) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'type must be a valid string'
    });
  }

  if (title !== undefined && title !== null && (typeof title !== 'string' || title.trim() === '')) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'title must be a valid string'
    });
  }

  if (message !== undefined && message !== null && (typeof message !== 'string' || message.trim() === '')) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'message must be a valid string'
    });
  }

  if (read !== undefined && read !== null && typeof read !== 'boolean') {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'read must be a boolean'
    });
  }

  next();
};

module.exports = { validateNotificationData, validateNotificationUpdateData };
