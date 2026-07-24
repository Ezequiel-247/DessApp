const nodemailer = require('nodemailer');

let transporter;

function getFrontendBaseUrl() {
  return process.env.FRONTEND_URL || 'http://localhost:3000';
}

function canSendEmails() {
  return Boolean(
    process.env.SMTP_HOST
      && process.env.SMTP_PORT
      && process.env.SMTP_USER
      && process.env.SMTP_PASS
      && process.env.SMTP_FROM
  );
}

function getTransporter() {
  if (transporter) {
    return transporter;
  }

  if (!canSendEmails()) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
}

async function sendMail(mailOptions) {
  const mailTransporter = getTransporter();

  if (!mailTransporter) {
    console.warn('SMTP no configurado. Se omite envio de email.');
    return { sent: false, skipped: true };
  }

  await mailTransporter.sendMail({
    from: process.env.SMTP_FROM,
    ...mailOptions,
  });

  return { sent: true, skipped: false };
}

function buildInvitationLink(invitationToken) {
  const baseUrl = getFrontendBaseUrl().replace(/\/$/, '');
  return `${baseUrl}/invitations/${invitationToken}`;
}

async function sendConnectionInvitationEmail({
  to,
  inviterName,
  invitationToken,
}) {
  const invitationLink = buildInvitationLink(invitationToken);
  const safeInviterName = inviterName || 'Un estudiante';

  return sendMail({
    to,
    subject: `${safeInviterName} te invito a conectar en DesApp`,
    text: [
      `Hola,`,
      '',
      `${safeInviterName} te envio una invitacion para conectar en DesApp.`,
      'Para aceptar o rechazar la invitacion, abre este link:',
      invitationLink,
      '',
      'Si no esperabas esta invitacion, puedes ignorar este email.',
    ].join('\n'),
    html: `
      <p>Hola,</p>
      <p><strong>${safeInviterName}</strong> te envio una invitacion para conectar en DesApp.</p>
      <p>Para aceptar o rechazar la invitacion, haz clic en este link:</p>
      <p><a href="${invitationLink}">${invitationLink}</a></p>
      <p>Si no esperabas esta invitacion, puedes ignorar este email.</p>
    `,
  });
}

async function sendInviteeNotRegisteredEmail({
  to,
  inviterName,
  targetEmail,
}) {
  const safeInviterName = inviterName || 'Hola';

  return sendMail({
    to,
    subject: 'No se pudo enviar la invitacion de conexion',
    text: [
      `${safeInviterName},`,
      '',
      `No pudimos enviar la invitacion porque ${targetEmail} no corresponde a un usuario registrado en DesApp.`,
      'Verifica la direccion o invitalo a registrarse primero.',
    ].join('\n'),
    html: `
      <p>${safeInviterName},</p>
      <p>No pudimos enviar la invitacion porque <strong>${targetEmail}</strong> no corresponde a un usuario registrado en DesApp.</p>
      <p>Verifica la direccion o invitalo a registrarse primero.</p>
    `,
  });
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString('es-AR', {
    weekday: 'long', year: 'numeric', month: 'long',
    day: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

function getBaseTemplate(title, content) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5; margin: 0; padding: 40px 0; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%); padding: 30px 20px; text-align: center; color: white; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
        .content { padding: 30px; color: #374151; line-height: 1.6; }
        .footer { background-color: #f9fafb; padding: 20px; text-align: center; font-size: 14px; color: #6b7280; border-top: 1px solid #e5e7eb; }
        .highlight { font-weight: 600; color: #111827; }
        .detail-box { background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .detail-row { margin-bottom: 8px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${title}</h1>
        </div>
        <div class="content">
          ${content}
        </div>
        <div class="footer">
          NEXO
        </div>
      </div>
    </body>
    </html>
  `;
}

async function sendConfirmationEmail(studentEmail, sessionDetails) {
  const dateStr = formatDate(sessionDetails.date_time);
  const isVirtual = sessionDetails.type === 'virtual';
  const modality = isVirtual ? 'Virtual' : 'Presencial';
  const locationStr = isVirtual 
    ? (sessionDetails.meeting_link || 'Enlace pendiente') 
    : (sessionDetails.location || 'Lugar pendiente');

  const content = `
    <p>Hola,</p>
    <p>Tu inscripción a la sesión de estudio ha sido confirmada. Aquí tienes los detalles:</p>
    <div class="detail-box">
      <div class="detail-row"><span class="highlight">Tema:</span> ${sessionDetails.title}</div>
      <div class="detail-row"><span class="highlight">Fecha y Hora:</span> ${dateStr}</div>
      <div class="detail-row"><span class="highlight">Modalidad:</span> ${modality}</div>
      <div class="detail-row"><span class="highlight">Lugar/Enlace:</span> ${locationStr}</div>
    </div>
    <p>¡Te esperamos!</p>
  `;

  const html = getBaseTemplate('¡Inscripción Confirmada!', content);
  return sendMail({
    to: studentEmail,
    subject: `Inscripción Confirmada: ${sessionDetails.title}`,
    html: html
  });
}

async function sendCancellationEmail(studentEmail, sessionDetails) {
  const content = `
    <p>Hola,</p>
    <p>Te informamos que la sesión de estudio a la que estabas inscripto ha sido <strong>cancelada</strong> por el organizador.</p>
    <div class="detail-box">
      <div class="detail-row"><span class="highlight">Tema:</span> ${sessionDetails.title}</div>
    </div>
    <p>Lamentamos los inconvenientes. Puedes buscar otras sesiones disponibles en la plataforma.</p>
  `;

  const html = getBaseTemplate('Sesión Cancelada', content);
  return sendMail({
    to: studentEmail,
    subject: `Sesión Cancelada: ${sessionDetails.title}`,
    html: html
  });
}

async function sendReminderEmail(studentEmail, sessionDetails) {
  const dateStr = formatDate(sessionDetails.date_time);
  const isVirtual = sessionDetails.type === 'virtual';
  const modality = isVirtual ? 'Virtual' : 'Presencial';
  const locationStr = isVirtual 
    ? (sessionDetails.meeting_link || 'Enlace pendiente') 
    : (sessionDetails.location || 'Lugar pendiente');

  const content = `
    <p>Hola,</p>
    <p>Este es un recordatorio de que tienes una sesión de estudio programada para mañana.</p>
    <div class="detail-box">
      <div class="detail-row"><span class="highlight">Tema:</span> ${sessionDetails.title}</div>
      <div class="detail-row"><span class="highlight">Fecha y Hora:</span> ${dateStr}</div>
      <div class="detail-row"><span class="highlight">Modalidad:</span> ${modality}</div>
      <div class="detail-row"><span class="highlight">Lugar/Enlace:</span> ${locationStr}</div>
    </div>
    <p>No olvides conectarte a tiempo y tener tus materiales preparados. ¡Éxitos!</p>
  `;

  const html = getBaseTemplate('Recordatorio de Sesión', content);
  return sendMail({
    to: studentEmail,
    subject: `Recordatorio: ${sessionDetails.title} es mañana`,
    html: html
  });
}

async function sendDeregistrationEmail(hostEmail, sessionDetails, studentName) {
  const dateStr = formatDate(sessionDetails.date_time);
  const content = `
    <p>Hola,</p>
    <p>Te informamos que el estudiante <strong>${studentName}</strong> se ha dado de baja de tu sesión de estudio:</p>
    <div class="detail-box">
      <div class="detail-row"><span class="highlight">Tema:</span> ${sessionDetails.title}</div>
      <div class="detail-row"><span class="highlight">Fecha y Hora:</span> ${dateStr}</div>
    </div>
    <p>El cupo liberado ya está disponible para otros estudiantes.</p>
  `;

  const html = getBaseTemplate('Baja de Participante', content);
  return sendMail({
    to: hostEmail,
    subject: `Baja de participante: ${sessionDetails.title}`,
    html: html
  });
}

module.exports = {
  sendMail,
  buildInvitationLink,
  sendConnectionInvitationEmail,
  sendInviteeNotRegisteredEmail,
  sendConfirmationEmail,
  sendCancellationEmail,
  sendReminderEmail,
  sendDeregistrationEmail,
};

