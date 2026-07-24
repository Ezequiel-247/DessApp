const materialController = require('../src/controllers/materialController');
const { materialsMock } = require('./mocks/mockData');

jest.mock('../src/models', () => {
  const Material = {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn()
  };
  const Student = {
    findAll: jest.fn().mockResolvedValue([]),
  };
  const User = {
    findAll: jest.fn().mockResolvedValue([]),
  };
  const Subject = {
    findAll: jest.fn().mockResolvedValue([]),
  };
  const StudyPlan = {
    findAll: jest.fn().mockResolvedValue([]),
  };
  const Career = {
    findAll: jest.fn().mockResolvedValue([]),
  };
  const StudentCareerEnrollment = {
    findAll: jest.fn().mockResolvedValue([]),
  };
  const PlanSubject = {
    findAll: jest.fn().mockResolvedValue([]),
  };
  const Report = {
    findAll: jest.fn().mockResolvedValue([]),
    count: jest.fn().mockResolvedValue(0),
  };
  const ReportReason = {
    findAll: jest.fn().mockResolvedValue([]),
  };
  const SystemConfig = {
    findAll: jest.fn().mockResolvedValue([]),
  };
  const Vote = {
    findAll: jest.fn().mockResolvedValue([]),
  };

  return {
    Material,
    Student,
    User,
    Subject,
    StudyPlan,
    Career,
    StudentCareerEnrollment,
    PlanSubject,
    Report,
    ReportReason,
    SystemConfig,
    Vote,
  };
}, { virtual: true });

const { Material } = require('../src/models');

const withGet = (obj) => ({ ...obj, get: (opts) => opts?.plain ? { ...obj } : { ...obj } });

const formatExpected = (m) => ({
  ...m,
  author_name: undefined,
  tags: m.tags || [],
  my_vote: null,
  report_counts: { pending: 0, verified: 0 }
});

describe('Material Controller - CRUD', () => {
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
    it('should get all materials and return status 200', async () => {
      Material.findAll.mockResolvedValue(materialsMock.map(withGet));
      await materialController.getAll(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ data: materialsMock.map(formatExpected) });
    });

    it('should return 500 if database throws an error', async () => {
      Material.findAll.mockRejectedValue(new Error('DB connection failed'));
      await materialController.getAll(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error fetching materials', details: 'DB connection failed' });
    });
  });

  describe('getById', () => {
    it('should get a material by its ID and return status 200', async () => {
      req.params.id = 1;
      const mockMaterial = materialsMock.find(m => m.id === Number(req.params.id));
      Material.findByPk.mockResolvedValue(withGet(mockMaterial));
      
      await materialController.getById(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ data: formatExpected(mockMaterial) });
    });

    it('should return 404 if material is not found', async () => {
      req.params.id = 999;
      Material.findByPk.mockResolvedValue(null);
      await materialController.getById(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Material not found' });
    });

    it('should return 500 if database throws an error', async () => {
      req.params.id = 1;
      Material.findByPk.mockRejectedValue(new Error('DB Error'));
      await materialController.getById(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getByStudentId', () => {
    it('should get materials by student_id and return status 200', async () => {
      req.params.student_id = 2;
      const filteredMaterials = materialsMock.filter(m => m.id_author === parseInt(req.params.student_id));
      Material.findAll.mockResolvedValue(filteredMaterials.map(withGet));
      
      await materialController.getByStudentId(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ data: filteredMaterials.map(formatExpected) });
    });

    it('should return 404 if no materials are found for the student', async () => {
      req.params.student_id = 999;
      Material.findAll.mockResolvedValue([]);
      await materialController.getByStudentId(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Material not found' });
    });

    it('should return 500 if database throws an error', async () => {
      req.params.student_id = 2;
      Material.findAll.mockRejectedValue(new Error('DB Error'));
      await materialController.getByStudentId(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('create', () => {
    it('should create a new material and return status 201', async () => {
      const newMaterial = { id_author: 2, id_subject: 1, title: 'Test', file_url: 'http://test.com', status: 'active' };
      req.body = newMaterial;
      const createdMaterial = { id: 3, total_upvotes: 0, ...newMaterial };
      const createdMaterialWithGet = withGet(createdMaterial);

      Material.create.mockResolvedValue(createdMaterialWithGet);
      Material.findByPk.mockResolvedValue(createdMaterialWithGet);
      await materialController.create(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ message: 'Material created successfully', data: formatExpected(createdMaterial) });
    });

    it('should return 500 if creation fails in the database', async () => {
      req.body = { id_author: 2, id_subject: 1, title: 'Test', file_url: 'http://test.com', status: 'active' };
      Material.create.mockRejectedValue(new Error('Constraint error'));
      await materialController.create(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('update', () => {
    it('should update an existing material and return status 200', async () => {
      req.params.id = 1;
      req.body = { title: 'Nuevo Título' };
      const updatedMaterial = { ...materialsMock[0], title: req.body.title };

      Material.update.mockResolvedValue([1]);
      Material.findByPk.mockResolvedValue(withGet(updatedMaterial)); 

      await materialController.update(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Material updated successfully', data: formatExpected(updatedMaterial) });
      
      // Asegurar que total_upvotes se eliminó del req.body antes de actualizar
      expect(req.body.total_upvotes).toBeUndefined();
    });

    it('should return 404 if material to update is not found or no changes were made', async () => {
      req.params.id = 999;
      req.body = { title: 'Nuevo Título' };
      Material.update.mockResolvedValue([0]);
      await materialController.update(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Material not found or no changes made' });
    });

    it('should return 500 if database update fails', async () => {
      req.params.id = 1;
      Material.update.mockRejectedValue(new Error('Update failed'));
      await materialController.update(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('delete', () => {
    it('should delete a material and return status 200', async () => {
      req.params.id = 1;
      Material.destroy.mockResolvedValue(1);
      await materialController.delete(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 if material to delete is not found', async () => {
      req.params.id = 999;
      Material.destroy.mockResolvedValue(0);
      await materialController.delete(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 500 if database deletion fails', async () => {
      req.params.id = 1;
      Material.destroy.mockRejectedValue(new Error('Delete failed'));
      await materialController.delete(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});