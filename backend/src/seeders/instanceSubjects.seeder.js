const { InstanceSubject } = require('../models');
const { seedRows } = require('./helpers');

const instanceSubjectTemplates = [
  { subject_index: 0, comision: 1, professor: 'Prof. Gómez', schedule: '[{"day":"Lunes","start":"18:00"},{"day":"Miércoles","start":"18:00"}]', classroom: 'Aula 101', term: 1 },
  { subject_index: 1, comision: 1, professor: 'Prof. Pérez', schedule: '[{"day":"Martes","start":"18:00"},{"day":"Jueves","start":"18:00"}]', classroom: 'Aula 102', term: 1 },
  { subject_index: 2, comision: 1, professor: 'Prof. Díaz', schedule: '[{"day":"Lunes","start":"20:00"},{"day":"Viernes","start":"18:00"}]', classroom: 'Aula 103', term: 1 },
  { subject_index: 3, comision: 1, professor: 'Prof. Silva', schedule: '[{"day":"Miércoles","start":"20:00"},{"day":"Sábado","start":"09:00"}]', classroom: 'Aula 104', term: 2 },
  { subject_index: 4, comision: 1, professor: 'Prof. López', schedule: '[{"day":"Martes","start":"20:00"},{"day":"Jueves","start":"20:00"}]', classroom: 'Aula 105', term: 2 },
  { subject_index: 16, comision: 1, professor: 'Prof. Martínez', schedule: '[{"day":"Lunes","start":"18:00"},{"day":"Viernes","start":"18:00"}]', classroom: 'Aula 201', term: 1 },
  { subject_index: 17, comision: 1, professor: 'Prof. Fernández', schedule: '[{"day":"Martes","start":"18:00"},{"day":"Jueves","start":"18:00"}]', classroom: 'Aula 202', term: 1 },
  { subject_index: 18, comision: 1, professor: 'Prof. Rodríguez', schedule: '[{"day":"Miércoles","start":"18:00"},{"day":"Sábado","start":"09:00"}]', classroom: 'Aula 203', term: 2 },
];

async function seedInstanceSubjects(subjects, transaction) {
  const rows = instanceSubjectTemplates.map((inst) => ({
    id_subject: subjects[inst.subject_index].id,
    comision: inst.comision,
    professor: inst.professor,
    schedule: inst.schedule,
    classroom: inst.classroom,
    term: inst.term,
  }));

  return seedRows(InstanceSubject, rows, ['id_subject', 'comision'], transaction);
}

module.exports = seedInstanceSubjects;
