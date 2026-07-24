const { validateCareerData, validateCareerUpdateData } = require('../src/middlewares/careerMiddleware');

describe('Career Middleware - validateCareerData', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should fail if career name is not provided', () => {
    req.body = { id_institute: 1, degree_title: 'Lic.', duration: 5, code: 'CODE' };

    validateCareerData(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Bad Request',
      message: 'Career name is required'
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should fail if career name is empty or only has spaces', () => {
    req.body = { name: '   ', id_institute: 1, degree_title: 'Lic.', duration: 5, code: 'CODE' };

    validateCareerData(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Bad Request',
      message: 'Career name is required'
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should fail if career name has less than 2 characters', () => {
    req.body = { name: 'A', id_institute: 1, degree_title: 'Lic.', duration: 5, code: 'CODE' };

    validateCareerData(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Bad Request',
      message: 'Career name must be at least 2 characters long'
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should fail if id_institute is not provided', () => {
    req.body = { name: 'Ingeniería en Sistemas', degree_title: 'Lic.', duration: 5, code: 'CODE' };

    validateCareerData(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Bad Request',
      message: 'id_institute is required'
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should fail if id_institute is not a valid integer', () => {
    req.body = { name: 'Ingeniería', id_institute: 'no-es-numero', degree_title: 'Lic.', duration: 5, code: 'CODE' };

    validateCareerData(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Bad Request',
      message: 'id_institute must be a valid integer'
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should fail if degree_title is not provided', () => {
    req.body = { name: 'Ingeniería', id_institute: 1, duration: 5, code: 'CODE' };

    validateCareerData(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Bad Request',
      message: 'degree_title is required'
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should fail if degree_title is empty string', () => {
    req.body = { name: 'Ingeniería', id_institute: 1, degree_title: '', duration: 5, code: 'CODE' };

    validateCareerData(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Bad Request',
      message: 'degree_title is required'
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should fail if duration is not provided', () => {
    req.body = { name: 'Ingeniería', id_institute: 1, degree_title: 'Lic.', code: 'CODE' };

    validateCareerData(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Bad Request',
      message: 'duration is required and must be a valid integer'
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should fail if duration is not a valid integer', () => {
    req.body = { name: 'Ingeniería', id_institute: 1, degree_title: 'Lic.', duration: 'abc', code: 'CODE' };

    validateCareerData(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Bad Request',
      message: 'duration is required and must be a valid integer'
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should fail if code is not provided', () => {
    req.body = { name: 'Ingeniería', id_institute: 1, degree_title: 'Lic.', duration: 5 };

    validateCareerData(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Bad Request',
      message: 'code is required'
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should fail if code is empty string', () => {
    req.body = { name: 'Ingeniería', id_institute: 1, degree_title: 'Lic.', duration: 5, code: '' };

    validateCareerData(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Bad Request',
      message: 'code is required'
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next() if all data is correct', () => {
    req.body = { name: 'Licenciatura en Computación', id_institute: 2, degree_title: 'Lic. en Computación', duration: 5, code: 'LIC-COMP' };

    validateCareerData(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});

describe('Career Middleware - validateCareerUpdateData', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should call next() with no body fields', () => {
    validateCareerUpdateData(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('should fail if name is empty string on update', () => {
    req.body = { name: '' };
    validateCareerUpdateData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should fail if id_institute is not a valid integer on update', () => {
    req.body = { id_institute: 'abc' };
    validateCareerUpdateData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should fail if degree_title is empty string on update', () => {
    req.body = { degree_title: '' };
    validateCareerUpdateData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should fail if duration is not a valid integer on update', () => {
    req.body = { duration: 'abc' };
    validateCareerUpdateData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should fail if code is empty string on update', () => {
    req.body = { code: '' };
    validateCareerUpdateData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should call next() with valid update data', () => {
    req.body = { name: 'Nombre Actualizado' };
    validateCareerUpdateData(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});