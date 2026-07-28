const studentController = require('../src/controllers/studentController');
const { studentsMock, usersMock, studentCareerEnrollmentsMock } = require('./mocks/mockData');

const mockTransaction = { commit: jest.fn(), rollback: jest.fn() };

jest.mock('../src/academicRecordService', () => ({
  getAcademicSummary: jest.fn(),
}), { virtual: true });

const academicRecordService = require('../src/academicRecordService');

jest.mock('../src/models', () => ({
  User: {
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn()
  },
  Student: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn()
  },
  Career: {
    findByPk: jest.fn()
  },
  StudentCareerEnrollment: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
    findByPk: jest.fn(),
    bulkCreate: jest.fn()
  },
  AcademicRecord: {
    findAll: jest.fn()
  },
  PlanSubject: {},
  Subject: {},
  StudyPlan: {},
  Connection: {
    findOne: jest.fn()
  },
  sequelize: {
    transaction: jest.fn()
  }
}), { virtual: true });

const { User, Student, Career, StudentCareerEnrollment, Connection, sequelize } = require('../src/models');

describe('Student Controller', () => {
  let req, res;

  const buildUserInstance = (data) => ({
    ...data,
    toJSON: () => ({ ...data })
  });

  beforeEach(() => {
    req = { params: {}, body: {}, user: { id: 2 } };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    jest.clearAllMocks();
    sequelize.transaction.mockResolvedValue(mockTransaction);
  });

  describe('getAll', () => {
    it('should return all students with status 200', async () => {
      Student.findAll.mockResolvedValue(studentsMock);
      await studentController.getAll(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ data: studentsMock });
    });

    it('should return 500 on error', async () => {
      Student.findAll.mockRejectedValue(new Error('DB error'));
      await studentController.getAll(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getById', () => {
    it('should return a student by id with status 200', async () => {
      req.params.id = 2;
      Student.findOne.mockResolvedValue(studentsMock[0]);
      await studentController.getById(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 if not found', async () => {
      req.params.id = 999;
      Student.findOne.mockResolvedValue(null);
      await studentController.getById(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('getProfile', () => {
    const buildStudentInstance = (overrides = {}) => ({
      public_profile: false,
      show_email: false,
      show_academic_info: false,
      toJSON: () => ({
        user_id: 2,
        public_profile: false,
        show_email: false,
        show_academic_info: false,
        User: {
          id: 2,
          name: 'Student',
          lastname: 'Test',
          email: 'student@test.com'
        },
        academic_records: [{ id: 1 }],
        enrollments: []
      }),
      ...overrides,
    });

    it('should return full profile for owner', async () => {
      req.params.id = 2;
      req.user = { id: 2 };
      Student.findOne.mockResolvedValue(buildStudentInstance());

      await studentController.getProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        data: expect.objectContaining({
          visibility: 'owner',
          User: expect.objectContaining({ email: 'student@test.com' }),
          academic_records: expect.any(Array)
        })
      });
    });

    it('should hide email and academic info for public profile toggles off', async () => {
      req.params.id = 3;
      req.user = { id: 10 };
      Student.findOne.mockResolvedValue(
        buildStudentInstance({
          public_profile: true,
          show_email: false,
          show_academic_info: false,
          toJSON: () => ({
            user_id: 3,
            public_profile: true,
            show_email: false,
            show_academic_info: false,
            User: { id: 3, name: 'Public', lastname: 'Hidden', email: 'public@test.com' },
            academic_records: [{ id: 99 }],
            enrollments: []
          })
        })
      );
      Connection.findOne.mockResolvedValue(null);

      await studentController.getProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        data: expect.objectContaining({
          visibility: 'public',
          User: expect.not.objectContaining({ email: expect.anything() })
        })
      });
      expect(res.json.mock.calls[0][0].data.academic_records).toBeUndefined();
    });

    it('should return 403 for private profile when viewer is not contact', async () => {
      req.params.id = 3;
      req.user = { id: 10 };
      Student.findOne.mockResolvedValue(buildStudentInstance({ public_profile: false }));
      Connection.findOne.mockResolvedValue(null);

      await studentController.getProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('create', () => {
    it('should create user + student and return status 201', async () => {
      const payload = {
        email: 'newstudent@test.com',
        password: 'secret123',
        name: 'New',
        lastname: 'Student',
        legajo: 'A999',
      };
      req.body = payload;

      const createdUser = buildUserInstance({ id: 4, email: payload.email, name: payload.name, lastname: payload.lastname, role: 'student', is_active: true });
      const createdStudent = { user_id: 4, legajo: 'A999' };

      User.create.mockResolvedValue(createdUser);
      Student.create.mockResolvedValue(createdStudent);

      await studentController.create(req, res);

      expect(User.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: payload.email, role: 'student' }),
        { transaction: mockTransaction }
      );
      expect(Student.create).toHaveBeenCalledWith(
        expect.objectContaining({ user_id: 4, legajo: 'A999' }),
        { transaction: mockTransaction }
      );
      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Student created successfully',
        data: expect.objectContaining({ id: 4, email: payload.email, student: createdStudent })
      });
    });

    it('should create student with enrollments when provided', async () => {
      const payload = {
        email: 'enrolled@test.com',
        password: 'secret123',
        name: 'Enrolled',
        lastname: 'Student',
        enrollments: [{ career_id: 1 }],
      };
      req.body = payload;

      const createdUser = buildUserInstance({ id: 5, email: payload.email, name: payload.name, lastname: payload.lastname, role: 'student', is_active: true });
      const createdStudent = { user_id: 5 };
      const createdEnrollment = { id: 3, student_id: 5, career_id: 1 };

      User.create.mockResolvedValue(createdUser);
      Student.create.mockResolvedValue(createdStudent);
      Career.findByPk.mockResolvedValue({ id: 1 });
      StudentCareerEnrollment.bulkCreate.mockResolvedValue([createdEnrollment]);

      await studentController.create(req, res);

      expect(StudentCareerEnrollment.bulkCreate).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ student_id: 5, career_id: 1 })]),
        { transaction: mockTransaction }
      );
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should rollback and return 500 on error', async () => {
      User.create.mockRejectedValue(new Error('DB error'));
      req.body = { email: 'fail@test.com', password: 'pass', name: 'Fail', lastname: 'User' };

      await studentController.create(req, res);

      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('update', () => {
    it('should update user + student and return status 200', async () => {
      req.params.id = 2;
      req.body = { email: 'updated@test.com', name: 'Updated', public_profile: true };

      Student.findOne.mockResolvedValue(studentsMock[0]);

      await studentController.update(req, res);

      expect(User.update).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'updated@test.com', name: 'Updated' }),
        { where: { id: 2 }, transaction: mockTransaction, individualHooks: true }
      );
      expect(Student.update).toHaveBeenCalledWith(
        expect.objectContaining({ public_profile: true }),
        { where: { user_id: 2 }, transaction: mockTransaction }
      );
      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 if not found', async () => {
      req.params.id = 999;
      Student.findOne.mockResolvedValue(null);

      await studentController.update(req, res);

      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('delete', () => {
    it('should delete user (cascade to student) and return status 200', async () => {
      req.params.id = 2;
      User.destroy.mockResolvedValue(1);

      await studentController.delete(req, res);

      expect(User.destroy).toHaveBeenCalledWith({ where: { id: 2 } });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 if not found', async () => {
      req.params.id = 999;
      User.destroy.mockResolvedValue(0);

      await studentController.delete(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('uploadAvatar', () => {
    it('should upload avatar for owner', async () => {
      req.params.id = 2;
      req.user = { id: 2 };
      req.file = { filename: 'avatar.png' };

      Student.findOne
        .mockResolvedValueOnce({ user_id: 2 })
        .mockResolvedValueOnce({ user_id: 2, User: { id: 2, avatar: '/uploads/avatars/avatar.png' } });
      User.update.mockResolvedValue([1]);

      await studentController.uploadAvatar(req, res);

      expect(User.update).toHaveBeenCalledWith(
        { avatar: '/uploads/avatars/avatar.png' },
        { where: { id: 2 } }
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 403 if user tries to upload avatar for another student', async () => {
      req.params.id = 8;
      req.user = { id: 2 };
      req.file = { filename: 'avatar.png' };

      await studentController.uploadAvatar(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('getEnrollments', () => {
    it('should get enrollments for a student and return status 200', async () => {
      req.params.id = 2;
      Student.findOne.mockResolvedValue(studentsMock[0]);
      StudentCareerEnrollment.findAll.mockResolvedValue(studentCareerEnrollmentsMock);

      await studentController.getEnrollments(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ data: studentCareerEnrollmentsMock });
    });

    it('should return 404 if student not found', async () => {
      req.params.id = 999;
      Student.findOne.mockResolvedValue(null);

      await studentController.getEnrollments(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('addEnrollment', () => {
    it('should create an enrollment and return status 201', async () => {
      req.params.id = 2;
      req.body = { career_id: 2 };

      Student.findOne.mockResolvedValue(studentsMock[0]);
      Career.findByPk.mockResolvedValue({ id: 2 });
      StudentCareerEnrollment.findOne.mockResolvedValue(null);
      StudentCareerEnrollment.create.mockResolvedValue({ id: 3, student_id: 2, career_id: 2 });

      await studentController.addEnrollment(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Enrollment created successfully',
        data: expect.objectContaining({ student_id: 2, career_id: 2 })
      });
    });

    it('should return 400 if duplicate active enrollment exists', async () => {
      req.params.id = 2;
      req.body = { career_id: 1 };

      Student.findOne.mockResolvedValue(studentsMock[0]);
      Career.findByPk.mockResolvedValue({ id: 1 });
      StudentCareerEnrollment.findOne.mockResolvedValue({ id: 1 });

      await studentController.addEnrollment(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
    });

    it('should return 404 if student not found', async () => {
      req.params.id = 999;
      Student.findOne.mockResolvedValue(null);

      await studentController.addEnrollment(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 404 if career not found', async () => {
      req.params.id = 2;
      Student.findOne.mockResolvedValue(studentsMock[0]);
      Career.findByPk.mockResolvedValue(null);

      await studentController.addEnrollment(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('updateEnrollment', () => {
    it('should update an enrollment and return status 200', async () => {
      req.params.id = 2;
      req.params.enrollmentId = 1;
      req.body = { status: 'completed' };

      Student.findOne.mockResolvedValue(studentsMock[0]);
      StudentCareerEnrollment.findOne.mockResolvedValue({ id: 1, student_id: 2, career_id: 1 });

      await studentController.updateEnrollment(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 if enrollment not found', async () => {
      req.params.id = 2;
      req.params.enrollmentId = 999;

      Student.findOne.mockResolvedValue(studentsMock[0]);
      StudentCareerEnrollment.findOne.mockResolvedValue(null);

      await studentController.updateEnrollment(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('deleteEnrollment', () => {
    it('should delete an enrollment and return status 200', async () => {
      req.params.id = 2;
      req.params.enrollmentId = 1;

      Student.findOne.mockResolvedValue(studentsMock[0]);
      StudentCareerEnrollment.destroy.mockResolvedValue(1);

      await studentController.deleteEnrollment(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 if enrollment not found', async () => {
      req.params.id = 2;
      req.params.enrollmentId = 999;

      Student.findOne.mockResolvedValue(studentsMock[0]);
      StudentCareerEnrollment.destroy.mockResolvedValue(0);

      await studentController.deleteEnrollment(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('getAcademicSummary', () => {
    it('should return academic summary with status 200', async () => {
      req.params.id = 2;
      req.query = {};
      const summary = {
        average: 8,
        approved_count: 1,
        current_academic_year: { academic_year: 2, current_term: 1, label: '2° Año, 1° Cuatrimestre', short_label: '1.3 años' },
        total_units: 10,
        completed_units: 3,
        progress_percentage: 30,
        mandatory: { total: 6, approved: 1 },
        unahur: { total: 2, approved: 1 },
        elective: { total: 1, approved: 0, blocks: [{ id: 1, name: 'Electivas', min_required: 2, approved_from_pool: 0, completed: false }] },
        credit: { total: 1, approved: 1, blocks: [{ id: 1, name: 'Actividades', min_credits_required: 5, max_credits_allowed: 10, earned_credits: 5, completed: true }] },
      };
      Student.findOne.mockResolvedValue(studentsMock[0]);
      academicRecordService.getAcademicSummary.mockResolvedValue(summary);

      await studentController.getAcademicSummary(req, res);

      expect(academicRecordService.getAcademicSummary).toHaveBeenCalledWith(2, null);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ data: summary });
    });

    it('should forward enrollmentId from the query string when present', async () => {
      req.params.id = 2;
      req.query = { enrollmentId: '5' };
      Student.findOne.mockResolvedValue(studentsMock[0]);
      academicRecordService.getAcademicSummary.mockResolvedValue({});

      await studentController.getAcademicSummary(req, res);

      expect(academicRecordService.getAcademicSummary).toHaveBeenCalledWith(2, '5');
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 if student not found', async () => {
      req.params.id = 999;
      req.query = {};
      Student.findOne.mockResolvedValue(null);

      await studentController.getAcademicSummary(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(academicRecordService.getAcademicSummary).not.toHaveBeenCalled();
    });

    it('should return 500 on service error', async () => {
      req.params.id = 2;
      req.query = {};
      Student.findOne.mockResolvedValue(studentsMock[0]);
      academicRecordService.getAcademicSummary.mockRejectedValue(new Error('DB error'));

      await studentController.getAcademicSummary(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
