const { validateVoteData } = require('../src/middlewares/voteMiddleware');

describe('Vote Middleware Validations', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {}, user: { id: 1 } };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  describe('Passing conditions', () => {
    it('should call next() if all fields are valid for material', () => {
      req.body = { target_type: 'material', target_id: 1, is_upvote: true };
      validateVoteData(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should call next() if all fields are valid for post', () => {
      req.body = { target_type: 'post', target_id: 1, is_upvote: false };
      validateVoteData(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should call next() if all fields are valid for comment', () => {
      req.body = { target_type: 'comment', target_id: 1, is_upvote: true };
      validateVoteData(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('Failing conditions', () => {
    it('should return 400 if target_type is missing', () => {
      req.body = { target_id: 1, is_upvote: true };
      validateVoteData(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request', message: 'target_type must be "material", "post", "comment", or "academic_event"' });
    });

    it('should return 400 if target_type is invalid', () => {
      req.body = { target_type: 'event', target_id: 1, is_upvote: true };
      validateVoteData(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request', message: 'target_type must be "material", "post", "comment", or "academic_event"' });
    });

    it('should return 400 if target_id is missing', () => {
      req.body = { target_type: 'material', is_upvote: true };
      validateVoteData(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request', message: 'target_id is required and must be a valid integer' });
    });

    it('should return 400 if target_id is not a valid integer', () => {
      req.body = { target_type: 'material', target_id: 'abc', is_upvote: true };
      validateVoteData(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 if is_upvote is missing', () => {
      req.body = { target_type: 'material', target_id: 1 };
      validateVoteData(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request', message: 'is_upvote is required and must be a boolean' });
    });

    it('should return 400 if is_upvote is not a boolean', () => {
      req.body = { target_type: 'material', target_id: 1, is_upvote: 'true' };
      validateVoteData(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 if is_upvote is a number', () => {
      req.body = { target_type: 'material', target_id: 1, is_upvote: 1 };
      validateVoteData(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 if is_upvote is null', () => {
      req.body = { target_type: 'material', target_id: 1, is_upvote: null };
      validateVoteData(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
