const isValidYear = (value) => {
  const num = Number(value);
  return Number.isInteger(num) && num > 0;
};

const validateSabbaticalData = (req, res, next) => {
  const { year, terms } = req.body;

  if (!isValidYear(year)) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'year is required and must be a valid positive integer',
    });
  }

  if (!Array.isArray(terms) || terms.length === 0) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'terms is required and must be a non-empty array',
    });
  }

  if (!terms.every((term) => term === 1 || term === 2)) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'terms must only contain the values 1 and/or 2',
    });
  }

  if (new Set(terms).size !== terms.length) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'terms must not contain duplicate values',
    });
  }

  next();
};

const validateSabbaticalDeleteQuery = (req, res, next) => {
  const { year, term } = req.query;

  if (!isValidYear(year)) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'year query parameter is required and must be a valid positive integer',
    });
  }

  if (term !== undefined && term !== '1' && term !== '2') {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'term query parameter, when provided, must be 1 or 2',
    });
  }

  next();
};

module.exports = { validateSabbaticalData, validateSabbaticalDeleteQuery };
