const { Op } = require('sequelize');
const { StudySession, StudySessionRegistration, Student, Subject, Connection, User, AcademicRecord } = require('../models');
const emailService = require('../emailService');
const notificationService = require('../services/notificationService');

exports.create = async (req, res) => {
  try {
    const student_id = req.user.id;
    const {
      subject_id, title, description, type, meeting_link, location,
      date_time, duration_hours, duration_minutes, max_slots, approval_required
    } = req.body;

    if (!date_time || new Date(date_time) <= new Date()) {
      return res.status(400).json({ error: 'La fecha de la sesión no puede ser en el pasado.' });
    }

    const session = await StudySession.create({
      host_student_id: student_id,
      subject_id,
      title,
      description,
      type,
      meeting_link: type === 'virtual' ? meeting_link : null,
      location: type === 'presencial' ? location : null,
      date_time,
      duration_hours,
      duration_minutes,
      max_slots,
      approval_required: approval_required || false,
      status: 'abierta'
    });

    res.status(201).json(session);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear la sesión de estudio.' });
  }
};

exports.getAll = async (req, res) => {
  try {
    const userId = req.user.id;
    const { subject_id, query, type } = req.query; // additional filters

    // 1. Get connections for visibility
    const connections = await Connection.findAll({
      where: {
        status: 'accepted',
        [Op.or]: [
          { id_user: userId },
          { id_connected_user: userId }
        ]
      }
    });

    const contactIds = connections.map(c => 
      c.id_user === userId ? c.id_connected_user : c.id_user
    );
    contactIds.push(userId); // the user can see their own sessions

    // Build filters
    const whereClause = {
      status: 'abierta'
    };

    if (subject_id) {
      whereClause.subject_id = subject_id;
    }
    if (type) {
      whereClause.type = type;
    }
    if (query) {
      whereClause.title = { [Op.iLike]: `%${query}%` };
    }

    // Si no hay filtro de materia explícito, filtrar por materias que el estudiante tiene registros académicos
    if (!subject_id) {
      const records = await AcademicRecord.findAll({
        where: { id_student: userId },
        attributes: ['id_subject'],
      });
      const subjectIds = [...new Set(records.map((r) => r.id_subject).filter(Boolean))];
      if (subjectIds.length > 0) {
        whereClause.subject_id = { [Op.in]: subjectIds };
      }
    }

    const sessions = await StudySession.findAll({
      where: whereClause,
      order: [['date_time', 'ASC']],
      include: [
        {
          model: Student,
          as: 'host',
          include: [{ model: User, attributes: ['id', 'name', 'lastname'] }]
        },
        {
          model: Subject,
          as: 'subject'
        },
        {
          model: StudySessionRegistration,
          as: 'registrations',
          required: false,
          include: [
            {
              model: Student,
              as: 'student',
              include: [{ model: User, attributes: ['id', 'name', 'lastname'] }]
            }
          ]
        }
      ]
    });

    // Filter by visibility: If host has public_profile = false, only their contacts can see it
    const visibleSessions = sessions.filter(session => {
      const hostIsPublic = session.host ? session.host.public_profile : false;
      const hostId = session.host_student_id;
      return hostIsPublic || contactIds.includes(hostId);
    });

    res.json(visibleSessions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al recuperar las sesiones.' });
  }
};

exports.getById = async (req, res) => {
  try {
    const session = await StudySession.findByPk(req.params.id, {
      include: [
        {
          model: Student,
          as: 'host',
          include: [{ model: User, attributes: ['id', 'name', 'lastname'] }]
        },
        {
          model: Subject,
          as: 'subject'
        },
        {
          model: StudySessionRegistration,
          as: 'registrations',
          include: [
            {
              model: Student,
              as: 'student',
              include: [{ model: User, attributes: ['id', 'name', 'lastname', 'email'] }]
            }
          ]
        }
      ]
    });

    if (!session) {
      return res.status(404).json({ error: 'Sesión no encontrada' });
    }

    res.json(session);
  } catch (error) {
    res.status(500).json({ error: 'Error al recuperar la sesión.' });
  }
};

exports.update = async (req, res) => {
  try {
    const userId = req.user.id;
    const session = await StudySession.findByPk(req.params.id);

    if (!session) {
      return res.status(404).json({ error: 'Sesión no encontrada' });
    }

    if (session.host_student_id !== userId) {
      return res.status(403).json({ error: 'No tienes permisos para editar esta sesión.' });
    }

    const {
      subject_id, title, description, type, meeting_link, location,
      date_time, duration_hours, duration_minutes, max_slots, approval_required
    } = req.body;

    await session.update({
      subject_id, title, description, type,
      meeting_link: type === 'virtual' ? meeting_link : null,
      location: type === 'presencial' ? location : null,
      date_time, duration_hours, duration_minutes, max_slots, approval_required
    });

    res.json(session);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar la sesión.' });
  }
};

exports.cancel = async (req, res) => {
  try {
    const userId = req.user.id;
    const session = await StudySession.findByPk(req.params.id, {
      include: [
        {
          model: StudySessionRegistration,
          as: 'registrations',
          where: { status: 'approved' },
          required: false,
          include: [
            {
              model: Student,
              as: 'student',
              include: [{ model: User, attributes: ['email'] }]
            }
          ]
        }
      ]
    });

    if (!session) {
      return res.status(404).json({ error: 'Sesión no encontrada' });
    }

    if (session.host_student_id !== userId) {
      return res.status(403).json({ error: 'No tienes permisos para cancelar esta sesión.' });
    }

    session.status = 'cancelada';
    await session.save();

    // Notify approved participants
    if (session.registrations && session.registrations.length > 0) {
      for (const reg of session.registrations) {
        if (reg.student && reg.student.User && reg.student.User.email) {
          Promise.resolve(emailService.sendCancellationEmail(reg.student.User.email, session))
            .catch(err => console.error('Error al enviar email de cancelación:', err));

          Promise.resolve(notificationService.createNotification({
            userId: reg.student.user_id,
            type: 'warning',
            title: 'Sesion de estudio cancelada',
            message: `La sesion "${session.title}" fue cancelada por el organizador.`,
          }))
            .catch(err => console.error('Error al crear notificación de cancelación:', err));
        }
      }
    }

    res.json({ message: 'Sesión cancelada exitosamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al cancelar la sesión.' });
  }
};

exports.join = async (req, res) => {
  try {
    const userId = req.user.id;
    const sessionId = req.params.id;

    const session = await StudySession.findByPk(sessionId, {
      include: [{ model: StudySessionRegistration, as: 'registrations', where: { status: 'approved' }, required: false }]
    });

    if (!session) {
      return res.status(404).json({ error: 'Sesión no encontrada' });
    }

    if (session.status !== 'abierta') {
      return res.status(400).json({ error: 'La sesión no está abierta' });
    }

    if (session.host_student_id === userId) {
      return res.status(400).json({ error: 'El organizador no puede inscribirse en su propia sesión' });
    }

    const existingRegistration = await StudySessionRegistration.findOne({
      where: { study_session_id: sessionId, student_id: userId }
    });

    if (existingRegistration) {
      return res.status(400).json({ error: 'Ya estás inscrito o tienes una solicitud pendiente' });
    }

    // Check max_slots
    if (session.max_slots) {
      const approvedCount = session.registrations ? session.registrations.length : 0;
      if (approvedCount >= session.max_slots) {
        return res.status(400).json({ error: 'No hay cupos disponibles' });
      }
    }

    const newStatus = session.approval_required ? 'pending' : 'approved';
    const reg = await StudySessionRegistration.create({
      study_session_id: sessionId,
      student_id: userId,
      status: newStatus
    });

    if (newStatus === 'approved') {
      const student = await Student.findByPk(userId, { include: [User] });
      if (student && student.User && student.User.email) {
        Promise.resolve(emailService.sendConfirmationEmail(student.User.email, session))
          .catch(err => console.error('Error al enviar email de confirmación:', err));

        Promise.resolve(notificationService.createNotification({
          userId,
          type: 'success',
          title: 'Inscripcion confirmada',
          message: `Tu inscripcion a la sesion "${session.title}" fue confirmada.`,
        }))
          .catch(err => console.error('Error al crear notificación de inscripción:', err));
      }
    }

    res.status(201).json(reg);
  } catch (error) {
    res.status(500).json({ error: 'Error al inscribirse a la sesión.' });
  }
};

exports.leave = async (req, res) => {
  try {
    const userId = req.user.id;
    const sessionId = req.params.id;

    const reg = await StudySessionRegistration.findOne({
      where: { study_session_id: sessionId, student_id: userId }
    });

    if (!reg) {
      return res.status(404).json({ error: 'No tienes una inscripción en esta sesión' });
    }

    const session = await StudySession.findByPk(sessionId, {
      include: [{
        model: Student,
        as: 'host',
        include: [{ model: User, attributes: ['email'] }]
      }]
    });

    const leavingStudent = await Student.findByPk(userId, { include: [User] });
    const wasApproved = reg.status === 'approved';

    await reg.destroy();

    if (wasApproved && session && session.host && session.host.User && session.host.User.email) {
      const studentName = leavingStudent && leavingStudent.User ? `${leavingStudent.User.name} ${leavingStudent.User.lastname}` : 'Un estudiante';
      Promise.resolve(emailService.sendDeregistrationEmail(session.host.User.email, session, studentName))
        .catch(err => console.error('Error al enviar email de baja:', err));

      Promise.resolve(notificationService.createNotification({
        userId: session.host_student_id,
        type: 'info',
        title: 'Baja de participante',
        message: `${studentName} se dio de baja de tu sesion "${session.title}".`,
      }))
        .catch(err => console.error('Error al crear notificación de baja:', err));
    }

    res.json({ message: 'Te has dado de baja de la sesión exitosamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al darse de baja de la sesión.' });
  }
};

exports.approveParticipant = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id: sessionId, registrationId } = req.params;

    const session = await StudySession.findByPk(sessionId, {
      include: [{ model: StudySessionRegistration, as: 'registrations', where: { status: 'approved' }, required: false }]
    });

    if (!session) {
      return res.status(404).json({ error: 'Sesión no encontrada' });
    }

    if (session.host_student_id !== userId) {
      return res.status(403).json({ error: 'No tienes permisos para aprobar participantes' });
    }

    const reg = await StudySessionRegistration.findByPk(registrationId, {
      include: [
        {
          model: Student,
          as: 'student',
          include: [{ model: User }]
        }
      ]
    });

    if (!reg || reg.study_session_id !== parseInt(sessionId)) {
      return res.status(404).json({ error: 'Inscripción no encontrada' });
    }

    if (session.max_slots) {
      const approvedCount = session.registrations ? session.registrations.length : 0;
      if (approvedCount >= session.max_slots) {
        return res.status(400).json({ error: 'No hay cupos disponibles para aprobar' });
      }
    }

    reg.status = 'approved';
    await reg.save();

    if (reg.student && reg.student.User && reg.student.User.email) {
      Promise.resolve(emailService.sendConfirmationEmail(reg.student.User.email, session))
        .catch(err => console.error('Error al enviar email de confirmación:', err));

      Promise.resolve(notificationService.createNotification({
        userId: reg.student.user_id,
        type: 'success',
        title: 'Inscripcion aprobada',
        message: `Tu solicitud para la sesion "${session.title}" fue aprobada.`,
      }))
        .catch(err => console.error('Error al crear notificación de aprobación:', err));
    }

    res.json(reg);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al aprobar al participante.' });
  }
};

exports.rejectParticipant = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id: sessionId, registrationId } = req.params;

    const session = await StudySession.findByPk(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Sesión no encontrada' });
    }

    if (session.host_student_id !== userId) {
      return res.status(403).json({ error: 'No tienes permisos' });
    }

    const reg = await StudySessionRegistration.findByPk(registrationId);

    if (!reg || reg.study_session_id !== parseInt(sessionId)) {
      return res.status(404).json({ error: 'Inscripción no encontrada' });
    }

    reg.status = 'rejected';
    await reg.save();

    res.json(reg);
  } catch (error) {
    res.status(500).json({ error: 'Error al rechazar al participante.' });
  }
};

exports.removeParticipant = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id: sessionId, registrationId } = req.params;

    const session = await StudySession.findByPk(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Sesión no encontrada' });
    }

    const student = await Student.findOne({ where: { user_id: userId } });
    if (!student) {
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    }

    if (session.host_student_id !== student.user_id) {
      return res.status(403).json({ error: 'Solo el organizador puede eliminar participantes.' });
    }

    const reg = await StudySessionRegistration.findByPk(registrationId);

    if (!reg || reg.study_session_id !== parseInt(sessionId)) {
      return res.status(404).json({ error: 'Inscripción no encontrada' });
    }

    await reg.destroy();

    res.json({ message: 'Participante eliminado exitosamente.' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar al participante.' });
  }
};

