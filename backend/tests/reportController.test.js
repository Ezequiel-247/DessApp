const reportController = require('../src/controllers/reportController');
const { reportsMock } = require('./mocks/mockData');

jest.mock('../src/models', () => ({
  Report: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn()
  },
  sequelize: {
    query: jest.fn(),
    QueryTypes: {
      SELECT: 'SELECT',
    },
  },
}), { virtual: true });

jest.mock('../src/services/notificationService', () => ({
  createNotification: jest.fn(),
}));

const { Report, sequelize } = require('../src/models');
const notificationService = require('../src/services/notificationService');

describe('Report Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { params: {}, body: {}, query: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return all with status 200', async () => {
      Report.findAll.mockResolvedValue(reportsMock);
      await reportController.getAll(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should filter by status query param', async () => {
      req.query.status = 'pendiente';
      Report.findAll.mockResolvedValue([reportsMock[0]]);
      await reportController.getAll(req, res);
      expect(Report.findAll).toHaveBeenCalledWith({ where: { status: 'pendiente' } });
    });

    it('should filter by reporterId query param', async () => {
      req.query.reporterId = '2';
      Report.findAll.mockResolvedValue([reportsMock[0]]);
      await reportController.getAll(req, res);
      expect(Report.findAll).toHaveBeenCalledWith({ where: { id_reporter: '2' } });
    });
  });

  describe('getById', () => {
    it('should return by id with status 200', async () => {
      req.params.id = 1;
      Report.findByPk.mockResolvedValue(reportsMock[0]);
      await reportController.getById(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 if not found', async () => {
      req.params.id = 999;
      Report.findByPk.mockResolvedValue(null);
      await reportController.getById(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('create', () => {
    it('should create and return status 201', async () => {
      req.body = { id_reporter: 2, id_content: 1, content_type: 'material', id_reason: 1 };
      Report.create.mockResolvedValue({ id: 2, ...req.body });
      await reportController.create(req, res);
      expect(notificationService.createNotification).toHaveBeenCalledWith(expect.objectContaining({
        userId: 2,
        title: 'Denuncia registrada',
      }));
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('update', () => {
    it('should update and return status 200', async () => {
      req.params.id = 1;
      req.body = { status: 'resuelto' };
      Report.update.mockResolvedValue([1]);
      Report.findByPk.mockResolvedValue({ ...reportsMock[0], status: 'resuelto', id_reporter: 2 });
      await reportController.update(req, res);
      expect(notificationService.createNotification).toHaveBeenCalledWith(expect.objectContaining({
        userId: 2,
        title: 'Actualizacion de denuncia',
      }));
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('delete', () => {
    it('should delete and return status 200', async () => {
      req.params.id = 1;
      Report.destroy.mockResolvedValue(1);
      await reportController.delete(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 if not found', async () => {
      req.params.id = 999;
      Report.destroy.mockResolvedValue(0);
      await reportController.delete(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 500 on error', async () => {
      req.params.id = 1;
      Report.destroy.mockRejectedValue(new Error('DB error'));
      await reportController.delete(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getAll - error path', () => {
    it('should return 500 on error', async () => {
      Report.findAll.mockRejectedValue(new Error('DB error'));
      await reportController.getAll(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getById - error path', () => {
    it('should return 500 on error', async () => {
      req.params.id = 1;
      Report.findByPk.mockRejectedValue(new Error('DB error'));
      await reportController.getById(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('create - error paths', () => {
    it('should return 500 on unexpected error', async () => {
      req.body = { id_reporter: 1, id_content: 1, content_type: 'material' };
      Report.create.mockRejectedValue(new Error('DB error'));
      await reportController.create(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('update - error paths', () => {
    it('should return 404 if not found', async () => {
      req.params.id = 999;
      req.body = { status: 'resuelto' };
      Report.update.mockResolvedValue([0]);
      await reportController.update(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 500 on error', async () => {
      req.params.id = 1;
      req.body = { status: 'resuelto' };
      Report.update.mockRejectedValue(new Error('DB error'));
      await reportController.update(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('subjectsByCareer', () => {
    it('should apply date filters and return aggregated data', async () => {
      req.query = { career_id: '1', start_date: '2026-01-01', end_date: '2026-06-30' };

      sequelize.query
        .mockResolvedValueOnce([
          {
            career_id: 1,
            career_name: 'Ingenieria',
            total_students: 2,
            total_records: 3,
            total_approved: 2,
            total_subjects: 2,
          },
        ])
        .mockResolvedValueOnce([
          {
            career_id: 1,
            subject_id: 10,
            subject_name: 'Algebra',
            total_records: 3,
            approved: 2,
            desaprobado: 1,
            pendiente: 0,
            enrolled: 0,
          },
        ])
        .mockResolvedValueOnce([{ cnt: 2 }]);

      await reportController.subjectsByCareer(req, res);

      expect(sequelize.query).toHaveBeenCalledTimes(3);
      const firstCallQuery = sequelize.query.mock.calls[0][0];
      const secondCallQuery = sequelize.query.mock.calls[1][0];
      const firstCallOptions = sequelize.query.mock.calls[0][1];

      expect(firstCallQuery).toContain('ar."createdAt" >= :start_date');
      expect(secondCallQuery).toContain('ar."createdAt" <= :end_date');
      expect(firstCallOptions.replacements).toEqual(
        expect.objectContaining({
          career_id: '1',
          start_date: '2026-01-01',
          end_date: '2026-06-30',
        })
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.any(Array),
        totals: expect.any(Object),
      }));
    });
  });

  describe('subjectsByStudent', () => {
    it('should apply date filters and return distribution', async () => {
      req.query = { start_date: '2026-01-01', end_date: '2026-06-30' };
      sequelize.query.mockResolvedValueOnce([
        { cursada_count: 0, student_count: 1 },
        { cursada_count: 2, student_count: 3 },
      ]);

      await reportController.subjectsByStudent(req, res);

      const callQuery = sequelize.query.mock.calls[0][0];
      expect(callQuery).toContain('ar."createdAt" >= :start_date');
      expect(callQuery).toContain('ar."createdAt" <= :end_date');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          distribution: expect.any(Array),
        }),
      }));
    });
  });

  describe('studySessionsUsage', () => {
    it('should return study sessions usage report with monthly trend and drilldown', async () => {
      req.query = { career_id: '1', start_date: '2026-01-01', end_date: '2026-06-30' };

      sequelize.query
        .mockResolvedValueOnce([
          {
            career_id: 1,
            career_name: 'Ingenieria',
            total_sessions: 4,
            abierta: 1,
            cancelada: 1,
            finalizada: 2,
            total_registrations: 8,
            approved: 5,
            pending: 2,
            rejected: 1,
            total_slots: 10,
          },
        ])
        .mockResolvedValueOnce([
          {
            career_id: 1,
            subject_id: 10,
            subject_name: 'Algebra',
            total_sessions: 2,
            abierta: 0,
            cancelada: 1,
            finalizada: 1,
            total_registrations: 4,
            approved: 3,
            pending: 1,
            rejected: 0,
            total_slots: 5,
          },
        ])
        .mockResolvedValueOnce([
          { month: '2026-01', sessions: 2, registrations: 4 },
          { month: '2026-02', sessions: 2, registrations: 4 },
        ]);

      await reportController.studySessionsUsage(req, res);

      expect(sequelize.query).toHaveBeenCalledTimes(3);
      const firstCallOptions = sequelize.query.mock.calls[0][1];
      expect(firstCallOptions.replacements).toEqual(
        expect.objectContaining({
          career_id: 1,
          start_date: '2026-01-01',
          end_date: '2026-06-30',
        })
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          totals: expect.any(Object),
          monthly_trend: expect.any(Array),
          by_career: expect.any(Array),
        }),
      }));
    });

    it('should filter study sessions by type if parameter is provided', async () => {
      req.query = { type: 'virtual' };
      sequelize.query
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      await reportController.studySessionsUsage(req, res);

      const firstCallQuery = sequelize.query.mock.calls[0][0];
      const firstCallOptions = sequelize.query.mock.calls[0][1];

      expect(firstCallQuery).toContain('ss.type = :type');
      expect(firstCallOptions.replacements.type).toEqual('virtual');
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('socialConnections', () => {
    it('should return aggregated social connections stats and distribution', async () => {
      req.query = { start_date: '2026-01-01', end_date: '2026-06-30' };

      sequelize.query
        .mockResolvedValueOnce([
          {
            total_students: 10,
            students_with_connections: 6,
            students_without_connections: 4,
            average_connections: 1.2,
            max_connections: 4,
          },
        ])
        .mockResolvedValueOnce([
          { connections_count: 0, student_count: 4 },
          { connections_count: 1, student_count: 4 },
          { connections_count: 4, student_count: 2 },
        ])
        .mockResolvedValueOnce([
          { status: 'accepted', count: 6 },
          { status: 'pending', count: 3 },
          { status: 'rejected', count: 1 },
        ]);

      await reportController.socialConnections(req, res);

      expect(sequelize.query).toHaveBeenCalledTimes(3);
      const firstCallQuery = sequelize.query.mock.calls[0][0];
      const firstCallOptions = sequelize.query.mock.calls[0][1];

      expect(firstCallQuery).toContain('c."createdAt" >= :start_date');
      expect(firstCallOptions.replacements.start_date).toEqual('2026-01-01');
      expect(firstCallOptions.replacements.end_date).toEqual('2026-06-30');

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        data: {
          total_students: 10,
          students_with_connections: 6,
          students_without_connections: 4,
          average_connections: 1.2,
          max_connections: 4,
          distribution: [
            { connections_count: 0, student_count: 4 },
            { connections_count: 1, student_count: 4 },
            { connections_count: 4, student_count: 2 },
          ],
          status_breakdown: {
            accepted: 6,
            pending: 3,
            rejected: 1,
          },
        },
      });
    });
  });

  describe('getStudentsByConnectionsCount', () => {
    it('should return error 400 if connections_count is missing', async () => {
      await reportController.getStudentsByConnectionsCount(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'connections_count is required' });
    });

    it('should return students list filtered by connections count', async () => {
      req.query = { connections_count: '2', career_id: '1' };
      sequelize.query.mockResolvedValueOnce([
        { id: 1, name: 'John', lastname: 'Doe', email: 'john@example.com', legajo: '123', connections_count: 2 },
      ]);

      await reportController.getStudentsByConnectionsCount(req, res);

      expect(sequelize.query).toHaveBeenCalledTimes(1);
      const callQuery = sequelize.query.mock.calls[0][0];
      const callOptions = sequelize.query.mock.calls[0][1];

      expect(callQuery).toContain('AND COALESCE(uc.connections_count, 0) = :connections_count');
      expect(callQuery).toContain('sce.career_id = :career_id');
      expect(callOptions.replacements.connections_count).toEqual(2);
      expect(callOptions.replacements.career_id).toEqual('1');

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        data: [
          { id: 1, name: 'John', lastname: 'Doe', email: 'john@example.com', legajo: '123', connections_count: 2 },
        ],
      });
    });
  });
});
