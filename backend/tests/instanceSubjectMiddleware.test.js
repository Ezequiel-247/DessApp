const { validateInstanceSubjectData, validateInstanceSubjectUpdateData } = require('../src/middlewares/instanceSubjectMiddleware');

describe('Instance Subject Middleware - validateInstanceSubjectData', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should call next() with valid data', () => {
    req.body = { id_subject: 1 };
    validateInstanceSubjectData(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should return 400 if id_subject is missing', () => {
    req.body = {};
    validateInstanceSubjectData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request', message: 'id_subject is required and must be a valid integer' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 if id_subject is not an integer', () => {
    req.body = { id_subject: 'abc' };
    validateInstanceSubjectData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should return 400 if id_subject is a float', () => {
    req.body = { id_subject: 1.5 };
    validateInstanceSubjectData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe('Instance Subject Middleware - validateInstanceSubjectUpdateData', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should always call next()', () => {
    validateInstanceSubjectUpdateData(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
