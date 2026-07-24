const postController = require('../src/controllers/postController');
const { postsMock } = require('./mocks/mockData');

jest.mock('../src/services/notificationService', () => ({
  getAcceptedConnectionIds: jest.fn(),
  createNotification: jest.fn(),
}), { virtual: true });

jest.mock('../src/models', () => ({
  Post: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn()
  },
  User: {
    findByPk: jest.fn(),
  }
}), { virtual: true });

const { Post } = require('../src/models');
const notificationService = require('../src/services/notificationService');

describe('Post Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { params: {}, body: {}, query: {}, user: { id: 2 } };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    jest.clearAllMocks();
    notificationService.getAcceptedConnectionIds.mockResolvedValue([]);
    notificationService.createNotification.mockResolvedValue({ id: 1 });
  });

  describe('getAll', () => {
    it('should return all with status 200', async () => {
      Post.findAll.mockResolvedValue(postsMock);
      await postController.getAll(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should filter by authorId query param', async () => {
      req.query.authorId = '2';
      Post.findAll.mockResolvedValue([postsMock[0]]);
      await postController.getAll(req, res);
      expect(Post.findAll).toHaveBeenCalledWith({ where: { id_author: '2' } });
    });
  });

  describe('getById', () => {
    it('should return by id with status 200', async () => {
      req.params.id = 1;
      Post.findByPk.mockResolvedValue(postsMock[0]);
      await postController.getById(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 if not found', async () => {
      req.params.id = 999;
      Post.findByPk.mockResolvedValue(null);
      await postController.getById(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('create', () => {
    it('should create and return status 201', async () => {
      req.body = { id_author: 2, title: 'New Post', content: 'Content' };
      Post.create.mockResolvedValue({ id: 2, ...req.body });
      await postController.create(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should notify accepted connections after creating a post', async () => {
      req.body = { title: 'Nuevo apunte', content: 'Contenido' };
      req.user = { id: 2, name: 'Ana', lastname: 'Lopez' };
      Post.create.mockResolvedValue({ id: 2, id_author: 2, title: 'Nuevo apunte', content: 'Contenido' });
      notificationService.getAcceptedConnectionIds.mockResolvedValue([5, 6]);

      await postController.create(req, res);
      await Promise.resolve();

      expect(notificationService.getAcceptedConnectionIds).toHaveBeenCalledWith(2);
      expect(notificationService.createNotification).toHaveBeenCalledTimes(2);
      expect(notificationService.createNotification).toHaveBeenCalledWith(expect.objectContaining({
        userId: 5,
        type: 'connection_post',
      }));
    });
  });

  describe('update', () => {
    it('should update and return status 200', async () => {
      req.params.id = 1;
      req.body = { title: 'Updated' };
      Post.findByPk
        .mockResolvedValueOnce({ ...postsMock[0], id_author: 2 })
        .mockResolvedValueOnce({ ...postsMock[0], id_author: 2, title: 'Updated' });
      Post.update.mockResolvedValue([1]);
      await postController.update(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 403 when user is not owner', async () => {
      req.params.id = 1;
      req.body = { title: 'Updated' };
      req.user = { id: 99 };
      Post.findByPk.mockResolvedValue({ ...postsMock[0], id_author: 2 });

      await postController.update(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('delete', () => {
    it('should delete and return status 200', async () => {
      req.params.id = 1;
      Post.findByPk.mockResolvedValue({ ...postsMock[0], id_author: 2 });
      Post.destroy.mockResolvedValue(1);
      await postController.delete(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 if not found', async () => {
      req.params.id = 999;
      Post.findByPk.mockResolvedValue(null);
      await postController.delete(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 403 when user is not owner', async () => {
      req.params.id = 1;
      req.user = { id: 99 };
      Post.findByPk.mockResolvedValue({ ...postsMock[0], id_author: 2 });

      await postController.delete(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should return 500 on error', async () => {
      req.params.id = 1;
      Post.destroy.mockRejectedValue(new Error('DB error'));
      await postController.delete(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getAll - error path', () => {
    it('should return 500 on error', async () => {
      Post.findAll.mockRejectedValue(new Error('DB error'));
      await postController.getAll(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getById - error path', () => {
    it('should return 500 on error', async () => {
      req.params.id = 1;
      Post.findByPk.mockRejectedValue(new Error('DB error'));
      await postController.getById(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('create - error paths', () => {
    it('should return 500 on unexpected error', async () => {
      req.body = { id_user: 1, title: 'T', content: 'C' };
      Post.create.mockRejectedValue(new Error('DB error'));
      await postController.create(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('update - error paths', () => {
    it('should return 404 if not found', async () => {
      req.params.id = 999;
      req.body = { title: 'Updated' };
      Post.findByPk.mockResolvedValue(null);
      await postController.update(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 500 on error', async () => {
      req.params.id = 1;
      req.body = { title: 'Updated' };
      Post.findByPk.mockResolvedValue({ ...postsMock[0], id_author: 2 });
      Post.update.mockRejectedValue(new Error('DB error'));
      await postController.update(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
