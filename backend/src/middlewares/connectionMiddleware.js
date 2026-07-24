const validateConnectionData = (req, res, next) => {
  const { id_user, id_connected_user } = req.body;

  if (!id_user || !Number.isInteger(Number(id_user))) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'id_user is required and must be a valid integer'
    });
  }

  if (!id_connected_user || !Number.isInteger(Number(id_connected_user))) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'id_connected_user is required and must be a valid integer'
    });
  }

  next();
};

const validateConnectionUpdateData = (req, res, next) => {
  next();
};

const validateInviteData = (req, res, next) => {
  const email = String(req.body.email || '').trim();

  if (!email) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'email is required',
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'email must be a valid email address',
    });
  }

  next();
};

const validateInvitationResponseData = (req, res, next) => {
  const { action } = req.body;

  if (!action || !['accept', 'reject'].includes(action)) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'action is required and must be either accept or reject',
    });
  }

  next();
};

module.exports = {
  validateConnectionData,
  validateConnectionUpdateData,
  validateInviteData,
  validateInvitationResponseData,
};
