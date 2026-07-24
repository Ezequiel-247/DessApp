const systemConfigController = require('../src/controllers/systemConfigController');
const { systemConfigsMock } = require('./mocks/mockData');

jest.mock('../src/models', () => ({
  SystemConfig: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn()
  }
}), { virtual: true });

const { SystemConfig } = require('../src/models');

describe('SystemConfig Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { params: {}, body: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return all configs with status 200', async () => {
      SystemConfig.findAll.mockResolvedValue(systemConfigsMock);
      await systemConfigController.getAll(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getByKey', () => {
    it('should return by key with status 200', async () => {
      req.params.key = 'app_name';
      SystemConfig.findByPk.mockResolvedValue(systemConfigsMock[0]);
      await systemConfigController.getByKey(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 if key not found', async () => {
      req.params.key = 'nonexistent';
      SystemConfig.findByPk.mockResolvedValue(null);
      await systemConfigController.getByKey(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('create', () => {
    it('should create and return status 201', async () => {
      req.body = { key: 'new_key', value: 'new_value' };
      SystemConfig.create.mockResolvedValue(req.body);
      await systemConfigController.create(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('update', () => {
    it('should update by key and return status 200', async () => {
      req.params.key = 'app_name';
      req.body = { value: 'new_value' };
      const mockInstance = { ...systemConfigsMock[0], update: jest.fn().mockResolvedValue() };
      SystemConfig.findByPk.mockResolvedValue(mockInstance);
      await systemConfigController.update(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 if key not found', async () => {
      req.params.key = 'nonexistent';
      SystemConfig.findByPk.mockResolvedValue(null);
      await systemConfigController.update(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('delete', () => {
    it('should delete by key and return status 200', async () => {
      req.params.key = 'app_name';
      SystemConfig.destroy.mockResolvedValue(1);
      await systemConfigController.delete(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 if key not found', async () => {
      req.params.key = 'nonexistent';
      SystemConfig.destroy.mockResolvedValue(0);
      await systemConfigController.delete(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});
