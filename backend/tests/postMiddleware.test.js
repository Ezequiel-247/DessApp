const { validatePostData, validatePostUpdateData } = require('../src/middlewares/postMiddleware');

describe('Post Middleware - validatePostData', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should call next() with valid data', () => {
    req.body = { id_author: 1, title: 'Mi Post', content: 'Contenido del post' };
    validatePostData(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should return 400 if id_author is missing', () => {
    req.body = { title: 'Mi Post', content: 'Contenido del post' };
    validatePostData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request', message: 'id_author is required and must be a valid integer' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 if id_author is not an integer', () => {
    req.body = { id_author: 'abc', title: 'Mi Post', content: 'Contenido' };
    validatePostData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should return 400 if title is missing', () => {
    req.body = { id_author: 1, content: 'Contenido del post' };
    validatePostData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request', message: 'title is required' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 if title is empty string', () => {
    req.body = { id_author: 1, title: '', content: 'Contenido' };
    validatePostData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should return 400 if content is missing', () => {
    req.body = { id_author: 1, title: 'Mi Post' };
    validatePostData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request', message: 'content is required' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 if content is empty string', () => {
    req.body = { id_author: 1, title: 'Mi Post', content: '' };
    validatePostData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe('Post Middleware - validatePostUpdateData', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should call next() with no fields', () => {
    validatePostUpdateData(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('should return 400 if title is empty on update', () => {
    req.body = { title: '' };
    validatePostUpdateData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request', message: 'title must be a valid string' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 if content is empty on update', () => {
    req.body = { content: '' };
    validatePostUpdateData(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should call next() with valid update data', () => {
    req.body = { title: 'Título Actualizado' };
    validatePostUpdateData(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
