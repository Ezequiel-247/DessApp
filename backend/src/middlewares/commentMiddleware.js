const VALID_TARGET_TYPES = new Set(['post', 'academic_event']);

const validateCommentData = (req, res, next) => {
  const targetType = String(req.body.target_type || req.body.targetType || '').trim().toLowerCase();
  const targetId = Number.parseInt(req.body.target_id || req.body.targetId, 10);
  const { content } = req.body;

  if (!VALID_TARGET_TYPES.has(targetType)) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'target_type must be one of: post, academic_event',
    });
  }

  if (Number.isNaN(targetId) || targetId <= 0) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'target_id must be a valid integer greater than 0',
    });
  }

  if (!content || typeof content !== 'string' || content.trim() === '') {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'content is required',
    });
  }

  return next();
};

module.exports = {
  validateCommentData,
};