const planSubjectController = require('../src/controllers/planSubjectController');
const { planSubjectsMock } = require('./mocks/mockData');

jest.mock('../src/models', () => ({
  PlanSubject: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn()
  }
}), { virtual: true });

const { PlanSubject } = require('../src/models');

describe('PlanSubject Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { params: {}, body: {}, query: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return all with status 200', async () => {
      PlanSubject.findAll.mockResolvedValue(planSubjectsMock);
      await planSubjectController.getAll(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should filter by planId query param', async () => {
      req.query.planId = '1';
      PlanSubject.findAll.mockResolvedValue([planSubjectsMock[0]]);
      await planSubjectController.getAll(req, res);
      expect(PlanSubject.findAll).toHaveBeenCalledWith({ where: { id_study_plan: '1' } });
    });
  });

  describe('getById', () => {
    it('should return by id with status 200', async () => {
      req.params.id = 1;
      PlanSubject.findByPk.mockResolvedValue(planSubjectsMock[0]);
      await planSubjectController.getById(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 if not found', async () => {
      req.params.id = 999;
      PlanSubject.findByPk.mockResolvedValue(null);
      await planSubjectController.getById(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('create', () => {
    it('should create and return status 201', async () => {
      req.body = { id_study_plan: 1, id_subject: 1, suggested_year: 1, suggested_term: 1 };
      PlanSubject.create.mockResolvedValue({ id: 5, ...req.body });
      await planSubjectController.create(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should create with credits and include credits in response', async () => {
      req.body = { id_study_plan: 1, id_subject: 1, suggested_year: 1, suggested_term: 1, credits: 3 };
      PlanSubject.create.mockResolvedValue({ id: 5, ...req.body });
      await planSubjectController.create(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Plan subject created',
        data: expect.objectContaining({ credits: 3 })
      });
    });

    it('should create with zero credits', async () => {
      req.body = { id_study_plan: 1, id_subject: 1, suggested_year: 1, suggested_term: 1, credits: 0 };
      PlanSubject.create.mockResolvedValue({ id: 5, ...req.body });
      await planSubjectController.create(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('update', () => {
    it('should update and return status 200', async () => {
      req.params.id = 1;
      req.body = { credits: 5 };
      PlanSubject.update.mockResolvedValue([1]);
      PlanSubject.findByPk.mockResolvedValue({ ...planSubjectsMock[0], credits: 5 });
      await planSubjectController.update(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('delete', () => {
    it('should delete and return status 200', async () => {
      req.params.id = 1;
      PlanSubject.destroy.mockResolvedValue(1);
      await planSubjectController.delete(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 if not found', async () => {
      req.params.id = 999;
      PlanSubject.destroy.mockResolvedValue(0);
      await planSubjectController.delete(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 500 on error', async () => {
      req.params.id = 1;
      PlanSubject.destroy.mockRejectedValue(new Error('DB error'));
      await planSubjectController.delete(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getAll - error path', () => {
    it('should return 500 on error', async () => {
      PlanSubject.findAll.mockRejectedValue(new Error('DB error'));
      await planSubjectController.getAll(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getById - error path', () => {
    it('should return 500 on error', async () => {
      req.params.id = 1;
      PlanSubject.findByPk.mockRejectedValue(new Error('DB error'));
      await planSubjectController.getById(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('create - error paths', () => {
    it('should return 409 on duplicate', async () => {
      req.body = { id_study_plan: 1, id_subject: 1 };
      PlanSubject.create.mockRejectedValue({ name: 'SequelizeUniqueConstraintError' });
      await planSubjectController.create(req, res);
      expect(res.status).toHaveBeenCalledWith(409);
    });

    it('should return 500 on unexpected error', async () => {
      req.body = { id_study_plan: 1, id_subject: 1 };
      PlanSubject.create.mockRejectedValue(new Error('DB error'));
      await planSubjectController.create(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('update - error paths', () => {
    it('should return 404 if not found', async () => {
      req.params.id = 999;
      req.body = { credits: 5 };
      PlanSubject.update.mockResolvedValue([0]);
      await planSubjectController.update(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 500 on error', async () => {
      req.params.id = 1;
      req.body = { credits: 5 };
      PlanSubject.update.mockRejectedValue(new Error('DB error'));
      await planSubjectController.update(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
