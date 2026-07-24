const {
  validateConnectionData,
  validateConnectionUpdateData,
  validateInviteData,
  validateInvitationResponseData,
} = require('../src/middlewares/connectionMiddleware');

describe('Connection Middleware - validateConnectionData', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should call next() with valid data', () => {
    req.body = { id_user: 1, id_connected_user: 2 };
    validateConnectionData(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should return 400 if id_user is missing', () => {
    req.body = { id_connected_user: 2 };
    validateConnectionData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request', message: 'id_user is required and must be a valid integer' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 if id_user is not an integer', () => {
    req.body = { id_user: 'abc', id_connected_user: 2 };
    validateConnectionData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should return 400 if id_connected_user is missing', () => {
    req.body = { id_user: 1 };
    validateConnectionData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request', message: 'id_connected_user is required and must be a valid integer' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 if id_connected_user is not an integer', () => {
    req.body = { id_user: 1, id_connected_user: 'abc' };
    validateConnectionData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe('Connection Middleware - validateConnectionUpdateData', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should always call next()', () => {
    validateConnectionUpdateData(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});

describe('Connection Middleware - validateInviteData', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should call next() with valid email', () => {
    req.body = { email: 'student@example.com' };
    validateInviteData(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('should return 400 when email is missing', () => {
    validateInviteData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 when email is invalid', () => {
    req.body = { email: 'bad-email' };
    validateInviteData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });
});

describe('Connection Middleware - validateInvitationResponseData', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should call next() for accept action', () => {
    req.body = { action: 'accept' };
    validateInvitationResponseData(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('should call next() for reject action', () => {
    req.body = { action: 'reject' };
    validateInvitationResponseData(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('should return 400 for invalid action', () => {
    req.body = { action: 'later' };
    validateInvitationResponseData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });
});
