const { Institute } = require('../models');
const { seedRows } = require('./helpers');

const institutes = [
  { name: 'Instituto de Ciencias Exactas y Naturales', short_name: 'ICEN', responsible: 'Dr. García', status: 'activo', email: 'exactas@unahur.edu.ar', tel: '1234-5678', address: 'Av. Principal 123' },
  { name: 'Instituto de Ingenieria y Tecnologia', short_name: 'IIT', responsible: 'Ing. Martínez', status: 'activo', email: 'ingenieria@unahur.edu.ar', tel: '1234-5679', address: 'Av. Tecnológica 456' },
  { name: 'Instituto de Tecnología e Ingeniería', short_name: 'ITI', responsible: 'Ing. Alvarez', status: 'activo', email: 'iti@unahur.edu.ar', tel: '1234-5688', address: 'Av. Innovación 100' },
  { name: 'Instituto de Ciencias Sociales', short_name: 'ICS', responsible: 'Dra. Rodríguez', status: 'activo', email: 'sociales@unahur.edu.ar', tel: '1234-5680', address: 'Calle del Conocimiento 789' },
  { name: 'Instituto de Ciencias de la Salud', short_name: 'ICSa', responsible: 'Dr. López', status: 'activo', email: 'salud@unahur.edu.ar', tel: '1234-5681', address: 'Av. Sanitaria 321' },
  { name: 'Instituto de Educacion', short_name: 'IE', responsible: 'Prof. González', status: 'activo', email: 'educacion@unahur.edu.ar', tel: '1234-5682', address: 'Calle Educativa 654' },
  { name: 'Instituto de Humanidades', short_name: 'IH', responsible: 'Dra. Fernández', status: 'activo', email: 'humanidades@unahur.edu.ar', tel: '1234-5683', address: 'Av. Cultural 987' },
  { name: 'Instituto de Arte y Diseno', short_name: 'IAD', responsible: 'Lic. Torres', status: 'activo', email: 'arte@unahur.edu.ar', tel: '1234-5684', address: 'Pasaje Creativo 147' },
  { name: 'Instituto de Gestion y Negocios', short_name: 'IGN', responsible: 'Mg. Vargas', status: 'activo', email: 'negocios@unahur.edu.ar', tel: '1234-5685', address: 'Av. Comercial 258' },
  { name: 'Instituto de Ambiente y Energia', short_name: 'IAE', responsible: 'Dr. Ríos', status: 'activo', email: 'ambiente@unahur.edu.ar', tel: '1234-5686', address: 'Calle Sustentable 369' },
  { name: 'Instituto de Datos y Computacion', short_name: 'IDC', responsible: 'Ing. Paz', status: 'activo', email: 'datos@unahur.edu.ar', tel: '1234-5687', address: 'Av. Digital 753' },
];

async function seedInstitutes(transaction) {
  return seedRows(Institute, institutes, ['name'], transaction);
}

module.exports = seedInstitutes;
