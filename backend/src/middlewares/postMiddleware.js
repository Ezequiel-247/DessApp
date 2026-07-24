const validatePostData = (req, res, next) => {
  const { id_author, title, content } = req.body;
  const authenticatedUserId = req.user?.id;

  if (!authenticatedUserId && (!id_author || !Number.isInteger(Number(id_author)))) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'id_author is required and must be a valid integer'
    });
  }

  if (!title || typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'title is required'
    });
  }

  if (!content || typeof content !== 'string' || content.trim() === '') {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'content is required'
    });
  }

  next();
};

const validatePostUpdateData = (req, res, next) => {
  const { title, content } = req.body;

  if (title !== undefined && title !== null && (typeof title !== 'string' || title.trim() === '')) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'title must be a valid string'
    });
  }

  if (content !== undefined && content !== null && (typeof content !== 'string' || content.trim() === '')) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'content must be a valid string'
    });
  }

  next();
};

module.exports = { validatePostData, validatePostUpdateData };
