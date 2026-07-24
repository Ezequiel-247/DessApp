const { validateStudentCreateData, validateStudentUpdateData } = require('../src/middlewares/studentMiddleware');

describe('Student Middleware - validateStudentCreateData', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should call next() with valid data', () => {
    req.body = { email: 'student@test.com', password: 'secret123', name: 'Test', lastname: 'Student' };
    validateStudentCreateData(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should return 400 if email is missing', () => {
    req.body = { password: 'secret123', name: 'Test', lastname: 'Student' };
    validateStudentCreateData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request', message: 'Email is required' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 if password is missing', () => {
    req.body = { email: 'student@test.com', name: 'Test', lastname: 'Student' };
    validateStudentCreateData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request', message: 'Password is required and must be at least 6 characters' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 if password is too short', () => {
    req.body = { email: 'student@test.com', password: 'abc', name: 'Test', lastname: 'Student' };
    validateStudentCreateData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should return 400 if name is missing', () => {
    req.body = { email: 'student@test.com', password: 'secret123', lastname: 'Student' };
    validateStudentCreateData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request', message: 'Name is required' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 if lastname is missing', () => {
    req.body = { email: 'student@test.com', password: 'secret123', name: 'Test' };
    validateStudentCreateData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request', message: 'Lastname is required' });
    expect(next).not.toHaveBeenCalled();
  });
});

describe('Student Middleware - validateStudentUpdateData', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should call next() with no fields provided', () => {
    validateStudentUpdateData(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should call next() with valid legajo', () => {
    req.body = { legajo: 'A123' };
    validateStudentUpdateData(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('should return 400 if legajo is empty string', () => {
    req.body = { legajo: '' };
    validateStudentUpdateData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request', message: 'legajo must be a non-empty string' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 if public_profile is not a boolean', () => {
    req.body = { public_profile: 'abc' };
    validateStudentUpdateData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request', message: 'public_profile must be a boolean' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next() with valid public_profile', () => {
    req.body = { public_profile: true };
    validateStudentUpdateData(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('should return 400 if show_email is not a boolean', () => {
    req.body = { show_email: 'abc' };
    validateStudentUpdateData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request', message: 'show_email must be a boolean' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 if show_academic_info is not a boolean', () => {
    req.body = { show_academic_info: 'abc' };
    validateStudentUpdateData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request', message: 'show_academic_info must be a boolean' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 if publish_approvals is not a boolean', () => {
    req.body = { publish_approvals: 'abc' };
    validateStudentUpdateData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request', message: 'publish_approvals must be a boolean' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next() with all valid boolean fields', () => {
    req.body = { public_profile: true, show_email: false, show_academic_info: true, publish_approvals: false };
    validateStudentUpdateData(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
