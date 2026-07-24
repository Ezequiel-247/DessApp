const voteController = require('../src/controllers/voteController');
const { votesMock, materialsMock } = require('./mocks/mockData');

jest.mock('../src/services/notificationService', () => ({
  areUsersConnected: jest.fn(),
  createNotification: jest.fn(),
}), { virtual: true });

jest.mock('../src/models', () => ({
  Vote: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
  Material: {
    findByPk: jest.fn(),
  },
  Post: {
    findByPk: jest.fn(),
  },
  Comment: {
    findByPk: jest.fn(),
  },
  AcademicRecord: {
    findByPk: jest.fn(),
  },
  User: {
    findByPk: jest.fn(),
  },
}), { virtual: true });

const { Vote, Material, Post } = require('../src/models');
const notificationService = require('../src/services/notificationService');

describe('Vote Controller - Toggle', () => {
  let req, res;

  beforeEach(() => {
    req = { params: {}, body: {}, user: { id: 5 } };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
    notificationService.areUsersConnected.mockResolvedValue(false);
    notificationService.createNotification.mockResolvedValue({ id: 1 });
  });

  describe('create (toggle vote)', () => {
    it('should create a new vote if none exists', async () => {
      req.body = { target_type: 'material', target_id: 1, is_upvote: true };
      const createdVote = { id: 3, target_type: 'material', target_id: 1, id_student: 5, is_upvote: true };

      Material.findByPk.mockResolvedValue(materialsMock[0]);
      Vote.findOne.mockResolvedValue(null);
      Vote.create.mockResolvedValue(createdVote);

      await voteController.create(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ message: 'Vote created successfully', data: createdVote, action: 'added' });
    });

    it('should remove existing vote if same direction (toggle off)', async () => {
      req.body = { target_type: 'material', target_id: 1, is_upvote: true };
      const existingVote = { ...votesMock[0], destroy: jest.fn().mockResolvedValue(true) };

      Material.findByPk.mockResolvedValue(materialsMock[0]);
      Vote.findOne.mockResolvedValue(existingVote);

      await voteController.create(req, res);
      expect(existingVote.destroy).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Vote removed successfully', action: 'removed' });
    });

    it('should update existing vote if opposite direction', async () => {
      req.body = { target_type: 'material', target_id: 2, is_upvote: true };
      const existingVote = { ...votesMock[1], save: jest.fn().mockResolvedValue(true) };

      Material.findByPk.mockResolvedValue(materialsMock[1]);
      Vote.findOne.mockResolvedValue(existingVote);

      await voteController.create(req, res);
      expect(existingVote.is_upvote).toBe(true);
      expect(existingVote.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Vote updated successfully', data: existingVote, action: 'updated' });
    });

    it('should return 404 if target not found', async () => {
      req.body = { target_type: 'material', target_id: 999, is_upvote: true };

      Material.findByPk.mockResolvedValue(null);

      await voteController.create(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'material not found' });
    });

    it('should return 403 if voting on own content', async () => {
      req.body = { target_type: 'material', target_id: 1, is_upvote: true };
      req.user = { id: 2 };

      Material.findByPk.mockResolvedValue(materialsMock[0]);

      await voteController.create(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should return 500 on database error', async () => {
      req.body = { target_type: 'material', target_id: 1, is_upvote: true };

      Material.findByPk.mockResolvedValue(materialsMock[0]);
      Vote.findOne.mockRejectedValue(new Error('DB Error'));

      await voteController.create(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('should return 409 on unique constraint violation', async () => {
      req.body = { target_type: 'material', target_id: 1, is_upvote: true };
      const constraintError = new Error('Duplicate');
      constraintError.name = 'SequelizeUniqueConstraintError';

      Material.findByPk.mockResolvedValue(materialsMock[0]);
      Vote.findOne.mockResolvedValue(null);
      Vote.create.mockRejectedValue(constraintError);

      await voteController.create(req, res);
      expect(res.status).toHaveBeenCalledWith(409);
    });

    it('should notify content owner when connected user adds a like', async () => {
      req.body = { target_type: 'post', target_id: 11, is_upvote: true };
      req.user = { id: 5, name: 'Ana', lastname: 'Lopez' };

      Post.findByPk.mockResolvedValue({ id: 11, id_author: 2, title: 'Post' });
      Vote.findOne.mockResolvedValue(null);
      Vote.create.mockResolvedValue({ id: 44, target_type: 'post', target_id: 11, id_student: 5, is_upvote: true });
      notificationService.areUsersConnected.mockResolvedValue(true);

      await voteController.create(req, res);
      await Promise.resolve();

      expect(notificationService.areUsersConnected).toHaveBeenCalledWith(5, 2);
      expect(notificationService.createNotification).toHaveBeenCalledWith(expect.objectContaining({
        userId: 2,
        type: 'content_vote',
        title: 'Recibiste un like',
        targetType: 'post',
        targetId: 11,
      }));
    });

    it('should not notify content owner when users are not connected', async () => {
      req.body = { target_type: 'post', target_id: 12, is_upvote: false };
      req.user = { id: 6, name: 'Pepe', lastname: 'Gomez' };

      Post.findByPk.mockResolvedValue({ id: 12, id_author: 3, title: 'Post B' });
      Vote.findOne.mockResolvedValue(null);
      Vote.create.mockResolvedValue({ id: 45, target_type: 'post', target_id: 12, id_student: 6, is_upvote: false });
      notificationService.areUsersConnected.mockResolvedValue(false);

      await voteController.create(req, res);
      await Promise.resolve();

      expect(notificationService.createNotification).not.toHaveBeenCalled();
    });
  });
});
