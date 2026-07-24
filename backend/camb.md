# Cambios en el Backend — Documentación para Frontend

## 1. `subjects` (materias)

| Campo | Cambio |
|---|---|
| `weekly_hours` | **AGREGADO** — se movió desde `plan_subjects` |
| `credits` | **ELIMINADO** — ahora está solo en `plan_subjects` |

Las horas semanales son intrínsecas a la materia, no varían por plan.

```json
// GET /api/subjects
{ "id": 1, "name": "Matemática I", "code": "MAT-101",
  "is_unahur": false, "weekly_hours": 6 }
```

## 2. `plan_subjects` (materia dentro de un plan de estudios)

| Campo | Cambio |
|---|---|
| `weekly_hours` | **ELIMINADO** — ahora está en `subjects` |
| `credits` | **SE CONSERVA** — crédito que aporta esa materia en el plan |

```json
// GET /api/plan-subjects
{ "id": 1, "id_study_plan": 1, "id_subject": 1,
  "suggested_year": 1, "suggested_term": 1, "credits": 4,
  "subject": { "id": 1, "name": "Matemática I", "weekly_hours": 6 } }
```

Para obtener `weekly_hours`: incluir relación `subject` → `ps.subject.weekly_hours`.

## 3. `academic_records` (solo materias)

| Campo eliminado | Motivo |
|---|---|
| `record_type` | Ya no es necesario (solo materias) |
| `name` | Se resuelve por `subject.name` |
| `credits` | Se resuelve por `plan_subject.credits` |
| `id_credit_block` | Ya no aplica (era solo para actividades) |

Ahora **solo registra materias**. Las actividades van a `activity_records`.

```json
// GET /api/academic-records
{ "id": 1, "id_student": 2, "id_subject": 1,
  "plan_subject_id": 50, "course_id": null,
  "year": 2025, "semester": 1, "grade": "8",
  "status": "aprobado", "regularity_expires_at": null }
```

Para mostrar nombre y créditos: incluir `plan_subject.subject` y `plan_subject.credits`.

## 4. `extracurricular_activities` eliminada

Reemplazada por **3 tablas nuevas**:

### 4a. `activities` — Catálogo global de actividades

Tabla nueva. No tiene datos del estudiante (es solo catálogo).

```json
// GET /api/activities
{ "id": 1, "name": "Voluntariado", "description": "..." }
```

### 4b. `plan_credit_block_items` — Actividad dentro de un bloque de créditos

Relación N:M entre `plan_credit_blocks` y `activities`, con `credits`.

```json
{ "id": 1, "id_credit_block": 1, "id_activity": 1, "credits": 2,
  "activity": { "id": 1, "name": "Voluntariado" } }
```

Equivale a `plan_subjects` pero para actividades.

### 4c. `activity_records` — Historial académico del estudiante (actividades)

Misma estructura que `academic_records` pero para actividades.

```json
// GET /api/activity-records
{ "id": 1, "id_student": 2, "id_activity": 1,
  "plan_credit_block_item_id": 1,
  "year": 2025, "semester": 1,
  "grade": "C", "status": "aprobado" }
```

| Campo | Nota |
|---|---|
| `id_activity` | **Obligatorio** — como `id_subject` en `academic_records` |
| `plan_credit_block_item_id` | **Opcional** — como `plan_subject_id` |

Para mostrar nombre: incluir `activity.name`.
Para mostrar créditos: incluir `plan_credit_block_item.credits`.

## 5. `final_exams` — sin cambios

Sigue vinculado solo a `academic_records` (materias). No aplica a actividades.

## 6. Resumen de créditos y horas

Antes (desde `academic_records`/`extracurricular_activities`):
```
record.credits          →  ahora ir por: plan_subject.credits
record.name             →  ahora ir por: subject.name / activity.name
record.weekly_hours     →  ahora ir por: subject.weekly_hours
```

Para el resumen académico (`GET /api/students/:id/summary`), el backend ya resuelve internamente estas relaciones. No deberían cambiar los campos del JSON de respuesta.

## 7. Endpoints nuevos

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/activities` | Lista catálogo de actividades |
| `GET` | `/api/plan-credit-block-items` | Lista items de bloques de crédito |
| `GET/POST/PUT/DELETE` | `/api/activity-records` | CRUD de registros de actividades del estudiante |
