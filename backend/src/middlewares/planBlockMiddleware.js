const validateUnahurBlockData = (req, res, next) => {
  const { suggested_year, suggested_term, sort_order } = req.body;

  if (suggested_year === undefined || suggested_year === null || !Number.isInteger(Number(suggested_year))) {
    return res.status(400).json({ error: 'Bad Request', message: 'suggested_year is required and must be a valid integer' });
  }

  if (suggested_term !== undefined && suggested_term !== null && !Number.isInteger(Number(suggested_term))) {
    return res.status(400).json({ error: 'Bad Request', message: 'suggested_term must be a valid integer' });
  }

  if (sort_order !== undefined && sort_order !== null && !Number.isInteger(Number(sort_order))) {
    return res.status(400).json({ error: 'Bad Request', message: 'sort_order must be a valid integer' });
  }

  next();
};

const validateUnahurBlockUpdateData = (req, res, next) => {
  const { suggested_year, suggested_term, sort_order } = req.body;

  if (suggested_year !== undefined && suggested_year !== null && !Number.isInteger(Number(suggested_year))) {
    return res.status(400).json({ error: 'Bad Request', message: 'suggested_year must be a valid integer' });
  }

  if (suggested_term !== undefined && suggested_term !== null && !Number.isInteger(Number(suggested_term))) {
    return res.status(400).json({ error: 'Bad Request', message: 'suggested_term must be a valid integer' });
  }

  if (sort_order !== undefined && sort_order !== null && !Number.isInteger(Number(sort_order))) {
    return res.status(400).json({ error: 'Bad Request', message: 'sort_order must be a valid integer' });
  }

  next();
};

const validateElectiveBlockData = (req, res, next) => {
  const { name, min_required, requires_approved_mandatory_count, suggested_year, sort_order } = req.body;

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ error: 'Bad Request', message: 'name is required and must be a non-empty string' });
  }

  if (min_required !== undefined && min_required !== null && (!Number.isInteger(Number(min_required)) || Number(min_required) < 1)) {
    return res.status(400).json({ error: 'Bad Request', message: 'min_required must be a positive integer' });
  }

  if (requires_approved_mandatory_count !== undefined && requires_approved_mandatory_count !== null && (!Number.isInteger(Number(requires_approved_mandatory_count)) || Number(requires_approved_mandatory_count) < 0)) {
    return res.status(400).json({ error: 'Bad Request', message: 'requires_approved_mandatory_count must be a non-negative integer' });
  }

  if (suggested_year !== undefined && suggested_year !== null && !Number.isInteger(Number(suggested_year))) {
    return res.status(400).json({ error: 'Bad Request', message: 'suggested_year must be a valid integer' });
  }

  if (sort_order !== undefined && sort_order !== null && !Number.isInteger(Number(sort_order))) {
    return res.status(400).json({ error: 'Bad Request', message: 'sort_order must be a valid integer' });
  }

  next();
};

const validateElectiveBlockUpdateData = (req, res, next) => {
  const { name, min_required, requires_approved_mandatory_count, suggested_year, sort_order } = req.body;

  if (name !== undefined && name !== null && (typeof name !== 'string' || name.trim() === '')) {
    return res.status(400).json({ error: 'Bad Request', message: 'name must be a non-empty string' });
  }

  if (min_required !== undefined && min_required !== null && (!Number.isInteger(Number(min_required)) || Number(min_required) < 1)) {
    return res.status(400).json({ error: 'Bad Request', message: 'min_required must be a positive integer' });
  }

  if (requires_approved_mandatory_count !== undefined && requires_approved_mandatory_count !== null && (!Number.isInteger(Number(requires_approved_mandatory_count)) || Number(requires_approved_mandatory_count) < 0)) {
    return res.status(400).json({ error: 'Bad Request', message: 'requires_approved_mandatory_count must be a non-negative integer' });
  }

  if (suggested_year !== undefined && suggested_year !== null && !Number.isInteger(Number(suggested_year))) {
    return res.status(400).json({ error: 'Bad Request', message: 'suggested_year must be a valid integer' });
  }

  if (sort_order !== undefined && sort_order !== null && !Number.isInteger(Number(sort_order))) {
    return res.status(400).json({ error: 'Bad Request', message: 'sort_order must be a valid integer' });
  }

  next();
};

const validateElectiveBlockSubjectData = (req, res, next) => {
  const { id_subject } = req.body;

  if (!id_subject || !Number.isInteger(Number(id_subject))) {
    return res.status(400).json({ error: 'Bad Request', message: 'id_subject is required and must be a valid integer' });
  }

  next();
};

const validateCreditBlockData = (req, res, next) => {
  const { name, min_credits_required, max_credits_allowed, sort_order } = req.body;

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ error: 'Bad Request', message: 'name is required and must be a non-empty string' });
  }

  if (min_credits_required !== undefined && min_credits_required !== null && (!Number.isInteger(Number(min_credits_required)) || Number(min_credits_required) < 0)) {
    return res.status(400).json({ error: 'Bad Request', message: 'min_credits_required must be a non-negative integer' });
  }

  if (max_credits_allowed !== undefined && max_credits_allowed !== null && (!Number.isInteger(Number(max_credits_allowed)) || Number(max_credits_allowed) < 0)) {
    return res.status(400).json({ error: 'Bad Request', message: 'max_credits_allowed must be a non-negative integer' });
  }

  if (sort_order !== undefined && sort_order !== null && !Number.isInteger(Number(sort_order))) {
    return res.status(400).json({ error: 'Bad Request', message: 'sort_order must be a valid integer' });
  }

  next();
};

const validateCreditBlockUpdateData = (req, res, next) => {
  const { name, min_credits_required, max_credits_allowed, sort_order } = req.body;

  if (name !== undefined && name !== null && (typeof name !== 'string' || name.trim() === '')) {
    return res.status(400).json({ error: 'Bad Request', message: 'name must be a non-empty string' });
  }

  if (min_credits_required !== undefined && min_credits_required !== null && (!Number.isInteger(Number(min_credits_required)) || Number(min_credits_required) < 0)) {
    return res.status(400).json({ error: 'Bad Request', message: 'min_credits_required must be a non-negative integer' });
  }

  if (max_credits_allowed !== undefined && max_credits_allowed !== null && (!Number.isInteger(Number(max_credits_allowed)) || Number(max_credits_allowed) < 0)) {
    return res.status(400).json({ error: 'Bad Request', message: 'max_credits_allowed must be a non-negative integer' });
  }

  if (sort_order !== undefined && sort_order !== null && !Number.isInteger(Number(sort_order))) {
    return res.status(400).json({ error: 'Bad Request', message: 'sort_order must be a valid integer' });
  }

  next();
};

module.exports = {
  validateUnahurBlockData,
  validateUnahurBlockUpdateData,
  validateElectiveBlockData,
  validateElectiveBlockUpdateData,
  validateElectiveBlockSubjectData,
  validateCreditBlockData,
  validateCreditBlockUpdateData,
};
