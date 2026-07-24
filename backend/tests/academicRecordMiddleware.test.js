const { validateAcademicRecordData, validateAcademicRecordUpdateData } = require('../src/middlewares/academicRecordMiddleware');

describe('Academic Record Middleware - validateAcademicRecordData', () => {
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

  it('should call next() if all required fields are valid', () => {
    req.body = { id_student: 1, id_subject: 101, status: 'cursando' };

    validateAcademicRecordData(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should return 400 if id_student is missing', () => {
    req.body = { id_subject: 101, status: 'cursando' };

    validateAcademicRecordData(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request', message: 'id_student is required' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 if id_student is not a valid integer', () => {
    req.body = { id_student: 'abc', id_subject: 101, status: 'cursando' };

    validateAcademicRecordData(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request', message: 'id_student must be a valid integer' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 if id_subject is missing', () => {
    req.body = { id_student: 1, status: 'cursando' };

    validateAcademicRecordData(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request', message: 'id_subject is required for subject records' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 if id_subject is not a valid integer', () => {
    req.body = { id_student: 1, id_subject: 3.14, status: 'cursando' };

    validateAcademicRecordData(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request', message: 'id_subject must be a valid integer' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 if status is missing', () => {
    req.body = { id_student: 1, id_subject: 101 };

    validateAcademicRecordData(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request', message: 'status is required' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 if status is empty string', () => {
    req.body = { id_student: 1, id_subject: 101, status: '' };

    validateAcademicRecordData(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request', message: 'status is required' });
    expect(next).not.toHaveBeenCalled();
  });
});

describe('Academic Record Middleware - validateAcademicRecordUpdateData', () => {
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
    validateAcademicRecordUpdateData(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('should return 400 if id_student is not a valid integer on update', () => {
    req.body = { id_student: 'abc' };
    validateAcademicRecordUpdateData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request', message: 'id_student must be a valid integer' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 if id_subject is not a valid integer on update', () => {
    req.body = { id_subject: 'abc' };
    validateAcademicRecordUpdateData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request', message: 'id_subject must be a valid integer' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next() with valid update data', () => {
    req.body = { status: 'aprobada' };
    validateAcademicRecordUpdateData(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});