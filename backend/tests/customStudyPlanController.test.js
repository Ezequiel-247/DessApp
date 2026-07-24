const customStudyPlanController = require('../src/controllers/customStudyPlanController');
const { customStudyPlansMock } = require('./mocks/mockData');

jest.mock('../src/models', () => ({
  CustomStudyPlan: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn()
  },
  CustomStudyPlanItem: {
    bulkCreate: jest.fn(),
    destroy: jest.fn(),
  },
  PlanSubject: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
  },
  Subject: {},
}), { virtual: true });

const { CustomStudyPlan } = require('../src/models');

describe('CustomStudyPlan Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { params: {}, body: {}, query: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return all with status 200', async () => {
      CustomStudyPlan.findAll.mockResolvedValue(customStudyPlansMock);
      await customStudyPlanController.getAll(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should filter by studentId query param', async () => {
      req.query.studentId = '2';
      CustomStudyPlan.findAll.mockResolvedValue([customStudyPlansMock[0]]);
      await customStudyPlanController.getAll(req, res);
      expect(CustomStudyPlan.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id_student: '2' } })
      );
    });
  });

  describe('getById', () => {
    it('should return by id with status 200', async () => {
      req.params.id = 1;
      CustomStudyPlan.findByPk.mockResolvedValue(customStudyPlansMock[0]);
      await customStudyPlanController.getById(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 if not found', async () => {
      req.params.id = 999;
      CustomStudyPlan.findByPk.mockResolvedValue(null);
      await customStudyPlanController.getById(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('create', () => {
    it('should create and return status 201', async () => {
      req.body = { id_student: 2, name: 'My Plan', weekly_hours: 15 };
      CustomStudyPlan.create.mockResolvedValue({ id: 2, ...req.body });
      await customStudyPlanController.create(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('update', () => {
    it('should update and return status 200', async () => {
      req.params.id = 1;
      req.body = { weekly_hours: 25 };
      CustomStudyPlan.update.mockResolvedValue([1]);
      CustomStudyPlan.findByPk.mockResolvedValue({ ...customStudyPlansMock[0], weekly_hours: 25 });
      await customStudyPlanController.update(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('delete', () => {
    it('should delete and return status 200', async () => {
      req.params.id = 1;
      CustomStudyPlan.destroy.mockResolvedValue(1);
      await customStudyPlanController.delete(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 if not found', async () => {
      req.params.id = 999;
      CustomStudyPlan.destroy.mockResolvedValue(0);
      await customStudyPlanController.delete(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 500 on error', async () => {
      req.params.id = 1;
      CustomStudyPlan.destroy.mockRejectedValue(new Error('DB error'));
      await customStudyPlanController.delete(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getAll - error path', () => {
    it('should return 500 on error', async () => {
      CustomStudyPlan.findAll.mockRejectedValue(new Error('DB error'));
      await customStudyPlanController.getAll(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getById - error path', () => {
    it('should return 500 on error', async () => {
      req.params.id = 1;
      CustomStudyPlan.findByPk.mockRejectedValue(new Error('DB error'));
      await customStudyPlanController.getById(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('create - error paths', () => {
    it('should return 409 on duplicate', async () => {
      req.body = { id_student: 1, name: 'Plan' };
      CustomStudyPlan.create.mockRejectedValue({ name: 'SequelizeUniqueConstraintError' });
      await customStudyPlanController.create(req, res);
      expect(res.status).toHaveBeenCalledWith(409);
    });

    it('should return 500 on unexpected error', async () => {
      req.body = { id_student: 1, name: 'Plan' };
      CustomStudyPlan.create.mockRejectedValue(new Error('DB error'));
      await customStudyPlanController.create(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('update - error paths', () => {
    it('should return 404 if not found', async () => {
      req.params.id = 999;
      req.body = { weekly_hours: 30 };
      CustomStudyPlan.update.mockResolvedValue([0]);
      await customStudyPlanController.update(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 500 on error', async () => {
      req.params.id = 1;
      req.body = { weekly_hours: 30 };
      CustomStudyPlan.update.mockRejectedValue(new Error('DB error'));
      await customStudyPlanController.update(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getDeviation', () => {
    beforeEach(() => {
      req.params.id = 1;
      req.query.studentId = '2';
    });

    it('should return 400 if studentId is missing', async () => {
      req.query = {};
      await customStudyPlanController.getDeviation(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 if plan not found', async () => {
      CustomStudyPlan.findByPk.mockResolvedValue(null);
      await customStudyPlanController.getDeviation(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 403 if plan does not belong to student', async () => {
      CustomStudyPlan.findByPk.mockResolvedValue({ id: 1, id_student: 999, name: 'Other', items: [] });
      await customStudyPlanController.getDeviation(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should return 200 with metrics', async () => {
      CustomStudyPlan.findByPk.mockResolvedValue({
        id: 1,
        id_student: 2,
        name: 'My Plan',
        items: [],
      });
      await customStudyPlanController.getDeviation(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            plan_name: 'My Plan',
            summary: expect.any(Object),
            subjects: expect.any(Array),
          }),
        })
      );
    });

    it('should return 500 on error', async () => {
      CustomStudyPlan.findByPk.mockRejectedValue(new Error('DB error'));
      await customStudyPlanController.getDeviation(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
