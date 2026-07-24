const validateStudentCreateData = (req, res, next) => {
  const { email, password, name, lastname } = req.body;

  if (!email || typeof email !== 'string' || email.trim() === '') {
    return res.status(400).json({ error: 'Bad Request', message: 'Email is required' });
  }

  if (!password || typeof password !== 'string' || password.trim() === '' || password.length < 6) {
    return res.status(400).json({ error: 'Bad Request', message: 'Password is required and must be at least 6 characters' });
  }

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ error: 'Bad Request', message: 'Name is required' });
  }

  if (!lastname || typeof lastname !== 'string' || lastname.trim() === '') {
    return res.status(400).json({ error: 'Bad Request', message: 'Lastname is required' });
  }

  next();
};

const validateStudentUpdateData = (req, res, next) => {
  const { legajo, public_profile, show_email, show_academic_info, publish_approvals } = req.body;

  if (legajo !== undefined && legajo !== null && (typeof legajo !== 'string' || legajo.trim() === '')) {
    return res.status(400).json({ error: 'Bad Request', message: 'legajo must be a non-empty string' });
  }

  if (public_profile !== undefined && public_profile !== null && typeof public_profile !== 'boolean') {
    return res.status(400).json({ error: 'Bad Request', message: 'public_profile must be a boolean' });
  }

  if (show_email !== undefined && show_email !== null && typeof show_email !== 'boolean') {
    return res.status(400).json({ error: 'Bad Request', message: 'show_email must be a boolean' });
  }

  if (show_academic_info !== undefined && show_academic_info !== null && typeof show_academic_info !== 'boolean') {
    return res.status(400).json({ error: 'Bad Request', message: 'show_academic_info must be a boolean' });
  }

  if (publish_approvals !== undefined && publish_approvals !== null && typeof publish_approvals !== 'boolean') {
    return res.status(400).json({ error: 'Bad Request', message: 'publish_approvals must be a boolean' });
  }

  next();
};

module.exports = { validateStudentCreateData, validateStudentUpdateData };
