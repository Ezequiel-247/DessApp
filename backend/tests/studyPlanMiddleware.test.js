const { validateStudyPlanData, validateStudyPlanUpdateData } = require('../src/middlewares/studyPlanMiddleware');

describe('Study Plan Middleware - validateStudyPlanData', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should call next() with valid data', () => {
    req.body = { id_career: 1, name: 'Plan 2026', status: 'vigente' };
    validateStudyPlanData(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should return 400 if id_career is missing', () => {
    req.body = { name: 'Plan 2026', status: 'vigente' };
    validateStudyPlanData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request', message: 'id_career is required and must be a valid integer' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 if id_career is not an integer', () => {
    req.body = { id_career: 'abc', name: 'Plan 2026', status: 'vigente' };
    validateStudyPlanData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should return 400 if name is missing', () => {
    req.body = { id_career: 1, status: 'vigente' };
    validateStudyPlanData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request', message: 'Study plan name is required and must be a non-empty string' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 if name is empty string', () => {
    req.body = { id_career: 1, name: '', status: 'vigente' };
    validateStudyPlanData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should return 400 if status is missing', () => {
    req.body = { id_career: 1, name: 'Plan 2026' };
    validateStudyPlanData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request', message: 'Status is required and must be a non-empty string' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 if status is empty string', () => {
    req.body = { id_career: 1, name: 'Plan 2026', status: '' };
    validateStudyPlanData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe('Study Plan Middleware - validateStudyPlanUpdateData', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should call next() with no fields', () => {
    validateStudyPlanUpdateData(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('should return 400 if id_career is not an integer on update', () => {
    req.body = { id_career: 'abc' };
    validateStudyPlanUpdateData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should return 400 if name is empty on update', () => {
    req.body = { name: '' };
    validateStudyPlanUpdateData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should return 400 if status is empty on update', () => {
    req.body = { status: '' };
    validateStudyPlanUpdateData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should call next() with valid update data', () => {
    req.body = { name: 'Plan Actualizado' };
    validateStudyPlanUpdateData(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
