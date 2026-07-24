const correlativityController = require('../src/controllers/correlativityController');
const { correlativitiesMock } = require('./mocks/mockData');

jest.mock('../src/models', () => ({
  Correlativity: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn()
  },
  PlanSubject: {}
}), { virtual: true });

const { Correlativity } = require('../src/models');

describe('Correlativity Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { params: {}, body: {}, query: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return all correlativities with status 200', async () => {
      Correlativity.findAll.mockResolvedValue(correlativitiesMock);
      await correlativityController.getAll(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ data: correlativitiesMock });
    });
  });

  describe('getById', () => {
    it('should return a correlativity by id with status 200', async () => {
      req.params.id = 1;
      Correlativity.findByPk.mockResolvedValue(correlativitiesMock[0]);
      await correlativityController.getById(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 if not found', async () => {
      req.params.id = 999;
      Correlativity.findByPk.mockResolvedValue(null);
      await correlativityController.getById(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('create', () => {
    it('should create and return status 201', async () => {
      const data = { id_plan_subject_target: 1, id_required_plan_subject: 2, type: 'regular' };
      req.body = data;
      const created = { id: 2, ...data };
      Correlativity.create.mockResolvedValue(created);
      await correlativityController.create(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('update', () => {
    it('should update and return status 200', async () => {
      req.params.id = 1;
      req.body = { type: 'strong' };
      Correlativity.update.mockResolvedValue([1]);
      Correlativity.findByPk.mockResolvedValue({ ...correlativitiesMock[0], type: 'strong' });
      await correlativityController.update(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 if not found', async () => {
      req.params.id = 999;
      Correlativity.update.mockResolvedValue([0]);
      await correlativityController.update(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('delete', () => {
    it('should delete and return status 200', async () => {
      req.params.id = 1;
      Correlativity.destroy.mockResolvedValue(1);
      await correlativityController.delete(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 if not found', async () => {
      req.params.id = 999;
      Correlativity.destroy.mockResolvedValue(0);
      await correlativityController.delete(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 500 on error', async () => {
      req.params.id = 1;
      Correlativity.destroy.mockRejectedValue(new Error('DB error'));
      await correlativityController.delete(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getAll - filter and error', () => {
    it('should filter by id_plan_subject_target query param', async () => {
      req.query.id_plan_subject_target = '5';
      Correlativity.findAll.mockResolvedValue([correlativitiesMock[0]]);
      await correlativityController.getAll(req, res);
      expect(Correlativity.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id_plan_subject_target: '5' } })
      );
    });

    it('should return 500 on error', async () => {
      Correlativity.findAll.mockRejectedValue(new Error('DB error'));
      await correlativityController.getAll(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getById - error path', () => {
    it('should return 500 on error', async () => {
      req.params.id = 1;
      Correlativity.findByPk.mockRejectedValue(new Error('DB error'));
      await correlativityController.getById(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('create - error paths', () => {
    it('should return 409 on duplicate', async () => {
      req.body = { id_plan_subject_target: 1, id_required_plan_subject: 2 };
      Correlativity.create.mockRejectedValue({ name: 'SequelizeUniqueConstraintError' });
      await correlativityController.create(req, res);
      expect(res.status).toHaveBeenCalledWith(409);
    });

    it('should return 500 on unexpected error', async () => {
      req.body = { id_plan_subject_target: 1, id_required_plan_subject: 2 };
      Correlativity.create.mockRejectedValue(new Error('DB error'));
      await correlativityController.create(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('update - error path', () => {
    it('should return 500 on error', async () => {
      req.params.id = 1;
      req.body = { type: 'weak' };
      Correlativity.update.mockRejectedValue(new Error('DB error'));
      await correlativityController.update(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
