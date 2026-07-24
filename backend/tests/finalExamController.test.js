const finalExamController = require('../src/controllers/finalExamController');
const academicRecordService = require('../src/academicRecordService');
const { finalExamsMock } = require('./mocks/mockData');

jest.mock('../src/academicRecordService');

jest.mock('../src/models', () => ({
  FinalExam: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn()
  },
  AcademicRecord: {}
}), { virtual: true });

const { FinalExam } = require('../src/models');

describe('FinalExam Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { params: {}, body: {}, query: {}, user: { id: 1 } };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return all final exams with status 200', async () => {
      FinalExam.findAll.mockResolvedValue(finalExamsMock);
      await finalExamController.getAll(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ data: finalExamsMock });
    });
  });

  describe('getById', () => {
    it('should return a final exam by id with status 200', async () => {
      req.params.id = 1;
      FinalExam.findByPk.mockResolvedValue(finalExamsMock[0]);
      await finalExamController.getById(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 if not found', async () => {
      req.params.id = 999;
      FinalExam.findByPk.mockResolvedValue(null);
      await finalExamController.getById(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('create', () => {
    it('should create and return status 201', async () => {
      const data = { id_academic_record: 1, grade: '8' };
      req.body = data;
      const created = { id: 2, ...data, status: 'aprobado' };
      academicRecordService.addFinalExam.mockResolvedValue(created);
      await finalExamController.create(req, res);
      expect(academicRecordService.addFinalExam).toHaveBeenCalledWith(data, req.user.id);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ message: 'Examen final registrado exitosamente', data: created });
    });

    it('should return 409 on DomainError with statusCode 409', async () => {
      const domainError = new Error('Ya existe un examen aprobado para esta materia.');
      domainError.name = 'DomainError';
      domainError.statusCode = 409;
      academicRecordService.addFinalExam.mockRejectedValue(domainError);
      req.body = { id_academic_record: 1, grade: '8' };
      await finalExamController.create(req, res);
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ error: 'Ya existe un examen aprobado para esta materia.' });
    });

    it('should return 422 on DomainError with statusCode 422', async () => {
      const domainError = new Error('Existen registros de cursada posteriores...');
      domainError.name = 'DomainError';
      domainError.statusCode = 422;
      academicRecordService.addFinalExam.mockRejectedValue(domainError);
      req.body = { id_academic_record: 1, grade: '8' };
      await finalExamController.create(req, res);
      expect(res.status).toHaveBeenCalledWith(422);
    });

    it('should return 400 on DomainError with statusCode 400', async () => {
      const domainError = new Error('El año del examen no puede ser anterior al año de cursada.');
      domainError.name = 'DomainError';
      domainError.statusCode = 400;
      academicRecordService.addFinalExam.mockRejectedValue(domainError);
      req.body = { id_academic_record: 1, grade: '8' };
      await finalExamController.create(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 500 on unexpected error', async () => {
      academicRecordService.addFinalExam.mockRejectedValue(new Error('DB error'));
      req.body = { id_academic_record: 1, grade: '8' };
      await finalExamController.create(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('update', () => {
    it('should update and return status 200', async () => {
      req.params.id = 1;
      req.body = { grade: '9' };
      FinalExam.update.mockResolvedValue([1]);
      FinalExam.findByPk.mockResolvedValue({ ...finalExamsMock[0], grade: '9' });
      await finalExamController.update(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 if not found', async () => {
      req.params.id = 999;
      req.body = { grade: '10' };
      FinalExam.update.mockResolvedValue([0]);
      await finalExamController.update(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 500 on error', async () => {
      req.params.id = 1;
      req.body = { grade: '10' };
      FinalExam.update.mockRejectedValue(new Error('DB error'));
      await finalExamController.update(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('delete', () => {
    it('should delete and return status 200', async () => {
      req.params.id = 1;
      FinalExam.destroy.mockResolvedValue(1);
      await finalExamController.delete(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 if not found', async () => {
      req.params.id = 999;
      FinalExam.destroy.mockResolvedValue(0);
      await finalExamController.delete(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 500 on error', async () => {
      req.params.id = 1;
      FinalExam.destroy.mockRejectedValue(new Error('DB error'));
      await finalExamController.delete(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getAll - error path', () => {
    it('should return 500 on error', async () => {
      FinalExam.findAll.mockRejectedValue(new Error('DB error'));
      await finalExamController.getAll(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getById - error path', () => {
    it('should return 500 on error', async () => {
      req.params.id = 1;
      FinalExam.findByPk.mockRejectedValue(new Error('DB error'));
      await finalExamController.getById(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
