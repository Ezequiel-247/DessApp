const { Post } = require('../models');
const { seedRows } = require('./helpers');

const postTemplates = [
  { title: 'Mi primer post', content: 'Hola a todos, soy nuevo en la plataforma' },
  { title: 'Busco grupo de estudio', content: 'Alguien para formar grupo de estudio para Matematica I?' },
  { title: 'Resumen de parcial', content: 'Subi un resumen del primer parcial. Si quieren, lo comparto por material.' },
  { title: 'Duda de correlativas', content: 'Alguien sabe si para cursar Arquitectura alcanza con regularizar Matematica I?' },
  { title: 'Apunte actualizado', content: 'Actualice los apuntes con ejercicios resueltos y una guia corta para repasar.' },
  { title: 'Consulta final', content: 'Estoy preparando final de Programacion I, si quieren armamos simulacro esta semana.' },
  { title: 'Convocatoria para proyecto', content: 'Busco companeros para avanzar con una mini app y practicar arquitectura.' },
  { title: 'Tips de organizacion', content: 'Comparto como arme mi semana para balancear cursada, trabajo y estudio.' },
  { title: 'Recomendacion de material', content: 'Subi un video y un link con recursos que me ayudaron para el ultimo parcial.' },
  { title: 'Cierre de semana', content: 'Como les fue en los examenes? Podemos armar hilo de feedback y mejoras.' },
];

const extraPostTemplates = [
  {
    student_index: 5,
    title: 'Student6 - Primer año TUP y finales pendientes',
    content: 'Cerre primer año de TUP y estoy preparando los finales pendientes de Matematica para Informatica II e Ingles I.',
  },
  {
    student_index: 6,
    title: 'Student7 - Doble carrera TUP + Ambiente',
    content: 'Estoy con doble cursada: termine primer año de TUP y avance en Quimica General de Ingenieria Ambiental.',
  },
];

async function seedPosts(students, transaction) {
  const rows = [];

  students.forEach((student, studentIndex) => {
    postTemplates.forEach((post, templateIndex) => {
      if ((studentIndex + templateIndex) % 2 === 0 || templateIndex < 4) {
        rows.push({
          id_author: student.user_id,
          title: `${post.title} - Estudiante ${studentIndex + 1}`,
          content: post.content,
          created_at: new Date(Date.now() - (studentIndex * postTemplates.length + templateIndex) * 60 * 60 * 1000),
        });
      }
    });
  });

  extraPostTemplates.forEach((post, templateIndex) => {
    const student = students[post.student_index];
    if (!student) {
      return;
    }

    rows.push({
      id_author: student.user_id,
      title: post.title,
      content: post.content,
      created_at: new Date(Date.now() - templateIndex * 5 * 60 * 1000),
    });
  });

  return seedRows(Post, rows, ['id_author', 'title'], transaction);
}

module.exports = seedPosts;
