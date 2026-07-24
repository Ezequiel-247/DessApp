const notificationController = require('../src/controllers/notificationController');
const { notificationsMock } = require('./mocks/mockData');

jest.mock('../src/models', () => ({
  Notification: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
    count: jest.fn(),
  }
}), { virtual: true });

const { Notification } = require('../src/models');

describe('Notification Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { params: {}, body: {}, query: {}, user: { id: 1 } };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return all with status 200', async () => {
      Notification.findAll.mockResolvedValue(notificationsMock);
      await notificationController.getAll(req, res);
      expect(Notification.findAll).toHaveBeenCalledWith({ where: { id_user: 1 } });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should filter by userId query param', async () => {
      req.query.userId = '2';
      Notification.findAll.mockResolvedValue([notificationsMock[0]]);
      await notificationController.getAll(req, res);
      expect(Notification.findAll).toHaveBeenCalledWith({ where: { id_user: '2' } });
    });

    it('should filter by read query param', async () => {
      req.query.read = 'false';
      Notification.findAll.mockResolvedValue(notificationsMock);
      await notificationController.getAll(req, res);
      expect(Notification.findAll).toHaveBeenCalledWith({ where: { id_user: 1, read: false } });
    });
  });

  describe('getById', () => {
    it('should return by id with status 200', async () => {
      req.params.id = 1;
      Notification.findByPk.mockResolvedValue(notificationsMock[0]);
      await notificationController.getById(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 if not found', async () => {
      req.params.id = 999;
      Notification.findByPk.mockResolvedValue(null);
      await notificationController.getById(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('create', () => {
    it('should create and return status 201', async () => {
      req.body = { id_user: 2, type: 'info', title: 'Test', message: 'Test msg' };
      Notification.create.mockResolvedValue({ id: 3, ...req.body, read: false });
      await notificationController.create(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('update', () => {
    it('should update and return status 200', async () => {
      req.params.id = 1;
      req.body = { read: true };
      Notification.update.mockResolvedValue([1]);
      Notification.findByPk.mockResolvedValue({ ...notificationsMock[0], read: true });
      await notificationController.update(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('delete', () => {
    it('should delete and return status 200', async () => {
      req.params.id = 1;
      Notification.destroy.mockResolvedValue(1);
      await notificationController.delete(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 if not found', async () => {
      req.params.id = 999;
      Notification.destroy.mockResolvedValue(0);
      await notificationController.delete(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 500 on error', async () => {
      req.params.id = 1;
      Notification.destroy.mockRejectedValue(new Error('DB error'));
      await notificationController.delete(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getAll - error path', () => {
    it('should return 500 on error', async () => {
      Notification.findAll.mockRejectedValue(new Error('DB error'));
      await notificationController.getAll(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getById - error path', () => {
    it('should return 500 on error', async () => {
      req.params.id = 1;
      Notification.findByPk.mockRejectedValue(new Error('DB error'));
      await notificationController.getById(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('create - error paths', () => {
    it('should return 500 on unexpected error', async () => {
      req.body = { id_user: 1, type: 'info', title: 'T', message: 'M' };
      Notification.create.mockRejectedValue(new Error('DB error'));
      await notificationController.create(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('update - error paths', () => {
    it('should return 404 if not found', async () => {
      req.params.id = 999;
      req.body = { read: true };
      Notification.update.mockResolvedValue([0]);
      await notificationController.update(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 500 on error', async () => {
      req.params.id = 1;
      req.body = { read: true };
      Notification.update.mockRejectedValue(new Error('DB error'));
      await notificationController.update(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('markAllAsRead', () => {
    it('should mark unread notifications as read and return 200', async () => {
      Notification.update.mockResolvedValue([3]);

      await notificationController.markAllAsRead(req, res);

      expect(Notification.update).toHaveBeenCalledWith(
        { read: true },
        { where: { id_user: 1, read: false } },
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('unreadCount', () => {
    it('should return unread count with status 200', async () => {
      Notification.count.mockResolvedValue(5);

      await notificationController.unreadCount(req, res);

      expect(Notification.count).toHaveBeenCalledWith({ where: { id_user: 1, read: false } });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ data: { count: 5 } });
    });
  });
});
