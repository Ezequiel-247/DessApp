const { validateAdminData, validateAdminUpdateData } = require('../src/middlewares/adminMiddleware');

describe('Admin Middleware - validateAdminData', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should call next() with valid data', () => {
    req.body = { email: 'admin@test.com', password: 'secret123', name: 'Admin', lastname: 'User', cuil: '20-12345678-9' };
    validateAdminData(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should return 400 if email is missing', () => {
    req.body = { password: 'secret123', name: 'Admin', lastname: 'User', cuil: '20-12345678-9' };
    validateAdminData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request', message: 'Email is required' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 if password is missing', () => {
    req.body = { email: 'admin@test.com', name: 'Admin', lastname: 'User', cuil: '20-12345678-9' };
    validateAdminData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request', message: 'Password is required' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 if name is missing', () => {
    req.body = { email: 'admin@test.com', password: 'secret123', lastname: 'User', cuil: '20-12345678-9' };
    validateAdminData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request', message: 'Name is required' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 if lastname is missing', () => {
    req.body = { email: 'admin@test.com', password: 'secret123', name: 'Admin', cuil: '20-12345678-9' };
    validateAdminData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request', message: 'Lastname is required' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 if cuil is missing', () => {
    req.body = { email: 'admin@test.com', password: 'secret123', name: 'Admin', lastname: 'User' };
    validateAdminData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request', message: 'cuil is required' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 if cuil is empty string', () => {
    req.body = { email: 'admin@test.com', password: 'secret123', name: 'Admin', lastname: 'User', cuil: '' };
    validateAdminData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request', message: 'cuil is required' });
    expect(next).not.toHaveBeenCalled();
  });
});

describe('Admin Middleware - validateAdminUpdateData', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should call next() with no fields', () => {
    validateAdminUpdateData(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('should return 400 if cuil is empty on update', () => {
    req.body = { cuil: '' };
    validateAdminUpdateData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request', message: 'cuil must be a valid string' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 if role is empty on update', () => {
    req.body = { role: '' };
    validateAdminUpdateData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request', message: 'role must be a valid string' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next() with valid update data', () => {
    req.body = { cuil: '20-12345678-9', role: 'superadmin' };
    validateAdminUpdateData(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
