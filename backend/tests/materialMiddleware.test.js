const { validateMaterialData } = require('../src/middlewares/materialMiddleware');

describe('Material Middleware Validations', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  describe('Passing conditions', () => {
    it('should call next() if all fields are valid', () => {
      req.body = {
        id_author: 1,
        id_subject: 2,
        title: 'Resumen Unidad 1',
        file_url: 'http://example.com/file.pdf',
        status: 'active'
      };

      validateMaterialData(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('Failing conditions', () => {
    it('should return 400 if id_author is missing', () => {
      req.body = { id_subject: 2, title: 'Title', file_url: 'http://example.com', status: 'active' };

      validateMaterialData(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request', message: 'id_author is required and must be a valid integer' });
    });

    it('should return 400 if id_author is not a valid integer', () => {
      req.body = { id_author: 'abc', id_subject: 2, title: 'Title', file_url: 'http://example.com', status: 'active' };

      validateMaterialData(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request', message: 'id_author is required and must be a valid integer' });
    });

    it('should return 400 if id_author is a float', () => {
      req.body = { id_author: 1.5, id_subject: 2, title: 'Title', file_url: 'http://example.com', status: 'active' };
      validateMaterialData(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request', message: 'id_author is required and must be a valid integer' });
    });

    it('should return 400 if id_subject is missing', () => {
      req.body = { id_author: 1, title: 'Title', file_url: 'http://example.com', status: 'active' };

      validateMaterialData(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request', message: 'id_subject is required and must be a valid integer' });
    });

    it('should return 400 if id_subject is not a valid integer', () => {
      req.body = { id_author: 1, id_subject: 'xyz', title: 'Title', file_url: 'http://example.com', status: 'active' };
      validateMaterialData(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request', message: 'id_subject is required and must be a valid integer' });
    });

    it('should return 400 if title is less than 2 characters long', () => {
      req.body = { id_author: 1, id_subject: 2, title: 'A', file_url: 'http://example.com', status: 'active' };

      validateMaterialData(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request', message: 'title is required and must be at least 2 characters long' });
    });

    it('should return 400 if title is not a string (e.g., number)', () => {
      req.body = { id_author: 1, id_subject: 2, title: 123, file_url: 'http://example.com', status: 'active' };
      validateMaterialData(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request', message: 'title is required and must be at least 2 characters long' });
    });

    it('should return 400 if title only contains whitespace', () => {
      req.body = { id_author: 1, id_subject: 2, title: '   ', file_url: 'http://example.com', status: 'active' };
      validateMaterialData(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request', message: 'title is required and must be at least 2 characters long' });
    });

    it('should return 400 if file_url is missing or empty', () => {
      req.body = { id_author: 1, id_subject: 2, title: 'Title', file_url: '', status: 'active' };

      validateMaterialData(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request', message: 'file_url is required and must be a valid string' });
    });

    it('should return 400 if file_url has less than 5 characters or contains only whitespace', () => {
      req.body = { id_author: 1, id_subject: 2, title: 'Title', file_url: '    ', status: 'active' };
      validateMaterialData(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request', message: 'file_url is required and must be a valid string' });
    });

    it('should return 400 if status is missing', () => {
      req.body = { id_author: 1, id_subject: 2, title: 'Title', file_url: 'http://example.com' };
      validateMaterialData(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request', message: 'status is required and must be at least 2 characters long' });
    });

    it('should return 400 if status is not a string', () => {
      req.body = { id_author: 1, id_subject: 2, title: 'Title', file_url: 'http://example.com', status: true };
      validateMaterialData(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request', message: 'status is required and must be at least 2 characters long' });
    });
  });
});