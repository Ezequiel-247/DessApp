const validateVoteData = (req, res, next) => {
  const { target_type, target_id, is_upvote } = req.body;

  if (!target_type || !['material', 'post', 'comment', 'academic_event'].includes(target_type)) {
    return res.status(400).json({ error: 'Bad Request', message: 'target_type must be "material", "post", "comment", or "academic_event"' });
  }
  if (target_id === undefined || !Number.isInteger(Number(target_id))) {
    return res.status(400).json({ error: 'Bad Request', message: 'target_id is required and must be a valid integer' });
  }
  if (is_upvote === undefined || typeof is_upvote !== 'boolean') {
    return res.status(400).json({ error: 'Bad Request', message: 'is_upvote is required and must be a boolean' });
  }

  next();
};

module.exports = { validateVoteData };
