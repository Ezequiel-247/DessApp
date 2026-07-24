const { validateNotificationData, validateNotificationUpdateData } = require('../src/middlewares/notificationMiddleware');

describe('Notification Middleware - validateNotificationData', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should call next() with valid data', () => {
    req.body = { id_user: 1, type: 'info', title: 'Bienvenido', message: 'Cuenta creada' };
    validateNotificationData(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should return 400 if id_user is missing', () => {
    req.body = { type: 'info', title: 'Bienvenido', message: 'Cuenta creada' };
    validateNotificationData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request', message: 'id_user is required and must be a valid integer' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 if id_user is not an integer', () => {
    req.body = { id_user: 'abc', type: 'info', title: 'Bienvenido', message: 'Cuenta creada' };
    validateNotificationData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should return 400 if type is missing', () => {
    req.body = { id_user: 1, title: 'Bienvenido', message: 'Cuenta creada' };
    validateNotificationData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request', message: 'type is required' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 if type is empty string', () => {
    req.body = { id_user: 1, type: '', title: 'Bienvenido', message: 'Cuenta creada' };
    validateNotificationData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should return 400 if title is missing', () => {
    req.body = { id_user: 1, type: 'info', message: 'Cuenta creada' };
    validateNotificationData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request', message: 'title is required' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 if message is missing', () => {
    req.body = { id_user: 1, type: 'info', title: 'Bienvenido' };
    validateNotificationData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request', message: 'message is required' });
    expect(next).not.toHaveBeenCalled();
  });
});

describe('Notification Middleware - validateNotificationUpdateData', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should call next() with no fields', () => {
    validateNotificationUpdateData(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('should return 400 if type is empty on update', () => {
    req.body = { type: '' };
    validateNotificationUpdateData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request', message: 'type must be a valid string' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 if title is empty on update', () => {
    req.body = { title: '' };
    validateNotificationUpdateData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should return 400 if message is empty on update', () => {
    req.body = { message: '' };
    validateNotificationUpdateData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should return 400 if read is not a boolean', () => {
    req.body = { read: 'abc' };
    validateNotificationUpdateData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request', message: 'read must be a boolean' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next() with valid update data', () => {
    req.body = { read: true };
    validateNotificationUpdateData(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
