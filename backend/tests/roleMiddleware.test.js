const requireRole = require('../src/middlewares/roleMiddleware');

describe('Role Middleware - requireRole', () => {
  let req, res, next;

  beforeEach(() => {
    req = { user: null };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should return 401 if req.user is not present', () => {
    const middleware = requireRole('admin');
    middleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Authentication required' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 403 if user role is not allowed', () => {
    req.user = { role: 'student' };
    const middleware = requireRole('admin');
    middleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Forbidden: You do not have permission to perform this action' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next() if user role is allowed', () => {
    req.user = { role: 'admin' };
    const middleware = requireRole('admin');
    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should call next() if user role matches one of allowed roles', () => {
    req.user = { role: 'moderator' };
    const middleware = requireRole('admin', 'moderator');
    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
