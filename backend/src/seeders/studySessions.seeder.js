const { StudySession } = require('../models');
const { seedRows } = require('./helpers');

const sessionTemplates = [
  {
    title: 'Repaso guiado',
    description: 'Encuentro para resolver dudas frecuentes y practicar ejercicios clave',
    type: 'virtual',
    status: 'abierta',
    approval_required: false,
    duration_hours: 2,
    duration_minutes: 0,
    max_slots: 30,
    reminder_sent: false,
    dayOffset: 3,
  },
  {
    title: 'Simulacro de parcial',
    description: 'Sesion colaborativa con tiempos reales y devolucion entre pares',
    type: 'presencial',
    status: 'finalizada',
    approval_required: true,
    duration_hours: 2,
    duration_minutes: 30,
    max_slots: 18,
    reminder_sent: true,
    dayOffset: -5,
  },
  {
    title: 'Taller de consultas',
    description: 'Mesa abierta para temas puntuales, apuntes y estrategias de estudio',
    type: 'virtual',
    status: 'cancelada',
    approval_required: true,
    duration_hours: 1,
    duration_minutes: 30,
    max_slots: 20,
    reminder_sent: false,
    dayOffset: 1,
  },
  {
    title: 'Laboratorio entre pares',
    description: 'Practica en grupo para ejercicios largos y revision cruzada',
    type: 'presencial',
    status: 'abierta',
    approval_required: false,
    duration_hours: 3,
    duration_minutes: 0,
    max_slots: 15,
    reminder_sent: false,
    dayOffset: 6,
  },
  {
    title: 'Clinica de finales',
    description: 'Resolucion intensiva de modelos de examen y dudas de ultimo momento',
    type: 'virtual',
    status: 'finalizada',
    approval_required: false,
    duration_hours: 2,
    duration_minutes: 0,
    max_slots: 35,
    reminder_sent: true,
    dayOffset: -12,
  },
  {
    title: 'Encuentro de integracion',
    description: 'Sesion para coordinar grupo, repartir temas y consolidar avances',
    type: 'presencial',
    status: 'cancelada',
    approval_required: true,
    duration_hours: 1,
    duration_minutes: 45,
    max_slots: 12,
    reminder_sent: false,
    dayOffset: 2,
  },
];

function buildSessionDate(dayOffset, studentIndex, templateIndex) {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset + (studentIndex % 3));
  date.setHours(16 + (templateIndex % 3), 0, 0, 0);
  return date;
}

async function seedStudySessions(students, subjects, transaction) {
  const rows = [];

  students.forEach((student, studentIndex) => {
    sessionTemplates.forEach((template, templateIndex) => {
      const subject = subjects[(studentIndex * 2 + templateIndex) % subjects.length];
      const dateTime = buildSessionDate(template.dayOffset, studentIndex, templateIndex);

      rows.push({
        host_student_id: student.user_id,
        subject_id: subject.id,
        title: `${template.title} - ${subject.code} - Host ${studentIndex + 1}`,
        description: `${template.description}. Materia foco: ${subject.name}.`,
        type: template.type,
        meeting_link:
          template.type === 'virtual'
            ? `https://meet.desapp.edu.ar/${subject.code.toLowerCase()}-h${studentIndex + 1}-t${templateIndex + 1}`
            : null,
        location:
          template.type === 'presencial'
            ? `Campus UNAHUR - Aula ${100 + studentIndex + templateIndex}`
            : null,
        date_time: dateTime,
        duration_hours: template.duration_hours,
        duration_minutes: template.duration_minutes,
        max_slots: template.max_slots,
        approval_required: template.approval_required,
        status: template.status,
        reminder_sent: template.reminder_sent,
      });
    });
  });

  return seedRows(StudySession, rows, ['host_student_id', 'title'], transaction);
}

module.exports = seedStudySessions;
