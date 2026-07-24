const careerController = require('../src/controllers/careerController');
const { careersMock } = require('./mocks/mockData');

// Mockeamos de forma virtual el archivo de modelos para que no falle si aún no existe
jest.mock('../src/models', () => ({
  Career: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn()
  }
}), { virtual: true });

const { Career } = require('../src/models');

describe('Career Controller - CRUD', () => {
  let req, res;

  beforeEach(() => {
    // Reseteamos los mocks de req y res antes de cada test
    req = { params: {}, body: {} };
    res = {
      status: jest.fn().mockReturnThis(), // Permite encadenar res.status().json()
      json: jest.fn(),
      send: jest.fn()
    };
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should get all careers and return status 200', async () => {
      Career.findAll.mockResolvedValue(careersMock);

      await careerController.getAll(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ data: careersMock });
    });
  });

  describe('getById', () => {
    it('should get a career by its ID and return status 200', async () => {
      req.params.id = 1;
      const mockCareer = careersMock.find(c => c.id === req.params.id);
      
      Career.findByPk.mockResolvedValue(mockCareer);
      
      await careerController.getById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ data: mockCareer });
    });

    it('should return status 404 if the career does not exist', async () => {
      req.params.id = 999; // ID inexistente
      
      Career.findByPk.mockResolvedValue(null);

      await careerController.getById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Career not found' });
    });
  });

  describe('create', () => {
    it('should create a new career and return status 201', async () => {
      const newCareer = { name: 'Enfermería', id_institute: 3 };
      req.body = newCareer;
      const createdCareer = { id: 5, ...newCareer };

      Career.create.mockResolvedValue(createdCareer);

      await careerController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ message: 'Career created successfully', data: createdCareer });
    });
  });

  describe('update', () => {
    it('should update an existing career and return status 200', async () => {
      req.params.id = 1;
      req.body = { name: 'Nombre Actualizado' };
      const updatedCareer = { ...careersMock[0], name: req.body.name };

      Career.update.mockResolvedValue([1]);
      Career.findByPk.mockResolvedValue(updatedCareer); 

      await careerController.update(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Career updated successfully', data: updatedCareer });
    });
  });

  describe('delete', () => {
    it('should delete a career and return status 200 with a message', async () => {
      req.params.id = 1;
      Career.destroy.mockResolvedValue(1);
      await careerController.delete(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: `Career with id: ${req.params.id} deleted successfully` });
    });

    it('should return 404 if career not found', async () => {
      req.params.id = 999;
      Career.destroy.mockResolvedValue(0);
      await careerController.delete(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 500 on error', async () => {
      req.params.id = 1;
      Career.destroy.mockRejectedValue(new Error('DB error'));
      await careerController.delete(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getAll - error path', () => {
    it('should return 500 on error', async () => {
      Career.findAll.mockRejectedValue(new Error('DB error'));
      await careerController.getAll(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getById - error paths', () => {
    it('should return 500 on error', async () => {
      req.params.id = 1;
      Career.findByPk.mockRejectedValue(new Error('DB error'));
      await careerController.getById(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('create - error paths', () => {
    it('should return 409 on duplicate code', async () => {
      req.body = { name: 'Duplicate', code: 'DUP' };
      Career.create.mockRejectedValue({ name: 'SequelizeUniqueConstraintError' });
      await careerController.create(req, res);
      expect(res.status).toHaveBeenCalledWith(409);
    });

    it('should return 500 on unexpected error', async () => {
      req.body = { name: 'Test' };
      Career.create.mockRejectedValue(new Error('DB error'));
      await careerController.create(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('update - error paths', () => {
    it('should return 404 if no rows updated', async () => {
      req.params.id = 999;
      req.body = { name: 'Test' };
      Career.update.mockResolvedValue([0]);
      await careerController.update(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 500 on error', async () => {
      req.params.id = 1;
      req.body = { name: 'Test' };
      Career.update.mockRejectedValue(new Error('DB error'));
      await careerController.update(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});