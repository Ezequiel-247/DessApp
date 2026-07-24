const instanceSubjectController = require('../src/controllers/instanceSubjectController');
const { instanceSubjectsMock } = require('./mocks/mockData');

jest.mock('../src/models', () => ({
  InstanceSubject: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn()
  }
}), { virtual: true });

const { InstanceSubject } = require('../src/models');

describe('InstanceSubject Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { params: {}, body: {}, query: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return all with status 200', async () => {
      InstanceSubject.findAll.mockResolvedValue(instanceSubjectsMock);
      await instanceSubjectController.getAll(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should filter by subjectId query param', async () => {
      req.query.subjectId = '1';
      InstanceSubject.findAll.mockResolvedValue([instanceSubjectsMock[0]]);
      await instanceSubjectController.getAll(req, res);
      expect(InstanceSubject.findAll).toHaveBeenCalledWith({ where: { id_subject: '1' } });
    });
  });

  describe('getById', () => {
    it('should return by id with status 200', async () => {
      req.params.id = 1;
      InstanceSubject.findByPk.mockResolvedValue(instanceSubjectsMock[0]);
      await instanceSubjectController.getById(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 if not found', async () => {
      req.params.id = 999;
      InstanceSubject.findByPk.mockResolvedValue(null);
      await instanceSubjectController.getById(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('create', () => {
    it('should create and return status 201', async () => {
      req.body = { id_subject: 1, comision: 1, term: 1 };
      InstanceSubject.create.mockResolvedValue({ id: 3, ...req.body });
      await instanceSubjectController.create(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('update', () => {
    it('should update and return status 200', async () => {
      req.params.id = 1;
      req.body = { professor: 'New Prof' };
      InstanceSubject.update.mockResolvedValue([1]);
      InstanceSubject.findByPk.mockResolvedValue({ ...instanceSubjectsMock[0], professor: 'New Prof' });
      await instanceSubjectController.update(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('delete', () => {
    it('should delete and return status 200', async () => {
      req.params.id = 1;
      InstanceSubject.destroy.mockResolvedValue(1);
      await instanceSubjectController.delete(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});
