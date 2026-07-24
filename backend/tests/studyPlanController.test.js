const studyPlanController = require('../src/controllers/studyPlanController');
const { studyPlansMock } = require('./mocks/mockData');

jest.mock('../src/models', () => ({
  StudyPlan: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn()
  }
}), { virtual: true });

const { StudyPlan } = require('../src/models');

describe('StudyPlan Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { params: {}, body: {}, query: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return all with status 200', async () => {
      StudyPlan.findAll.mockResolvedValue(studyPlansMock);
      await studyPlanController.getAll(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should filter by careerId query param', async () => {
      req.query.careerId = '1';
      StudyPlan.findAll.mockResolvedValue([studyPlansMock[0]]);
      await studyPlanController.getAll(req, res);
      expect(StudyPlan.findAll).toHaveBeenCalledWith({ where: { id_career: '1' } });
    });
  });

  describe('getById', () => {
    it('should return by id with status 200', async () => {
      req.params.id = 1;
      StudyPlan.findByPk.mockResolvedValue(studyPlansMock[0]);
      await studyPlanController.getById(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 if not found', async () => {
      req.params.id = 999;
      StudyPlan.findByPk.mockResolvedValue(null);
      await studyPlanController.getById(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('create', () => {
    it('should create and return status 201', async () => {
      req.body = { id_career: 1, name: 'New Plan', status: 'vigente' };
      StudyPlan.create.mockResolvedValue({ id: 3, ...req.body });
      await studyPlanController.create(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
    });


  });

  describe('update', () => {
    it('should update and return status 200', async () => {
      req.params.id = 1;
      req.body = { name: 'Updated' };
      StudyPlan.update.mockResolvedValue([1]);
      StudyPlan.findByPk.mockResolvedValue({ ...studyPlansMock[0], name: 'Updated' });
      await studyPlanController.update(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('delete', () => {
    it('should delete and return status 200', async () => {
      req.params.id = 1;
      StudyPlan.destroy.mockResolvedValue(1);
      await studyPlanController.delete(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 if not found', async () => {
      req.params.id = 999;
      StudyPlan.destroy.mockResolvedValue(0);
      await studyPlanController.delete(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 500 on error', async () => {
      req.params.id = 1;
      StudyPlan.destroy.mockRejectedValue(new Error('DB error'));
      await studyPlanController.delete(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getAll - error path', () => {
    it('should return 500 on error', async () => {
      StudyPlan.findAll.mockRejectedValue(new Error('DB error'));
      await studyPlanController.getAll(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getById - error path', () => {
    it('should return 500 on error', async () => {
      req.params.id = 1;
      StudyPlan.findByPk.mockRejectedValue(new Error('DB error'));
      await studyPlanController.getById(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('create - error paths', () => {
    it('should return 409 on duplicate', async () => {
      req.body = { name: 'Dup', id_career: 1 };
      StudyPlan.create.mockRejectedValue({ name: 'SequelizeUniqueConstraintError' });
      await studyPlanController.create(req, res);
      expect(res.status).toHaveBeenCalledWith(409);
    });

    it('should return 500 on unexpected error', async () => {
      req.body = { name: 'Plan', id_career: 1 };
      StudyPlan.create.mockRejectedValue(new Error('DB error'));
      await studyPlanController.create(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('update - error paths', () => {
    it('should return 404 if not found', async () => {
      req.params.id = 999;
      req.body = { name: 'Updated' };
      StudyPlan.update.mockResolvedValue([0]);
      await studyPlanController.update(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 500 on error', async () => {
      req.params.id = 1;
      req.body = { name: 'Updated' };
      StudyPlan.update.mockRejectedValue(new Error('DB error'));
      await studyPlanController.update(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
