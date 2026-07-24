const { validateFinalExamData, validateFinalExamUpdateData } = require('../src/middlewares/finalExamMiddleware');

describe('Final Exam Middleware - validateFinalExamData', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should call next() with valid data (only required fields)', () => {
    req.body = { id_academic_record: 1, status: 'active' };
    validateFinalExamData(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should return 400 if id_academic_record is missing', () => {
    req.body = { status: 'active' };
    validateFinalExamData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request', message: 'id_academic_record is required and must be a valid integer' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 if id_academic_record is not an integer', () => {
    req.body = { id_academic_record: 'abc', status: 'active' };
    validateFinalExamData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should return 400 if grade is not a string', () => {
    req.body = { id_academic_record: 1, grade: 8, status: 'active' };
    validateFinalExamData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request', message: 'grade must be a string' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 if status is missing', () => {
    req.body = { id_academic_record: 1 };
    validateFinalExamData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request', message: 'status is required and must be a string' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 if status is not a string', () => {
    req.body = { id_academic_record: 1, status: 123 };
    validateFinalExamData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request', message: 'status is required and must be a string' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next() with all optional fields valid', () => {
    req.body = { id_academic_record: 1, grade: '8', status: 'active' };
    validateFinalExamData(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});

describe('Final Exam Middleware - validateFinalExamUpdateData', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should call next() with no fields', () => {
    validateFinalExamUpdateData(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('should return 400 if id_academic_record is not an integer on update', () => {
    req.body = { id_academic_record: 'abc' };
    validateFinalExamUpdateData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should call next() with valid update data', () => {
    req.body = { grade: '9' };
    validateFinalExamUpdateData(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
