# Frontend — Nuevo Algoritmo de Proyección de Planes

## Contexto y Motivación

Anteriormente el backend ejecutaba el algoritmo de planificación (`POST /api/students/:id/generate-plan`) y el frontend solo mostraba el resultado. Cada edición (drag & drop, cambio de horas) requería validaciones vía API, resultando lento y tedioso.

**Solución:** El frontend ejecuta todo el algoritmo localmente, incluyendo el simulador "¿Qué pasa si...?". El backend solo provee los datos estáticos una vez. Esto permite:

- Re-cálculo instantáneo al cambiar horas semanales.
- Drag & drop con validación y cascada en milisegundos.
- Simulador instantáneo (sin round-trip).
- Sin dependencia de red para la interacción del planificador.

> **Nota sobre actualización de datos:** El frontend obtiene `planner-data` al abrir el planificador. Si el alumno aprueba materias en otra pestaña o un admin le modifica registros, los datos quedan "stale" hasta que cierre y vuelva a abrir el planificador (o use un botón "Recargar datos"). Es un comportamiento aceptable para una app con caché en sesión.

---

## Cómo funciona el Algoritmo

### Fase 1: Preparación y Ordenamiento Jerárquico

**Paso 1 — Filtrado de historial:**
Se excluyen del universo de cálculo todas las materias que el alumno ya finalizó (status `aprobado`, o `pendiente` con final aprobado). Solo se proyecta el camino restante.

**Paso 2 — Peso de desbloqueo:**
Para cada materia pendiente, se calcula recursivamente cuántas materias dependen de ella (grado de salida en el grafo). Una materia que desbloquea 5 materias tiene mayor peso que una que no desbloquea ninguna.

**Paso 3 — Ordenamiento topológico:**
Se ordenan las materias de forma que ninguna aparezca antes que sus correlativas. Criterio de desempate: mayor peso de desbloqueo primero.

### Fase 2: Asignación Cronológica (Greedy)

**Paso 4 — Punto de partida:**
- Sin correlativas → arranca del primer cuatrimestre (`C1` del año actual).
- Con correlativas → arranca del cuatrimestre **siguiente** al de la última correlativa ubicada en el plan.

**Paso 5 — Validación de techo horario:**
Evalúa el período actual. Si la suma de `weekly_hours` de las materias ya asignadas + la materia actual **no supera** `limitHours`, la asigna. Si supera, avanza al siguiente período y repite.

### Fase 3: Edición con Efecto Cascada

Este es el motor que resuelve los movimientos del usuario via drag & drop.

**Concepto clave — Materias Ancladas (📌):**
Cuando el usuario mueve una materia manualmente, se marca como `anclada = true`. El algoritmo **jamás** mueve materias ancladas automáticamente.

**Casos que resuelve:**

| Caso | Descripción | Resolución |
|---|---|---|
| 1 | Materia independiente en cuatrimestre con espacio | Asigna, ancla, no hay cascada |
| 2 | Materia en cuatrimestre que supera límite horario | Ancla la movida, desplaza la no-anclada de menor peso al C+1, repite |
| 3 | Violación de correlatividades hacia adelante | Desplanifica las dependientes, las reubica desde el período siguiente |
| 4 | Caso 2 + Caso 3 combinados | Primero resuelve correlatividades, luego horas |
| 5 | Violación de correlatividades hacia atrás | Intenta cascada inversa; si no es posible, rechaza el movimiento |
| 6 | Efecto Sándwich (todas ancladas, sin espacio) | Rechaza el movimiento con mensaje |

---

## Simulador "¿Qué pasa si...?" (también se migra al frontend)

El simulador actualmente vive en `POST /api/students/:id/simulate-what-if` y depende de `correlativityEngine.js`. Se migra al frontend para evitar duplicación del motor de correlatividades.

**Cómo funciona ahora (local):**
1. El frontend ya tiene el grafo de materias pendientes y sus registros académicos (`planner-data`).
2. El usuario selecciona materias `enrolled` que quiere simular como aprobadas.
3. Se clona el grafo en memoria y se marcan esas materias como `finalizada`.
4. Se ejecuta `getAvailableSubjects()` contra el grafo modificado.
5. Se compara con el estado actual y se retornan las materias que se desbloquearon nuevas.

**Archivos del simulador (ya existen, se adaptan):**
- `src/features/myPlanner/simulator/model/simulator.ts` — tipos
- `src/features/myPlanner/simulator/services/simulatorService.ts` — antes llamaba al backend, ahora usa el grafo local
- `src/features/myPlanner/simulator/hooks/useSimulator.ts` — recibe el grafo del planificador
- `src/features/myPlanner/simulator/components/SimulatorView.tsx` — UI (sin cambios mayores)

---

## Archivos a Crear

### 1. `src/features/myPlanner/customPlan/services/plannerDataService.ts`

Obtiene los datos del backend.

```typescript
export async function fetchPlannerData(studentId: number): Promise<PlannerDataResponse>
```

Llama a `GET /api/students/:id/planner-data` y tipa la respuesta.

### 2. `src/features/myPlanner/customPlan/services/planningAlgorithm.ts`

**El corazón del nuevo sistema.** Contiene todo el algoritmo puro (sin efectos, sin React). Funciones:

| Función | Input | Output | Descripción |
|---|---|---|---|
| `buildSubjectGraph(planSubjects, correlativities)` | Subjects + correlatividades | `SubjectGraph` | Arma el grafo en memoria con nodos y aristas |
| `classifySubjects(records, planSubjects)` | Records académicos | `Map<id, Classification>` | Clasifica cada materia como finalizada / regularizada / enrolled / faltante |
| `calculateUnlockWeights(graph)` | Grafo de materias pendientes | `Map<id, number>` | Peso = cantidad de materias que dependen de ella (recursivo) |
| `topologicalSort(graph, weights)` | Grafo + pesos | `number[]` (ids ordenados) | Orden topológico, desempate por peso de desbloqueo |
| `findBestTerm(subject, plan, limitHours, startPeriod)` | Materia, plan en construcción, horas, período inicial | `{ year, term }` | Busca el primer cuatrimestre donde la materia entre sin superar horas |
| `generatePlan(planSubjects, records, correlativities, limitHours)` | Todos los datos | `Plan` (años × cuatrimestres × materias) | Orquesta todo: filtra → pesa → ordena → asigna |
| `calculateTermHours(plan, year, term)` | Plan + período | `number` | Suma de horas de materias en un cuatrimestre |
| `getPrerequisiteStatus(graph, plan, subjectId)` | Grafo + plan + materia | `PrerequisiteStatus[]` | Estado de cada correlativa de una materia |

### 3. `src/features/myPlanner/customPlan/services/editEngine.ts`

**Motor de edición con efecto cascada.** Implementa el pseudocódigo de la sección 4 de `xd.md`.

| Función | Descripción |
|---|---|
| `processMove(plan, subjectId, targetPeriod)` | Punto de entrada. Ancla la materia, valida y dispara cascada |
| `verifyPrerequisitesInPast(plan, subject)` | Verifica que todos los requisitos estén en períodos anteriores |
| `attemptReverseCascade(plan, subject)` | Intenta mover requisitos hacia atrás si hay espacio |
| `findDependentSubjectsInPastOrPresent(plan, subject)` | Encuentra materias que quedaron en el pasado pero dependen de la movida |
| `resolveHourOverflow(plan, year, term, overflowBag, limitHours)` | Saca la materia no anclada de menor peso de un cuatrimestre saturado |
| `runBaseAlgorithm(overflowBag, plan, startPeriod, limitHours)` | Reprocesa la bolsa de materias desplanificadas desde un período dado |

### 4. `sugerencias-proximas.md`

Archivo en la raíz del proyecto con ideas a futuro que no se implementan ahora. Por ejemplo: manejo de materias anuales (`term_type: 'anual'`) como bloque que ocupa C1+C2 con horas contando en ambos semestres. Ver archivo adjunto.

### 5. `src/features/myPlanner/customPlan/model/planner.ts` (modificar)

**Tipos nuevos a agregar:**

```typescript
export interface SubjectGraphNode {
  plan_subject_id: number;
  subject_name: string;
  weekly_hours: number;
  credits: number;
  is_elective: boolean;
  term_type: string;
  suggested_year: number;
  suggested_term: number;
  required_by: number[];  // IDs de materias que dependen de esta
  requires: number[];     // IDs de materias que esta necesita
  requirements: PrerequisiteInfo[];
}

export interface PrerequisiteInfo {
  required_plan_subject_id: number;
  subject_name: string;
  correlativity_type: 'regularidad' | 'aprobacion' | 'finalizada' | null;
}

export type SubjectClassification = 'finalizada' | 'regularizada' | 'enrolled' | 'faltante';

export interface PlannedSubject {
  plan_subject_id: number;
  subject_name: string;
  weekly_hours: number;
  credits: number;
  is_elective: boolean;
  anchored: boolean;  // 📌
  weight: number;     // peso de desbloqueo
}

export interface PlannedSemester {
  term: number;           // 1 o 2
  subjects: PlannedSubject[];
  total_hours: number;
}

export interface PlannedYear {
  year: number;
  semesters: [PlannedSemester, PlannedSemester]; // C1, C2
}

export interface Plan {
  years: PlannedYear[];
  total_credits: number;
  limit_hours: number;
}
```

---

## Archivos a Modificar

### 1. `src/features/myPlanner/customPlan/hooks/usePlanner.ts`

**Cambios:**
- `generate(hours)` ya no llama al backend → ejecuta `planningAlgorithm.generatePlan()` con los datos obtenidos de `plannerDataService`.
- Recibe los datos del planificador (subjects, correlativities, records) como parámetro o contexto.
- `optimizeFrom(year, term)` también usa el algoritmo local en lugar de llamar al backend.

### 2. `src/features/myPlanner/customPlan/hooks/useDndTimeline.ts`

**Cambios:**
- Reemplazar las 3 llamadas API (`validate-placement`, `calculate-term-hours`, `cascading-impact`) por llamadas a `editEngine`.
- `handleDragEnd` → llama a `editEngine.processMove()` en lugar de múltiples validaciones remotas.
- Obtener el grafo y `limitHours` del hook padre o contexto.

### 3. `src/features/myPlanner/customPlan/services/plannerService.ts`

**Cambios:**
- Eliminar la función `generatePlan()` que llama al backend.
- Eliminar `mapPlanToPlannerData()` (se reemplaza por el nuevo modelo).
- Mantener solo `plannerDataToSaveFormat()` si se necesita para guardar.

### 4. `src/features/myPlanner/customPlan/services/validationService.ts`

**Cambios:**
- Eliminar las funciones que llaman al backend (`validatePlacement`, `calculateTermHours`, `getCascadingImpact`).
- Reemplazar con funciones que usan el grafo local (o simplemente eliminar y mover la lógica a `editEngine`).

### 5. `src/features/myPlanner/customPlan/hooks/useMyPlannerPage.ts`

**Cambios:**
- Al montar el planificador, llamar a `fetchPlannerData(studentId)` y pasar los datos a `usePlanner`.
- Manejar estado de carga/error de la obtención de datos.

### 6. `src/features/myPlanner/customPlan/components/SubjectCard.tsx`

**Cambios:**
- Mostrar icono 📌 si `anchored === true`.
- Permitir desanclar con click.

### 7. `src/features/myPlanner/customPlan/components/SemesterRow.tsx`

**Cambios:**
- Mostrar advertencia visual (borde rojo) si el cuatrimestre supera `limitHours`.
- Mostrar horas actuales vs límite.

### 8. `src/features/myPlanner/customPlan/components/TimelineContent.tsx`

**Cambios:**
- Adaptar al nuevo modelo `Plan` (con `PlannedSubject[]`).
- Los `useDroppable` y `useDraggable` siguen igual, solo cambia el tipo de datos.

---

## Orden de Implementación Sugerido

1. **Crear `plannerDataService.ts`** — tipar la respuesta del backend.
2. **Actualizar `planner.ts` (modelo)** — agregar tipos del grafo, clasificación, plan, etc.
3. **Crear `planningAlgorithm.ts`** — implementar las funciones puras en orden:
   - `buildSubjectGraph` → `classifySubjects` → `calculateUnlockWeights` → `topologicalSort` → `findBestTerm` → `generatePlan`
4. **Crear `editEngine.ts`** — implementar la cascada:
   - `processMove` → cada caso del 1 al 6.
5. **Modificar `usePlanner.ts`** — conectar al nuevo flujo.
6. **Modificar `useDndTimeline.ts`** — reemplazar validaciones remotas por locales.
7. **Adaptar el simulador** — `simulatorService.ts` y `useSimulator.ts` para usar el grafo local en lugar del backend.
8. **Modificar `SubjectCard.tsx` y `SemesterRow.tsx`** — mostrar anclas y alertas.
9. **Eliminar código muerto** — funciones viejas de `plannerService.ts` y `validationService.ts`.
