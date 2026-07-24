const { Career } = require('../models');
const { seedRows } = require('./helpers');

const careerTemplates = [
  {
    name: 'Licenciatura en Ciencias de la Computacion',
    institute_name: 'Instituto de Ciencias Exactas y Naturales',
    degree_title: 'Licenciado en Ciencias de la Computación',
    duration: 5,
    code: 'LIC-COMP',
    description: 'Carrera orientada a la computación',
  },
  {
    name: 'Ingenieria Ambiental',
    institute_name: 'Instituto de Ingenieria y Tecnologia',
    degree_title: 'Ingeniero Ambiental',
    duration: 5,
    code: 'ING-AMB',
    description: 'Carrera de ingeniería ambiental',
  },
  {
    name: 'Tecnicatura Universitaria en Programación',
    institute_name: 'Instituto de Tecnología e Ingeniería',
    degree_title: 'Técnico/a Universitario/a en Programación',
    duration: 3,
    code: 'TUP',
    description: 'Carrera orientada al desarrollo de software y tecnologías de programación.',
  },
];

async function seedCareers(institutes, transaction) {
  const instituteByName = new Map(institutes.map((institute) => [institute.name, institute]));

  const rows = careerTemplates.map((career) => ({
    name: career.name,
    id_institute: instituteByName.get(career.institute_name)?.id,
    degree_title: career.degree_title,
    duration: career.duration,
    code: career.code,
    description: career.description,
  }));

  const invalid = rows.find((row) => !row.id_institute);
  if (invalid) {
    throw new Error(`No se encontró institute para career: ${invalid.name}`);
  }

  return seedRows(Career, rows, ['name'], transaction);
}

module.exports = seedCareers;
