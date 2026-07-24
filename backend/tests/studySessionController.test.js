const studySessionController = require('../src/controllers/studySessionController');

jest.mock('../src/models', () => ({
  StudySession: {
    create: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
  },
  StudySessionRegistration: {
    create: jest.fn(),
    findOne: jest.fn(),
    findByPk: jest.fn(),
  },
  Connection: {
    findAll: jest.fn(),
  },
  Student: {
    findByPk: jest.fn(),
    findOne: jest.fn(),
  },
  AcademicRecord: {
    findAll: jest.fn(),
  },
  User: {},
  Subject: {},
}), { virtual: true });

jest.mock('../src/emailService', () => ({
  sendConfirmationEmail: jest.fn(),
  sendCancellationEmail: jest.fn(),
  sendDeregistrationEmail: jest.fn(),
}));

jest.mock('../src/services/notificationService', () => ({
  createNotification: jest.fn(),
}));

const { StudySession, StudySessionRegistration, Connection, Student, AcademicRecord } = require('../src/models');
const emailService = require('../src/emailService');
const notificationService = require('../src/services/notificationService');

describe('StudySession Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { 
      params: {}, 
      body: {}, 
      query: {}, 
      user: { id: 1 } 
    };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create and return status 201', async () => {
      const futureDate = new Date(Date.now() + 86400000); // Tomorrow
      req.body = { subject_id: 1, title: 'Test Session', type: 'virtual', date_time: futureDate };
      StudySession.create.mockResolvedValue({ id: 1, ...req.body });
      
      await studySessionController.create(req, res);
      
      expect(StudySession.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should return 400 if date_time is in the past', async () => {
      const pastDate = new Date(Date.now() - 86400000); // Yesterday
      req.body = { subject_id: 1, title: 'Test Session', type: 'virtual', date_time: pastDate };
      
      await studySessionController.create(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'La fecha de la sesión no puede ser en el pasado.' });
    });

    it('should return 500 on error', async () => {
      const futureDate = new Date(Date.now() + 86400000); // Tomorrow
      req.body = { subject_id: 1, title: 'Test Session', type: 'virtual', date_time: futureDate };
      StudySession.create.mockRejectedValue(new Error('DB error'));
      await studySessionController.create(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getAll', () => {
    it('should return sessions filtered by connection visibility', async () => {
      Connection.findAll.mockResolvedValue([{ id_user: 1, id_connected_user: 2 }]);
      AcademicRecord.findAll.mockResolvedValue([]);
      StudySession.findAll.mockResolvedValue([
        { id: 10, host_student_id: 2, host: { public_profile: false } },
        { id: 11, host_student_id: 3, host: { public_profile: false } },
        { id: 12, host_student_id: 3, host: { public_profile: true } }
      ]);

      await studySessionController.getAll(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({ id: 10 }), // Contact's session
        expect.objectContaining({ id: 12 })  // Public session
      ]));
      expect(res.json.mock.calls[0][0]).not.toContainEqual(expect.objectContaining({ id: 11 })); // Non-contact private session
    });
  });

  describe('join', () => {
    it('should join and auto-approve if approval_required is false', async () => {
      req.params.id = 1;
      StudySession.findByPk.mockResolvedValue({ 
        id: 1, 
        host_student_id: 2, 
        status: 'abierta',
        approval_required: false 
      });
      StudySessionRegistration.findOne.mockResolvedValue(null);
      StudySessionRegistration.create.mockResolvedValue({ id: 100, status: 'approved' });

      await studySessionController.join(req, res);

      expect(StudySessionRegistration.create).toHaveBeenCalledWith(expect.objectContaining({ status: 'approved' }));
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should create pending registration if approval_required is true', async () => {
      req.params.id = 1;
      StudySession.findByPk.mockResolvedValue({ 
        id: 1, 
        host_student_id: 2, 
        status: 'abierta',
        approval_required: true 
      });
      StudySessionRegistration.findOne.mockResolvedValue(null);
      StudySessionRegistration.create.mockResolvedValue({ id: 100, status: 'pending' });

      await studySessionController.join(req, res);

      expect(StudySessionRegistration.create).toHaveBeenCalledWith(expect.objectContaining({ status: 'pending' }));
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should not allow host to join their own session', async () => {
      req.params.id = 1;
      StudySession.findByPk.mockResolvedValue({ id: 1, host_student_id: 1, status: 'abierta' });
      
      await studySessionController.join(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'El organizador no puede inscribirse en su propia sesión' });
    });
  });

  describe('approveParticipant', () => {
    it('should approve and send email', async () => {
      req.params.id = 1;
      req.params.registrationId = 100;

      StudySession.findByPk.mockResolvedValue({ id: 1, host_student_id: 1, max_slots: null });
      
      const saveMock = jest.fn();
      StudySessionRegistration.findByPk.mockResolvedValue({
        id: 100,
        study_session_id: 1,
        status: 'pending',
        save: saveMock,
        student: { User: { email: 'test@unahur.edu.ar' } }
      });

      await studySessionController.approveParticipant(req, res);

      expect(saveMock).toHaveBeenCalled();
      expect(emailService.sendConfirmationEmail).toHaveBeenCalledWith('test@unahur.edu.ar', expect.any(Object));
      expect(notificationService.createNotification).toHaveBeenCalledWith(expect.objectContaining({
        type: 'success',
        title: 'Inscripcion aprobada',
      }));
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'approved' }));
    });
  });

  describe('removeParticipant', () => {
    it('should remove participant and return status 200', async () => {
      req.params.id = 1;
      req.params.registrationId = 100;

      const studentId = 10;
      Student.findOne.mockResolvedValue({ user_id: studentId });
      StudySession.findByPk.mockResolvedValue({ id: 1, host_student_id: studentId });
      
      const destroyMock = jest.fn();
      StudySessionRegistration.findByPk.mockResolvedValue({
        id: 100,
        study_session_id: 1,
        destroy: destroyMock
      });

      await studySessionController.removeParticipant(req, res);

      expect(destroyMock).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ message: 'Participante eliminado exitosamente.' });
    });

    it('should return 403 if user is not the host', async () => {
      req.params.id = 1;
      req.params.registrationId = 100;

      const studentId = 10;
      const otherHostId = 20;
      Student.findOne.mockResolvedValue({ user_id: studentId });
      StudySession.findByPk.mockResolvedValue({ id: 1, host_student_id: otherHostId });
      
      await studySessionController.removeParticipant(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Solo el organizador puede eliminar participantes.' });
    });
  });

  describe('leave', () => {
    it('should leave session and send deregistration email to host if student was approved', async () => {
      req.params.id = 1;
      req.user.id = 10;

      StudySessionRegistration.findOne.mockResolvedValue({
        study_session_id: 1,
        student_id: 10,
        status: 'approved',
        destroy: jest.fn()
      });

      StudySession.findByPk.mockResolvedValue({
        id: 1,
        host_student_id: 2,
        host: { User: { email: 'host@unahur.edu.ar' } }
      });

      Student.findByPk.mockResolvedValue({
        User: { name: 'Juan', lastname: 'Perez' }
      });

      await studySessionController.leave(req, res);

      expect(emailService.sendDeregistrationEmail).toHaveBeenCalledWith(
        'host@unahur.edu.ar',
        expect.any(Object),
        'Juan Perez'
      );
      expect(notificationService.createNotification).toHaveBeenCalledWith(expect.objectContaining({
        userId: 2,
        title: 'Baja de participante',
      }));
      expect(res.json).toHaveBeenCalledWith({ message: 'Te has dado de baja de la sesión exitosamente' });
    });
  });
});
