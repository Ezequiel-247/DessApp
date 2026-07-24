const { validatePlanSubjectData, validatePlanSubjectUpdateData } = require('../src/middlewares/planSubjectMiddleware');

describe('Plan Subject Middleware - validatePlanSubjectData', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should call next() with valid data', () => {
    req.body = { id_study_plan: 1, id_subject: 2, suggested_year: 1, suggested_term: 1 };
    validatePlanSubjectData(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should return 400 if id_study_plan is missing', () => {
    req.body = { id_subject: 2, suggested_year: 1, suggested_term: 1 };
    validatePlanSubjectData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request', message: 'id_study_plan is required and must be a valid integer' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 if id_study_plan is not an integer', () => {
    req.body = { id_study_plan: 'abc', id_subject: 2, suggested_year: 1, suggested_term: 1 };
    validatePlanSubjectData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should return 400 if id_subject is missing', () => {
    req.body = { id_study_plan: 1, suggested_year: 1, suggested_term: 1 };
    validatePlanSubjectData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request', message: 'id_subject is required and must be a valid integer' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 if id_subject is not an integer', () => {
    req.body = { id_study_plan: 1, id_subject: 'abc', suggested_year: 1, suggested_term: 1 };
    validatePlanSubjectData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should return 400 if suggested_year is missing', () => {
    req.body = { id_study_plan: 1, id_subject: 2, suggested_term: 1 };
    validatePlanSubjectData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request', message: 'suggested_year is required and must be a valid integer' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 if suggested_term is missing', () => {
    req.body = { id_study_plan: 1, id_subject: 2, suggested_year: 1 };
    validatePlanSubjectData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request', message: 'suggested_term is required and must be a valid integer' });
    expect(next).not.toHaveBeenCalled();
  });
});

describe('Plan Subject Middleware - validatePlanSubjectUpdateData', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should call next() with no fields', () => {
    validatePlanSubjectUpdateData(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('should return 400 if id_study_plan is not an integer on update', () => {
    req.body = { id_study_plan: 'abc' };
    validatePlanSubjectUpdateData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should call next() with valid update data', () => {
    req.body = { suggested_year: 2 };
    validatePlanSubjectUpdateData(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});

describe('Plan Subject Middleware - validatePlanSubjectData - credits validation', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should accept zero credits', () => {
    req.body = { id_study_plan: 1, id_subject: 2, suggested_year: 1, suggested_term: 1, credits: 0 };
    validatePlanSubjectData(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should accept positive integer credits', () => {
    req.body = { id_study_plan: 1, id_subject: 2, suggested_year: 1, suggested_term: 1, credits: 5 };
    validatePlanSubjectData(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should allow credits to be omitted (optional field)', () => {
    req.body = { id_study_plan: 1, id_subject: 2, suggested_year: 1, suggested_term: 1 };
    validatePlanSubjectData(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('should allow credits to be null', () => {
    req.body = { id_study_plan: 1, id_subject: 2, suggested_year: 1, suggested_term: 1, credits: null };
    validatePlanSubjectData(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('should reject negative credits', () => {
    req.body = { id_study_plan: 1, id_subject: 2, suggested_year: 1, suggested_term: 1, credits: -5 };
    validatePlanSubjectData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Bad Request',
      message: 'credits must be a non-negative integer'
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should reject decimal credits', () => {
    req.body = { id_study_plan: 1, id_subject: 2, suggested_year: 1, suggested_term: 1, credits: 3.14 };
    validatePlanSubjectData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Bad Request',
      message: 'credits must be a non-negative integer'
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should reject string credits', () => {
    req.body = { id_study_plan: 1, id_subject: 2, suggested_year: 1, suggested_term: 1, credits: 'abc' };
    validatePlanSubjectData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });
});

describe('Plan Subject Middleware - validatePlanSubjectUpdateData - credits validation', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should accept valid update with positive credits', () => {
    req.body = { credits: 3 };
    validatePlanSubjectUpdateData(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('should accept update with zero credits', () => {
    req.body = { credits: 0 };
    validatePlanSubjectUpdateData(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('should reject negative credits on update', () => {
    req.body = { credits: -5 };
    validatePlanSubjectUpdateData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Bad Request',
      message: 'credits must be a non-negative integer'
    });
  });

  it('should reject decimal credits on update', () => {
    req.body = { credits: 2.5 };
    validatePlanSubjectUpdateData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should allow null credits on update (optional)', () => {
    req.body = { credits: null };
    validatePlanSubjectUpdateData(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
