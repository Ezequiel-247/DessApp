# Fix: el planificador no respetaba el vencimiento de la regularidad

## El síntoma

En "Mi Planificador", la card de un "Final pendiente" se podía arrastrar a cualquier cuatrimestre, incluso a uno posterior a la fecha en que vence la regularidad de esa materia (la que se ve en Calificaciones → Editar Registro). Ejemplo real detectado: una materia regularizada en 2do cuatrimestre de 2025 (vence 31/12/2027) se pudo mover hasta 2028 sin que el sistema lo impidiera.

## Causas encontradas (fueron dos bugs distintos, no uno solo)

### 1. La validación del drag-and-drop comparaba solo el año, no el cuatrimestre

**Archivo:** `frontend/src/features/myPlanner/customPlan/hooks/useDndTimeline.ts`

El backend calcula el vencimiento como **31/7** (si regularizaste en 1er cuatrimestre) o **31/12** (si fue en 2do cuatrimestre) — ver `calcularRegularidadExpiresAt` en `backend/src/academicRecordService.js`. Una materia regularizada en 1er cuatrimestre vence a mitad de año, antes de que empiece el 2do cuatrimestre de ese mismo año. La validación original solo comparaba `targetYear > dueYear`, así que en ese caso dejaba pasar el 2do cuatrimestre igual.

**Fix:** ahora se deriva el cuatrimestre real del vencimiento a partir del mes de la fecha (`getMonth() <= 6` → 1er cuatrimestre, si no → 2do) y se compara año **y** cuatrimestre:

```js
const dueDateObj = data.dueDate ? new Date(data.dueDate) : null;
const dueYear = dueDateObj ? dueDateObj.getFullYear() : data.regularizedYear + 2;
const dueSemester = dueDateObj ? (dueDateObj.getMonth() <= 6 ? 1 : 2) : 2;

const isAfterExpiry =
  targetYear > dueYear ||
  (targetYear === dueYear && targetTerm > dueSemester);
```

También se mejoró el mensaje de error que ve el alumno, de *"Ese cuatrimestre está después de que vence la regularidad de la materia"* a **"La regularidad de esta materia vence antes de ese cuatrimestre."**

### 2. El endpoint de edición de calificaciones ignoraba año/cuatrimestre (bug real, no cosmético)

**Archivo:** `backend/src/controllers/academicRecordController.js` (handler `update`, usado por `PATCH/PUT /api/academic-records/:id`)

Este era el bug de fondo. El modal "Editar Registro" calcula y muestra una **vista previa en vivo** del vencimiento a partir de lo que hay tipeado en el formulario (`computeExpiryLabel` en `frontend/src/features/academic-record/utils/academicRecordForm.ts`). Pero al guardar, el `payload` que se persistía en la base **solo incluía** `id_student`, `id_subject`, `grade` (y a veces `status`) — nunca `year`, `semester` ni `regularity_expires_at`, aunque el frontend sí los mandaba. Resultado: cambiabas el año de cursada en el modal, veías la vista previa actualizarse, pero al clickear "Actualizar" ese cambio se descartaba silenciosamente y el registro seguía con su año y vencimiento originales.

**Fix:** el `update` ahora persiste `year`/`semester` si vienen en el body, y si no se manda `regularity_expires_at` explícito pero la nota queda en el rango 4-6 (regulariza), recalcula el vencimiento con `calcularRegularidadExpiresAt(year, semester)` — la misma fórmula que usa el alta de un registro nuevo.

**Test agregado:** `backend/tests/academicRecordController.test.js` — verifica que al editar año/cuatrimestre se recalcula y persiste el vencimiento correcto.

### 3. El seeder de datos de prueba tenía el vencimiento hardcodeado a mano

**Archivo:** `backend/src/seeders/academicRecords.seeder.js`

El año/cuatrimestre de cada registro de prueba se calculaba con `inferPeriod()` (a partir de `planSubject.suggested_year/suggested_term`), pero el campo `regularity_expires_at` era un string literal tipeado a mano (ej. `'2028-12-31'`), sin ninguna relación con ese año/cuatrimestre real. Por eso los datos de prueba mostraban un vencimiento que no coincidía con lo que el propio sistema hubiera calculado — esto fue lo que hizo parecer, al principio, que el planificador estaba mal, cuando en realidad el dato de origen ya venía mal cargado.

**Fix:** se eliminaron los literales hardcodeados; ahora se calcula siempre con `calcularRegularidadExpiresAt(period.year, period.semester)`.

**Antes** — la fecha era un string tipeado a mano, sin relación con el año/cuatrimestre real del registro:

```js
const studentAcademicHistory = [
  { student_index: 5, subject_code: '793', status: 'pendiente', grade: '5', regularity_expires_at: '2028-12-31' },
  { student_index: 5, subject_code: '030', status: 'pendiente', grade: '4', regularity_expires_at: '2028-12-31' },
  // ...
];

// ...

if (student && studyPlan && planSubject) {
  const period = inferPeriod(planSubject, record);
  rows.push({
    id_student: student.user_id,
    id_subject: planSubject.id_subject,
    plan_subject_id: planSubject.id,
    course_id: null,
    year: period.year,
    semester: period.semester,
    status: record.status,
    grade: record.grade,
    regularity_expires_at: record.regularity_expires_at, // <- el literal de arriba, ignora period.year/semester
  });
}
```

**Ahora** — la fecha se calcula a partir del mismo `year`/`semester` que ya se resolvió para ese registro, con la fórmula oficial (`calcularRegularidadExpiresAt`):

```js
const { calcularRegularidadExpiresAt } = require('../academicRecordService');

const studentAcademicHistory = [
  { student_index: 5, subject_code: '793', status: 'pendiente', grade: '5' },
  { student_index: 5, subject_code: '030', status: 'pendiente', grade: '4' },
  // ...
];

// ...

if (student && studyPlan && planSubject) {
  const period = inferPeriod(planSubject, record);
  const regularityExpiresAt = record.status === 'pendiente'
    ? calcularRegularidadExpiresAt(period.year, period.semester)
    : null;

  rows.push({
    id_student: student.user_id,
    id_subject: planSubject.id_subject,
    plan_subject_id: planSubject.id,
    course_id: null,
    year: period.year,
    semester: period.semester,
    status: record.status,
    grade: record.grade,
    regularity_expires_at: regularityExpiresAt, // <- calculado en base a period.year/semester
  });
}
```

Con esto, año/cuatrimestre y vencimiento **siempre** salen del mismo cálculo — no pueden desincronizarse entre sí como pasaba antes.

## Archivos modificados

| Archivo | Cambio |
|---|---|
| `frontend/src/features/myPlanner/customPlan/hooks/useDndTimeline.ts` | Validación año+cuatrimestre exacto + mensaje de error mejorado |
| `backend/src/controllers/academicRecordController.js` | `update` ahora persiste year/semester y recalcula el vencimiento |
| `backend/src/seeders/academicRecords.seeder.js` | Vencimiento calculado, ya no hardcodeado |
| `backend/tests/academicRecordController.test.js` | Test nuevo de regresión |

## Cómo probarlo

1. Reseedear la base: `node backend/src/seeders/seedDatabase.js` (o reiniciar el backend en modo desarrollo, que corre los seeders solo).
2. En Calificaciones, abrir "Editar Registro" de una materia regularizada (nota 4-6, estado Aprobada/Pendiente) y confirmar que el vencimiento mostrado coincide con año+cuatrimestre de cursada.
3. En Mi Planificador, ubicar la card de "Final pendiente" de esa materia y arrastrarla:
   - Hasta el último cuatrimestre válido (el del vencimiento) → debe permitirlo.
   - Un cuatrimestre más allá → debe bloquear con el mensaje "La regularidad de esta materia vence antes de ese cuatrimestre."
4. Correr los tests del backend: `npm test` en `backend/` (728 tests, todos verdes).
