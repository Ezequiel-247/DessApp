const reportReasonController = require('../src/controllers/reportReasonController');
const { reportReasonsMock } = require('./mocks/mockData');

jest.mock('../src/models', () => ({
  ReportReason: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn()
  }
}), { virtual: true });

const { ReportReason } = require('../src/models');

describe('ReportReason Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { params: {}, body: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return all report reasons with status 200', async () => {
      ReportReason.findAll.mockResolvedValue(reportReasonsMock);
      await reportReasonController.getAll(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getById', () => {
    it('should return by id with status 200', async () => {
      req.params.id = 1;
      ReportReason.findByPk.mockResolvedValue(reportReasonsMock[0]);
      await reportReasonController.getById(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('create', () => {
    it('should create and return status 201', async () => {
      const data = { name: 'New reason' };
      req.body = data;
      ReportReason.create.mockResolvedValue({ id: 3, ...data });
      await reportReasonController.create(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('update', () => {
    it('should update and return status 200', async () => {
      req.params.id = 1;
      req.body = { name: 'Updated' };
      ReportReason.update.mockResolvedValue([1]);
      ReportReason.findByPk.mockResolvedValue({ ...reportReasonsMock[0], name: 'Updated' });
      await reportReasonController.update(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('delete', () => {
    it('should delete and return status 200', async () => {
      req.params.id = 1;
      ReportReason.destroy.mockResolvedValue(1);
      await reportReasonController.delete(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 if not found', async () => {
      req.params.id = 999;
      ReportReason.destroy.mockResolvedValue(0);
      await reportReasonController.delete(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 500 on error', async () => {
      req.params.id = 1;
      ReportReason.destroy.mockRejectedValue(new Error('DB error'));
      await reportReasonController.delete(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getAll - error path', () => {
    it('should return 500 on error', async () => {
      ReportReason.findAll.mockRejectedValue(new Error('DB error'));
      await reportReasonController.getAll(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getById - error paths', () => {
    it('should return 404 if not found', async () => {
      req.params.id = 999;
      ReportReason.findByPk.mockResolvedValue(null);
      await reportReasonController.getById(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 500 on error', async () => {
      req.params.id = 1;
      ReportReason.findByPk.mockRejectedValue(new Error('DB error'));
      await reportReasonController.getById(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('create - error paths', () => {
    it('should return 409 on duplicate', async () => {
      req.body = { name: 'Duplicate' };
      ReportReason.create.mockRejectedValue({ name: 'SequelizeUniqueConstraintError' });
      await reportReasonController.create(req, res);
      expect(res.status).toHaveBeenCalledWith(409);
    });

    it('should return 500 on unexpected error', async () => {
      req.body = { name: 'Test' };
      ReportReason.create.mockRejectedValue(new Error('DB error'));
      await reportReasonController.create(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('update - error paths', () => {
    it('should return 404 if not found', async () => {
      req.params.id = 999;
      req.body = { name: 'Test' };
      ReportReason.update.mockResolvedValue([0]);
      await reportReasonController.update(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 500 on error', async () => {
      req.params.id = 1;
      req.body = { name: 'Test' };
      ReportReason.update.mockRejectedValue(new Error('DB error'));
      await reportReasonController.update(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
