const { validateSubjectData, validateSubjectUpdateData } = require('../src/middlewares/subjectMiddleware');

describe('Subject Middleware - validateSubjectData', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should call next() with valid data', () => {
    req.body = { name: 'Matemática', code: 'MAT-101', is_unahur: true };
    validateSubjectData(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should return 400 if name is missing', () => {
    req.body = { code: 'MAT-101', is_unahur: true };
    validateSubjectData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request', message: 'Subject name is required and must be a non-empty string' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 if name is empty string', () => {
    req.body = { name: '', code: 'MAT-101', is_unahur: true };
    validateSubjectData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should return 400 if code is missing', () => {
    req.body = { name: 'Matemática', is_unahur: true };
    validateSubjectData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request', message: 'Subject code is required and must be a non-empty string' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 if code is empty string', () => {
    req.body = { name: 'Matemática', code: '', is_unahur: true };
    validateSubjectData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should return 400 if is_unahur is missing', () => {
    req.body = { name: 'Matemática', code: 'MAT-101' };
    validateSubjectData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request', message: 'is_unahur is required and must be a boolean' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 if is_unahur is not a boolean', () => {
    req.body = { name: 'Matemática', code: 'MAT-101', is_unahur: 'yes' };
    validateSubjectData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe('Subject Middleware - validateSubjectUpdateData', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should call next() with no fields', () => {
    validateSubjectUpdateData(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('should return 400 if name is empty on update', () => {
    req.body = { name: '' };
    validateSubjectUpdateData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request', message: 'Subject name must be a non-empty string' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 if code is empty on update', () => {
    req.body = { code: '' };
    validateSubjectUpdateData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should return 400 if is_unahur is not a boolean on update', () => {
    req.body = { is_unahur: 'abc' };
    validateSubjectUpdateData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request', message: 'is_unahur must be a boolean' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next() with valid update data', () => {
    req.body = { name: 'Matemática II' };
    validateSubjectUpdateData(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
