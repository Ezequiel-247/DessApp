const { validateCorrelativityData, validateCorrelativityUpdateData } = require('../src/middlewares/correlativityMiddleware');

describe('Correlativity Middleware - validateCorrelativityData', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should call next() with valid data', () => {
    req.body = { id_plan_subject_target: 1, id_required_plan_subject: 2, type: 'regular' };
    validateCorrelativityData(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should return 400 if id_plan_subject_target is missing', () => {
    req.body = { id_required_plan_subject: 2 };
    validateCorrelativityData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request', message: 'id_plan_subject_target is required and must be a valid integer' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 if id_plan_subject_target is not an integer', () => {
    req.body = { id_plan_subject_target: 'abc', id_required_plan_subject: 2 };
    validateCorrelativityData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should return 400 if id_required_plan_subject is missing', () => {
    req.body = { id_plan_subject_target: 1 };
    validateCorrelativityData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request', message: 'id_required_plan_subject is required and must be a valid integer' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 if id_required_plan_subject is not an integer', () => {
    req.body = { id_plan_subject_target: 1, id_required_plan_subject: 'abc' };
    validateCorrelativityData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should call next() without type field', () => {
    req.body = { id_plan_subject_target: 1, id_required_plan_subject: 2 };
    validateCorrelativityData(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});

describe('Correlativity Middleware - validateCorrelativityUpdateData', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should call next() with no fields', () => {
    validateCorrelativityUpdateData(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('should return 400 if id_plan_subject_target is not an integer on update', () => {
    req.body = { id_plan_subject_target: 'abc' };
    validateCorrelativityUpdateData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should call next() with valid update data', () => {
    req.body = { type: 'regular' };
    validateCorrelativityUpdateData(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
