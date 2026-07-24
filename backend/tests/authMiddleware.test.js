const jwt = require('jsonwebtoken');
const authenticate = require('../src/middlewares/authMiddleware');

jest.mock('jsonwebtoken');
jest.mock('../src/models/user', () => ({
  findByPk: jest.fn()
}));

const User = require('../src/models/user');

describe('Auth Middleware - authenticate', () => {
  let req, res, next;

  beforeEach(() => {
    req = { headers: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should return 401 if no Authorization header', async () => {
    await authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'No token provided' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 if Authorization header does not start with Bearer', async () => {
    req.headers.authorization = 'Invalid token';
    await authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'No token provided' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 if token is invalid', async () => {
    req.headers.authorization = 'Bearer invalidtoken';
    jwt.verify.mockImplementation(() => { throw new Error('Invalid token'); });
    await authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 if token is expired', async () => {
    req.headers.authorization = 'Bearer expiredtoken';
    const error = new Error('Token expired');
    error.name = 'TokenExpiredError';
    jwt.verify.mockImplementation(() => { throw error; });
    await authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token expired' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 if user is not found or inactive', async () => {
    req.headers.authorization = 'Bearer validtoken';
    jwt.verify.mockReturnValue({ sub: 1 });
    User.findByPk.mockResolvedValue(null);
    await authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized or inactive user' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next() if token is valid and user is active', async () => {
    req.headers.authorization = 'Bearer validtoken';
    jwt.verify.mockReturnValue({ sub: 1 });
    const mockUser = { id: 1, role: 'admin', is_active: true };
    User.findByPk.mockResolvedValue(mockUser);
    await authenticate(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual(mockUser);
  });
});
