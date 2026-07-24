const { validateReportData, validateReportUpdateData } = require('../src/middlewares/reportMiddleware');

describe('Report Middleware - validateReportData', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should call next() with valid data', () => {
    req.body = { id_reporter: 1 };
    validateReportData(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should return 400 if id_reporter is missing', () => {
    req.body = {};
    validateReportData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request', message: 'id_reporter is required and must be a valid integer' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 if id_reporter is not an integer', () => {
    req.body = { id_reporter: 'abc' };
    validateReportData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should return 400 if id_reporter is a float', () => {
    req.body = { id_reporter: 1.5 };
    validateReportData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe('Report Middleware - validateReportUpdateData', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should always call next()', () => {
    validateReportUpdateData(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
