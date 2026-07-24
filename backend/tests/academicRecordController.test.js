const academicRecordController = require('../src/controllers/academicRecordController');
const { academicRecordsMock } = require('./mocks/mockData');

jest.mock('../src/academicRecordService', () => ({
  addRecord: jest.fn(),
  deleteRecord: jest.fn(),
  calcularRegularidadExpiresAt: jest.fn((year, semester) => {
    if (semester === 1) return `${year + 2}-07-31`;
    if (semester === 2) return `${year + 2}-12-31`;
    return null;
  }),
}));

const academicRecordService = require('../src/academicRecordService');

// Mockeamos los modelos
jest.mock('../src/models', () => ({
  AcademicRecord: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn()
  },
  PlanSubject: {
    findOne: jest.fn()
  },
  StudentCareerEnrollment: {
    findOne: jest.fn()
  },
  FinalExam: {}
}), { virtual: true });

const { AcademicRecord, PlanSubject, StudentCareerEnrollment } = require('../src/models');

describe('Academic Record Controller - CRUD', () => {
  let req, res;

  beforeEach(() => {
    req = { params: {}, body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn()
    };
    jest.clearAllMocks();
    StudentCareerEnrollment.findOne.mockClear();
    PlanSubject.findOne.mockClear();
  });

  describe('getAll', () => {
    it('should get all academic records and return status 200', async () => {
      const enrichedMocks = academicRecordsMock.map((r) => {
        const plain = { ...r, final_exams: [] };
        return {
          ...r,
          final_exams: [],
          toJSON: () => plain,
        };
      });
      AcademicRecord.findAll.mockResolvedValue(enrichedMocks);

      await academicRecordController.getAll(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const callArg = res.json.mock.calls[0][0];
      expect(callArg).toHaveProperty('data');
      expect(Array.isArray(callArg.data)).toBe(true);
      expect(callArg.data).toHaveLength(academicRecordsMock.length);
      expect(callArg.data[0]).toHaveProperty('micro_estado_calculado');
      expect(callArg.data[0]).toHaveProperty('final_exams_count');
      expect(callArg.data[0]).toHaveProperty('latest_final_exam_status');
    });
  });

  describe('getByStudentId', () => {
    it('should get an academic record by student_id and return status 200', async () => {
      req.params.student_id = 2;
      const mockRecord = academicRecordsMock.find(r => r.id_student === parseInt(req.params.student_id));

      AcademicRecord.findOne.mockResolvedValue(mockRecord);

      await academicRecordController.getByStudentId(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ data: mockRecord });
    });

    it('should return status 404 if no academic record is found for the student', async () => {
      req.params.student_id = 999;
      AcademicRecord.findOne.mockResolvedValue(null);

      await academicRecordController.getByStudentId(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Academic record not found' });
    });
  });

  describe('create', () => {
    it('should create a new academic record and return status 201', async () => {
      const newRecord = { id_student: 3, id_subject: 104, status: 'cursando' };
      req.body = newRecord;
      const createdRecord = { id: 5, ...newRecord, plan_subject_id: 50 };

      StudentCareerEnrollment.findOne.mockResolvedValue({ study_plan_id: 10 });
      PlanSubject.findOne.mockResolvedValue({ id: 50, id_subject: 104 });
      academicRecordService.addRecord.mockResolvedValue(createdRecord);

      await academicRecordController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ message: 'Academic record created successfully', data: createdRecord });
    });
  });

  describe('update', () => {
    it('should update an existing academic record by ID and return status 200', async () => {
      req.params.id = 1;
      req.body = { status: 'aprobada', grade: 9 };
      const updatedRecord = { ...academicRecordsMock[0], ...req.body };

      AcademicRecord.update.mockResolvedValue([1]);
      AcademicRecord.findByPk.mockResolvedValue(updatedRecord);

      await academicRecordController.update(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Academic record updated successfully', data: updatedRecord });
    });

    it('should persist year/semester changes and recompute regularity_expires_at to match', async () => {
      req.params.id = 1;
      req.body = { grade: '5', year: 2025, semester: 2 };
      const currentRecord = { ...academicRecordsMock[0], year: 2026, semester: 1, grade: '5', regularity_expires_at: '2028-07-31' };

      AcademicRecord.findByPk.mockResolvedValue(currentRecord);
      AcademicRecord.update.mockResolvedValue([1]);

      await academicRecordController.update(req, res);

      expect(AcademicRecord.update).toHaveBeenCalledWith(
        expect.objectContaining({
          year: 2025,
          semester: 2,
          regularity_expires_at: '2027-12-31',
        }),
        { where: { id: 1 } }
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('updateByStudentId', () => {
    it('should update an academic record by student_id and return status 200', async () => {
      req.params.student_id = 1;
      req.body = { status: 'regular' };
      const updatedRecord = { ...academicRecordsMock[0], ...req.body };

      AcademicRecord.update.mockResolvedValue([1]);
      AcademicRecord.findOne.mockResolvedValue(updatedRecord);

      await academicRecordController.updateByStudentId(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Academic record updated successfully', data: updatedRecord });
    });
  });

  describe('delete', () => {
    it('should delete an academic record by ID and return status 200', async () => {
      req.params.id = 1;

      academicRecordService.deleteRecord.mockResolvedValue({ message: 'Registro académico 1 eliminado correctamente' });

      await academicRecordController.delete(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Registro académico 1 eliminado correctamente' });
    });

    it('should return 404 if record ID to delete is not found', async () => {
      req.params.id = 999;
      const notFoundError = new Error('Registro académico no encontrado');
      notFoundError.name = 'DomainError';
      notFoundError.statusCode = 404;
      academicRecordService.deleteRecord.mockRejectedValue(notFoundError);

      await academicRecordController.delete(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Registro académico no encontrado' });
    });
  });

  describe('deleteByStudentId', () => {
    it('should delete academic records by student_id and return status 200', async () => {
      req.params.student_id = 1;

      AcademicRecord.destroy.mockResolvedValue(2); // asumiendo que borra 2 registros

      await academicRecordController.deleteByStudentId(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: `Academic record with student id: ${req.params.student_id} deleted successfully` });
    });
  });
});