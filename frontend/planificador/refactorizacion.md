# Plan de Refactorización: Sistema de Bloques (UNAHUR + Electivas)

## Objetivo

Reemplazar el sistema actual donde UNAHUR y electivas se agregan 1:1 como `PlanSubject` en cada plan, por un sistema de **bloques genéricos** que representan slots cumplibles por cualquier materia del tipo correspondiente.

---

## 1. Modelo de datos unificado

### 1.1 Tabla `plan_blocks` (reemplaza a `plan_unahur_blocks`)

| Columna | Tipo | Notas |
|---|---|---|
| `id` | INT PK AUTO | |
| `id_study_plan` | INT FK → study_plans.id | CASCADE DELETE |
| `type` | ENUM('unahur', 'elective') | Discriminador. Futuro: 'credits' |
| `suggested_year` | INT | Año sugerido en el plan |
| `suggested_term` | INT | nullable |
| `display_order` | INT | Orden |
| `name` | VARCHAR(255) | Auto: "Materia UNAHUR N" / "Electiva N" |
| `created_at` / `updated_at` | TIMESTAMP | |

### 1.2 Tabla `plan_block_subjects` (solo para electivas)

Vincula PlanSubjects (marcados `is_elective: true`) a un bloque electivo.

| Columna | Tipo | Notas |
|---|---|---|
| `id` | INT PK AUTO | |
| `id_plan_block` | INT FK → plan_blocks.id | CASCADE DELETE |
| `id_plan_subject` | INT FK → plan_subjects.id | CASCADE DELETE |
| `created_at` / `updated_at` | TIMESTAMP | |

### 1.3 Tabla `plan_block_correlativities` (solo para electivas)

Correlativas a nivel de bloque (NO a nivel de PlanSubject individual).

| Columna | Tipo | Notas |
|---|---|---|
| `id` | INT PK AUTO | |
| `id_plan_block` | INT FK → plan_blocks.id | CASCADE DELETE |
| `id_required_plan_subject` | INT FK → plan_subjects.id | Materia requerida |
| `type` | ENUM('regularidad','aprobacion','finalizada') | |
| `created_at` / `updated_at` | TIMESTAMP | |

### 1.4 Modelos existentes (sin cambios estructurales)

- `Subject.is_unahur` — boolean global ✅
- `PlanSubject.is_elective` — boolean por plan ✅ (ya existe)
- `StudyPlan.required_unahur_subjects` — define cuántos bloques UNAHUR crear
- `StudyPlan.required_elective_blocks` — INT, default 0. **nuevo**: define cuántos bloques electivos crear

### 1.5 Sync de bloques (al guardar el plan)

- Si `required_unahur_subjects` (o `required_elective_blocks`) **aumenta**: se crean bloques nuevos al final con valores default
- Si **disminuye**: se eliminan los últimos bloques (mayor `display_order`) hasta ajustar el count
- Los bloques existentes conservan su año/cuatrimestre personalizado al hacer sync

---

## 2. Comportamiento por tipo de bloque

### 2.1 Bloques UNAHUR (`type = 'unahur'`)

| Aspecto | Comportamiento |
|---|---|
| Creación | Se generan N bloques según `required_unahur_subjects` al guardar el plan |
| Prerrequisitos | **No tiene** (siempre disponible) |
| Contenido | Ninguno explícito. Cualquier materia con `is_unahur: true` sirve |
| Cumplimiento | `approved_unahur = min(blocksCount, passedCount)`. FIFO: 1 materia = 1 bloque |
| En breakdown | Aparecen en su año sugerido como items especiales (`is_unahur_block: true`) |

### 2.2 Bloques Electivos (`type = 'elective'`)

| Aspecto | Comportamiento |
|---|---|
| Creación | Se generan N bloques según `required_elective_blocks` al guardar el plan |
| Prerrequisitos | **Tiene**. Se agregan a nivel de bloque (`plan_block_correlativities`) |
| Contenido | Se agregan PlanSubjects donde `is_elective = true` vía `plan_block_subjects` |
| Cumplimiento | Si el alumno aprueba **cualquiera** de las materias del bloque, cumple el bloque |
| En breakdown | Aparecen en su año sugerido. Se verifica cumplimiento contra `academic_records` |
| Correlativas individuales | Las materias electivas dentro del bloque **NO tienen** correlativas propias |
| En breakdown normal | **No aparecen** en el desglose normal por años — solo se renderizan dentro del bloque |

---

## 3. Reglas de negocio

### 3.1 `is_unahur` vs `is_elective` — mutuamente excluyentes

- Si `Subject.is_unahur === true` → todos sus `PlanSubject.is_elective = false`
- Si se cambia `Subject.is_unahur` de `false` a `true`:
  1. Se eliminan todas las `Correlativity` donde ese PlanSubject sea target
  2. Se setea `PlanSubject.is_elective = false` en todos los planes
- Si se cambia `Subject.is_unahur` de `true` a `false`:
  - La materia vuelve a ser normal, puede tener PlanSubjects con is_elective y correlativas

### 3.2 Electivas no pueden tener correlativas individuales

- Si `PlanSubject.is_elective === true` → no puede tener `Correlativity` donde sea target
- Las correlativas van al **bloque** electivo via `plan_block_correlativities`
- Si se marca un PlanSubject como `is_elective: true`, se eliminan sus correlativas existentes

### 3.3 En AcademicRecord (estudiante)

- **UNAHUR**: se crea con `plan_subject_id = null` (backend detecta `subject.is_unahur`)
- **Electivas**: se crea normalmente con `plan_subject_id` al PlanSubject electivo. El backend debe verificar que el bloque electivo al que pertenece tenga las correlativas cumplidas (no la materia individual)

---

## 4. Frontend — Admin

### 4.1 PlansPage

| Campo | Comportamiento |
|---|---|
| `requiredUnahurSubjects` (input numérico) | Al guardar, crea/elimina `plan_blocks` de tipo `'unahur'` |
| `requiredElectiveBlocks` (input numérico, **nuevo**) | Al guardar, crea/elimina `plan_blocks` de tipo `'elective'` |

### 4.2 SubjectsPage

**Checkbox `is_elective`** (nuevo):

| Estado del formulario | `is_elective` visible? | `is_elective` enabled? |
|---|---|---|
| Creando Subject nuevo (code not found) | ❌ Oculto | — |
| Agregando Subject existente al plan (code exists) | ✅ Visible | ✅ Enabled |
| Editando PlanSubject existente | ✅ Visible | ✅ Enabled |

**Sección "Bloques UNAHUR"**:
- Lista los `plan_blocks` con `type = 'unahur'` del plan seleccionado
- Cada bloque: nombre, año sugerido, cuatrimestre — editable
- Ícono de candado abierto (siempre disponible, sin correlativas)
- No permite agregar materias dentro (cualquier UNAHUR sirve)

**Sección "Bloques Electivos"**:
- Lista los `plan_blocks` con `type = 'elective'` del plan seleccionado
- Cada bloque editable: nombre, año sugerido, cuatrimestre
- **Prerrequisitos del bloque**: modal para agregar correlativas (reutilizar lógica de `CorrelativityModal`)
- **Materias del bloque**: dropdown que lista solo PlanSubjects con `is_elective = true` del plan actual. Botón "Agregar materia al bloque"
- Las materias del bloque se muestran listadas debajo

**Edición de PlanSubject existente**:
- Si tiene `is_elective = true` → sección de correlativas deshabilitada con mensaje: "Las correlativas se gestionan a nivel del bloque electivo"
- Si se cambia `is_unahur` a `true` → se fuerza `is_elective = false` y se borran correlativas

---

## 5. Frontend — Student

### 5.1 AcademicRecordPage

- UNAHUR: dropdown muestra **todos** los `Subject` con `is_unahur=true` globalmente (no filtrados por plan)
- Electivas: dropdown mezclado con materias normales (ya funcionan porque tienen PlanSubject)
- La validación de prerrequisitos del bloque electivo se hace al guardar el record

> **IMPORTANTE:** Toda lógica que se modifique en AcademicRecord (creación, validación de correlativas, resolución de UNAHUR sin `plan_subject_id`, etc.) aplica tanto al **formulario web** como a la **subida por Excel**.

### 5.2 MyProgress

- **ConditionsGrid**: se mantiene "Materias UNAHUR X/Y". **No se agrega contador de electivas** (quedan implícitas en el desglose por años)
- **YearAccordion**: tanto bloques UNAHUR como electivos aparecen como items especiales en su año sugerido
  - UNAHUR: 🔓 si hay materias UNAHUR aprobadas suficientes para cubrir el bloque acumulativamente
  - Electivas: 🔓 si hay al menos una materia del bloque aprobada, 🔒 si no + tooltip con prerrequisitos del bloque

---

## 6. Backend — Endpoints

### 6.1 CRUD de bloques (reemplaza a planUnahurBlockController)

| Método | Endpoint | Propósito |
|---|---|---|
| `GET` | `/api/study-plans/:studyPlanId/blocks?type=unahur\|elective` | Listar bloques por tipo |
| `POST` | `/api/study-plans/:studyPlanId/blocks` | Crear bloque (type, year, term, name) |
| `PUT` | `/api/blocks/:id` | Editar año/cuatrimestre/nombre |
| `DELETE` | `/api/blocks/:id` | Eliminar bloque |
| `POST` | `/api/study-plans/:studyPlanId/sync-blocks` | Sincronizar bloques según `required_unahur_subjects` y `required_elective_blocks` |

### 6.2 CRUD de materias dentro de bloques electivos

| Método | Endpoint | Propósito |
|---|---|---|
| `POST` | `/api/blocks/:blockId/subjects` | Agregar PlanSubject al bloque |
| `DELETE` | `/api/blocks/:blockId/subjects/:planSubjectId` | Sacar PlanSubject del bloque |

### 6.3 CRUD de correlativas de bloques

| Método | Endpoint | Propósito |
|---|---|---|
| `GET` | `/api/blocks/:blockId/correlativities` | Listar correlativas del bloque |
| `POST` | `/api/blocks/:blockId/correlativities` | Agregar correlativa al bloque |
| `PUT` | `/api/block-correlativities/:id` | Editar tipo |
| `DELETE` | `/api/block-correlativities/:id` | Eliminar correlativa |

### 6.4 Endpoints existentes a modificar

| Endpoint | Cambio |
|---|---|
| `GET /api/academic-summary` | Sumar lógica de bloques electivos cumplidos |
| `GET /api/academic-year-breakdown` | Incluir ambos tipos de bloques en el breakdown |
| `POST /api/academic-records` | Aceptar UNAHUR sin plan_subject_id; validar prerreq. del bloque electivo |
| `GET /api/subjects?is_unahur=true` | Ya existe ✅ |
| `GET /api/plan-subjects?is_elective=true` | Filtrar PlanSubjects por is_elective (nuevo query param) |
| `POST /api/simulate-what-if` | Aceptar `id_subject` para UNAHUR (sin PlanSubject) |
| `POST /api/generate-plan` | Considerar bloques electivos en la planificación |

---

## 7. Lógica de cumplimiento de bloques (backend)

### `getAcademicSummary`
```
UNAHUR:
  blocksCount = count(plan_blocks WHERE type='unahur')
  passedCount = count(AcademicRecord WHERE subject.is_unahur=true AND finalized)
  approved_unahur = min(blocksCount, passedCount)

ELECTIVAS:
  blocksCount = count(plan_blocks WHERE type='elective')
  approved_elective = 0
  For each elective block:
    blockSubjectIds = plan_block_subjects WHERE id_plan_block = block.id
    If ANY AcademicRecord WHERE plan_subject_id IN blockSubjectIds AND finalized:
      approved_elective += 1
```

### `getAcademicYearBreakdown`
```
Para cada año:
  1. PlanSubjects normales (como hoy)
  2. Bloques UNAHUR: plan_blocks WHERE type='unahur' AND suggested_year = year
     - Classification: fifo(cumulativePassedCount, blockIndex)
  3. Bloques electivos: plan_blocks WHERE type='elective' AND suggested_year = year
     - Classification: 'finalizada' si hay record aprobado de alguna materia del bloque
       'faltante' si no, con available=true/false según correlativas del bloque
```

---

## 8. Simulador "¿Qué pasa si...?"

- Para UNAHUR: el simulador acepta `id_subject` en lugar de `plan_subject_id`
- Para electivas: funciona como hoy, con `plan_subject_id`

---

## 9. Fases de implementación

| Fase | Descripción |
|---|---|
| 1 | Modelos: `PlanBlock`, `PlanBlockSubject`, `PlanBlockCorrelativity` + migraciones |
| 2 | Backend CRUD de bloques + sync de UNAHUR y electivas según `required_unahur_subjects` / `required_elective_blocks` |
| 3 | Backend CRUD de materias electivas dentro de bloques + correlativas de bloque |
| 4 | Frontend PlansPage: agregar `requiredElectiveBlocks`, sincronizar ambos tipos de bloques |
| 5 | Frontend SubjectsPage: secciones Bloques UNAHUR / Electivos, checkbox `is_elective` |
| 6 | Backend `getAcademicSummary` + `getAcademicYearBreakdown`: lógica de cumplimiento |
| 7 | Backend `POST /academic-records`: aceptar UNAHUR sin `plan_subject_id`, validar correlativas del bloque electivo |
| 8 | Frontend MyProgress: YearAccordion renderiza items de bloque UNAHUR y electivos |
| 9 | Simulador + cleanup de código legacy |
