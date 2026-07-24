const { validateSystemConfigData, validateSystemConfigUpdateData } = require('../src/middlewares/systemConfigMiddleware');

describe('System Config Middleware - validateSystemConfigData', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should call next() with valid data', () => {
    req.body = { key: 'app_name', value: 'Sistema' };
    validateSystemConfigData(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should return 400 if key is missing', () => {
    req.body = { value: 'Sistema' };
    validateSystemConfigData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request', message: 'key is required and must be a non-empty string' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 if key is empty string', () => {
    req.body = { key: '', value: 'Sistema' };
    validateSystemConfigData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should return 400 if value is missing', () => {
    req.body = { key: 'app_name' };
    validateSystemConfigData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request', message: 'value is required and must be a non-empty string' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 if value is empty string', () => {
    req.body = { key: 'app_name', value: '' };
    validateSystemConfigData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should return 400 if value is null', () => {
    req.body = { key: 'app_name', value: null };
    validateSystemConfigData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe('System Config Middleware - validateSystemConfigUpdateData', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should return 400 if value is missing on update', () => {
    req.body = {};
    validateSystemConfigUpdateData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request', message: 'value is required and must be a non-empty string' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next() with valid value', () => {
    req.body = { value: 'false' };
    validateSystemConfigUpdateData(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
