const { User } = require('../models');
const { seedRows } = require('./helpers');

const users = [
  {
    email: 'admin@example.com',
    password: 'admin123',
    name: 'Alicia',
    lastname: 'Nexus',
    role: 'admin',
    is_active: true,
  },
  {
    email: 'student1@example.com',
    password: 'password',
    name: 'Martin',
    lastname: 'Gomez',
    role: 'student',
    is_active: true,
  },
  {
    email: 'student2@example.com',
    password: 'password',
    name: 'Lucia',
    lastname: 'Fernandez',
    role: 'student',
    is_active: true,
  },
  {
    email: 'student3@example.com',
    password: 'password',
    name: 'Nicolas',
    lastname: 'Rossi',
    role: 'student',
    is_active: true,
  },
  {
    email: 'student4@example.com',
    password: 'password',
    name: 'Camila',
    lastname: 'Pereyra',
    role: 'student',
    is_active: true,
  },
  {
    email: 'student5@example.com',
    password: 'password',
    name: 'Santiago',
    lastname: 'Lopez',
    role: 'student',
    is_active: true,
  },
  {
    email: 'student6@example.com',
    password: 'password',
    name: 'Valentina',
    lastname: 'Suarez',
    role: 'student',
    is_active: true,
  },
  {
    email: 'student7@example.com',
    password: 'password',
    name: 'Federico',
    lastname: 'Castro',
    role: 'student',
    is_active: true,
  },
  {
    email: 'student8@example.com',
    password: 'password',
    name: 'Julieta',
    lastname: 'Mendez',
    role: 'student',
    is_active: true,
  },
  {
    email: 'student9@example.com',
    password: 'password',
    name: 'Tomas',
    lastname: 'Herrera',
    role: 'student',
    is_active: true,
  },
  {
    email: 'student10@example.com',
    password: 'password',
    name: 'Agustina',
    lastname: 'Vega',
    role: 'student',
    is_active: true,
  },
];

async function seedUsers(transaction) {
  return seedRows(User, users, ['email'], transaction);
}

module.exports = seedUsers;
