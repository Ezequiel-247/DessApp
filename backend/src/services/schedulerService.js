const { Op } = require('sequelize');
const { StudySession, StudySessionRegistration, Student, User, AcademicRecord, Subject, Notification } = require('../models');
const emailService = require('../emailService');
const notificationService = require('./notificationService');

class SchedulerService {
  constructor() {
    this.intervalId = null;
  }

  start() {
    console.log('Starting Scheduler Service...');
    // Run immediately on start
    this.checkUpcomingSessions();
    this.checkExpiringRegularities();
    // Then every 1 hour
    this.intervalId = setInterval(() => {
      this.checkUpcomingSessions();
      this.checkExpiringRegularities();
    }, 60 * 60 * 1000);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('Scheduler Service stopped.');
    }
  }

  async checkUpcomingSessions() {
    try {
      const now = new Date();
      // Look for sessions starting between 23 and 24.5 hours from now to be safe with intervals
      const in23Hours = new Date(now.getTime() + 23 * 60 * 60 * 1000);
      const in24_5Hours = new Date(now.getTime() + 24.5 * 60 * 60 * 1000);

      const upcomingSessions = await StudySession.findAll({
        where: {
          status: 'abierta',
          reminder_sent: false,
          date_time: {
            [Op.between]: [in23Hours, in24_5Hours]
          }
        },
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
                include: [{ model: User }]
              }
            ]
          }
        ]
      });

      for (const session of upcomingSessions) {
        if (session.registrations && session.registrations.length > 0) {
          for (const reg of session.registrations) {
            const email = reg.student?.User?.email;
            if (email) {
              await emailService.sendReminderEmail(email, session);
            }

            const studentUserId = reg.student?.user_id;
            if (studentUserId) {
              await notificationService.createNotification({
                userId: studentUserId,
                type: 'info',
                title: 'Recordatorio de sesion',
                message: `Recordatorio: la sesion "${session.title}" es manana.`,
              });
            }
          }
        }
        
        session.reminder_sent = true;
        await session.save();
        console.log(`Reminder sent for session ${session.id}`);
      }
    } catch (error) {
      console.error('Error checking upcoming sessions:', error);
    }
  }

  async checkExpiringRegularities() {
    try {
      const today = new Date();
      const in15Days = new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000);

      const expiringRecords = await AcademicRecord.findAll({
        where: {
          status: 'pendiente',
          regularity_expires_at: {
            [Op.between]: [today, in15Days],
          },
        },
        include: [{ model: Subject, attributes: ['name'], required: false }],
      });

      for (const record of expiringRecords) {
        const subjectName = record.Subject?.name || 'una materia';
        const expiresAt = new Date(record.regularity_expires_at).toISOString().slice(0, 10);
        const title = 'Regularidad proxima a vencer';
        const message = `Tu regularidad de ${subjectName} vence el ${expiresAt}.`;

        const existing = await Notification.findOne({
          where: {
            id_user: record.id_student,
            type: 'warning',
            title,
            message,
          },
        });

        if (existing) {
          continue;
        }

        await notificationService.createNotification({
          userId: record.id_student,
          type: 'warning',
          title,
          message,
        });
      }
    } catch (error) {
      console.error('Error checking expiring regularities:', error);
    }
  }
}

module.exports = new SchedulerService();
