const { Student } = require('../models');
const { seedRows } = require('./helpers');

const studentProfiles = [
  {
    legajo: 'A-2026-0001',
    public_profile: false,
    show_email: false,
    show_academic_info: false,
    publish_approvals: false,
  },
  {
    legajo: 'A-2026-0002',
    public_profile: true,
    show_email: false,
    show_academic_info: true,
    publish_approvals: true,
  },
  {
    legajo: 'A-2026-0003',
    public_profile: false,
    show_email: false,
    show_academic_info: true,
    publish_approvals: false,
  },
  {
    legajo: 'A-2026-0004',
    public_profile: true,
    show_email: true,
    show_academic_info: false,
    publish_approvals: false,
  },
  {
    legajo: 'A-2026-0005',
    public_profile: false,
    show_email: false,
    show_academic_info: false,
    publish_approvals: true,
  },
  {
    legajo: 'A-2026-0006',
    public_profile: true,
    show_email: true,
    show_academic_info: true,
    publish_approvals: true,
  },
  {
    legajo: 'A-2026-0007',
    public_profile: false,
    show_email: false,
    show_academic_info: true,
    publish_approvals: true,
  },
  {
    legajo: 'A-2026-0008',
    public_profile: true,
    show_email: true,
    show_academic_info: false,
    publish_approvals: true,
  },
  {
    legajo: 'A-2026-0009',
    public_profile: false,
    show_email: false,
    show_academic_info: false,
    publish_approvals: false,
  },
  {
    legajo: 'A-2026-0010',
    public_profile: true,
    show_email: true,
    show_academic_info: true,
    publish_approvals: false,
  },
];

async function seedStudents(users, transaction) {
  const rows = users.slice(1).map((user, index) => ({
    user_id: user.id,
    ...studentProfiles[index],
  }));

  return seedRows(Student, rows, ['user_id'], transaction);
}

module.exports = seedStudents;
