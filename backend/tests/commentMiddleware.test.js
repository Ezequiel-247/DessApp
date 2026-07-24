const { validateCommentData } = require('../src/middlewares/commentMiddleware');

describe('Comment Middleware - validateCommentData', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = { body: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should call next() with valid payload', () => {
    req.body = { target_type: 'post', target_id: 1, content: 'Buen post' };

    validateCommentData(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should return 400 when target_type is invalid', () => {
    req.body = { target_type: 'unknown', target_id: 1, content: 'Hola' };

    validateCommentData(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 when target_id is invalid', () => {
    req.body = { target_type: 'post', target_id: 'abc', content: 'Hola' };

    validateCommentData(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 when content is missing', () => {
    req.body = { target_type: 'post', target_id: 1 };

    validateCommentData(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });
});
