const instituteController = require('../src/controllers/instituteController');
const { institutesMock } = require('./mocks/mockData');

// Mockeamos el modelo de Sequelize de forma virtual
jest.mock('../src/models', () => ({
  Institute: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
  }
}), { virtual: true });

const { Institute } = require('../src/models');

describe('Institute Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { params: {}, body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return all institutes with status 200', async () => {
      Institute.findAll.mockResolvedValue(institutesMock);

      await instituteController.getAll(req, res);

      expect(Institute.findAll).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ data: institutesMock });
    });

    it('should handle errors and return status 500', async () => {
      const errorMessage = 'Database error';
      Institute.findAll.mockRejectedValue(new Error(errorMessage));

      await instituteController.getAll(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error fetching institutes', details: errorMessage });
    });
  });

  describe('create', () => {
    it('should create a new institute and return status 201', async () => {
      const newInstituteData = { name: 'Instituto de Tecnología' };
      const createdInstitute = { id: 4, ...newInstituteData };
      
      req.body = newInstituteData;
      Institute.create.mockResolvedValue(createdInstitute);

      await instituteController.create(req, res);

      expect(Institute.create).toHaveBeenCalledWith(newInstituteData);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ message: 'Institute created successfully', data: createdInstitute });
    });
  });

  describe('update', () => {
    it('should update an existing institute and return status 200', async () => {
      req.params.id = institutesMock[0].id;
      req.body = { name: 'Instituto Modificado' };
      
      const updatedInstitute = { ...institutesMock[0], name: req.body.name };
      
      Institute.update.mockResolvedValue([1]); // Sequelize retorna un array donde el primer elemento es cant. de filas afectadas
      Institute.findByPk.mockResolvedValue(updatedInstitute);

      await instituteController.update(req, res);

      expect(Institute.update).toHaveBeenCalledWith(req.body, { where: { id: institutesMock[0].id } });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Institute updated successfully', data: updatedInstitute });
    });

    it('should return 404 if institute to update is not found', async () => {
      req.params.id = 999;
      req.body = { name: 'No existe' };
      Institute.update.mockResolvedValue([0]); // 0 filas afectadas

      await instituteController.update(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Institute not found or no changes made' });
    });
  });

  describe('delete', () => {
    it('should delete an institute and return status 200', async () => {
      req.params.id = institutesMock[0].id;
      Institute.destroy.mockResolvedValue(1); // 1 fila eliminada

      await instituteController.delete(req, res);

      expect(Institute.destroy).toHaveBeenCalledWith({ where: { id: institutesMock[0].id } });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: `Institute with id: ${institutesMock[0].id} deleted successfully` });
    });

    it('should return 404 if institute to delete is not found', async () => {
      req.params.id = 999;
      Institute.destroy.mockResolvedValue(0); // 0 filas eliminadas

      await instituteController.delete(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Institute not found' });
    });

    it('should return 500 on unexpected error', async () => {
      req.params.id = 1;
      Institute.destroy.mockRejectedValue(new Error('DB error'));
      await instituteController.delete(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getById', () => {
    it('should return institute with status 200', async () => {
      req.params.id = institutesMock[0].id;
      Institute.findByPk.mockResolvedValue(institutesMock[0]);
      await instituteController.getById(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ data: institutesMock[0] });
    });

    it('should return 404 if institute not found', async () => {
      req.params.id = 999;
      Institute.findByPk.mockResolvedValue(null);
      await instituteController.getById(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 500 on error', async () => {
      req.params.id = 1;
      Institute.findByPk.mockRejectedValue(new Error('DB error'));
      await instituteController.getById(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('create - error paths', () => {
    it('should return 409 on duplicate name', async () => {
      req.body = { name: 'Duplicate Institute' };
      Institute.create.mockRejectedValue({ name: 'SequelizeUniqueConstraintError' });
      await instituteController.create(req, res);
      expect(res.status).toHaveBeenCalledWith(409);
    });

    it('should return 500 on unexpected error', async () => {
      req.body = { name: 'Test' };
      Institute.create.mockRejectedValue(new Error('DB error'));
      await instituteController.create(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('update - error paths', () => {
    it('should return 409 on unique constraint error', async () => {
      req.params.id = 1;
      req.body = { name: 'Duplicate' };
      Institute.update.mockRejectedValue({ name: 'SequelizeUniqueConstraintError' });
      await instituteController.update(req, res);
      expect(res.status).toHaveBeenCalledWith(409);
    });

    it('should return 500 on unexpected error', async () => {
      req.params.id = 1;
      req.body = { name: 'Test' };
      Institute.update.mockRejectedValue(new Error('DB error'));
      await instituteController.update(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});