const { Vote } = require('../models');
const { seedRows } = require('./helpers');

const materialVoteTemplates = [
  { material_index: 0, student_index: 1, is_upvote: true },
  { material_index: 1, student_index: 2, is_upvote: true },
  { material_index: 2, student_index: 3, is_upvote: true },
  { material_index: 3, student_index: 4, is_upvote: true },
  { material_index: 4, student_index: 5, is_upvote: true },
  { material_index: 5, student_index: 6, is_upvote: true },
  { material_index: 6, student_index: 7, is_upvote: true },
  { material_index: 7, student_index: 8, is_upvote: true },
  { material_index: 8, student_index: 9, is_upvote: true },
  { material_index: 9, student_index: 0, is_upvote: true },
  { material_index: 0, student_index: 0, is_upvote: true },
  { material_index: 1, student_index: 0, is_upvote: false },
  { material_index: 2, student_index: 0, is_upvote: true },
  { material_index: 2, student_index: 4, is_upvote: false },
  { material_index: 3, student_index: 5, is_upvote: false },
  { material_index: 4, student_index: 6, is_upvote: false },
  { material_index: 0, student_index: 7, is_upvote: false },
  { material_index: 1, student_index: 8, is_upvote: false },
];

const postVoteTemplates = [
  { post_index: 0, student_index: 1, is_upvote: true },
  { post_index: 1, student_index: 2, is_upvote: true },
  { post_index: 2, student_index: 3, is_upvote: true },
  { post_index: 0, student_index: 4, is_upvote: false },
  { post_index: 1, student_index: 5, is_upvote: false },
];

const commentVoteTemplates = [
  { comment_index: 0, student_index: 2, is_upvote: true },
  { comment_index: 1, student_index: 3, is_upvote: true },
  { comment_index: 2, student_index: 4, is_upvote: true },
  { comment_index: 0, student_index: 5, is_upvote: false },
  { comment_index: 3, student_index: 6, is_upvote: false },
  { comment_index: 1, student_index: 7, is_upvote: false },
];

async function seedMaterialVotes(materials, students, transaction) {
  const materialRows = materialVoteTemplates.map((vote) => ({
    target_type: 'material',
    target_id: materials[vote.material_index].id,
    id_student: students[vote.student_index].user_id,
    is_upvote: vote.is_upvote,
  }));

  return seedRows(Vote, materialRows, ['target_type', 'target_id', 'id_student'], transaction);
}

async function seedPostVotes(posts, students, transaction) {
  const postRows = postVoteTemplates.map((vote) => ({
    target_type: 'post',
    target_id: posts[vote.post_index].id,
    id_student: students[vote.student_index].user_id,
    is_upvote: vote.is_upvote,
  }));

  return seedRows(Vote, postRows, ['target_type', 'target_id', 'id_student'], transaction);
}

async function seedCommentVotes(comments, students, transaction) {
  const commentRows = commentVoteTemplates.map((vote) => ({
    target_type: 'comment',
    target_id: comments[vote.comment_index].id,
    id_student: students[vote.student_index].user_id,
    is_upvote: vote.is_upvote,
  }));

  return seedRows(Vote, commentRows, ['target_type', 'target_id', 'id_student'], transaction);
}

module.exports = seedMaterialVotes;
module.exports.seedPostVotes = seedPostVotes;
module.exports.seedCommentVotes = seedCommentVotes;
