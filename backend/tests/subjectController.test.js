const subjectController = require('../src/controllers/subjectController');
const { subjectsMock } = require('./mocks/mockData');

jest.mock('../src/models', () => ({
  Subject: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
    count: jest.fn(),
    restore: jest.fn(),
  },
}), { virtual: true });

const { Subject } = require('../src/models');

describe('Subject Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { params: {}, body: {}, query: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  });

  describe('getAll', () => {
    it('should return all subjects with status 200', async () => {
      Subject.findAll.mockResolvedValue(subjectsMock);
      await subjectController.getAll(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ data: subjectsMock });
    });

    it('should filter by is_unahur=true when query param present', async () => {
      req.query.is_unahur = 'true';
      Subject.findAll.mockResolvedValue(subjectsMock);
      await subjectController.getAll(req, res);
      expect(Subject.findAll).toHaveBeenCalledWith({ where: { is_unahur: true } });
    });

    it('should filter by is_unahur=false when query param is "false"', async () => {
      req.query.is_unahur = 'false';
      Subject.findAll.mockResolvedValue([]);
      await subjectController.getAll(req, res);
      expect(Subject.findAll).toHaveBeenCalledWith({ where: { is_unahur: false } });
    });

    it('should return 500 on error', async () => {
      Subject.findAll.mockRejectedValue(new Error('DB error'));
      await subjectController.getAll(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getById', () => {
    it('should return by id with status 200', async () => {
      req.params.id = 1;
      Subject.findByPk.mockResolvedValue(subjectsMock[0]);
      await subjectController.getById(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 if not found', async () => {
      req.params.id = 999;
      Subject.findByPk.mockResolvedValue(null);
      await subjectController.getById(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 500 on error', async () => {
      req.params.id = 1;
      Subject.findByPk.mockRejectedValue(new Error('DB error'));
      await subjectController.getById(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('create', () => {
    it('should create and return status 201', async () => {
      req.body = { name: 'New Subject', code: 'NEW-101', is_unahur: true };
      Subject.create.mockResolvedValue({ id: 5, ...req.body });
      await subjectController.create(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should default is_unahur to true when not provided', async () => {
      req.body = { name: 'New Subject', code: 'NEW-101' };
      Subject.create.mockResolvedValue({ id: 5, ...req.body, is_unahur: true });
      await subjectController.create(req, res);
      expect(Subject.create).toHaveBeenCalledWith(expect.objectContaining({ is_unahur: true }));
    });

    it('should return 409 on duplicate name', async () => {
      req.body = { name: 'Duplicate', code: 'DUP-001' };
      Subject.create.mockRejectedValue({ name: 'SequelizeUniqueConstraintError' });
      await subjectController.create(req, res);
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ error: 'Subject name already exists' });
    });

    it('should return 500 on unexpected error', async () => {
      req.body = { name: 'Test' };
      Subject.create.mockRejectedValue(new Error('DB error'));
      await subjectController.create(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('update', () => {
    it('should update and return status 200', async () => {
      req.params.id = 1;
      req.body = { name: 'Updated' };
      Subject.update.mockResolvedValue([1]);
      Subject.findByPk.mockResolvedValue({ ...subjectsMock[0], name: 'Updated' });
      await subjectController.update(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 if no rows updated', async () => {
      req.params.id = 999;
      req.body = { name: 'Updated' };
      Subject.update.mockResolvedValue([0]);
      await subjectController.update(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 409 on unique constraint error', async () => {
      req.params.id = 1;
      req.body = { name: 'Duplicate' };
      Subject.update.mockRejectedValue({ name: 'SequelizeUniqueConstraintError' });
      await subjectController.update(req, res);
      expect(res.status).toHaveBeenCalledWith(409);
    });

    it('should return 500 on unexpected error', async () => {
      req.params.id = 1;
      req.body = { name: 'Test' };
      Subject.update.mockRejectedValue(new Error('DB error'));
      await subjectController.update(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('delete', () => {
    it('should delete and return status 200', async () => {
      req.params.id = 1;
      Subject.destroy.mockResolvedValue(1);
      await subjectController.delete(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 if subject not found', async () => {
      req.params.id = 999;
      Subject.destroy.mockResolvedValue(0);
      await subjectController.delete(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 500 on error', async () => {
      req.params.id = 1;
      Subject.destroy.mockRejectedValue(new Error('DB error'));
      await subjectController.delete(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getUnahur', () => {
    it('should return UNAHUR subjects with status 200', async () => {
      Subject.findAll.mockResolvedValue(subjectsMock);
      await subjectController.getUnahur(req, res);
      expect(Subject.findAll).toHaveBeenCalledWith({ where: { is_unahur: true } });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 500 on error', async () => {
      Subject.findAll.mockRejectedValue(new Error('DB error'));
      await subjectController.getUnahur(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getCount', () => {
    it('should return count with status 200', async () => {
      Subject.count.mockResolvedValue(10);
      await subjectController.getCount(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ data: { total: 10 } });
    });

    it('should return 500 on error', async () => {
      Subject.count.mockRejectedValue(new Error('DB error'));
      await subjectController.getCount(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('search', () => {
    it('should return matching subjects', async () => {
      req.query.q = 'math';
      Subject.findAll.mockResolvedValue([subjectsMock[0]]);
      await subjectController.search(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 400 if no query provided', async () => {
      req.query = {};
      await subjectController.search(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Search query is required' });
    });

    it('should return 500 on error', async () => {
      req.query.q = 'math';
      Subject.findAll.mockRejectedValue(new Error('DB error'));
      await subjectController.search(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('restore', () => {
    it('should restore subject and return status 200', async () => {
      req.params.id = 1;
      Subject.restore.mockResolvedValue(undefined);
      Subject.findByPk.mockResolvedValue(subjectsMock[0]);
      await subjectController.restore(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 500 on error', async () => {
      req.params.id = 1;
      Subject.restore.mockRejectedValue(new Error('DB error'));
      await subjectController.restore(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
