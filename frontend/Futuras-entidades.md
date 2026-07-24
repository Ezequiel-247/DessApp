# Entidades futuras (pendientes de implementar en backend)

## StudySession (Sesión de Estudio/Mentoría)

### Razón
La página `SessionsPage` muestra un calendario con sesiones de estudio/mentoría,
pero no existe tabla, modelo ni endpoints en el backend.

### Atributos sugeridos

| Campo             | Tipo         | Descripción |
|-------------------|-------------|-------------|
| id                | int (PK, auto) | ID único |
| id_student_host   | int (FK → students.user_id) | Estudiante que organiza/hostea la sesión |
| id_subject        | int (FK → subjects.id) | Materia asociada |
| title             | varchar(255) | Título de la sesión (ej: "Tutoría: Cálculo III") |
| description       | text         | Descripción opcional |
| type              | enum('mentoria', 'grupo_estudio', 'tutoria', 'consulta') | Tipo de sesión |
| date              | date         | Fecha de la sesión |
| start_time        | time         | Hora de inicio |
| end_time          | time         | Hora de fin |
| location          | varchar(255) | Ubicación (aula, sala virtual, etc.) |
| modality          | enum('presencial', 'virtual', 'mixto') | Modalidad |
| max_attendees     | int          | Cupo máximo (0 = ilimitado) |
| status            | enum('abierta', 'completa', 'cancelada', 'finalizada') | Estado |
| recurrence        | json         | Regla de recurrencia (ej: RRULE semanal) |

### Observaciones
- El calendario actual de SessionsPage es hardcodeado a Oct 2023 y no tiene
  integración con APIs reales.
- Se necesitaría además una tabla `StudySessionAttendee` para registrar
  asistentes si se quiere control de cupo.
- Alternativa más simple si no se necesita recurrencia: tabla plana sin RRULE.
- Otra alternativa: no crear entidad nueva y usar `InstanceSubject` (comisiones)
  si las sesiones representan horarios de cursada, no tutorías.

## Dashboard (Endpoint compuesto)

### Razón
La página `DashboardPage` consume un objeto `DashboardData` mockeado que
combina datos de múltiples fuentes. No existe un endpoint único que los agregue.

### Datos que no tienen entidad propia

| Concepto | Alternativa |
|----------|-------------|
| `upcomingSessions` | Depende de `StudySession` (ver arriba). Mientras no exista, se puede omitir o reemplazar por `InstanceSubject` (próximas comisiones/exámenes). |
| `contactActivity` | Feed de actividad de contactos (ej: "Juan aprobó Análisis Matemático"). No tiene entidad. Se podría implementar como tabla `ActivityLog` o endpoint que exponga `AcademicRecord` + `User` de conexiones aceptadas. |
| `currentSubjects` | Estado y progreso de materias en curso. Se podría calcular desde `AcademicRecord` donde `status = 'pending'` + `InstanceSubject` para profesor/horario. |
| `nextGoal` | Meta calculada (ej: "Seminario de Grado"). Lógica de negocio, no entidad. |

### Atributos sugeridos (ActivityLog)

| Campo       | Tipo | Descripción |
|-------------|------|-------------|
| id          | int (PK, auto) | ID único |
| id_user     | int (FK → users.id) | Usuario que realizó la acción |
| action_type | enum('approved_subject', 'enrolled', 'achievement', 'post') | Tipo de actividad |
| description | varchar(255) | Texto legible (ej: "aprobó Análisis Matemático") |
| id_reference| int | ID del recurso relacionado (subject, post, etc.) |
| created_at  | timestamp | Fecha de la actividad |

### Observaciones
- Un endpoint `GET /api/students/:id/dashboard` podría armar el objeto completo
  consultando varias tablas y devolver la estructura que el frontend espera.
- Hasta que exista, DashboardPage se queda con datos mock.

## Like / PostReaction (Reacciones a posts)

### Razón
La página `ConnectionsPage` muestra un feed de posts con métricas de likes y
comentarios, pero la entidad `Post` del backend solo tiene `title` y `content`.

### Atributos sugeridos (Like)

| Campo      | Tipo | Descripción |
|------------|------|-------------|
| id         | int (PK, auto) | ID único |
| id_post    | int (FK → posts.id) | Post al que se reacciona |
| id_user    | int (FK → users.id) | Usuario que reacciona |
| type       | enum('like', 'celebrate', 'support', 'insight') | Tipo de reacción |
| created_at | timestamp | Fecha de la reacción |

### Observaciones
- Alternativa más simple: columna `likes_count` en `posts` sin tabla aparte.
- Si se quiere comentarios, crear tabla `PostComment`.

## ConnectionSuggestion / UserRecommendation (Sugerencias de conexión)

### Razón
ConnectionsPage muestra una sección "Sugerencias" con usuarios recomendados
para conectar. El backend no tiene lógica de recomendaciones.

### Observaciones
- Podría implementarse como un endpoint `GET /api/connections/suggestions/:user_id`
  que devuelva usuarios con misma carrera, mismas materias cursadas, etc.
- No requiere tabla nueva; es una query de negocio sobre `User`, `Student`,
  `AcademicRecord` y `StudentCareerEnrollment`.

## AcademicProgress (Cálculo de progreso académico)

### Razón
La página `ProgressPage` muestra el resumen de avance de carrera (materias
aprobadas, pendientes, desaprobadas, promedio, créditos) y una tabla de materias
agrupadas por año. Actualmente todo está hardcodeado.

### Estrategia sugerida
No se necesita una entidad nueva. El progreso se calcula combinando datos
existentes:

1. **Plan de estudio del estudiante** → `StudyPlan` + `PlanSubject` + `Subject`
   - Se obtienen todas las materias que componen la carrera con su año sugerido,
   - créditos y correlatividades.
2. **AcademicRecord del estudiante** → `AcademicRecord`
   - Se obtienen los registros académicos del estudiante (materias cursadas,
   - notas, estados).
3. **Cruce de datos**:
   - `approved` = cantidad de `AcademicRecord` con status `approved`
   - `pending` = cantidad de `AcademicRecord` con status `pending`
   - `failed` = cantidad de `AcademicRecord` con status `failed`
   - `averageGrade` = promedio de notas de todas las cursadas
   - `totalCredits` = suma de créditos de materias aprobadas
   - Materias agrupadas por `suggested_year` del `PlanSubject`

### Observaciones
- Un endpoint `GET /api/students/:id/progress` en el backend podría hacer este
  cálculo y devolver la estructura limpia al frontend.
- Alternativa: calcularlo en el frontend haciendo dos fetch:
  `GET /api/study-plans/:planId` (con includes de PlanSubject+Subject) y
  `GET /api/academic-records/student/:student_id`.
- La tabla de `SubjectProgress` actualmente usa un modelo (`DisplaySubject`)
  distinto al del hook (`SubjectProgress`). Habría que unificarlos.
- Las materias del plan de estudio pueden no tener correlato en AcademicRecord
  (nunca cursadas) → mostrar como "PENDIENTE" sin nota.

## CustomStudyPlan (Plan de estudio personalizado)

### Razón
La página `PlannerPage` permite al estudiante armar un plan de cursada
seleccionando materias disponibles para un cuatrimestre. Actualmente está
totalmente mockeada.

### Estado del backend
Ya existe la entidad `CustomStudyPlan` con campos: `id, id_student, name, weekly_hours`.
También existe `PlanSubject` con: `id, id_study_plan, id_subject, suggested_year,
suggested_term, weekly_hours, credits`.

### Lo que falta
1. **Endpoints para vincular materias al plan custom**: no hay ruta para agregar
   `PlanSubject` a un `CustomStudyPlan` específico. El backend trata `PlanSubject`
   como parte del plan de estudio oficial, no del plan personalizado.
2. **Entidad `CustomStudyPlan` en frontend**: no existe ni model ni API.
3. **Lógica de correlatividades/locked**: el mock muestra materias "bloqueadas"
   por correlativas. No hay endpoint que devuelva esta info.

### Estrategia futura sugerida
- El plan personalizado debería permitir seleccionar materias del `PlanSubject`
  del plan de estudio oficial del estudiante.
- Las materias disponibles serían las del plan oficial no cursadas aún (según
  `AcademicRecord`).
- Las correlatividades se obtendrían de `Correlativity` (si existe la tabla) o
  de la lógica de `PlanSubject.prerequisites`.

## Material — Campos eliminados (rating, tags)

### Cambios realizados
Durante la migración de `MaterialsPage` a la API real, se hicieron estos ajustes:

| Campo mock | Reemplazo | Razón |
|------------|-----------|-------|
| `rating.up` / `rating.down` | `totalUpvotes` (número entero, puede ser negativo) | El backend solo tiene `Material.total_upvotes` como contador neto (up − down). Cada `MaterialVote` con `is_upvote=true` lo incrementa, con `false` lo decrementa. |
| `tags: string[]` | Eliminado | El backend no tiene campo de tags. Se hardcodean íconos por tipo (`pdf`/`video`/`link`). |
| `url` | `fileUrl` (`file_url` en backend) | El backend almacena `file_url`. |

### Cómo implementar rating por separado (up / down) en el futuro
Si se quiere mostrar "124 up · 6 down" en vez de un score neto:

1. **Opción A — Calcular desde MaterialVote**: consultar la tabla `material_votes`
   contando los registros donde `is_upvote = true` y `is_upvote = false` para
   cada material. Agregar endpoint `GET /api/material/:id/votes/stats` que
   devuelva `{ up: number, down: number }`.

2. **Opción B — Agregar columnas al Material**: agregar `total_downvotes` a la
   tabla `materials` y actualizar los hooks de `MaterialVote` para mantener ambos
   contadores. Más simple pero datos duplicados.

### Cómo implementar tags (etiquetas) en el futuro
1. Crear tabla `MaterialTag` con: `id, id_material (FK), tag (varchar)`.
2. O crear tabla `Tag` con: `id, name` + tabla puente `MaterialTag`.
3. Agregar un campo `tags` como JSON array en `Material` si no se necesita
   búsqueda indexada por tag.
4. Modelo frontend: agregar `tags: string[]` al interface `Material`.
5. En el seeder actual los materiales no tienen tags, habría que agregarlos.

## Session (ya existe, pero solo para auth)

La entidad `Session` del backend solo almacena tokens JWT. No está relacionada
con el concepto de "sesión de estudio". Considerar renombrar la tabla a
`AuthSession` para evitar confusión si se crea `StudySession`.

## Subjects por Carrera (Filtro por Career)

### Problema actual
La función `getSubjectsByCareer(careerId)` en `entities/Subject/api/subjectApi.ts`
envía `GET /api/subjects?careerId=X` pero el backend ignora el query parameter.
La tabla `subjects` no tiene columna `careerId` y el controller no filtra por ese
campo. La función devuelve **todas** las materias sin filtrar por carrera.

Actualmente **no es usada** por ningún componente del frontend. Se renombró a
`getAllSubjects` para reflejar su comportamiento real.

### Estrategia futura sugerida
Para filtrar materias por carrera correctamente hay que atravesar la jerarquía:

```
Career → StudyPlan (id_career) → PlanSubject (id_study_plan) → Subject (id_subject)
```

**Opción A — Endpoint backend dedicado (recomendada):**
Agregar filtro `GET /api/subjects?careerId=X` en el backend que haga el JOIN:

```sql
SELECT subjects.* FROM subjects
JOIN plan_subjects ON plan_subjects.id_subject = subjects.id
JOIN study_plans ON study_plans.id = plan_subjects.id_study_plan
WHERE study_plans.id_career = X
```

En `subjectController.js`, modificar `getAll` para aceptar `careerId`:

```javascript
if (req.query.careerId) {
  whereClause['$study_plan.career_id$'] = req.query.careerId;
}
```

O usando un `include` con `through` si se configura la asociación.

**Opción B — Cálculo en frontend (alternativa):**
Combinar llamadas existentes desde el frontend:
1. `getPlans(careerId)` → obtener planes de la carrera
2. `getPlanSubjects()` → obtener todos los plan-subjects
3. Filtrar plan-subjects por `planId` en los planes obtenidos
4. Extraer `subjectId` únicos y hacer `getSubjects()` → filtrar por esos IDs

Desventaja: múltiples llamadas y lógica duplicada con SubjectsPage/PlansPage.
