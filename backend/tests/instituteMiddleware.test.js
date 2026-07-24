const { validateInstituteData, validateInstituteUpdateData } = require('../src/middlewares/InstituteMiddleware');

describe('Institute Middleware - validateInstituteData', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  const validBody = {
    name: 'Instituto de Ciencias',
    short_name: 'IC',
    responsible: 'Dr. García',
    status: 'activo',
    email: 'test@test.com',
    tel: '1234-5678',
    address: 'Av. Principal 123'
  };

  it('should call next() if all data is valid', () => {
    req.body = { ...validBody };

    validateInstituteData(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should return 400 if name is missing', () => {
    req.body = { ...validBody };
    delete req.body.name;

    validateInstituteData(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Bad Request',
      message: 'Institute name is required'
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 if name is empty or just spaces', () => {
    req.body = { ...validBody, name: '   ' };

    validateInstituteData(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Bad Request',
      message: 'Institute name is required'
    });
  });

  it('should return 400 if name has less than 2 characters', () => {
    req.body = { ...validBody, name: 'A' };

    validateInstituteData(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Bad Request',
      message: 'Institute name must be at least 2 characters long'
    });
  });

  it('should return 400 if short_name is missing', () => {
    req.body = { ...validBody };
    delete req.body.short_name;

    validateInstituteData(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Bad Request',
      message: 'short_name is required'
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 if responsible is missing', () => {
    req.body = { ...validBody };
    delete req.body.responsible;

    validateInstituteData(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Bad Request',
      message: 'responsible is required'
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 if status is missing', () => {
    req.body = { ...validBody };
    delete req.body.status;

    validateInstituteData(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Bad Request',
      message: 'status is required'
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 if email is missing', () => {
    req.body = { ...validBody };
    delete req.body.email;

    validateInstituteData(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Bad Request',
      message: 'email is required'
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 if email has invalid format', () => {
    req.body = { ...validBody, email: 'invalido' };

    validateInstituteData(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Bad Request',
      message: 'email must have a valid format'
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 if tel is missing', () => {
    req.body = { ...validBody };
    delete req.body.tel;

    validateInstituteData(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Bad Request',
      message: 'tel is required'
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 if address is missing', () => {
    req.body = { ...validBody };
    delete req.body.address;

    validateInstituteData(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Bad Request',
      message: 'address is required'
    });
    expect(next).not.toHaveBeenCalled();
  });
});

describe('Institute Middleware - validateInstituteUpdateData', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  it('should call next() with no fields', () => {
    validateInstituteUpdateData(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('should fail if name is empty on update', () => {
    req.body = { name: '' };
    validateInstituteUpdateData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should call next() with valid update data', () => {
    req.body = { name: 'Nuevo Nombre' };
    validateInstituteUpdateData(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});