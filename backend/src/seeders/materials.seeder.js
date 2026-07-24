const { Material } = require('../models');
const { seedRows } = require('./helpers');

const TUP_STUDENT_START_INDEX = 5; // student6..student10 segun studentCareerEnrollments.seeder

const TUP_SUBJECT_CODES = new Set([
  '788', '790', '789', '004', '791', '792', '793', '030',
  '754', '753', '752', '765', '043', '758', '759', '760',
  '761', '766', 'INF_COMP10', 'INF_COMP5', '756', '795', '757',
]);

const TUP_SUBJECT_YEAR_BY_CODE = {
  '788': 1,
  '790': 1,
  '789': 1,
  '004': 1,
  '791': 1,
  '792': 1,
  '793': 1,
  '030': 1,
  '754': 2,
  '753': 2,
  '752': 2,
  '765': 2,
  '043': 2,
  '761': 2,
  '766': 2,
  INF_COMP10: 2,
  INF_COMP5: 2,
  '756': 2,
  '795': 2,
  '757': 2,
  '758': 3,
  '759': 3,
  '760': 3,
};

const materialBlueprints = [
  {
    title: 'Apunte de catedra',
    type: 'pdf',
    status: 'active',
    tags: ['apunte', 'catedra', 'teoria'],
    slug: 'apunte-catedra',
  },
  {
    title: 'Resumen para parcial',
    type: 'pdf',
    status: 'active',
    tags: ['resumen', 'parcial', 'repaso'],
    slug: 'resumen-parcial',
  },
  {
    title: 'Video explicativo de ejercicios',
    type: 'video',
    status: 'active',
    tags: ['video', 'ejercicios', 'resueltos'],
    slug: 'video-ejercicios',
  },
  {
    title: 'Clase grabada y anotaciones',
    type: 'video',
    status: 'pending',
    tags: ['video', 'clase', 'anotaciones'],
    slug: 'clase-grabada',
  },
  {
    title: 'Repositorio de practica guiada',
    type: 'link',
    status: 'active',
    tags: ['link', 'practica', 'repo'],
    slug: 'repo-practica',
  },
  {
    title: 'Coleccion de recursos externos',
    type: 'link',
    status: 'inactive',
    tags: ['link', 'recursos', 'referencias'],
    slug: 'recursos-externos',
  },
];

const tupFocusedBlueprints = [
  {
    title: 'Guia TUP para TP integrador',
    type: 'pdf',
    status: 'active',
    tags: ['tup', 'tp', 'integrador'],
    slug: 'tup-guia-integrador',
  },
  {
    title: 'Clase TUP en video',
    type: 'video',
    status: 'active',
    tags: ['tup', 'video', 'clase'],
    slug: 'tup-clase-video',
  },
  {
    title: 'Repositorio TUP de practica',
    type: 'link',
    status: 'active',
    tags: ['tup', 'repo', 'practica'],
    slug: 'tup-repo-practica',
  },
];

function fileExtensionByType(type) {
  if (type === 'video') return 'mp4';
  if (type === 'link') return 'url';
  return 'pdf';
}

function isTupSubject(subject) {
  return TUP_SUBJECT_CODES.has(subject.code) || subject.code.startsWith('AU_');
}

function getTupSubjectYear(subjectCode) {
  if (subjectCode.startsWith('AU_')) return 2;
  return TUP_SUBJECT_YEAR_BY_CODE[subjectCode] || 2;
}

function getStudentTupYear(studentIndexInTup) {
  if (studentIndexInTup <= 1) return 1;
  if (studentIndexInTup <= 3) return 2;
  return 3;
}

async function seedMaterials(students, subjects, transaction) {
  const rows = [];

  students.forEach((student, studentIndex) => {
    materialBlueprints.forEach((blueprint, blueprintIndex) => {
      const subject = subjects[(studentIndex * 11 + blueprintIndex * 17) % subjects.length];
      const extension = fileExtensionByType(blueprint.type);

      rows.push({
        id_author: student.user_id,
        id_subject: subject.id,
        title: `${blueprint.title} - ${subject.code} - Cohorte ${studentIndex + 1}`,
        type: blueprint.type,
        file_url: `https://files.desapp.edu.ar/materiales/${blueprint.slug}-${subject.code.toLowerCase()}-s${studentIndex + 1}.${extension}`,
        status: blueprint.status,
        tags: [...blueprint.tags, subject.code.toLowerCase()],
      });
    });
  });

  const tupSubjects = subjects.filter(isTupSubject);
  const tupStudents = students.slice(TUP_STUDENT_START_INDEX);

  tupStudents.forEach((student, studentIndex) => {
    const cohortYear = getStudentTupYear(studentIndex);
    const preferredSubjects = tupSubjects.filter(
      (subject) => getTupSubjectYear(subject.code) === cohortYear,
    );
    const fallbackSubjects = preferredSubjects.length > 0 ? preferredSubjects : tupSubjects;

    tupFocusedBlueprints.forEach((blueprint, blueprintIndex) => {
      const subject = fallbackSubjects[(studentIndex * 5 + blueprintIndex * 3) % fallbackSubjects.length];
      const extension = fileExtensionByType(blueprint.type);
      const subjectYear = getTupSubjectYear(subject.code);

      rows.push({
        id_author: student.user_id,
        id_subject: subject.id,
        title: `${blueprint.title} - ${subject.code} - TUP Anio ${cohortYear} - Estudiante ${studentIndex + 6}`,
        type: blueprint.type,
        file_url: `https://files.desapp.edu.ar/materiales/${blueprint.slug}-${subject.code.toLowerCase()}-tup-s${studentIndex + 6}.${extension}`,
        status: blueprint.status,
        tags: [
          ...blueprint.tags,
          subject.code.toLowerCase(),
          'tup-2025',
          `tup-anio-${cohortYear}`,
          `materia-anio-${subjectYear}`,
        ],
      });
    });
  });

  return seedRows(Material, rows, ['id_author', 'id_subject', 'title'], transaction);
}

module.exports = seedMaterials;
