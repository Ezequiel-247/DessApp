# Resumen de cambios — Sesión

## 1. Modelos reestructurados

### `subjects`
| Cambio | Detalle |
|---|---|
| `weekly_hours` | **AGREGADO** (se movió desde `plan_subjects`) |
| `credits` | **ELIMINADO** (ahora solo en `plan_subjects`) |

### `plan_subjects`
| Cambio | Detalle |
|---|---|
| `weekly_hours` | **ELIMINADO** (se movió a `subjects`) |
| `credits` | **SE CONSERVA** |
| `is_elective` | **AGREGADO** (boolean, default false) |

### `academic_records` — Limpiado
| Campo eliminado | Motivo |
|---|---|
| `record_type` | Ya no distingue materia/actividad |
| `credits` | Se resuelve por relaciones |
| `name` | Se resuelve por relaciones (`subject.name`, `activity.name`) |
| `id_credit_block` | Ya no aplica |

### `extracurricular_activities` → **ELIMINADA**
Reemplazada por 3 tablas nuevas:

### `activities` (nuevo) — Catálogo global
- `id`, `name`, `description`

### `plan_credit_block_items` (nuevo) — N:M actividad↔bloque de crédito
- `id_credit_block`, `id_activity`, `credits`
- Análogo a `plan_subjects` pero para actividades

### `activity_records` (nuevo) — Historial académico de actividades
- `id_student`, `id_activity` (obligatorio, como `id_subject`)
- `plan_credit_block_item_id` (opcional, como `plan_subject_id`)
- `year`, `semester`, `grade`, `status`

### `plan_elective_block_subjects` — Modificado
| Cambio | Detalle |
|---|---|
| `id_subject` | **→ `id_plan_subject`** (ahora referencia `plan_subjects`, no `subjects`) |
| Unique index | `[id_elective_block, id_plan_subject]` |

## 2. Asociaciones nuevas (en `models/index.js`)

```
Activity ↔ PlanCreditBlockItem (1:N)
PlanCreditBlock ↔ Activity (N:M via PlanCreditBlockItem)
PlanCreditBlockItem ↔ ActivityRecord (1:N)
Activity ↔ ActivityRecord (1:N)
PlanElectiveBlockSubject → PlanSubject (belongs to, en vez de Subject)
```

## 3. Seeders

### Modificados
- `subjects.seeder.js` — agregado `weekly_hours` a cada materia
- `planSubjects.seeder.js` — sacado `weekly_hours`, agregadas 9 filas electivas con `is_elective: true`
- `academicRecords.seeder.js` — vaciado (`studentAcademicHistory = []`)
- `activityRecords.seeder.js` — vaciado (`rows = []`)
- `comments.seeder.js` — eliminados los `academic_event` viejos
- `seedDatabase.js` — pasa `planSubjects` a `planElectiveBlockSubjects` seeder

### Creados
- `activities.seeder.js` — 14 actividades globales
- `planCreditBlockItems.seeder.js` — 14 items en 4 bloques de crédito
- `activityRecords.seeder.js` → vaciado

### Eliminados
- `extracurriculars.seeder.js`

## 4. Controllers/Services/Middlewareq

### Modificados
- `academicRecordService.js` — separada lógica de actividades (`ActivityRecord`), actualizada lógica de electivas (`is_elective`)
- `academicRecordController.js` — sin `record_type`, sin `id_credit_block`; `PlanElectiveBlockSubject` ahora incluye `PlanSubject`
- `planSubjectController.js` — sin `weekly_hours`; agregado `is_elective` al payload
- `studentController.js` — `weekly_hours` desde `subject.weekly_hours`; `PlanElectiveBlockSubject` ahora incluye `PlanSubject`
- `planElectiveBlockController.js` — `id_subject` → `id_plan_subject` en create
- `studyPlanController.js` — include de `PlanElectiveBlockSubject` adaptado
- `academicRecordMiddleware.js` — sin validación de `record_type`/`id_credit_block`

### Eliminados
- `extracurricularActivityMiddleware.js`
- `extracurricularActivityController.js`

## 5. Tests
- Archivos de extracurricular eliminados
- `planBlockController.test.js` — adaptado a `id_plan_subject`
- `mocks/mockData.js` — electivas agregadas a `planSubjectsMock` con `is_elective`

## 6. Documentación
- `camb.md` — cambios para frontend
- `resumen.md` — este archivo
