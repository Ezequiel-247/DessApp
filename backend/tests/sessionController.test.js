const sessionController = require('../src/controllers/sessionController');
const { sessionsMock } = require('./mocks/mockData');

jest.mock('../src/models', () => ({
  Session: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
  },
}), { virtual: true });

const { Session } = require('../src/models');

describe('Session Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { params: {}, body: {}, query: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  });

  describe('getAll', () => {
    it('should return all with status 200', async () => {
      Session.findAll.mockResolvedValue(sessionsMock);
      await sessionController.getAll(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should filter by userId query param', async () => {
      req.query.userId = '1';
      Session.findAll.mockResolvedValue([sessionsMock[0]]);
      await sessionController.getAll(req, res);
      expect(Session.findAll).toHaveBeenCalledWith({ where: { id_user: '1' } });
    });

    it('should return 500 on error', async () => {
      Session.findAll.mockRejectedValue(new Error('DB error'));
      await sessionController.getAll(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getById', () => {
    it('should return by id with status 200', async () => {
      req.params.id = 1;
      Session.findByPk.mockResolvedValue(sessionsMock[0]);
      await sessionController.getById(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 if not found', async () => {
      req.params.id = 999;
      Session.findByPk.mockResolvedValue(null);
      await sessionController.getById(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 500 on error', async () => {
      req.params.id = 1;
      Session.findByPk.mockRejectedValue(new Error('DB error'));
      await sessionController.getById(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('create', () => {
    it('should create and return status 201', async () => {
      req.body = { id_user: 1, token: 'new-token' };
      Session.create.mockResolvedValue({ id: 2, ...req.body });
      await sessionController.create(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should accept userId alias', async () => {
      req.body = { userId: 1, token: 'tok' };
      Session.create.mockResolvedValue({ id: 3, id_user: 1, token: 'tok' });
      await sessionController.create(req, res);
      expect(Session.create).toHaveBeenCalledWith(expect.objectContaining({ id_user: 1 }));
    });

    it('should return 409 on duplicate session', async () => {
      req.body = { id_user: 1, token: 'dup-token' };
      Session.create.mockRejectedValue({ name: 'SequelizeUniqueConstraintError' });
      await sessionController.create(req, res);
      expect(res.status).toHaveBeenCalledWith(409);
    });

    it('should return 500 on unexpected error', async () => {
      req.body = { id_user: 1, token: 'tok' };
      Session.create.mockRejectedValue(new Error('DB error'));
      await sessionController.create(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('update', () => {
    it('should update and return status 200', async () => {
      req.params.id = 1;
      req.body = { token: 'updated-token', expires_at: '2099-01-01' };
      Session.update.mockResolvedValue([1]);
      Session.findByPk.mockResolvedValue({ ...sessionsMock[0], token: 'updated-token' });
      await sessionController.update(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should accept expiresAt alias', async () => {
      req.params.id = 1;
      req.body = { token: 'tok', expiresAt: '2099-01-01' };
      Session.update.mockResolvedValue([1]);
      Session.findByPk.mockResolvedValue(sessionsMock[0]);
      await sessionController.update(req, res);
      expect(Session.update).toHaveBeenCalledWith(
        expect.objectContaining({ expires_at: '2099-01-01' }),
        expect.any(Object)
      );
    });

    it('should return 404 if no rows updated', async () => {
      req.params.id = 999;
      req.body = { token: 'tok' };
      Session.update.mockResolvedValue([0]);
      await sessionController.update(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 500 on error', async () => {
      req.params.id = 1;
      req.body = { token: 'tok' };
      Session.update.mockRejectedValue(new Error('DB error'));
      await sessionController.update(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('delete', () => {
    it('should delete and return status 200', async () => {
      req.params.id = 1;
      Session.destroy.mockResolvedValue(1);
      await sessionController.delete(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 if session not found', async () => {
      req.params.id = 999;
      Session.destroy.mockResolvedValue(0);
      await sessionController.delete(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 500 on error', async () => {
      req.params.id = 1;
      Session.destroy.mockRejectedValue(new Error('DB error'));
      await sessionController.delete(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
