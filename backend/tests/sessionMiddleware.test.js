const { validateSessionData, validateSessionUpdateData } = require('../src/middlewares/sessionMiddleware');

describe('Session Middleware - validateSessionData', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should call next() with valid data', () => {
    req.body = { id_user: 1 };
    validateSessionData(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should return 400 if id_user is missing', () => {
    req.body = {};
    validateSessionData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request', message: 'id_user is required and must be a valid integer' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 if id_user is not an integer', () => {
    req.body = { id_user: 'abc' };
    validateSessionData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should return 400 if id_user is a float', () => {
    req.body = { id_user: 1.5 };
    validateSessionData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe('Session Middleware - validateSessionUpdateData', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should always call next()', () => {
    validateSessionUpdateData(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
