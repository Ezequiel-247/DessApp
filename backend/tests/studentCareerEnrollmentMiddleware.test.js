const { validateEnrollmentData, validateEnrollmentUpdateData } = require('../src/middlewares/studentCareerEnrollmentMiddleware');

describe('Enrollment Middleware - validateEnrollmentData', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should call next() with valid data', () => {
    req.body = { career_id: 1 };
    validateEnrollmentData(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should call next() with all optional fields', () => {
    req.body = { career_id: 1, enrolled_at: '2025-03-01', status: 'active', is_active: true };
    validateEnrollmentData(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('should return 400 if career_id is missing', () => {
    req.body = {};
    validateEnrollmentData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request', message: 'career_id is required and must be a valid integer' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 if career_id is not an integer', () => {
    req.body = { career_id: 'abc' };
    validateEnrollmentData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 if enrolled_at is invalid', () => {
    req.body = { career_id: 1, enrolled_at: 'not-a-date' };
    validateEnrollmentData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request', message: 'enrolled_at must be a valid date' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 if status is empty string', () => {
    req.body = { career_id: 1, status: '' };
    validateEnrollmentData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request', message: 'status must be a non-empty string' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 if is_active is not a boolean', () => {
    req.body = { career_id: 1, is_active: 'abc' };
    validateEnrollmentData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request', message: 'is_active must be a boolean' });
    expect(next).not.toHaveBeenCalled();
  });
});

describe('Enrollment Middleware - validateEnrollmentUpdateData', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should call next() with no fields', () => {
    validateEnrollmentUpdateData(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('should call next() with valid update fields', () => {
    req.body = { status: 'completed', is_active: false };
    validateEnrollmentUpdateData(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('should return 400 if career_id is not an integer', () => {
    req.body = { career_id: 'abc' };
    validateEnrollmentUpdateData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 if enrolled_at is invalid', () => {
    req.body = { enrolled_at: 'bad-date' };
    validateEnrollmentUpdateData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 if status is empty string', () => {
    req.body = { status: '' };
    validateEnrollmentUpdateData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 if is_active is not a boolean', () => {
    req.body = { is_active: 'abc' };
    validateEnrollmentUpdateData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });
});
