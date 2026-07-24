# Resumen del Planificador (Custom Plan)

## ¿Qué es?

El planificador toma el plan de estudios de una carrera y las materias que el alumno ya aprobó, y genera automáticamente una proyección cuatrimestre por cuatrimestre de lo que le queda por cursar, respetando correlativas y un límite de horas semanales configurable. Después el alumno puede modificar el plan arrastrando materias y el sistema reacomoda todo en cascada.

---

## 1. Algoritmo de Creación del Plan

Archivo: `src/features/myPlanner/customPlan/services/planningAlgorithm.ts` (753 líneas)

### Paso a paso:

1. **Filtrar historial académico** — Se excluyen las materias ya finalizadas o promocionadas. Solo se proyecta lo pendiente.

2. **Construir grafo de correlatividades** (`buildSubjectGraph`) — Se arma un grafo dirigido acíclico (DAG) donde cada materia es un nodo y las correlativas son aristas. Cada nodo guarda:
   - `requires`: qué materias necesita como correlativa
   - `requiredBy`: qué materias dependen de ella

3. **Calcular peso de desbloqueo** (`calculateUnlockWeights`) — Para cada materia, se calcula recursivamente (DFS) cuántas materias dependen directa o indirectamente de ella. Una materia que "desbloquea" muchas otras tiene más peso y va antes.

4. **Ordenamiento topológico** (`topologicalSort`) — Usando el algoritmo de Kahn, se ordenan las materias respetando que ninguna aparezca antes que sus correlativas. Si dos materias están en el mismo nivel, la de mayor peso de desbloqueo va primero.

5. **Clasificar materias** (`classifySubjects`) — Cada materia se etiqueta como:
   - `finalizada` / `regularizada`: ya cursada, no se incluye
   - `cursando`: se está cursando actualmente
   - `faltante`: pendiente de cursar

6. **Asignación greedy a cuatrimestres** (`findBestTerm` + `generatePlan`) — Se recorren las materias en el orden topológico. Para cada una:
   - Si no tiene correlativas → empieza a buscar desde el primer cuatrimestre disponible
   - Si tiene correlativas → empieza desde el cuatrimestre siguiente a la última correlativa ubicada
   - Busca el primer cuatrimestre donde entre sin superar `limitHours`
   - Si no entra, avanza al siguiente cuatrimestre y repite

### Funciones clave del algoritmo:

| Función | Qué hace |
|---------|----------|
| `buildSubjectGraph()` | Construye el DAG de correlatividades |
| `calculateUnlockWeights()` | Calcula pesos de desbloqueo vía DFS |
| `topologicalSort()` | Ordena materias (Kahn) con desempate por peso |
| `classifySubjects()` | Clasifica materias por estado académico |
| `findBestTerm()` | Encuentra el primer cuatrimestre donde cabe la materia |
| `generatePlan()` | Orquestador principal que genera el plan completo |
| `getPrerequisiteStatus()` | Evalúa si una materia tiene sus correlativas cumplidas |

---

## 2. Algoritmo de Modificación (Edición con Efecto Cascada)

Archivo: `src/features/myPlanner/customPlan/services/editEngine.ts` (507 líneas)

Cuando el usuario arrastra una materia a otro cuatrimestre, se ejecuta `processMove()` que valida y resuelve todo automáticamente según estos casos:

### Caso 1 — Materia independiente con espacio
La materia no tiene correlativas que afectar y el cuatrimestre destino tiene horas libres. Simple: se asigna y listo.

### Caso 2 — Materia independiente pero se pasa del límite horario
La materia que movés no tiene problemas de correlativas, pero el cuatrimestre destino se pasa del `limitHours`. El algoritmo busca la materia de **menor peso de desbloqueo** dentro de ese cuatrimestre y la empuja al siguiente. Si ese cuatrimestre también se satura, repite hacia adelante (efecto cascada).

### Caso 3 — Violación de correlativas hacia adelante
Movés una materia al futuro (ej: Programación I al 2027) pero una materia que depende de ella (Programación II) había quedado en el 2026 — eso es inválido porque la dependiente quedaría antes que su requisito.

El algoritmo:
1. Detecta todas las materias dependientes que quedaron en el pasado o presente de la movida
2. Las desplanifica y las mete en una "bolsa de reacomodo"
3. Las reubica desde el cuatrimestre siguiente a la materia movida, en orden topológico
4. Además, esto se hace **recursivamente** (`resolveSubjectRecursive`): si al mover una dependiente se generan nuevas violaciones, se siguen reubicando hacia adelante

### Caso 4 — Caso 2 + Caso 3 combinados
Se procesa primero el Caso 3 (correlativas rotas), que muchas veces libera horas al sacar materias. Si después de eso el cuatrimestre destino sigue excedido, se aplica el Caso 2 (empujar la de menor peso al futuro).

### Caso 5 — Violación de correlativas hacia atrás (cascada inversa)
Movés una materia avanzada al pasado (ej: Metés Proyecto Final en el primer cuatrimestre), pero sus correlativas quedaron después.

El algoritmo intenta **adelantar recursivamente** todas las correlativas necesarias hacia atrás (`resolvePrerequisiteRecursive`), moviendo cada requisito al mejor cuatrimestre disponible antes de la materia.

**Subcaso A (éxito):** Hay espacio en los cuatrimestres anteriores y se reubican todos los requisitos.
**Subcaso B (error):** No hay cuatrimestres disponibles antes (por ejemplo, querés meter una materia en el cuatrimestre 1 pero sus requisitos necesitarían estar en cuatrimestre 0). Se cancela todo el movimiento y se muestra un error.

### Funciones clave del motor de edición:

| Función | Qué hace |
|---------|----------|
| `processMove()` | Orquestador principal: ejecuta los 5 casos en orden |
| `removeSubjectFromPlan()` | Saca una materia del plan |
| `addSubjectToPlan()` | Agrega una materia al plan en un año/cuatrimestre |
| `resolveSubjectRecursive()` | Caso 3 recursivo: reubica dependientes hacia adelante |
| `resolvePrerequisiteRecursive()` | Caso 5 recursivo: reubica correlativas hacia atrás |
| `findDependentSubjectsInPastOrPresent()` | Encuentra dependientes que rompen correlatividad |
| `hasPrerequisitesInPast()` | Verifica si una materia tiene todas sus correlativas antes |
| `getSubjectsInPeriod()` | Obtiene las materias de un cuatrimestre específico |

---

## 3. Validación

Archivo: `src/features/myPlanner/customPlan/services/validationService.ts` (133 líneas)

Antes de ejecutar `processMove()`, se hace una validación previa para mostrarle al usuario qué materías se van a ver afectadas:

- `validatePlacementLocal()` — Verifica si una materia puede ir en un período (prerrequisitos, límite horario)
- `getCascadingImpactLocal()` — Calcula qué otras materías se moverían como efecto cascada

Esto se usa en la UI para mostrar un modal de confirmación con las materias afectadas antes de ejecutar el movimiento.

---

## 4. Hooks (Conexión UI → Lógica)

| Archivo | Qué hace |
|---------|----------|
| `hooks/usePlanner.ts` | Hook principal: genera el plan con el algoritmo, maneja movimientos vía `processMove()`, carga planes guardados |
| `hooks/useDndTimeline.ts` | Maneja drag & drop, llama a validación previa, muestra modales de confirmación, ejecuta `processMove()` |
| `hooks/usePlanManager.ts` | CRUD de planes guardados (fetch, save, update, delete, clone) |

---

## 5. UI Componentes

| Archivo | Qué hace |
|---------|----------|
| `components/TimelineContent.tsx` | Timeline principal con DndContext, años, semestres |
| `components/SemesterRow.tsx` | Fila de cuatrimestre (drop zone) con materias |
| `components/SubjectCard.tsx` | Card arrastrable con indicador de peso de desbloqueo |
| `components/YearNavSidebar.tsx` | Sidebar de navegación por años |
| `components/MoveConfirmModal.tsx` | Modal que muestra el impacto antes de mover |
| `components/OptimizePlanModal.tsx` | Modal para re-optimizar el plan desde cierto año |

---

## 6. Modelo de Datos

Archivo: `src/features/myPlanner/customPlan/model/planner.ts`

Las estructuras principales:

- **`Plan`** → `{ years: PlannedYear[], totalCredits: number }`
- **`PlannedYear`** → `{ year: number, semesters: PlannedSemester[] }`
- **`PlannedSemester`** → `{ term: number, subjects: PlannedSubject[] }`
- **`PlannedSubject`** → `{ plan_subject_id, subject_name, weekly_hours, credits, weight }`
- **`SubjectGraph`** → `{ nodes: Map<id, SubjectGraphNode>, topoOrder: number[], unlockWeights: Map<id, number> }`
- **`SubjectGraphNode`** → `{ plan_subject_id, subject_name, weekly_hours, requires: number[], requiredBy: number[] }`
