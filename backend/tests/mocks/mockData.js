const usersMock = [
  { id: 1, name: 'Admin', lastname: 'Nexo', email: 'admin@example.com', role: 'admin', is_active: true },
  { id: 2, name: 'Test', lastname: 'Student One', email: 'student1@example.com', role: 'student', is_active: true },
  { id: 3, name: 'Test', lastname: 'Student Two', email: 'student2@example.com', role: 'student', is_active: true },
];

const studentsMock = [
  { user_id: 2, legajo: 'A123', public_profile: false, show_email: false, show_academic_info: true, publish_approvals: false },
  { user_id: 3, legajo: 'A124', public_profile: false, show_email: false, show_academic_info: true, publish_approvals: false },
];

const adminsMock = [
  { id: 1, id_users: 1, cuil: '20-12345678-9', role: 'superadmin' },
];

const institutesMock = [
  { id: 1, name: 'Instituto de Ciencias Exactas y Naturales', short_name: 'ICEN', responsible: 'Dr. García', status: 'activo', email: 'exactas@test.com', tel: '1234-5678', address: 'Av. Principal 123' },
  { id: 2, name: 'Instituto de Ciencias Humanas', short_name: 'ICH', responsible: 'Dra. López', status: 'activo', email: 'humanas@test.com', tel: '1234-5679', address: 'Av. Secundaria 456' },
];

const careersMock = [
  { id: 1, name: 'Licenciatura en Ciencias de la Computación', id_institute: 1, degree_title: 'Lic. en Computación', duration: 5, code: 'LIC-COMP' },
  { id: 2, name: 'Ingeniería en Sistemas', id_institute: 1, degree_title: 'Ing. en Sistemas', duration: 5, code: 'ING-SIST' },
  { id: 3, name: 'Licenciatura en Psicología', id_institute: 2, degree_title: 'Lic. en Psicología', duration: 5, code: 'LIC-PSI' },
];

const studyPlansMock = [
  { id: 1, id_career: 1, name: 'Plan 2026 - Computación', status: 'vigente', years_duration: 5, course_type: 'cuatrimestral', default_term: 1 },
  { id: 2, id_career: 2, name: 'Plan 2026 - Sistemas', status: 'vigente', years_duration: 5, course_type: 'cuatrimestral', default_term: 1 },
];

const subjectsMock = [
  { id: 1, name: 'Matemática I', code: 'MAT-101', is_unahur: false },
  { id: 2, name: 'Programación I', code: 'PROG-101', is_unahur: false },
  { id: 3, name: 'Algoritmos y Estructuras', code: 'ALGO-201', is_unahur: false },
  { id: 4, name: 'Base de Datos', code: 'BD-201', is_unahur: false },
  { id: 5, name: 'Etica Profesional', code: 'ETI-301', is_unahur: true },
  { id: 6, name: 'Nuevos Entornos', code: 'NE-302', is_unahur: true },
];

const planSubjectsMock = [
  { id: 1, id_study_plan: 1, id_subject: 1, suggested_year: 1, suggested_term: 1, credits: 4, is_elective: false },
  { id: 2, id_study_plan: 1, id_subject: 2, suggested_year: 1, suggested_term: 2, credits: 4, is_elective: false },
  { id: 3, id_study_plan: 2, id_subject: 3, suggested_year: 2, suggested_term: 1, credits: 5, is_elective: false },
  { id: 4, id_study_plan: 2, id_subject: 4, suggested_year: 2, suggested_term: 2, credits: 4, is_elective: false },
  { id: 25, id_study_plan: 1, id_subject: 11, suggested_year: 4, suggested_term: 1, credits: null, is_elective: true },
  { id: 26, id_study_plan: 1, id_subject: 12, suggested_year: 4, suggested_term: 1, credits: null, is_elective: true },
];

const correlativitiesMock = [
  { id: 1, id_plan_subject_target: 2, id_required_plan_subject: 1, type: 'regular' },
];

const academicRecordsMock = [
  { id: 1, id_student: 2, id_subject: 1, year: 2025, semester: 1, grade: '8', status: 'aprobado', regularity_expires_at: null },
  { id: 2, id_student: 2, id_subject: 2, year: 2025, semester: 2, grade: null, status: 'enrolled', regularity_expires_at: null },
  { id: 3, id_student: 3, id_subject: 1, year: 2025, semester: 1, grade: '4', status: 'pendiente', regularity_expires_at: '2026-12-31' },
];

const finalExamsMock = [
  { id: 1, id_academic_record: 1, grade: '8', status: 'aprobado', year: 2025, semester: 1, attempt_number: 1 },
];

const materialsMock = [
  { id: 1, id_author: 2, id_subject: 1, title: 'Resumen Parcial 1', type: 'pdf', file_url: 'http://example.com/resumen1.pdf', total_upvotes: 5, likes_count: 5, dislikes_count: 1, valoracion_ratio: 0.8333, status: 'active' },
  { id: 2, id_author: 3, id_subject: 1, title: 'Ejercicios Resueltos', type: 'pdf', file_url: 'http://example.com/ejercicios.pdf', total_upvotes: 2, likes_count: 2, dislikes_count: 3, valoracion_ratio: 0.4, status: 'active' },
];

const votesMock = [
  { id: 1, target_type: 'material', target_id: 1, id_student: 3, is_upvote: true },
  { id: 2, target_type: 'material', target_id: 2, id_student: 2, is_upvote: false },
];

const customStudyPlansMock = [
  { id: 1, id_student: 2, name: 'Plan Personalizado 1', weekly_hours: 20 },
];

const studentCareerEnrollmentsMock = [
  { id: 1, student_id: 2, career_id: 1, enrolled_at: '2025-03-01', completed_at: null, status: 'active', is_active: true },
  { id: 2, student_id: 3, career_id: 1, enrolled_at: '2025-03-01', completed_at: null, status: 'active', is_active: true },
];

const instanceSubjectsMock = [
  { id: 1, id_subject: 1, comision: 1, professor: 'Prof. Gómez', schedule: '[{"day":"Lunes","start":"18:00"}]', classroom: 'Aula 101', is_exam: false, term: 1 },
  { id: 2, id_subject: 2, comision: 1, professor: 'Prof. Pérez', schedule: '[{"day":"Martes","start":"18:00"}]', classroom: 'Aula 102', is_exam: false, term: 2 },
];

const connectionsMock = [
  { id: 1, id_user: 2, id_connected_user: 3, status: 'accepted' },
];

const notificationsMock = [
  { id: 1, id_user: 2, type: 'info', title: 'Bienvenido', message: 'Cuenta creada exitosamente', read: false },
  { id: 2, id_user: 3, type: 'info', title: 'Bienvenido', message: 'Cuenta creada exitosamente', read: false },
];

const sessionsMock = [
  { id: 1, id_user: 1, token: 'mock-token-admin', expires_at: '2026-12-31' },
];

const reportReasonsMock = [
  { id: 1, name: 'Spam', description: 'Contenido publicitario no deseado' },
  { id: 2, name: 'Contenido ofensivo', description: 'Lenguaje inapropiado u ofensivo' },
];

const reportsMock = [
  { id: 1, id_reporter: 2, id_content: 2, content_type: 'material', id_reason: 2, status: 'pendiente' },
];

const postsMock = [
  { id: 1, id_author: 2, title: 'Mi primer post', content: 'Hola a todos', created_at: '2025-01-01' },
];

const systemConfigsMock = [
  { key: 'app_name', value: 'Sistema de Acompañamiento Estudiantil' },
  { key: 'maintenance_mode', value: 'false' },
];

module.exports = {
  usersMock,
  studentsMock,
  adminsMock,
  institutesMock,
  careersMock,
  studyPlansMock,
  subjectsMock,
  planSubjectsMock,
  correlativitiesMock,
  academicRecordsMock,
  finalExamsMock,
  materialsMock,
  votesMock,
  customStudyPlansMock,
  studentCareerEnrollmentsMock,
  instanceSubjectsMock,
  connectionsMock,
  notificationsMock,
  sessionsMock,
  reportReasonsMock,
  reportsMock,
  postsMock,
  systemConfigsMock,
};
