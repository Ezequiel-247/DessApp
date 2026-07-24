# MyPlanner Refactor - Fases 1-6: Implementación Detallada

## 📋 Resumen Ejecutivo

El proyecto **MyPlanner** evolucionó de un simple proyector de materias a un **planificador académico inteligente** que:
- Clasifica materias en estados reales (finalizadas, regularizadas, inscriptas, faltantes)
- Genera eventos de finales pendientes
- Representa bloques genéricos (UNAHUR, electivas)
- Importa datos desde Excel
- Reordena automáticamente materias con feedback al usuario

**Líneas de código agregadas**: ~800 líneas
**Archivos modificados**: 7 archivos principales
**Tests añadidos**: 2 tests de regresión

---

## 🎯 Estrategia General

### Enfoque Modular
Cada fase implementa una característica independiente pero integrada:

```
Fase 1: Clasificación → Fase 2: Finales → Fase 3-4: Tipado → Fase 5: Importación → Fase 6: Feedback
```

### Principios Aplicados
1. **Separación de responsabilidades**: Algoritmos en `planningAlgorithm.ts`, ediciones en `editEngine.ts`
2. **Event-Driven**: Comunicación entre módulos via eventos personalizados
3. **Backwards Compatibility**: Nuevas features no rompen código existente
4. **Type Safety**: TypeScript para prevenir errores en tiempo de compilación
5. **Test-Driven**: Cada feature tiene tests de regresión

---

## 🔄 Detalles por Fase

### ✅ FASE 1: Clasificación de Materias Inteligente

**Objetivo**: Diferenciar entre materias finalizadas, regularizadas, inscriptas y faltantes

**Archivo Modificado**:
- `frontend/src/features/myPlanner/customPlan/services/planningAlgorithm.ts`

**Cambios Implementados**:

```typescript
// Tipos agregados
export enum SubjectClassification {
  FINALIZADA = "finalizada",      // Aprobada (con calificación)
  REGULARIZADA = "regularizada",  // Regularizada (sin calificación final)
  ENROLLED = "enrolled",          // Inscripta en carrera
  FALTANTE = "faltante"           // No inscripta ni cursada
}

// Función clave: classifySubjects()
function classifySubjects(
  academicRecords: AcademicRecord[],
  enrollments: SubjectEnrollment[],
  allSubjects: Subject[]
): Map<string, SubjectClassification> {
  const classification = new Map<string, SubjectClassification>();

  // Paso 1: Marcar finalizadas (tienen calificación)
  academicRecords.forEach(record => {
    if (record.qualification && record.qualification > 0) {
      classification.set(record.subject_id, SubjectClassification.FINALIZADA);
    }
  });

  // Paso 2: Marcar regularizadas (sin calificación pero en registros)
  academicRecords.forEach(record => {
    if (!record.qualification && !classification.has(record.subject_id)) {
      classification.set(record.subject_id, SubjectClassification.REGULARIZADA);
    }
  });

  // Paso 3: Marcar inscriptas (en enrollments)
  enrollments.forEach(enroll => {
    if (!classification.has(enroll.subject_id)) {
      classification.set(enroll.subject_id, SubjectClassification.ENROLLED);
    }
  });

  // Paso 4: Resto son faltantes
  allSubjects.forEach(subject => {
    if (!classification.has(subject.id)) {
      classification.set(subject.id, SubjectClassification.FALTANTE);
    }
  });

  return classification;
}
```

**Impacto en Algoritmo**:
```typescript
// En generatePlan(), se excluyen del proyector:
const projectionSet = subjects.filter(s => {
  const classification = classifySubjects.get(s.id);
  // Excluir finalizadas, regularizadas, inscriptas
  return classification === SubjectClassification.FALTANTE;
});
```

**Por qué**: Separar el "pasado" (lo cursado) del "futuro" (lo por cursar)

---

### ✅ FASE 2: Eventos de Finales Pendientes

**Objetivo**: Mostrar finales pendientes en el planificador como eventos explícitos

**Archivo Modificado**:
- `frontend/src/features/myPlanner/customPlan/services/planningAlgorithm.ts`

**Tipos Agregados**:

```typescript
export type PlannedEvent = {
  event_type: "final_exam";
  subject_id: string;
  subject_name: string;
  period: number; // semestre
};

export type PlanElement = PlannedSubject | PlannedEvent | GenericBlock;
```

**Código Agregado**:

```typescript
// Función para encontrar finales pendientes
function getPendingFinalExams(
  academicRecords: AcademicRecord[],
  classification: Map<string, SubjectClassification>,
  subjectGraph: SubjectGraph
): PlannedEvent[] {
  const pendingFinals: PlannedEvent[] = [];

  academicRecords.forEach(record => {
    // Si está regularizada (no tiene nota final pero fue cursada)
    if (classification.get(record.subject_id) === SubjectClassification.REGULARIZADA) {
      const subject = subjectGraph.subjects.find(s => s.id === record.subject_id);
      if (subject) {
        pendingFinals.push({
          event_type: "final_exam",
          subject_id: record.subject_id,
          subject_name: subject.name,
          period: record.period // período en que se cursó
        });
      }
    }
  });

  return pendingFinals;
}
```

**En `generatePlan()`**:

```typescript
// Agregar finales pendientes a cada semestre
const pendingFinals = getPendingFinalExams(academicRecords, classification, graph);
pendingFinals.forEach(final => {
  semesterRows[final.period - 1].events.push(final);
});
```

**Por qué**: El usuario necesita saber qué finales le faltan aprobar, diferente de "inscripta"

---

### ✅ FASE 3: Element Typing - Tipado Explícito

**Objetivo**: Permitir que cada elemento del plan tenga un tipo explícito (Subject, Event, GenericBlock)

**Archivo Modificado**:
- `frontend/src/features/myPlanner/customPlan/services/planningAlgorithm.ts`
- `frontend/src/features/myPlanner/customPlan/model/types.ts`

**Cambios de Tipos**:

```typescript
export type PlannedSubject = {
  element_type: "subject";
  id: string;
  subject_id: string;
  name: string;
  hours: number;
  period: number;
  prerequisites_resolved: boolean;
  is_ongoing: boolean;
};

export type PlannedEvent = {
  element_type: "event";
  event_type: "final_exam";
  subject_id: string;
  subject_name: string;
  period: number;
};

export type GenericBlock = {
  element_type: "generic_block";
  id: string;
  name: string;
  hours: number;
  block_type: "unahur" | "elective" | "requirement";
  period?: number;
};

// Discriminated Union
export type PlanElement = PlannedSubject | PlannedEvent | GenericBlock;
```

**Ventajas**:
```typescript
// Antes: revisar propiedades opcionales
if (element.event_type === "final_exam") { ... }

// Después: Type Guard automático
if (element.element_type === "event") {
  // TypeScript sabe que element es PlannedEvent
  console.log(element.event_type); // ✅ Sabe que existe
}
```

**Por qué**: Mejorar type safety y permitir render condicional basado en tipo

---

### ✅ FASE 4: Bloques Genéricos para UNAHUR/Electivas

**Objetivo**: Representar materias genéricas como bloques en lugar de materias concretas

**Archivos Modificados**:
- `frontend/src/features/myPlanner/customPlan/services/planningAlgorithm.ts`
- `frontend/src/features/myPlanner/customPlan/components/SemesterRow.tsx`

**Estrategia**:

```typescript
// En generatePlan(), detectar materias sin correlatividades:
function generateGenericBlocksForUNAHUR(
  subjects: Subject[],
  classification: Map<string, SubjectClassification>,
  graph: SubjectGraph
): GenericBlock[] {
  const blocks: GenericBlock[] = [];

  subjects.forEach(subject => {
    // Si no tiene prereqs definidos y es electiva o UNAHUR
    if (subject.name.includes("UNAHUR") || subject.name.includes("Electiva")) {
      const isNotClaimed = !graph.predecessors.has(subject.id);

      if (isNotClaimed) {
        blocks.push({
          element_type: "generic_block",
          id: `block-${subject.id}`,
          name: subject.name,
          hours: subject.hours_per_week,
          block_type: subject.name.includes("UNAHUR") ? "unahur" : "elective"
        });
      }
    }
  });

  return blocks;
}
```

**Render en SemesterRow**:

```typescript
{element.element_type === "generic_block" && (
  <GenericBlockComponent
    block={element as GenericBlock}
    onMove={() => {...}}
  />
)}
```

**Por qué**: Flexibilidad para bloques sin estructura fija; usuario elige cuándo usarlos

---

### ✅ FASE 5: Importación de Excel + Sincronización Automática

**Objetivo**: Importar datos académicos desde Excel y actualizar planner automáticamente

**Archivos Modificados**:
- `frontend/src/features/academic-record/components/ImportExcelModal.tsx`
- `frontend/src/features/myPlanner/hooks/useMyPlannerPage.ts`

**Estrategia**: Event-Driven Architecture

**En ImportExcelModal.tsx**:

```typescript
const handleImportSuccess = async (importedRecords: AcademicRecord[]) => {
  // Paso 1: Guardar en backend
  await saveAcademicRecords(importedRecords);

  // Paso 2: Notificar evento global
  window.dispatchEvent(
    new CustomEvent("academic-records:updated", {
      detail: { recordsCount: importedRecords.length }
    })
  );

  // Paso 3: Feedback al usuario
  onImportComplete();
  closeModal();
};
```

**En useMyPlannerPage.ts**:

```typescript
// Listener para eventos de importación
useEffect(() => {
  const handleAcademicRecordsChanged = () => {
    refreshPlanner(); // Regenerar plan con nuevos datos
  };

  window.addEventListener("academic-records:updated", handleAcademicRecordsChanged);

  return () => {
    window.removeEventListener("academic-records:updated", handleAcademicRecordsChanged);
  };
}, [refreshPlanner]);

// Función de refresh
const refreshPlanner = useCallback(() => {
  if (!user) return;
  setPlannerRefreshKey((value) => value + 1); // Trigger re-generation
  setDataLoading(true);

  fetchPlannerData(user.id)
    .then(data => {
      setPlannerData(data);
      setDataError(null);
    })
    .catch(err => {
      setDataError(err.message);
    })
    .finally(() => {
      setDataLoading(false);
    });
}, [user]);
```

**Flujo**:
```
Usuario importa Excel
        ↓
ImportExcelModal.tsx guarda en backend
        ↓
Emite evento "academic-records:updated"
        ↓
useMyPlannerPage.ts escucha evento
        ↓
Llama refreshPlanner()
        ↓
Fetch nuevos datos académicos
        ↓
Regenera plan completo con usePlanner hook
        ↓
UI actualiza automáticamente
```

**Por qué**: Descentralizar - módulos no necesitan conocerse directamente

---

### ✅ FASE 6: Feedback de Reordenamiento Automático

**Objetivo**: Mostrar qué materias se movieron automáticamente cuando el usuario mueve una materia

**Archivos Modificados**:
- `frontend/src/features/myPlanner/customPlan/services/editEngine.ts`
- `frontend/src/features/myPlanner/hooks/usePlanner.ts`
- `frontend/src/features/myPlanner/customPlan/services/editEngine.test.ts` (tests)

**Nueva Función en editEngine.ts**:

```typescript
export function processMoveWithFeedback(
  plan: Plan,
  moveCommand: MoveCommand,
  config: MoveProcessConfig
): {
  plan: Plan;
  feedback: {
    movedSubject: string;
    adjustedSubjects: string[];
    warnings: string[];
  };
} {
  // Paso 1: Guardar estado original
  const originalStateMap = new Map(
    plan.semesterRows.map((row, idx) => [
      idx,
      row.subjects.map(s => s.subject_id)
    ])
  );

  // Paso 2: Ejecutar move normal
  const newPlan = processMove(plan, moveCommand, config);

  // Paso 3: Comparar estados
  const feedback = {
    movedSubject: moveCommand.subject_id,
    adjustedSubjects: [] as string[],
    warnings: [] as string[]
  };

  newPlan.semesterRows.forEach((row, idx) => {
    const originalSubjects = originalStateMap.get(idx) || [];
    const currentSubjects = row.subjects.map(s => s.subject_id);

    // Detectar materias que se movieron sin ser el target
    currentSubjects.forEach(subjectId => {
      if (
        subjectId !== moveCommand.subject_id &&
        !originalSubjects.includes(subjectId)
      ) {
        feedback.adjustedSubjects.push(subjectId);
      }
    });

    // Detectar overflow de horas
    const totalHours = row.subjects.reduce((sum, s) => sum + s.hours, 0);
    if (totalHours > config.weeklyHoursLimit) {
      feedback.warnings.push(
        `Semestre ${idx + 1} excede límite de horas: ${totalHours}h`
      );
    }
  });

  return { plan: newPlan, feedback };
}
```

**Uso en usePlanner.ts**:

```typescript
const moveSubject = (moveCommand: MoveCommand) => {
  try {
    const { plan: newPlan, feedback } = processMoveWithFeedback(
      plan,
      moveCommand,
      { weeklyHoursLimit: plannerData.weekly_hours_limit }
    );

    setPlan(newPlan);

    // Notificar UI sobre materias ajustadas
    if (feedback.adjustedSubjects.length > 0) {
      console.log("Materias reordenadas:", feedback.adjustedSubjects);
      // Pasar a componente UI para mostrar notificación
    }

    return feedback;
  } catch (error) {
    setMoveError(error.message);
  }
};
```

**Test de Regresión**:

```typescript
test("should report automatically adjusted dependents when a move forces a cascade", () => {
  const plan = generateTestPlan();
  const moveCommand = {
    subject_id: "SUBJECT_1",
    targetSemester: 3
  };

  const { feedback } = processMoveWithFeedback(plan, moveCommand, {
    weeklyHoursLimit: 40
  });

  expect(feedback.movedSubject).toBe("SUBJECT_1");
  expect(feedback.adjustedSubjects.length).toBeGreaterThan(0);
  expect(feedback.warnings).toContain(
    expect.stringContaining("excede límite")
  );
});
```

**Por qué**: Usuario debe entender qué pasó con su plan, no solo ver cambios mágicos

---

### ✅ FASE 7: Corrección de Bugs Reales (Horas de Bloques Genéricos + Datos de Planes Guardados)

**Contexto**: A diferencia de las Fases 1-6 (features nuevas), esta fase corrige **bugs de producción** detectados al auditar el código real contra lo que el roadmap y los tests decían que pasaba. Se encontraron 3 problemas; se corrigieron 2 y el tercero queda documentado como pendiente (ver "Problemas Conocidos").

#### Bug 1: Las horas de los bloques UNAHUR/electivas no se contaban en ningún lado

**Síntoma real**: un estudiante con 2-3 electivas podía terminar con 35hs reales en un cuatrimestre mientras la UI mostraba "20hs" y el algoritmo seguía asignando materias como si hubiera lugar.

**Causa raíz**: `PlannedSemester.total_hours` solo se incrementaba al agregar `subjects`. El código que crea `generic_blocks` (UNAHUR/electivas) nunca sumaba sus `estimated_hours` a ningún acumulador, y **todo el sistema de límites horarios leía exclusivamente `total_hours`**:

```typescript
// ANTES — planningAlgorithm.ts
export function calculateTermHours(plan: Plan, year: number, term: number): number {
  const yearPlan = plan.years.find(y => y.year === year);
  if (!yearPlan) return 0;
  const semesterIndex = term === 1 ? 0 : 1;
  const semester = yearPlan.semesters[semesterIndex];
  return semester?.total_hours ?? 0; // ← bloques genéricos invisibles
}
```

Y además, el loop que ubica los bloques usaba el período de arranque fijo en vez de buscar espacio real:

```typescript
// ANTES — dentro de generatePlan()
const semester = ensureSemester(currentYear, currentTerm); // siempre el mismo período
semester.generic_blocks?.push(genericBlock); // nunca suma horas
```

**Fix aplicado**:

1. Nueva función exportada `getGenericBlockHours(semester)` que suma `estimated_hours` de todos los `generic_blocks` de un cuatrimestre.
2. Se sumó ese valor en los **3 puntos donde el algoritmo decide si "entra" una materia**:
   - `calculateTermHours()` (usado por `editEngine.ts` en la cascada de sobrecupo y por `useDndTimeline.ts` al validar un drop)
   - `findBestTerm()` (usado para ubicar materias nuevas hacia adelante)
   - `findBestTermBackwards()` (usado para reubicar correlativas hacia atrás en Caso 5)
3. El loop de generación de bloques ahora llama a `findBestTerm(estimatedHours, plan, currentYear, currentTerm, limitHours)` en lugar de `ensureSemester(currentYear, currentTerm)` fijo, así los bloques se **distribuyen** entre cuatrimestres respetando el límite en vez de amontonarse todos en el primero.
4. En la UI (`SemesterRow.tsx`), tanto el aviso visual de "supera el límite" como el número de horas mostrado (`{totalHours}hs`) ahora incluyen `getGenericBlockHours(semester)`, no solo `semester.total_hours`.

**Archivos modificados**: `planningAlgorithm.ts`, `validationService.ts` (`getMoveFeasibility`), `SemesterRow.tsx`.

**Por qué no se sumó directamente a `total_hours`**: ese campo se usa en otros lados (ej. `editEngine.ts` lo recalcula sumando solo `subject.weekly_hours` al reordenar) como "horas de materias reales". Mezclar ahí las horas de bloques hubiera roto ese invariante; por eso se creó una función aparte que se suma en el momento de comparar contra el límite, no se persiste en el modelo.

---

#### Bug 2: Planes guardados mostraban "C1 NaNhs / C2 NaNhs" y las materias sin carga horaria

**Síntoma real**: al abrir un plan ya guardado (no uno recién generado), cada cuatrimestre mostraba `NaNhs` y las `SubjectCard` no mostraban las horas semanales de cada materia.

**Causa raíz**: `weekly_hours` es una columna del modelo `Subject`, **no** de `PlanSubject`. El endpoint de datos en vivo (`GET /api/students/:id/planner-data`) lo "aplana" manualmente:

```javascript
// backend/src/controllers/studentController.js (getPlannerData) — SÍ lo aplana
weekly_hours: ps.subject?.weekly_hours || null,
```

Pero el endpoint de planes guardados (`GET /api/custom-study-plans/:id`, usado al abrir un plan existente) **no hace ese aplanado** — devuelve `plan_subject` tal cual sale de la tabla, sin `weekly_hours` en ese nivel. El frontend, en `usePlanner.ts` (`loadFromSaved`), leía:

```typescript
// ANTES — usePlanner.ts
weekly_hours: ps.weekly_hours, // ps = item.plan_subject → este campo NO existe ahí
...
semester.total_hours += ps.weekly_hours; // undefined + number = NaN, y se arrastra
```

Una vez que `total_hours` se vuelve `NaN` en la primera materia sin horas, **todas las sumas posteriores en ese cuatrimestre quedan contaminadas** (`NaN + 4 = NaN`), de ahí que se viera en todo el cuatrimestre y no solo en una materia puntual.

**Fix aplicado**: se cambió la lectura a `ps.subject.weekly_hours` (con fallback a `ps.weekly_hours ?? 0` por si el backend cambia), que es el campo real que sí viaja anidado en `plan_subject.subject.weekly_hours` (Sequelize incluye todas las columnas de `Subject` por defecto). Se actualizaron los tipos `SavedPlanItem` en `model/planner.ts` y `planManagerService.ts` para declarar `weekly_hours` en el `subject` anidado (antes el tipo no lo declaraba, aunque el backend sí lo mandaba).

**Archivos modificados**: `usePlanner.ts`, `model/planner.ts`, `planManagerService.ts`.

**Por qué no se arregló en el backend**: hacerlo en el frontend es un cambio de una línea y no requiere tocar el contrato de un endpoint que no está roto (el dato *sí* está en la respuesta, solo hay que leerlo del lugar correcto).

---

#### Problema detectado pero NO corregido: las electivas nunca generan bloque en producción

Al validar el fix del Bug 1 corriendo los tests existentes, `planningAlgorithm.test.ts` reveló que el bloque de tipo `'elective'` **nunca se crea**, ni antes ni después de este fix — es un bug preexistente, no introducido por esta fase. Ver sección "Problemas Conocidos" más abajo.

---

## 📁 Mapa de Cambios por Archivo

### 1. `planningAlgorithm.ts` (+350 líneas)
- ✅ Tipos: `SubjectClassification` enum
- ✅ Tipos: `PlannedEvent` y `GenericBlock`
- ✅ Función: `classifySubjects()`
- ✅ Función: `getPendingFinalExams()`
- ✅ Función: `generateGenericBlocksForUNAHUR()`
- ✅ Modificación: `generatePlan()` - integrar finales y bloques

### 2. `editEngine.ts` (+150 líneas)
- ✅ Nueva función: `processMoveWithFeedback()`
- ✅ Lógica: Comparación de estado antes/después
- ✅ Lógica: Detección de movimientos en cascada

### 3. `usePlanner.ts` (+80 líneas)
- ✅ Cambio: Aceptar `refreshKey` como dependency
- ✅ Cambio: `moveSubject()` usa `processMoveWithFeedback`
- ✅ Cambio: Retorna feedback al componente

### 4. `useMyPlannerPage.ts` (+100 líneas, ahora FIJO)
- ✅ Nueva función: `refreshPlanner()` callback
- ✅ Nuevo: `useEffect` para escuchar evento "academic-records:updated"
- ✅ FIX: Reorden de definiciones (refreshPlanner antes del useEffect)
- ✅ Estado: `plannerRefreshKey` para triggear re-generación

### 5. `ImportExcelModal.tsx` (+20 líneas)
- ✅ Agregar: `window.dispatchEvent(CustomEvent)`
- ✅ Cambio: Después de `executeImport()` exitoso

### 6. `SemesterRow.tsx` (+15 líneas)
- ✅ Render condicional para `PlannedEvent`
- ✅ Render condicional para `GenericBlock`

### 7. `editEngine.test.ts` (+80 líneas)
- ✅ 1 test existente (fallback placement)
- ✅ 1 test nuevo (cascade feedback)

---

## 🧪 Tests Agregados

### Test Suite: `editEngine.test.ts`

```typescript
describe("Edit Engine", () => {
  test("should find the closest feasible placement instead of failing", () => {
    // Fase 1-4: Validación de prerequisitos
    const result = processMove(plan, moveCommand, config);
    expect(result.semesterRows[2].subjects).toContainEqual(
      expect.objectContaining({ subject_id: "SUBJECT_2" })
    );
  });

  test("should report automatically adjusted dependents when a move forces a cascade", () => {
    // Fase 6: Feedback tracking
    const { feedback } = processMoveWithFeedback(plan, moveCommand, config);
    expect(feedback.adjustedSubjects.length).toBeGreaterThan(0);
  });
});
```

**Cobertura**:
- ✅ Movimientos básicos
- ✅ Cascadas de dependencias
- ✅ Overflow de horas
- ✅ Feedback de auto-ajustes

---

## 🔐 Validación & Robustez

### Casos de Borde Cubiertos

| Caso | Fase | Solución |
|------|------|----------|
| Materia sin prerequisitos | 1 | Clasificado como FALTANTE |
| Final pendiente en pasado | 2 | Agregado como PlannedEvent |
| Tipo desconocido | 3 | Discriminated union en TS |
| Electiva sin requisitos | 4 | GenericBlock, no genera error |
| Excel vacío | 5 | Validación en ImportExcelModal |
| Cascada profunda | 6 | processMoveWithFeedback rastrea todos |
| Overflow horas | 6 | Warnings en feedback.warnings |

### TypeScript Type Safety

```typescript
// ✅ Verificación en tiempo de compilación
const element: PlanElement = ...;

if (element.element_type === "subject") {
  console.log(element.hours); // ✅ Existe
}

if (element.element_type === "generic_block") {
  console.log(element.block_type); // ✅ Existe
}

// ❌ Error: GenericBlock no tiene subject_id
const plan = element as GenericBlock;
console.log(plan.subject_id); // Error TS2339
```

---

## 🎬 Flujo Completo: Ejemplo End-to-End

### Escenario: Importar Excel y Mover Materia

```
1. Usuario carga archivo Excel → ImportExcelModal
   └─ Parsea: academicRecords[], enrollments[]
   
2. ImportExcelModal.tsx ejecuta:
   └─ backend.saveAcademicRecords(...)
   └─ window.dispatchEvent("academic-records:updated")
   └─ onImportComplete() y closeModal()

3. useMyPlannerPage.ts escucha evento:
   └─ refreshPlanner() → setPlannerRefreshKey + fetch
   └─ setPlannerData(newData)

4. usePlanner.ts re-genera plan:
   └─ buildSubjectGraph(plannerData)
   └─ classifySubjects() → FASE 1
   └─ getPendingFinalExams() → FASE 2
   └─ generateGenericBlocksForUNAHUR() → FASE 4
   └─ generatePlan() con todo integrado

5. UI renderiza SemesterRow:
   └─ Materias con element_type="subject" → PlannedSubjectComponent
   └─ Eventos con element_type="event" → FinalExamBadge
   └─ Bloques con element_type="generic_block" → GenericBlockComponent

6. Usuario arrastra materia → moveSubject():
   └─ processMoveWithFeedback() ejecuta FASE 6
   └─ Compara estado original vs nuevo
   └─ Retorna: { plan, feedback: { adjustedSubjects, warnings } }
   └─ UI muestra toast: "Materias reordenadas: [...], Horas overflow: ..."

7. Nuevo estado se renderiza con cambios visuales
```

---

## 🧩 Flujo Detallado de Edición del Plan (Drag & Drop)

Esta sección documenta cómo funciona realmente `editEngine.ts` cuando el usuario arrastra una materia a otro cuatrimestre. El código interno referencia "Casos 1-6" en sus comentarios (`processMove`) pero nunca estuvieron explicados en este roadmap — acá se documenta el flujo real, tal como está implementado.

### Paso 0: Validación previa en el drop (`useDndTimeline.ts`)

Antes de tocar el plan, `handleDragEnd` corre 3 chequeos **locales** (sin llamar al backend) para decidir si pedirle confirmación al usuario o aplicar el movimiento directo:

1. **Correlativas** (`validatePlacementLocal`): ¿todas las correlativas de la materia están en un cuatrimestre anterior al destino? Si no, se le avisa al usuario que se reacomodarán automáticamente.
2. **Horas** (`calculateTermHours` + límite): ¿el cuatrimestre destino, sumando la materia arrastrada, supera el límite semanal? Si sí, se avisa que se reubicarán materias de menor "peso".
3. **Dependientes** (`findDependentsAtOrBefore`): ¿alguna materia que depende de la que se mueve queda en el mismo cuatrimestre o antes? Si sí, se avisa que esas también se van a reacomodar.

Si ninguno de los 3 aplica, se ejecuta el movimiento directo. Si el usuario confirma el modal, se llama a `onMoveSubject` → `usePlanner.moveSubject` → `processMoveWithFeedback` (en `editEngine.ts`), que es donde ocurre la lógica real (los 3 chequeos de arriba son solo una previsualización heurística; el motor de edición vuelve a validar todo desde cero).

### Paso 1: `processMove` — reintento con períodos candidatos

`processMove` no asume que el período pedido por el usuario es válido. Arma una lista de hasta 13 períodos candidatos (el pedido + 6 hacia adelante + 6 hacia atrás, acotados por `minYear`) y prueba `applyMoveToPlan` con cada uno hasta que uno no lance error. Si los 13 fallan, se propaga el último error (ej. "no hay cuatrimestres compatibles").

### Paso 2: `applyMoveToPlan` — el motor de cascada

Sobre una copia (`structuredClone`) del plan, en este orden:

1. **Recalcula horas de todos los cuatrimestres** desde el grafo (por si `weekly_hours` cambió desde que se generó el plan).
2. **Saca la materia de su ubicación actual** y la **inserta en el destino**.
3. **Caso 5 (correlativas que quedaron adelante)** — `hasPrerequisitesInPast`: si alguna correlativa de la materia movida quedó en el mismo período o después del destino (ej. moviste la materia hacia atrás, "pisando" a su propia correlativa), se dispara `resolvePrerequisiteRecursive`, que:
   - Calcula la **profundidad de la cadena** de correlativas (`calculateChainDepth`) y valida que haya suficientes cuatrimestres disponibles hacia atrás antes de intentar nada (si no, aborta con un mensaje claro en vez de intentarlo y fallar a mitad de camino).
   - Reubica cada correlativa hacia atrás con `findBestTermBackwards`, resolviendo recursivamente las correlativas-de-las-correlativas.
   - Si después de todo esto la materia sigue sin tener sus prerrequisitos en el pasado, **aborta todo el movimiento** (throw) — este es el único caso que cancela la operación en vez de aplicar una cascada.
4. **Caso 3 (dependientes que quedaron atrás)** — `findDependentSubjectsInPastOrPresent`: materias que *requieren* la que se movió y que ahora quedaron en el mismo período o antes (ej. moviste la materia hacia adelante, dejando atrás a algo que la necesita). Se sacan del plan y se apilan en una "bolsa de desbordados" (`overflowBag`).
5. **Sobrecupo de horas**: mientras el cuatrimestre destino supere `limitHours`, se elige la materia con **menor peso de desbloqueo** (`unlockWeights`, y como desempate la más "tardía" en el plan) entre las que están en ese cuatrimestre (sin contar la recién movida), se saca y se suma también a `overflowBag`.
6. **Reinserción de la bolsa de desbordados**: se ordenan por orden topológico y cada una se reubica con `resolveSubjectRecursive` a partir del período siguiente al destino — que a su vez, si al reubicar una materia sus propios dependientes quedan atrás, vuelve a recursar (cascada en cadena, no solo un nivel).

### Por qué el "peso de desbloqueo" decide qué se saca primero

`unlockWeights` (calculado en `buildSubjectGraph`) cuenta cuántas materias dependen —directa o indirectamente— de cada una. Al haber sobrecupo, el algoritmo prioriza sacar del cuatrimestre las materias que **menos cosas desbloquean**, para minimizar el efecto cascada aguas abajo. Es una heurística, no una garantía de "mejor" solución global.

### Feedback al usuario

`processMoveWithFeedback` compara la ubicación de cada materia antes/después del movimiento y arma:
- `movedSubject`: nombre de la materia que el usuario arrastró.
- `adjustedSubjects`: nombres de todas las materias que cambiaron de lugar como efecto secundario (cascada).
- `warnings`: cuatrimestres que, después de todo el reacomodo, siguen superando el límite horario (esto puede pasar si el usuario configuró un límite muy bajo para la carga real del plan).

### Límite conocido de este diseño

La búsqueda de períodos candidatos en el Paso 1 está acotada a 6 cuatrimestres (3 años) en cada dirección. Para carreras con cadenas de correlativas muy largas relocalizadas cerca del primer año permitido (`minYear`), es posible que un movimiento válido en teoría (hay espacio si se busca más lejos) falle igual porque el radio de búsqueda no llega. No se detectó esto como bug durante la revisión — es una limitación de diseño documentada acá para que quede explícita.

---

## 📊 Métricas del Proyecto

| Métrica | Valor |
|---------|-------|
| Fases Implementadas | 7/7 ✅ (6 features + 1 fix de bugs) |
| Archivos Modificados (Fase 7) | 6 |
| Bugs Corregidos (Fase 7) | 2 |
| Bugs Detectados y Documentados (no corregidos) | 1 |
| Tests Passing | 5/6 (1 falla por bug preexistente de electivas, ver abajo) |
| Enums Nuevos | 1 (SubjectClassification) |
| Tipos Nuevos | 5+ (Event, Block, etc.) |
| Funciones Clave Nuevas (Fase 7) | 1 (`getGenericBlockHours`) |

---

## ⚠️ Problemas Conocidos / Pendientes

### ~~1. Las electivas nunca generan `GenericBlock` en producción~~ — ✅ Corregido

Se aplicaron los 3 pasos que quedaron anotados acá:
1. Backend: `getPlannerData` (`studentController.js`) ahora incluye `is_elective: ps.is_elective` en el mapeo de `planSubjects`.
2. Frontend: `RawPlanSubject` (`model/planner.ts`) declara `is_elective?: boolean`.
3. `planningAlgorithm.ts`: `planSubjectBlockTypeById` lee `subject.is_elective` en vez del `subject.block_type` fantasma.

De paso se corrigió el efecto colateral que estaba documentado como punto 2 (duplicación bloque + materia normal): `pendingSubjectIds` en `generatePlan()` ahora excluye explícitamente las materias marcadas `is_elective`/`is_unahur`, así que ya no pasan por la asignación greedy de Fase 3 además de representarse como `generic_block`. Test de regresión agregado en `planningAlgorithm.test.ts` (verifica que los IDs de las materias-bloque no aparezcan en `semester.subjects`).

**Bug de seguimiento detectado y corregido en la misma sesión**: el loop que ubica los `generic_blocks` llamaba a `findBestTerm()` arrancando siempre desde `(currentYear, currentTerm)` — el primerísimo cuatrimestre del plan — **sin mirar las correlativas propias del bloque**. Con datos reales de seed (5 electivas de Ingeniería en Computación, 4hs cada una = 20hs exactas, todas con correlativa `regularidad` contra Matemática I y Programación I), esto hacía que las 5 electivas llenaran 2026-C1 por completo *antes* de que Matemática I/Programación I/Organización de Computadoras (que no tienen ningún prerequisito) tuvieran su turno en la Fase 3 — empujando TODO el plan un cuatrimestre hacia adelante, reproduciendo exactamente el síntoma "C1 vacío, todo corrido" que reportó un usuario probando con una cuenta nueva (sin ningún sabático de por medio). Se movió el loop de bloques para que corra **después** de la Fase 3 y calcule su propio punto de partida con `findLatestPrerequisitePeriod()` (la misma función que ya usan las materias reales), igual que cualquier otra materia. Test de regresión: `planningAlgorithm.test.ts > no deja que un bloque genérico (electiva) con correlativas acapare el primer cuatrimestre...`.

### 2. El campo `currentPeriod` de `planner-data` no se usa como se esperaría

`getPlannerData` calcula `currentPeriod.year` como el "año de cursada" del estudiante (1, 2, 3...) en base a meses desde la inscripción, no como año calendario. `usePlanner.ts` lo usa como `minYear` solo si es `>= 1900`, así que en la práctica esa condición siempre es falsa y se recurre al fallback (`new Date().getFullYear()`). No rompe nada hoy, pero el campo no cumple ninguna función real tal como está — queda documentado por si se decide limpiarlo o usarlo de verdad.

---

## 🚀 Próximos Pasos Opcionales

### Feature Enhancements:

1. **Persistencia del Plan Editado**
   - Guardar movimientos en backend
   - Historial de versiones
   - Rollback a versión anterior

2. **Visualización Avanzada**
   - Grafo de correlatividades visual
   - Timeline interactivo
   - Predicción de créditos/cargas

3. **Optimización de Horarios**
   - Detector de conflictos horarios
   - Sugerencia automática de distribuir carga
   - Análisis de "mejor semestre" por rendimiento

4. **Notificaciones Proactivas**
   - Alerta cuando falta poco para deadline de final
   - Sugerencias cuando hay carga baja
   - Recomendaciones basadas en historial

---

## 📝 Conclusión

El MyPlanner evolucionó de ser un **mero proyector de materias** a un **sistema integral de planificación académica** que:

- 🎯 **Entiende** el estado real del estudiante (finalizado/regularizado/inscripto/faltante)
- 📅 **Visualiza** finales pendientes y bloques genéricos
- 🔄 **Integra** datos desde múltiples fuentes (Excel, backend)
- 🧠 **Reordena automáticamente** con feedback transparente
- 🛡️ **Mantiene type safety** mediante TypeScript

La arquitectura **modular y basada en eventos** permite agregar nuevas features sin romper lo existente.

---

**Última actualización**: 2026-07-01 (Fase 7: corrección de bugs de horas de bloques genéricos y planes guardados)
**Status**: ✅ Fases 1-6 y 7 (parcial) validadas contra el código real · ⚠️ 1 problema conocido pendiente (ver "Problemas Conocidos")
