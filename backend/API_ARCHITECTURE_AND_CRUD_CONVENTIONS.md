# Arquitectura API Backend y Convenciones CRUD

## Objetivo
Definir la estructura de rutas, middlewares, controladores y respuestas API del backend, junto con convenciones estándar para todos los CRUD.

## Arquitectura General
El backend sigue una arquitectura por capas basada en Express:

1. `src/index.js`
- Configura middlewares globales (`helmet`, `cors`, `express.json`).
- Monta las rutas por recurso bajo `/api/`.
- Expone health check (`GET /api/health`).
- Inicializa conexión con base de datos (Sequelize) y arranca el servidor.

2. `src/routes/*`
- Define endpoints HTTP por recurso.
- Aplica middlewares de validación por endpoint.
- Deriva la lógica de negocio al controlador correspondiente.

3. `src/middlewares/*`
- Valida estructura y tipos de datos de entrada.
- Corta la ejecución con `400 Bad Request` cuando hay errores de validación.

4. `src/controllers/*`
- Implementa operaciones CRUD.
- Interactúa con modelos Sequelize.
- Estandariza respuestas HTTP y manejo de errores.

5. `src/models/*`
- Define entidades y asociaciones con Sequelize.
- `src/models/index.js` exporta: `sequelize` + 25 modelos (User, Student, Admin, Career, Institute, StudyPlan, Subject, PlanSubject, Correlativity, AcademicRecord, FinalExam, Material, Vote, CustomStudyPlan, StudentCareerEnrollment, InstanceSubject, Connection, Notification, Session, Report, ReportReason, Post, SystemConfig, Course, CourseSchedule).

## Estructura de Rutas y Controladores
Todas las rutas base se montan bajo `/api/` en `src/index.js`.

### `/api/auth` (authRoutes.js)
- `POST /api/auth/register` -> `registerValidation` -> `authController.register`
- `POST /api/auth/login` -> `loginValidation` -> `authController.login`
- `GET /api/auth/me` -> `authenticate` -> `authController.me`

### `/api/admins` (adminRoutes.js)
- `GET /api/admins` -> `adminController.getAll`
- `GET /api/admins/:id` -> `adminController.getById`
- `POST /api/admins` -> `validateAdminData` -> `adminController.create`
- `PUT /api/admins/:id` -> `validateAdminUpdateData` -> `adminController.update`
- `DELETE /api/admins/:id` -> `adminController.delete`

### `/api/students` (studentRoutes.js)
- `GET /api/students` -> `studentController.getAll`
- `GET /api/students/:id` -> `studentController.getById`
- `POST /api/students` -> `validateStudentCreateData` -> `studentController.create`
- `PUT /api/students/:id` -> `validateStudentUpdateData` -> `studentController.update`
- `PATCH /api/students/:id` -> `validateStudentUpdateData` -> `studentController.update`
- `DELETE /api/students/:id` -> `studentController.delete`
- `GET /api/students/:id/enrollments` -> `studentController.getEnrollments`
- `POST /api/students/:id/enrollments` -> `validateEnrollmentData` -> `studentController.addEnrollment`
- `PUT /api/students/:id/enrollments/:enrollmentId` -> `validateEnrollmentUpdateData` -> `studentController.updateEnrollment`
- `DELETE /api/students/:id/enrollments/:enrollmentId` -> `studentController.deleteEnrollment`

### `/api/institutes` (instituteRoutes.js)
- `GET /api/institutes` -> `instituteController.getAll`
- `POST /api/institutes` -> `validateInstituteData` -> `instituteController.create`
- `PUT /api/institutes/:id` -> `validateInstituteUpdateData` -> `instituteController.update`
- `DELETE /api/institutes/:id` -> `instituteController.delete`

### `/api/careers` (careerRoutes.js)
- `GET /api/careers` -> `careerController.getAll`
- `GET /api/careers/:id` -> `careerController.getById`
- `POST /api/careers` -> `validateCareerData` -> `careerController.create`
- `PUT /api/careers/:id` -> `validateCareerUpdateData` -> `careerController.update`
- `DELETE /api/careers/:id` -> `careerController.delete`

### `/api/academic-records` (academicRecordRoutes.js)
- `GET /api/academic-records` -> `academicRecordController.getAll`
- `GET /api/academic-records/student/:student_id` -> `academicRecordController.getByStudentId`
- `POST /api/academic-records` -> `validateAcademicRecordData` -> `academicRecordController.create`
- `PUT /api/academic-records/:id` -> `validateAcademicRecordUpdateData` -> `academicRecordController.update`
- `PATCH /api/academic-records/:id` -> `validateAcademicRecordUpdateData` -> `academicRecordController.update`
- `PUT /api/academic-records/student/:student_id` -> `validateAcademicRecordUpdateData` -> `academicRecordController.updateByStudentId`
- `PATCH /api/academic-records/student/:student_id` -> `validateAcademicRecordUpdateData` -> `academicRecordController.updateByStudentId`
- `DELETE /api/academic-records/:id` -> `academicRecordController.delete`
- `DELETE /api/academic-records/student/:student_id` -> `academicRecordController.deleteByStudentId`

### `/api/correlativities` (correlativityRoutes.js)
- `GET /api/correlativities` -> `correlativityController.getAll`
- `GET /api/correlativities/:id` -> `correlativityController.getById`
- `POST /api/correlativities` -> `validateCorrelativityData` -> `correlativityController.create`
- `PUT /api/correlativities/:id` -> `validateCorrelativityUpdateData` -> `correlativityController.update`
- `PATCH /api/correlativities/:id` -> `validateCorrelativityUpdateData` -> `correlativityController.update`
- `DELETE /api/correlativities/:id` -> `correlativityController.delete`

### `/api/plans` (studyPlanRoutes.js)
- `GET /api/plans` -> `studyPlanController.getAll`
- `GET /api/plans/:id` -> `studyPlanController.getById`
- `POST /api/plans` -> `validateStudyPlanData` -> `studyPlanController.create`
- `PUT /api/plans/:id` -> `validateStudyPlanUpdateData` -> `studyPlanController.update`
- `PATCH /api/plans/:id` -> `validateStudyPlanUpdateData` -> `studyPlanController.update`
- `DELETE /api/plans/:id` -> `studyPlanController.delete`

### `/api/plan-subjects` (planSubjectRoutes.js)
- `GET /api/plan-subjects` -> `planSubjectController.getAll`
- `GET /api/plan-subjects/:id` -> `planSubjectController.getById`
- `POST /api/plan-subjects` -> `validatePlanSubjectData` -> `planSubjectController.create`
- `PUT /api/plan-subjects/:id` -> `validatePlanSubjectUpdateData` -> `planSubjectController.update`
- `PATCH /api/plan-subjects/:id` -> `validatePlanSubjectUpdateData` -> `planSubjectController.update`
- `DELETE /api/plan-subjects/:id` -> `planSubjectController.delete`

### `/api/subjects` (subjectRoutes.js)
- `GET /api/subjects` -> `subjectController.getAll`
- `GET /api/subjects/:id` -> `subjectController.getById`
- `POST /api/subjects` -> `validateSubjectData` -> `subjectController.create`
- `PUT /api/subjects/:id` -> `validateSubjectUpdateData` -> `subjectController.update`
- `PATCH /api/subjects/:id` -> `validateSubjectUpdateData` -> `subjectController.update`
- `DELETE /api/subjects/:id` -> `subjectController.delete`

### `/api/material` (materialRoutes.js)
- `GET /api/material` -> `materialController.getAll`
- `GET /api/material/student/:student_id` -> `materialController.getByStudentId`
- `GET /api/material/:id` -> `materialController.getById`
- `POST /api/material` -> `validateMaterialData` -> `materialController.create`
- `PUT /api/material/:id` -> `validateMaterialData` -> `materialController.update`
- `DELETE /api/material/:id` -> `materialController.delete`

### `/api/votes` (voteRoutes.js)
- `POST /api/votes` -> `authenticate` -> `validateVoteData` -> `voteController.create`

### `/api/custom-study-plans` (customStudyPlanRoutes.js)
- `GET /api/custom-study-plans` -> `customStudyPlanController.getAll`
- `GET /api/custom-study-plans/:id` -> `customStudyPlanController.getById`
- `POST /api/custom-study-plans` -> `validateCustomStudyPlanData` -> `customStudyPlanController.create`
- `PUT /api/custom-study-plans/:id` -> `validateCustomStudyPlanUpdateData` -> `customStudyPlanController.update`
- `DELETE /api/custom-study-plans/:id` -> `customStudyPlanController.delete`

### `/api/students/:id/enrollments` (studentRoutes.js — anidadas en studentController)
- `GET /api/students/:id/enrollments` -> `studentController.getEnrollments`
- `POST /api/students/:id/enrollments` -> `validateEnrollmentData` -> `studentController.addEnrollment`
- `PUT /api/students/:id/enrollments/:enrollmentId` -> `validateEnrollmentUpdateData` -> `studentController.updateEnrollment`
- `DELETE /api/students/:id/enrollments/:enrollmentId` -> `studentController.deleteEnrollment`

### `/api/instance-subjects` (instanceSubjectRoutes.js)
- `GET /api/instance-subjects` -> `instanceSubjectController.getAll`
- `GET /api/instance-subjects/:id` -> `instanceSubjectController.getById`
- `POST /api/instance-subjects` -> `validateInstanceSubjectData` -> `instanceSubjectController.create`
- `PUT /api/instance-subjects/:id` -> `validateInstanceSubjectUpdateData` -> `instanceSubjectController.update`
- `DELETE /api/instance-subjects/:id` -> `instanceSubjectController.delete`

### `/api/connections` (connectionRoutes.js)
- `POST /api/connections/invite` -> `authenticate` -> `validateInviteData` -> `connectionController.inviteByEmail`
- `GET /api/connections/invitation/:token` -> `authenticate` -> `connectionController.getInvitationByToken`
- `POST /api/connections/invitation/:token/respond` -> `authenticate` -> `validateInvitationResponseData` -> `connectionController.respondInvitation`
- `GET /api/connections` -> `connectionController.getAll`
- `GET /api/connections/:id` -> `connectionController.getById`
- `POST /api/connections` -> `validateConnectionData` -> `connectionController.create`
- `PUT /api/connections/:id` -> `validateConnectionUpdateData` -> `connectionController.update`
- `PATCH /api/connections/:id` -> `validateConnectionUpdateData` -> `connectionController.update`
- `DELETE /api/connections/:id` -> `connectionController.delete`

Nota de flujo vigente en frontend:
- La UI de Conexiones utiliza el flujo de invitación por email (`POST /api/connections/invite`) para crear solicitudes.
- El endpoint `POST /api/connections` permanece disponible por compatibilidad y uso programático.

### `/api/notifications` (notificationRoutes.js)
- `GET /api/notifications` -> `notificationController.getAll`
- `GET /api/notifications/:id` -> `notificationController.getById`
- `POST /api/notifications` -> `validateNotificationData` -> `notificationController.create`
- `PUT /api/notifications/:id` -> `validateNotificationUpdateData` -> `notificationController.update`
- `DELETE /api/notifications/:id` -> `notificationController.delete`

### `/api/sessions` (sessionRoutes.js)
- `GET /api/sessions` -> `sessionController.getAll`
- `GET /api/sessions/:id` -> `sessionController.getById`
- `POST /api/sessions` -> `validateSessionData` -> `sessionController.create`
- `PUT /api/sessions/:id` -> `validateSessionUpdateData` -> `sessionController.update`
- `DELETE /api/sessions/:id` -> `sessionController.delete`

### `/api/reports` (reportRoutes.js)
- `GET /api/reports` -> `reportController.getAll`
- `GET /api/reports/:id` -> `reportController.getById`
- `POST /api/reports` -> `validateReportData` -> `reportController.create`
- `PUT /api/reports/:id` -> `validateReportUpdateData` -> `reportController.update`
- `DELETE /api/reports/:id` -> `reportController.delete`

### `/api/report-reasons` (reportReasonRoutes.js)
- `GET /api/report-reasons` -> `reportReasonController.getAll`
- `GET /api/report-reasons/:id` -> `reportReasonController.getById`
- `POST /api/report-reasons` -> `validateReportReasonData` -> `reportReasonController.create`
- `PUT /api/report-reasons/:id` -> `validateReportReasonUpdateData` -> `reportReasonController.update`
- `DELETE /api/report-reasons/:id` -> `reportReasonController.delete`

### `/api/posts` (postRoutes.js)
- `GET /api/posts` -> `postController.getAll`
- `GET /api/posts/:id` -> `postController.getById`
- `POST /api/posts` -> `authenticate` -> `validatePostData` -> `postController.create`
- `PUT /api/posts/:id` -> `authenticate` -> `validatePostUpdateData` -> `postController.update`
- `PATCH /api/posts/:id` -> `authenticate` -> `validatePostUpdateData` -> `postController.update`
- `DELETE /api/posts/:id` -> `authenticate` -> `postController.delete`

Notas de seguridad en `postController`:
- `create` toma `id_author` desde `req.user.id` cuando hay usuario autenticado.
- `update` y `delete` validan ownership (`id_author === req.user.id`) y devuelven `403` si no coincide.

### `/api/novelties` (noveltyRoutes.js)
- `GET /api/novelties` -> `authenticate` -> `noveltyController.getFeed`

Comportamiento del feed:
- Devuelve novedades de contactos con conexión `accepted`.
- Mezcla eventos académicos (`AcademicRecord` con status `enrolled`, `regular`, `approved`) y `Post`.
- Incluye `Post` de contactos aceptados y también los posteos del usuario autenticado.
- Respeta privacidad académica con `Student.publish_approvals`.
- Ordena por fecha descendente y soporta paginación con `limit` y `offset`.

### `/api/final-exams` (finalExamRoutes.js)
- `GET /api/final-exams` -> `finalExamController.getAll`
- `GET /api/final-exams/:id` -> `finalExamController.getById`
- `POST /api/final-exams` -> `validateFinalExamData` -> `finalExamController.create`
- `PUT /api/final-exams/:id` -> `validateFinalExamUpdateData` -> `finalExamController.update`
- `PATCH /api/final-exams/:id` -> `validateFinalExamUpdateData` -> `finalExamController.update`
- `DELETE /api/final-exams/:id` -> `finalExamController.delete`

### `/api/system-config` (systemConfigRoutes.js)
- `GET /api/system-config` -> `systemConfigController.getAll`
- `GET /api/system-config/:key` -> `systemConfigController.getByKey`
- `POST /api/system-config` -> `validateSystemConfigData` -> `systemConfigController.create`
- `PUT /api/system-config/:key` -> `validateSystemConfigUpdateData` -> `systemConfigController.update`
- `PATCH /api/system-config/:key` -> `validateSystemConfigUpdateData` -> `systemConfigController.update`
- `DELETE /api/system-config/:key` -> `systemConfigController.delete`

---

## Middlewares de Validación

### `authenticate` (authMiddleware)
- `Authorization: Bearer <token>` header requerido.
- Decodifica JWT, busca User por `decoded.sub`.
- Errores: `'No token provided'`, `'Unauthorized or inactive user'`, `'Token expired'`, `'Invalid token'`.

### `requireRole(...roles)` (roleMiddleware)
- Factory que retorna middleware. Verifica `req.user.role` contra roles permitidos.
- Disponible pero actualmente sin uso en rutas.

### `registerValidation` / `loginValidation` (inline en authRoutes con express-validator)
- `registerValidation`: `email` (isEmail), `password` (min 6), `role` (isIn `['admin','student']`), `name`/`lastname` (optional, notEmpty).
- `loginValidation`: `email` (isEmail), `password` (notEmpty).

### `validateAdminData`
- `id_users` requerido, entero.
- `cuil` requerido, string no vacío.

### `validateAdminUpdateData`
- `cuil` opcional, string válido.
- `role` opcional, string válido.

### `validateStudentUpdateData`
- `legajo` opcional, string no vacío.
- `public_profile` opcional, booleano.
- `show_email` opcional, booleano.
- `show_academic_info` opcional, booleano.
- `publish_approvals` opcional, booleano.

### `validateInstituteData`
- `name` requerido, string, mínimo 2 caracteres.
- `short_name` requerido, string.
- `responsible` requerido, string.
- `status` requerido, string.
- `email` requerido, formato email válido.
- `tel` requerido, string.
- `adress` requerido, string.

### `validateInstituteUpdateData`
Mismos campos que create pero todos opcionales.

### `validateCareerData`
- `name` requerido, string, mínimo 2 caracteres.
- `id_institute` requerido, entero válido.
- `degree_title` requerido, string no vacío.
- `duration` requerido, entero válido.
- `code` requerido, string no vacío.

### `validateCareerUpdateData`
Mismos campos que create pero todos opcionales.

### `validateAcademicRecordData`
- `id_student` requerido, entero válido.
- `id_subject` requerido, entero válido.
- `status` requerido, string no vacío.

### `validateAcademicRecordUpdateData`
Mismos campos que create pero todos opcionales.

### `validateCorrelativityData`
- `id_plan_subject_target` requerido, entero.
- `id_required_plan_subject` requerido, entero.
- `type` opcional, string.

### `validateCorrelativityUpdateData`
Mismos campos que create pero todos opcionales.

### `validateStudyPlanData`
- `id_career` requerido, entero.
- `name` requerido, string no vacío.
- `status` requerido, string no vacío.

### `validateStudyPlanUpdateData`
Mismos campos que create pero todos opcionales.

### `validatePlanSubjectData`
- `id_study_plan` requerido, entero.
- `id_subject` requerido, entero.
- `suggested_year` requerido, entero.
- `suggested_term` requerido, entero.

### `validatePlanSubjectUpdateData`
Mismos campos que create pero todos opcionales.

### `validateSubjectData`
- `name` requerido, string no vacío.
- `code` requerido, string no vacío.
- `is_unahur` requerido, booleano.

### `validateSubjectUpdateData`
Mismos campos que create pero todos opcionales.

### `validateMaterialData`
- `id_author` requerido, entero válido.
- `id_subject` requerido, entero válido.
- `title` requerido, string, mínimo 2 caracteres.
- `file_url` requerido, string, mínimo 5 caracteres.
- `status` requerido, string, mínimo 2 caracteres.

### `validateVoteData`
- `target_type` requerido, string (`'material'` o `'post'`).
- `target_id` requerido, entero válido.
- `is_upvote` requerido, booleano.
- `id_student` se obtiene del token JWT (no se envía en el body).

### `validateCustomStudyPlanData`
- `id_student` requerido, entero.
- `name` requerido, string no vacío.

### `validateCustomStudyPlanUpdateData`
- `name` opcional, string no vacío.

### `validateStudentCreateData`
- `email` requerido, string email.
- `password` requerido, string mínimo 6 caracteres.
- `name` requerido, string no vacío.
- `lastname` requerido, string no vacío.
- `dni` requerido, string.
- `phone` opcional, string.
- `enrollments` opcional, array de objetos con `career_id` (entero) y `enrolled_at` (fecha, opcional).

### `validateEnrollmentData`
- `career_id` requerido, entero.
- `enrolled_at` opcional, fecha.
- `status` opcional, string (default `'active'`).

### `validateEnrollmentUpdateData`
- `status` opcional, string.
- `completed_at` opcional, fecha.
- `is_active` opcional, booleano.

### `validateInstanceSubjectData`
- `id_subject` requerido, entero.

### `validateInstanceSubjectUpdateData`
Sin validación (pass-through).

### `validateConnectionData`
- `id_user` requerido, entero.
- `id_connected_user` requerido, entero.

### `validateConnectionUpdateData`
Sin validación (pass-through).

### `validateInviteData`
- `email` requerido, formato email válido.

### `validateInvitationResponseData`
- `action` requerido, valores permitidos: `accept` o `reject`.

### `validateNotificationData`
- `id_user` requerido, entero.
- `type` requerido, string no vacío.
- `title` requerido, string no vacío.
- `message` requerido, string no vacío.

### `validateNotificationUpdateData`
- `type` opcional, string.
- `title` opcional, string.
- `message` opcional, string.
- `read` opcional, booleano.

### `validateSessionData`
- `id_user` requerido, entero.

### `validateSessionUpdateData`
Sin validación (pass-through).

### `validateReportData`
- `id_reporter` requerido, entero.

### `validateReportUpdateData`
Sin validación (pass-through).

### `validateReportReasonData`
- `name` requerido, string no vacío.

### `validateReportReasonUpdateData`
- `name` opcional, string no vacío.

### `validatePostData`
- `id_author` requerido, entero, excepto cuando existe `req.user.id` (flujo autenticado).
- `title` requerido, string no vacío.
- `content` requerido, string no vacío.

### `validatePostUpdateData`
- `title` opcional, string no vacío.
- `content` opcional, string no vacío.

### `validateFinalExamData`
- `id_academic_record` requerido, entero.
- `grade` opcional, string.
- `date` opcional, fecha válida.
- `attempt_number` opcional, entero.

### `validateFinalExamUpdateData`
Mismos campos que create pero todos opcionales.

### `validateSystemConfigData`
- `key` requerido, string no vacío.
- `value` requerido, string no vacío.

### `validateSystemConfigUpdateData`
- `value` requerido, string no vacío.

---

## Contrato de Respuestas API

### Respuestas exitosas
- `200 OK`:
  - Lectura: `{ "data": [...] }` o `{ "data": {...} }`
  - Actualización: `{ "message": "...", "data": {...} }`
  - Eliminación: `{ "message": "..." }`
- `201 Created`:
  - Creación: `{ "message": "... created successfully", "data": {...} }`

### Respuestas de error
- `400 Bad Request` (validación):
  - `{ "error": "Bad Request", "message": "..." }`
- `401 Unauthorized` (auth):
  - `{ "error": "..." }` (según middleware auth/role)
- `404 Not Found` (recurso inexistente):
  - `{ "error": "... not found" }`
  - o `{ "error": "... not found or no changes made" }`
- `500 Internal Server Error` (errores internos/DB):
  - `{ "error": "Error ...", "details": "..." }`

---

## Convenciones CRUD (estándar del repositorio)

### Convenciones de rutas
- Base por recurso en plural (`/api/careers`, `/api/institutes`, `/api/students`).
- Excepciones: `/api/material`, `/api/votes`, `/api/plans`, `/api/auth` (singular).
- Operaciones estándar:
  - `GET /resource`
  - `GET /resource/:id` (o identificador alternativo si aplica)
  - `POST /resource`
  - `PUT /resource/:id` (reemplazo parcial/completo)
  - `PATCH /resource/:id` (alternativa para actualización parcial, donde existe)
  - `DELETE /resource/:id`
- Endpoints alternativos (por ejemplo `student_id`) mantienen consistencia semántica y validación explícita.

### Convenciones de validación
- Todo `POST` y `PUT` debe pasar por middleware de validación.
- Donde existe, `PATCH` usa mismo middleware que `PUT` (ambos con campos opcionales).
- Validaciones mínimas obligatorias:
  - campos requeridos,
  - tipos de dato,
  - formato (fechas/números),
  - longitudes mínimas de strings relevantes.
- La validación responde siempre con `400` y formato uniforme `{ error, message }`.

### Convenciones de controladores
- Cada acción CRUD en bloque `try/catch`.
- Siempre devolver `return` en salidas tempranas (`404`, `400`) para evitar respuestas duplicadas.
- Usar los códigos HTTP correctos por operación (`200`, `201`, `400`, `401`, `404`, `500`).

### Convenciones de respuesta
- Éxito de lectura: usar clave `data`.
- Éxito de mutación: incluir `message` y, cuando aplica, `data`.
- Error de negocio/validación: `error` + `message`.
- Error interno: `error` + `details`.

### Convenciones de nomenclatura
- Archivos y `require()` deben respetar exactamente mayúsculas/minúsculas del filesystem para compatibilidad Linux.
- Mantener un único idioma para mensajes por recurso (actualmente inglés en la mayoría de respuestas).
- Nombres de campos en middlewares usan snake_case con prefijo `id_` para claves foráneas (ej: `id_subject`, `id_author`, `id_student`).
- Archivos PascalCase para modelos (ej: `Subject.js`, `StudyPlan.js`), camelCase para middlewares y controladores (ej: `subjectMiddleware.js`, `studyPlanController.js`).

---

## Verificación realizada (26 de mayo de 2026)

1. Pruebas automáticas backend (Jest):
- 49 suites OK
- 464 tests OK

2. Pruebas de endpoints (smoke test HTTP, sin DB configurada):
- Todos los endpoints responden y enrutan correctamente.
- Endpoints con validación (`POST`/`PUT`) devolvieron `400` esperado con payload inválido.
- Endpoints que dependen de DB devolvieron `500` por credenciales de PostgreSQL inválidas en entorno local, no por falla de rutas/controladores.

3. Pruebas de persistencia completa (E2E con PostgreSQL temporal en Docker):
- Se levantó instancia temporal de PostgreSQL para pruebas aisladas.
- Se inicializó esquema con Sequelize (`sync`) y datos semilla para resolver claves foráneas.
- CRUD verificado para: Institute, Career, AcademicRecord con respuestas `200/201`.
- Conclusión: la persistencia de datos funciona correctamente cuando la conexión a PostgreSQL está configurada.

## Estado operativo actual
- No quedan procesos temporales activos de prueba (servidor y contenedor detenidos).
- Para repetir validación de persistencia local, configurar `.env` con una instancia PostgreSQL accesible.
- Para ejecutar suite completa de tests: `npm test`.
- Para poblar base de datos con datos semilla: `node src/seeders/seedDatabase.js`.
