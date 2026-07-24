const { validateReportReasonData, validateReportReasonUpdateData } = require('../src/middlewares/reportReasonMiddleware');

describe('Report Reason Middleware - validateReportReasonData', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should call next() with valid data', () => {
    req.body = { name: 'Spam' };
    validateReportReasonData(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should return 400 if name is missing', () => {
    req.body = {};
    validateReportReasonData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request', message: 'name is required' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 if name is empty string', () => {
    req.body = { name: '' };
    validateReportReasonData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request', message: 'name is required' });
    expect(next).not.toHaveBeenCalled();
  });
});

describe('Report Reason Middleware - validateReportReasonUpdateData', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should call next() with no fields', () => {
    validateReportReasonUpdateData(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('should return 400 if name is empty on update', () => {
    req.body = { name: '' };
    validateReportReasonUpdateData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request', message: 'name must be a valid string' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next() with valid name', () => {
    req.body = { name: 'Contenido ofensivo' };
    validateReportReasonUpdateData(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
