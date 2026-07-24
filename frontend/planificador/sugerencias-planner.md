# Sugerencias y Próximos Pasos — MyPlanner

## Estado actual vs lo que debería ser

### Materias incluidas en la proyección

**Problema:** El algoritmo en `planningAlgorithm.ts::generatePlan` filtra solo `cls !== 'finalizada'`, incluyendo materias `regularizadas` (cursada aprobada con regularidad vigente). Estas materias no deberían planificarse como "a cursar", porque el estudiante ya las cursó y solo le queda rendir el final.

```javascript
// Actual — incorrecto:
const pendingSubjectIds = Array.from(classification.entries())
  .filter(([_, cls]) => cls !== 'finalizada')
  .map(([id, _]) => id);

// Debería ser:
  .filter(([_, cls]) => cls !== 'finalizada' && cls !== 'regularizada')
```

### Exámenes finales como eventos en la proyección

Los finales pendientes no ocupan cupo horario (son de un día), pero deben aparecer en la proyección porque:

1. Si el estudiante no aprueba el final, la materia no se considera `finalizada` y las correlativas que dependen de ella como `finalizada` quedan bloqueadas.
2. El alumno necesita visualizar qué finales debe rendir y en qué cuatrimestre.

**Propuesta:** Agregar un tipo `PlannedEvent` al modelo:

```typescript
interface PlannedEvent {
  type: 'final_exam';
  subject_name: string;
  plan_subject_id: number;
  academic_record_id: number;
  regularity_expires_at: string;
}
```

Y un array `events: PlannedEvent[]` dentro de `PlannedSemester`. La proyección se vería así:

```
| 2026
  [El alumno aprueba el examen final de Análisis Matemático I]
  [El alumno aprueba el examen final de Álgebra]
  C1: Materia 1, Materia 2
  C2: Materia 3, Materia 4
```

**Regla de arrastre:** Si el usuario arrastra un examen final de un cuatrimestre a otro, las materias que dependen de esa correlativa como `finalizada` también se mueven (cascada). Si la correlativa es de tipo `regularidad`, no es necesario moverlas porque la regularidad vigente ya alcanza.

**Fuente de datos:** El endpoint `GET /api/students/:id/pending-finals` (ya usado por MyProgress) devuelve los finales pendientes con vencimientos e intentos. Esa misma data alimentaría los eventos del planificador.

### Bloques UNAHUR y Electivas como cards genéricas

No se puede elegir una materia específica del pool porque es decisión del usuario y no queda bien en una proyección automática.

**Propuesta:** Representar cada bloque como una card genérica:

- **Bloque UNAHUR:** `"Materia UNAHUR I"`, `"Materia UNAHUR II"`, etc.
- **Bloque Electivo:** `"Materia Electiva I"`, `"Materia Electiva II"`, etc.

**Cálculo de horas:** Usar la carga horaria semanal máxima del pool de materias del bloque como estimación conservadora. Si el pool tiene materias de 4hs, 6hs y 8hs, la card se crea con 8hs. Opcionalmente mostrar un tooltip con el rango `"4hs - 8hs según la materia elegida"`.

**Correlativas en electivas:** Las materias dentro del pool electivo pueden tener correlativas. `PlanElectiveBlockSubject` vincula `plan_subject` con `PlanSubject`, y `PlanSubject` ya tiene `RequiredSubjects` a través de `Correlativity`. Si se cargan los bloques en el grafo, las correlativas de las materias del pool se resuelven automáticamente. Si alguna materia del pool tiene correlativas pendientes, el bloque debería marcarse como no disponible hasta cumplirlas (o al menos advertir al usuario que algunas materias del pool estarán bloqueadas).

**Persistencia:** Si el usuario arrastra una card genérica "Electiva I" a un cuatrimestre, se guarda eso. Si después quiere especificar qué materia del pool cursar, podría hacerlo desde otra vista (no el planificador).

---

## Problemas existentes detectados

### Multi-carrera no soportado

`getPlannerData` en `studentController.js` (líneas 494-497) usa `enrollments[0]` sin posibilidad de cambiar de carrera:

```javascript
const enrollment = await StudentCareerEnrollment.findOne({
  where: { student_id: studentId, is_active: true, status: 'active' },
});
```

No acepta `enrollmentId` como query param. El frontend `plannerDataService.ts` solo acepta `studentId`. Ya arreglamos esto en AcademicRecord y MyProgress con la key compartida `selected_enrollment_id` en localStorage.

### Filtro de registros failed/expired

El backend `getAcademicYearBreakdown` ahora filtra registros `desaprobado` y regularidades vencidas antes de procesar el desglose. MyPlanner, en cambio:

1. Recibe todos los `AcademicRecord` sin filtrar (no hay equivalente al `validRecords` filter).
2. Su propio `classifySubjects` procesa estos registros de forma distinta: `desaprobado` → `'faltante'`, vencidas → `'faltante'`.
3. El resultado es que esas materias aparecen como "FALTANTE" en el planificador cuando en el progreso ya no se muestran.

### `getPlannerData` no incluye bloques

El endpoint no devuelve `PlanUnahurBlock`, `PlanElectiveBlock` ni `PlanCreditBlock`. Toda la lógica de bloques que ya existe en `getAcademicYearBreakdown` no está disponible para el planificador.

### `is_unahur` existe pero no se usa

`RawPlanSubject.subject.is_unahur` se envía desde el backend, pero el algoritmo de planificación no lo procesa. Una materia UNAHUR se trata igual que una obligatoria.

### `is_elective` ausente en el modelo

El `frontend.md` original especificaba `is_elective: boolean` en `SubjectGraphNode` y `PlannedSubject`, pero nunca se implementó. Toda materia se trata como obligatoria.

### `anchored` ausente

El mismo documento especificaba `anchored: boolean` en `PlannedSubject` para evitar que el algoritmo mueva materias ubicadas manualmente por el usuario. No se implementó. La cascada del `editEngine` puede reubicar materias que el usuario ya posicionó deliberadamente.

### `_getAvailableSubjects` sin enrollmentId

En `getAcademicYearBreakdown` se corrigió la línea 475 para pasar el enrollmentId. En `getPlannerData` no se usa este método ni hay equivalente.

---

## Arquitectura futura sugerida

### Modelo de datos extendido

```typescript
interface PlannedSubject {
  plan_subject_id?: number;     // null para bloques genéricos
  subject_name: string;
  weekly_hours: number;
  credits: number;
  weight: number;
  anchored: boolean;
  is_elective?: boolean;
  block_type?: 'regular' | 'unahur' | 'elective';
  pool_subject_ids?: number[];  // IDs de materias del pool (para bloques)
  pool_hours_range?: { min: number; max: number };
}

interface PlannedEvent {
  type: 'final_exam';
  subject_name: string;
  plan_subject_id: number;
  academic_record_id: number;
  regularity_expires_at: string;
}

interface PlannedSemester {
  term: number;
  subjects: PlannedSubject[];
  events: PlannedEvent[];
  total_hours: number;
}
```

### Endpoint unificado `getPlannerData`

Agregar al response actual:

- `enrollmentId` como query param opcional
- `unahurBlocks` con sus pool_subjects y horas
- `electiveBlocks` con sus pool_subjects, horas y correlativas
- `pendingFinals` (misma data que `GET /api/students/:id/pending-finals`)
- Filtrar academicRecords igual que en `getAcademicYearBreakdown` (failed/expired out)

### Clasificación de estados

Sincronizar `classifySubjects` del planificador con la lógica del backend:

- `desaprobado` → no aparece en la proyección (se trata como si nunca se hubiera cursado)
- `pendiente` vencida → no aparece en la proyección
- `pendiente` vigente (`regularizada`) → no se planifica como cursada, pero se agrega un `PlannedEvent` de tipo `final_exam` si no tiene final aprobado
- `enrolled` → se planifica como cursada normal (mantener)
- Sin registro → se planifica como cursada normal (mantener)

---

## Nota final

Este plan no contempla ni congela futuros cambios del algoritmo. Está sujeto a modificaciones según feedback de usuarios, evolución de requisitos académicos y refinamiento continuo de la ingeniería. La arquitectura propuesta (graph-based planning, eventos separados, bloques genéricos) busca ser lo suficientemente flexible para absorber cambios sin reescribir todo.
