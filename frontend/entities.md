Este archivo refleja el estado actual de los modelos Sequelize en `src/models/`.

// ==========================================
// MÓDULO: USUARIOS
// ==========================================

Table users {
  id int [pk, increment]
  name? varchar
  lastname? varchar
  email varchar [not null, unique]
  avatar? varchar
  role enum('admin', 'student') [not null, default: 'student']
  is_active bool [not null, default: true]
  password varchar [not null] // hasheado con bcrypt antes de persistir
  createdAt timestamp
  updatedAt timestamp
}

Table students {
  user_id int [pk, ref: > users.id]
  legajo? varchar [unique]
  public_profile? bool [default: false]
  show_email bool [not null, default: false]
  show_academic_info? bool [default: true]
  publish_approvals? bool [default: false]
  // Sin timestamps
}

Table admins {
  id int [pk, increment]
  id_users int [not null, ref: > users.id]
  cuil varchar [not null]
  role? varchar
  id_of_creator? int [ref: > admins.id]
  createdAt timestamp
  updatedAt timestamp
}

Table sessions {
  id int [pk, increment]
  id_user int [not null, ref: > users.id]
  token? varchar
  expires_at? timestamp
  createdAt timestamp
  updatedAt timestamp
}

// ==========================================
// MÓDULO: ESTUDIANTIL
// ==========================================

// --- Estructura Académica ---

Table institutes {
  id int [pk, increment]
  name varchar [not null, unique]
  short_name varchar [not null]
  responsible varchar [not null]
  status varchar [not null] // 'activo', 'en revision', 'inactivo'
  email varchar [not null]
  tel varchar [not null]
  address varchar [not null]
  notes? varchar
  createdAt timestamp
  updatedAt timestamp
}

Table careers {
  id int [pk, increment]
  name varchar [not null]
  id_institute int [not null, ref: > institutes.id]
  degree_title varchar [not null]
  duration int [not null] // 2, 3, 4, 5, 6
  code varchar [not null]
  description? varchar
  createdAt timestamp
  updatedAt timestamp
}

Table study_plans {
  id int [pk, increment]
  id_career int [not null, ref: > careers.id]
  name varchar [not null]
  status varchar [not null] // 'vigente', 'en transicion', 'descontinuado'
  years_duration? int
  course_type? varchar
  default_term? int // 1, 2
  createdAt timestamp
  updatedAt timestamp


Table subjects {
  id int [pk, increment]
  name varchar [not null]
  code varchar [not null]
  is_unahur bool [not null, default: false]
  weekly_hours? int
  createdAt timestamp
  updatedAt timestamp
  deletedAt timestamp // soft delete (paranoid)
}

Table plan_subjects {
  id int [pk, increment]
  id_study_plan int [not null, ref: > study_plans.id]
  id_subject int [not null, ref: > subjects.id]
  suggested_year int [not null] // 1, 2, 3, 4, 5, 6
  suggested_term int [not null] // 1, 2
  credits? int
  createdAt timestamp
  updatedAt timestamp
  indexes: unique(id_study_plan, id_subject)
}

// --- Plan de Estudios: Bloques ---

Table plan_credit_blocks {
  id int [pk, increment]
  id_study_plan int [not null, ref: > study_plans.id]
  name varchar [not null]
  min_credits_required? int
  max_credits_allowed? int
  sort_order? int
  createdAt timestamp
  updatedAt timestamp
  indexes: unique(id_study_plan, name)
}

Table activities {
  id int [pk, increment]
  name varchar [not null]
  description? text
  createdAt timestamp
  updatedAt timestamp
}

Table plan_credit_block_items {
  id int [pk, increment]
  id_credit_block int [not null, ref: > plan_credit_blocks.id]
  id_activity int [not null, ref: > activities.id]
  credits int [not null]
  createdAt timestamp
  updatedAt timestamp
  indexes: unique(id_credit_block, id_activity)
}

Table plan_elective_blocks {
  id int [pk, increment]
  id_study_plan int [not null, ref: > study_plans.id]
  name varchar [not null]
  min_required int [not null, default: 1]
  requires_approved_mandatory_count int [not null, default: 0]
  suggested_year? int
  sort_order? int
  createdAt timestamp
  updatedAt timestamp
}

Table plan_elective_block_subjects {
  id int [pk, increment]
  id_elective_block int [not null, ref: > plan_elective_blocks.id]
  id_subject int [not null, ref: > subjects.id]
  createdAt timestamp
  updatedAt timestamp
  indexes: unique(id_elective_block, id_subject)
}

Table plan_unahur_blocks {
  id int [pk, increment]
  id_study_plan int [not null, ref: > study_plans.id]
  suggested_year int [not null]
  suggested_term? int // 1, 2
  sort_order? int
  createdAt timestamp
  updatedAt timestamp
}

// --- Correlatividades ---

Table correlativities {
  id int [pk, increment]
  id_plan_subject_target int [not null, ref: > plan_subjects.id]
  id_required_plan_subject int [not null, ref: > plan_subjects.id]
  type? varchar
  // Sin timestamps
}

// --- Historia Académica: Materias ---

Table academic_records {
  id int [pk, increment]
  id_student int [not null, ref: > users.id]
  id_subject? int [ref: > subjects.id]
  plan_subject_id? int [ref: > plan_subjects.id]
  course_id? int [ref: > courses.id]
  year? int
  semester? int // 1, 2
  grade? varchar // "1"-"10", "C", "NC", vacio
  status varchar [not null] // 'aprobado', 'desaprobado', 'pendiente', 'enrolled'
  regularity_expires_at? date
  createdAt timestamp
  updatedAt timestamp
}

Table final_exams {
  id int [pk, increment]
  id_academic_record int [not null, ref: > academic_records.id]
  grade? varchar // "1"-"10", "C", "NC"
  year? int
  semester? int // 1, 2
  status varchar [not null] // 'aprobado', 'desaprobado'
  createdAt timestamp
  updatedAt timestamp
}

// --- Historia Académica: Actividades ---

Table activities_records {
  id int [pk, increment]
  id_student int [not null, ref: > users.id]
  id_activity int [not null, ref: > activities.id]
  plan_credit_block_item_id? int [ref: > plan_credit_block_items.id]
  year? int
  semester? int // 1, 2
  grade? varchar // "1"-"10", "C", "NC", vacio
  status varchar [not null] // 'aprobado', 'desaprobado', 'pendiente', 'enrolled'
  createdAt timestamp
  updatedAt timestamp
}

// --- Plan de Estudio Personalizado ---

Table custom_study_plans {
  id int [pk, increment]
  id_student int [not null, ref: > students.user_id]
  name varchar [not null]
  weekly_hours? int
  createdAt timestamp
  updatedAt timestamp
}

Table custom_study_plan_items {
  id int [pk, increment]
  id_custom_study_plan int [not null, ref: > custom_study_plans.id]
  plan_subject_id int [not null, ref: > plan_subjects.id]
  target_year int [not null]
  target_term int [not null]
  order? int
  status enum('planificado', 'cursando', 'completado') [not null, default: 'planificado']
  createdAt timestamp
  updatedAt timestamp
}

// --- Inscripciones ---

Table student_career_enrollments {
  id int [pk, increment]
  student_id int [not null, ref: > students.user_id]
  career_id int [not null, ref: > careers.id]
  study_plan_id? int [ref: > study_plans.id]
  enrolled_at date [not null, default: `now`]
  completed_at? date
  status varchar [not null, default: 'active'] // 'active', 'completed', 'cancelled'
  is_active bool [not null, default: true]
  createdAt timestamp
  updatedAt timestamp
}

// --- Comisiones / Cursos ---

Table courses {
  id int [pk, increment]
  plan_subject_id int [not null, ref: > plan_subjects.id]
  commission varchar [not null]
  year int [not null]
  term int [not null]
  capacity int [not null, default: 50]
  professor_name? varchar
  createdAt timestamp
  updatedAt timestamp
}

Table course_schedules {
  id int [pk, increment]
  course_id int [not null, ref: > courses.id]
  day_of_week varchar [not null]
  start_time time [not null]
  end_time time [not null]
  classroom? varchar
  createdAt timestamp
  updatedAt timestamp
}

// --- (Legacy) Instance Subjects ---

Table instance_subjects {
  id int [pk, increment]
  id_subject int [not null, ref: > subjects.id]
  comision? int
  professor? varchar
  schedule? varchar // JSON: [{"day": "Lunes", "start": "18:00"}]
  classroom? varchar
  is_exam? bool [default: false]
  regularity_expires_at? timestamp
  term? int // 1, 2
  createdAt timestamp
  updatedAt timestamp
}

// ==========================================
// MÓDULO: SOCIAL
// ==========================================

// --- Conexiones ---

Table connections {
  id int [pk, increment]
  id_user int [not null, ref: > users.id]
  id_connected_user int [not null, ref: > users.id]
  status? varchar // 'pending', 'accepted', 'rejected'
  invitation_token? varchar [unique]
  target_email? varchar
  createdAt timestamp
  updatedAt timestamp
}

// --- Notificaciones ---

Table notifications {
  id int [pk, increment]
  id_user int [not null, ref: > users.id]
  type varchar [not null] // 'info', 'warning', 'success', 'error'
  title varchar [not null]
  message varchar [not null]
  read? bool [default: false]
  createdAt timestamp
  updatedAt timestamp
}

// --- Reportes ---

Table report_reasons {
  id int [pk, increment]
  name varchar [not null]
  description? varchar
  createdAt timestamp
  updatedAt timestamp
}

Table reports {
  id int [pk, increment]
  id_reporter int [not null, ref: > users.id]
  id_content? int
  content_type? varchar
  id_reason? int [ref: > report_reasons.id]
  status? varchar
  resolved_by_id? int [ref: > users.id]
  createdAt timestamp
  updatedAt timestamp
}

// --- Posts y Comentarios ---

Table posts {
  id int [pk, increment]
  id_author int [not null, ref: > students.user_id]
  title varchar [not null]
  content text [not null]
  created_at? timestamp
  // Sin timestamps automáticos (timestamps: false)
}

Table comments {
  id int [pk, increment]
  target_type varchar [not null] // 'post', 'academic_event'
  target_id int [not null]
  id_author int [not null, ref: > students.user_id]
  content text [not null]
  created_at? timestamp
  // Sin timestamps automáticos (timestamps: false)
}

// --- Materiales y Votos ---

Table materials {
  id int [pk, increment]
  id_author int [not null, ref: > students.user_id]
  id_subject int [not null, ref: > subjects.id]
  title varchar [not null]
  type? varchar
  file_url varchar [not null]
  total_upvotes? int [default: 0]
  status varchar [not null, default: 'active']
  tags? text // JSON array: ["tag1", "tag2"]
  createdAt timestamp
  updatedAt timestamp
}

Table material_votes {
  id int [pk, increment]
  id_material int [not null, ref: > materials.id]
  id_student int [not null, ref: > students.user_id]
  is_upvote bool [not null]
  createdAt timestamp
  updatedAt timestamp
  // Hooks: afterCreate/afterUpdate/afterDestroy ajustan total_upvotes en materials
}

// --- Sesiones de Estudio ---

Table study_sessions {
  id int [pk, increment]
  host_student_id int [not null, ref: > students.user_id]
  subject_id int [not null, ref: > subjects.id]
  title varchar [not null]
  description? text
  type enum('virtual', 'presencial') [not null]
  meeting_link? varchar
  location? varchar
  date_time timestamp [not null]
  duration_hours int [not null, default: 1]
  duration_minutes int [not null, default: 0]
  max_slots? int
  approval_required bool [not null, default: false]
  status enum('abierta', 'cancelada', 'finalizada') [not null, default: 'abierta']
  reminder_sent bool [not null, default: false]
  createdAt timestamp
  updatedAt timestamp
}

Table study_session_registrations {
  id int [pk, increment]
  study_session_id int [not null, ref: > study_sessions.id]
  student_id int [not null, ref: > students.user_id]
  status enum('pending', 'approved', 'rejected') [not null, default: 'pending']
  createdAt timestamp
  updatedAt timestamp
}

// ==========================================
// MÓDULO: OTROS
// ==========================================

Table system_configs {
  key varchar [pk, not null]
  value? varchar
  // Sin timestamps
}

// ==========================================
// RELACIONES
// ==========================================

// --- Estructura Académica ---
Ref: institutes.id < careers.id_institute
Ref: careers.id < study_plans.id_career
Ref: study_plans.id < plan_subjects.id_study_plan
Ref: subjects.id < plan_subjects.id_subject

// --- Bloques del Plan ---
Ref: study_plans.id < plan_credit_blocks.id_study_plan
Ref: plan_credit_blocks.id < plan_credit_block_items.id_credit_block
Ref: activities.id < plan_credit_block_items.id_activity
Ref: study_plans.id < plan_elective_blocks.id_study_plan
Ref: study_plans.id < plan_unahur_blocks.id_study_plan
Ref: plan_elective_blocks.id < plan_elective_block_subjects.id_elective_block
Ref: subjects.id < plan_elective_block_subjects.id_subject

// --- Correlatividades ---
Ref: plan_subjects.id < correlativities.id_plan_subject_target
Ref: plan_subjects.id < correlativities.id_required_plan_subject

// --- Usuarios y Roles ---
Ref: users.id < students.user_id
Ref: users.id < admins.id_users
Ref: admins.id < admins.id_of_creator
Ref: users.id < sessions.id_user

// --- Historia Académica: Materias ---
Ref: users.id < academic_records.id_student
Ref: subjects.id < academic_records.id_subject
Ref: plan_subjects.id < academic_records.plan_subject_id
Ref: courses.id < academic_records.course_id
Ref: academic_records.id < final_exams.id_academic_record

// --- Historia Académica: Actividades ---
Ref: users.id < activities_records.id_student
Ref: activities.id < activities_records.id_activity
Ref: plan_credit_block_items.id < activities_records.plan_credit_block_item_id

// --- Plan de Estudio Personalizado ---
Ref: students.user_id < custom_study_plans.id_student
Ref: custom_study_plans.id < custom_study_plan_items.id_custom_study_plan
Ref: plan_subjects.id < custom_study_plan_items.plan_subject_id

// --- Inscripciones ---
Ref: students.user_id < student_career_enrollments.student_id
Ref: careers.id < student_career_enrollments.career_id
Ref: study_plans.id < student_career_enrollments.study_plan_id

// --- Comisiones / Cursos ---
Ref: plan_subjects.id < courses.plan_subject_id
Ref: courses.id < course_schedules.course_id
Ref: subjects.id < instance_subjects.id_subject

// --- Social: Conexiones ---
Ref: users.id < connections.id_user
Ref: users.id < connections.id_connected_user

// --- Social: Notificaciones ---
Ref: users.id < notifications.id_user

// --- Social: Reportes ---
Ref: users.id < reports.id_reporter
Ref: report_reasons.id < reports.id_reason
Ref: users.id < reports.resolved_by_id

// --- Social: Posts y Comentarios ---
Ref: students.user_id < posts.id_author
Ref: students.user_id < comments.id_author

// --- Social: Materiales ---
Ref: students.user_id < materials.id_author
Ref: subjects.id < materials.id_subject
Ref: materials.id < material_votes.id_material
Ref: students.user_id < material_votes.id_student

// --- Social: Sesiones de Estudio ---
Ref: students.user_id < study_sessions.host_student_id
Ref: subjects.id < study_sessions.subject_id
Ref: study_sessions.id < study_session_registrations.study_session_id
Ref: students.user_id < study_session_registrations.student_id
