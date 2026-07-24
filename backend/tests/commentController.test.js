const commentController = require('../src/controllers/commentController');

jest.mock('../src/services/notificationService', () => ({
  createNotification: jest.fn(),
}), { virtual: true });

jest.mock('../src/models', () => ({
  Comment: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    destroy: jest.fn(),
  },
  Post: {
    findByPk: jest.fn(),
  },
  AcademicRecord: {
    findByPk: jest.fn(),
  },
  Vote: {
    findAll: jest.fn().mockResolvedValue([]),
  },
  Student: {},
  User: {},
}), { virtual: true });

const { Comment, Post, AcademicRecord } = require('../src/models');
const notificationService = require('../src/services/notificationService');

describe('Comment Controller', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      params: {},
      query: {},
      body: {},
      user: { id: 2 },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
    notificationService.createNotification.mockResolvedValue({ id: 1 });
  });

  describe('list', () => {
    it('should list comments for a post target', async () => {
      req.query = { target_type: 'post', target_id: '1' };
      Post.findByPk.mockResolvedValue({ id: 1 });
      Comment.findAll.mockResolvedValue([
        {
          id: 10,
          target_type: 'post',
          target_id: 1,
          id_author: 2,
          content: 'Hola',
          created_at: '2026-06-13T10:00:00.000Z',
          Student: { User: { name: 'Ana', lastname: 'Lopez', avatar: null } },
        },
      ]);

      await commentController.list(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        data: [
          expect.objectContaining({
            id: 10,
            targetType: 'post',
            targetId: 1,
            content: 'Hola',
          }),
        ],
      });
    });

    it('should return 404 if target does not exist', async () => {
      req.query = { target_type: 'post', target_id: '999' };
      Post.findByPk.mockResolvedValue(null);

      await commentController.list(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('create', () => {
    it('should create comment for academic event', async () => {
      req.body = { target_type: 'academic_event', target_id: 3, content: 'Felicitaciones!' };

      AcademicRecord.findByPk.mockResolvedValue({ id: 3 });
      Comment.create.mockResolvedValue({ id: 15 });
      Comment.findByPk.mockResolvedValue({
        id: 15,
        target_type: 'academic_event',
        target_id: 3,
        id_author: 2,
        content: 'Felicitaciones!',
        created_at: '2026-06-13T12:00:00.000Z',
        Student: { User: { name: 'Ana', lastname: 'Lopez', avatar: null } },
      });

      await commentController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(Comment.create).toHaveBeenCalledWith(expect.objectContaining({
        target_type: 'academic_event',
        target_id: 3,
        id_author: 2,
      }));
    });

    it('should return 404 when target does not exist', async () => {
      req.body = { target_type: 'post', target_id: 100, content: 'Hola' };
      Post.findByPk.mockResolvedValue(null);

      await commentController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should notify post author when comment is created on post target', async () => {
      req.body = { target_type: 'post', target_id: 100, content: 'Buenisimo' };
      req.user = { id: 2, name: 'Ana', lastname: 'Lopez' };

      Post.findByPk
        .mockResolvedValueOnce({ id: 100, id_author: 7, title: 'Post A' })
        .mockResolvedValueOnce({ id: 100, id_author: 7, title: 'Post A' });
      Comment.create.mockResolvedValue({ id: 22 });
      Comment.findByPk.mockResolvedValue({
        id: 22,
        target_type: 'post',
        target_id: 100,
        id_author: 2,
        content: 'Buenisimo',
        created_at: '2026-06-13T12:00:00.000Z',
        Student: { User: { name: 'Ana', lastname: 'Lopez', avatar: null } },
      });

      await commentController.create(req, res);
      await Promise.resolve();

      expect(notificationService.createNotification).toHaveBeenCalledWith(expect.objectContaining({
        userId: 7,
        type: 'post_comment',
        targetType: 'post',
        targetId: 100,
      }));
    });
  });

  describe('delete', () => {
    it('should return 403 when user is not owner', async () => {
      req.params.id = 20;
      req.user = { id: 99 };
      Comment.findByPk.mockResolvedValue({ id: 20, id_author: 2 });

      await commentController.delete(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should delete own comment', async () => {
      req.params.id = 20;
      req.user = { id: 2 };
      Comment.findByPk.mockResolvedValue({ id: 20, id_author: 2 });
      Comment.destroy.mockResolvedValue(1);

      await commentController.delete(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(Comment.destroy).toHaveBeenCalledWith({ where: { id: 20 } });
    });
  });
});
