# Plan Original — Sistema de Acompañamiento Estudiantil

## Creación de Materias

Para crear una materia se necesitan dos entidades:

**Subject** (la materia en sí misma)

- `name` — nombre
- `code` — código único (ej. MAT-101)
- `is_unahur` — booleano que la marca como materia de UNAHUR
- `weekly_hours` — opcional (horas semanales)

**PlanSubject** (el vínculo materia-plan)

- `id_study_plan` — a qué plan pertenece
- `id_subject` — qué materia
- `suggested_year` — año sugerido dentro del plan
- `suggested_term` — cuatrimestre sugerido
- `credits` — créditos que aporta
- `is_elective` — booleano, si es una materia electiva dentro de un bloque

Además las **Correlativity** vinculan PlanSubject entre sí con un `type` que puede ser `regularidad`, `aprobacion` o `finalizada`.

Esto ya funciona en SubjectsPage a través del hook `useSubjectsPage`. El frontend tiene SubjectsPage completa con alta/edición de materias, gestión de correlativas con detección de ciclos, y lookup por código.

---

## Creación de Bloques

Después de la limpieza de PlansPage (14/07/2026), los 3 tipos de bloque no tienen UI de gestión. El backend y las entidades del frontend existen, pero falta una página para administrarlos.

### Bloque UNAHUR (`PlanUnahurBlock`)

- `id_study_plan` → FK al plan
- `suggested_year` → año sugerido
- `suggested_term` → opcional
- `sort_order` → opcional

No tiene lista explícita de materias. Las materias UNAHUR se identifican porque el `Subject` tiene `is_unahur = true`. El bloque UNAHUR solo indica "en el año 4 hay que cursar una materia UNAHUR". Las materias que califican se resuelven dinámicamente filtrando subjects del plan con `is_unahur = true`.

### Bloque Electivo (`PlanElectiveBlock`)

- `id_study_plan`
- `name` — nombre del bloque
- `min_required` — cuántas materias elegir del pool (default 1)
- `requires_approved_mandatory_count` — cuántas obligatorias aprobar antes de poder cursar electivas
- `suggested_year`, `sort_order` — opcionales

Se vincula a `PlanSubject` concretos via `PlanElectiveBlockSubject` (join table). Esto permite que una materia dentro del pool electivo tenga sus propias correlativas a través de la tabla `Correlativity`, que ya está modelada y funcional.

### Bloque de Créditos (`PlanCreditBlock`)

- `id_study_plan`
- `name`
- `min_credits_required` — opcional
- `max_credits_allowed` — opcional
- `sort_order` — opcional

Se vincula a `Activity` via `PlanCreditBlockItem` con un `credits` por actividad. Las Activities son tipos de actividades extracurriculares (cursos, seminarios, etc.) que el estudiante puede realizar para obtener créditos.

---

## Campos faltantes en StudyPlan

### Duración: Carrera vs Plan

`Career` tiene `duration` (años de la carrera en abstracto). `Plan` tiene `years_duration` (años del plan en particular). Son conceptualmente distintos aunque relacionados:

- `Career.duration` describe la carrera genérica (ej. "Licenciatura dura 5 años").
- `Plan.years_duration` describe ese plan concreto (ej. "Plan 2026 dura 4 años").

Técnicamente `Plan.years_duration` podría inferirse de `max(suggested_year)` entre sus PlanSubject, pero tenerlo como campo explícito es útil para validación rápida y display. No hay redundancia problemática.

### Total de créditos mínimos para egresar

`StudyPlan` **no tiene** un campo `min_total_credits` o `required_credits`. Hoy el total requerido se calcula implícitamente sumando los créditos de todas las materias obligatorias del plan, pero no hay un valor declarativo. Tenerlo explícito permitiría:

- Mostrar "te faltan X créditos para egresar" sin necesidad de recorrer todo el plan cada vez.
- Soportar planes donde haya créditos optativos por fuera de los bloques.

### Cantidad de bloques UNAHUR requeridos

No hay un contador global como `min_unahur_blocks` en StudyPlan. Hoy la cantidad se infiere de cuántos `PlanUnahurBlock` tiene el plan. Si se quiere flexibilidad (ej. "aprobar 2 de 4 bloques UNAHUR"), convendría un campo explícito.

### Cantidad de bloques electivos requeridos

Similar a UNAHUR: hoy se infiere de los `PlanElectiveBlock` y sus `min_required`. Para planes más flexibles, un campo `min_elective_blocks` en StudyPlan permitiría decir "elegir 2 de estos 5 bloques electivos".

### Otros campos ausentes

- **`weekly_hours` en PlanSubject**: existe en `Subject` como opcional, pero no en el vínculo `PlanSubject` donde tendría más sentido (una misma materia podría tener carga horaria distinta según el plan).
- **`total_credits` calculado en Plan**: no es un campo, pero muchos cálculos (progreso, efficiency) dependen de recorrer todas las PlanSubject. Podría cachearse como campo derivado.

Ninguno de estos es blocker para la implementación actual, pero si se quiere trackeo preciso del progreso hacia egreso sin depender de cálculos implícitos, conviene agregarlos al modelo de datos.
