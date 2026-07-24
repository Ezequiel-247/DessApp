const { Notification } = require('../models');
const { seedRows } = require('./helpers');

const notificationTemplates = [
  {
    type: 'info',
    title: 'Novedades del dia',
    message: 'Hay nuevas actividades y recursos en tus materias activas',
    read: false,
  },
  {
    type: 'success',
    title: 'Avance academico registrado',
    message: 'Se actualizo tu progreso con una nueva regularidad',
    read: false,
  },
  {
    type: 'warning',
    title: 'Recordatorio de vencimiento',
    message: 'Tenes una entrega o evento academico proximo a vencer',
    read: true,
  },
  {
    type: 'error',
    title: 'Accion pendiente',
    message: 'Una gestion quedo incompleta y requiere tu revision',
    read: true,
  },
];

const relationshipNotifications = [
  {
    user_index: 6,
    type: 'connection_response',
    title: 'Conexion aceptada - Student7',
    message: 'Federico acepto tu invitacion de conexion. Ya pueden interactuar en el feed.',
    read: false,
  },
  {
    user_index: 6,
    type: 'connection_post',
    title: 'Nuevo posteo de tu conexion',
    message: 'Federico publico una novedad sobre su cursada en TUP y Ambiente.',
    read: false,
  },
  {
    user_index: 6,
    type: 'post_comment',
    title: 'Comentario en tu post',
    message: 'Un contacto comento en tu publicacion.',
    read: false,
  },
  {
    user_index: 7,
    type: 'connection_response',
    title: 'Conexion aceptada - Student6',
    message: 'Valentina acepto tu invitacion de conexion. Ya pueden interactuar en el feed.',
    read: false,
  },
  {
    user_index: 7,
    type: 'connection_post',
    title: 'Nuevo posteo de tu conexion',
    message: 'Valentina publico una novedad sobre finales pendientes de primer año.',
    read: false,
  },
  {
    user_index: 7,
    type: 'post_comment',
    title: 'Comentario en tu post',
    message: 'Un contacto comento en tu publicacion.',
    read: false,
  },
];

async function seedNotifications(users, transaction) {
  const rows = [];

  users.forEach((user, userIndex) => {
    notificationTemplates.forEach((template, templateIndex) => {
      rows.push({
        id_user: user.id,
        type: template.type,
        title: `${template.title} #${templateIndex + 1} - Usuario ${userIndex + 1}`,
        message: template.message,
        read: template.read,
      });
    });
  });

  relationshipNotifications.forEach((notification) => {
    const user = users[notification.user_index];
    if (!user) {
      return;
    }

    rows.push({
      id_user: user.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      read: notification.read,
    });
  });

  return seedRows(Notification, rows, ['id_user', 'title'], transaction);
}

module.exports = seedNotifications;
