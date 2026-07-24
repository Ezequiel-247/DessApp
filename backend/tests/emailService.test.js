const nodemailer = require('nodemailer');

const mockSendMail = jest.fn().mockResolvedValue({ messageId: 'test_id_123' });

jest.mock('nodemailer', () => {
  return {
    createTransport: jest.fn().mockImplementation(() => {
      return {
        sendMail: (options) => mockSendMail(options),
      };
    }),
  };
});

describe('EmailService - Notificaciones de Sesiones de Estudio', () => {
  let emailService;

  beforeAll(() => {
    // Configuramos variables SMTP de prueba para que pase canSendEmails()
    process.env.SMTP_HOST = 'smtp.gmail.com';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_USER = 'test@gmail.com';
    process.env.SMTP_PASS = 'testapppassword';
    process.env.SMTP_FROM = 'NEXO <test@gmail.com>';

    emailService = require('../src/emailService');
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const dummySession = {
    title: 'Álgebra Avanzada',
    date_time: new Date('2026-10-10T15:00:00Z').toISOString(),
    type: 'virtual',
    meeting_link: 'https://meet.google.com/abc-defg-hij',
    location: null
  };

  test('sendConfirmationEmail debería enviar un email con la plantilla y detalles correctos', async () => {
    const result = await emailService.sendConfirmationEmail('alumno@test.com', dummySession);

    expect(mockSendMail).toHaveBeenCalledTimes(1);
    expect(result.sent).toBe(true);

    const callArgs = mockSendMail.mock.calls[0][0];
    expect(callArgs.to).toEqual('alumno@test.com');
    expect(callArgs.subject).toContain('Inscripción Confirmada: Álgebra Avanzada');
    expect(callArgs.html).toContain('¡Inscripción Confirmada!');
    expect(callArgs.html).toContain('Álgebra Avanzada');
    expect(callArgs.html).toContain('Virtual');
    expect(callArgs.html).toContain('https://meet.google.com/abc-defg-hij');
    expect(callArgs.html).toContain('NEXO');
  });

  test('sendCancellationEmail debería enviar un email notificando la cancelación', async () => {
    const result = await emailService.sendCancellationEmail('alumno@test.com', dummySession);

    expect(mockSendMail).toHaveBeenCalledTimes(1);
    expect(result.sent).toBe(true);

    const callArgs = mockSendMail.mock.calls[0][0];
    expect(callArgs.to).toEqual('alumno@test.com');
    expect(callArgs.subject).toContain('Sesión Cancelada: Álgebra Avanzada');
    expect(callArgs.html).toContain('Sesión Cancelada');
    expect(callArgs.html).toContain('cancelada');
    expect(callArgs.html).toContain('NEXO');
  });

  test('sendReminderEmail debería enviar un email de recordatorio con la modalidad y fecha formateadas', async () => {
    const result = await emailService.sendReminderEmail('alumno@test.com', dummySession);

    expect(mockSendMail).toHaveBeenCalledTimes(1);
    expect(result.sent).toBe(true);

    const callArgs = mockSendMail.mock.calls[0][0];
    expect(callArgs.to).toEqual('alumno@test.com');
    expect(callArgs.subject).toContain('Recordatorio: Álgebra Avanzada es mañana');
    expect(callArgs.html).toContain('Recordatorio de Sesión');
    expect(callArgs.html).toContain('mañana');
    expect(callArgs.html).toContain('NEXO');
  });
});
