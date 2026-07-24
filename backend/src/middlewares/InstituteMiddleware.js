const validateInstituteData = (req, res, next) => {
  const { name, short_name, responsible, status, email, tel, address } = req.body;

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Institute name is required'
    });
  }

  if (name.trim().length < 2) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Institute name must be at least 2 characters long'
    });
  }

  if (!short_name || typeof short_name !== 'string' || short_name.trim() === '') {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'short_name is required'
    });
  }

  if (!responsible || typeof responsible !== 'string' || responsible.trim() === '') {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'responsible is required'
    });
  }

  if (!status || typeof status !== 'string' || status.trim() === '') {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'status is required'
    });
  }

  if (!email || typeof email !== 'string' || email.trim() === '') {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'email is required'
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'email must have a valid format'
    });
  }

  if (!tel || typeof tel !== 'string' || tel.trim() === '') {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'tel is required'
    });
  }

  if (!address || typeof address !== 'string' || address.trim() === '') {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'address is required'
    });
  }

  next();
};

const validateInstituteUpdateData = (req, res, next) => {
  const { name, short_name, responsible, status, email, tel, address } = req.body;

  if (name !== undefined && name !== null && (typeof name !== 'string' || name.trim() === '' || name.trim().length < 2)) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Institute name must be at least 2 characters long'
    });
  }

  if (short_name !== undefined && short_name !== null && (typeof short_name !== 'string' || short_name.trim() === '')) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'short_name must be a valid string'
    });
  }

  if (responsible !== undefined && responsible !== null && (typeof responsible !== 'string' || responsible.trim() === '')) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'responsible must be a valid string'
    });
  }

  if (status !== undefined && status !== null && (typeof status !== 'string' || status.trim() === '')) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'status must be a valid string'
    });
  }

  if (email !== undefined && email !== null) {
    if (typeof email !== 'string' || email.trim() === '') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'email must be a valid string'
      });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'email must have a valid format'
      });
    }
  }

  if (tel !== undefined && tel !== null && (typeof tel !== 'string' || tel.trim() === '')) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'tel must be a valid string'
    });
  }

  if (address !== undefined && address !== null && (typeof address !== 'string' || address.trim() === '')) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'address must be a valid string'
    });
  }

  next();
};

module.exports = { validateInstituteData, validateInstituteUpdateData };
