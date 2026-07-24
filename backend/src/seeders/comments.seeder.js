const { Comment } = require('../models');
const { seedRows } = require('./helpers');

const commentTemplates = [
  { target_type: 'post', target_index: 0, author_index: 1, content: 'Bienvenido! Cualquier cosa avisame.' },
  { target_type: 'post', target_index: 0, author_index: 2, content: 'Gracias por compartir, me sirve para arrancar.' },
  { target_type: 'post', target_index: 0, author_index: 3, content: 'Si armas grupo de estudio me sumo.' },
  { target_type: 'post', target_index: 1, author_index: 0, content: 'Yo estoy buscando grupo para esa materia tambien.' },
  { target_type: 'post', target_index: 2, author_index: 4, content: 'Me pasas el link cuando puedas?' },
];

const extraCommentTemplates = [
  {
    target_type: 'post',
    post_title: 'Student6 - Primer año TUP y finales pendientes',
    post_author_index: 5,
    author_index: 4,
    content: 'Vamos con esos finales! Si queres, armamos una sesion de repaso para 793.',
  },
  {
    target_type: 'post',
    post_title: 'Student7 - Doble carrera TUP + Ambiente',
    post_author_index: 6,
    author_index: 7,
    content: 'Buenisimo ese avance. Si queres te comparto apuntes para organizar doble cursada.',
  },
];

function buildPostKey(idAuthor, title) {
  return `${idAuthor}:${title}`;
}

async function seedComments(posts, students, transaction) {
  const rows = commentTemplates
    .map((comment, index) => {
      const target = posts[comment.target_index];
      if (!target) return null;

      const student = students[comment.author_index % students.length];

      return {
        target_type: comment.target_type,
        target_id: target.id,
        id_author: student.user_id,
        content: comment.content,
        created_at: new Date(Date.now() - index * 10 * 60 * 1000),
      };
    })
    .filter(Boolean);

  const postsByAuthorAndTitle = new Map(
    posts.map((post) => [buildPostKey(post.id_author, post.title), post])
  );

  extraCommentTemplates.forEach((comment, index) => {
    const postAuthor = students[comment.post_author_index];
    const commentAuthor = students[comment.author_index];
    if (!postAuthor || !commentAuthor) {
      return;
    }

    const target = postsByAuthorAndTitle.get(buildPostKey(postAuthor.user_id, comment.post_title));
    if (!target) {
      return;
    }

    rows.push({
      target_type: comment.target_type,
      target_id: target.id,
      id_author: commentAuthor.user_id,
      content: comment.content,
      created_at: new Date(Date.now() - (rows.length + index) * 8 * 60 * 1000),
    });
  });

  return seedRows(Comment, rows, ['target_type', 'target_id', 'id_author', 'content'], transaction);
}

module.exports = seedComments;
