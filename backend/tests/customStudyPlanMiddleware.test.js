const { validateCustomStudyPlanData, validateCustomStudyPlanUpdateData } = require('../src/middlewares/customStudyPlanMiddleware');

describe('Custom Study Plan Middleware - validateCustomStudyPlanData', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should call next() with valid data', () => {
    req.body = { id_student: 1, name: 'Plan Personalizado' };
    validateCustomStudyPlanData(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should return 400 if id_student is missing', () => {
    req.body = { name: 'Plan Personalizado' };
    validateCustomStudyPlanData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request', message: 'id_student is required and must be a valid integer' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 if id_student is not an integer', () => {
    req.body = { id_student: 'abc', name: 'Plan Personalizado' };
    validateCustomStudyPlanData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should return 400 if name is missing', () => {
    req.body = { id_student: 1 };
    validateCustomStudyPlanData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request', message: 'name is required' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 if name is empty string', () => {
    req.body = { id_student: 1, name: '' };
    validateCustomStudyPlanData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request', message: 'name is required' });
    expect(next).not.toHaveBeenCalled();
  });
});

describe('Custom Study Plan Middleware - validateCustomStudyPlanUpdateData', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should call next() with no fields', () => {
    validateCustomStudyPlanUpdateData(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('should return 400 if name is empty on update', () => {
    req.body = { name: '' };
    validateCustomStudyPlanUpdateData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request', message: 'name must be a valid string' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next() with valid name', () => {
    req.body = { name: 'Plan Actualizado' };
    validateCustomStudyPlanUpdateData(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
