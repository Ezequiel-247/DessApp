# Resumen de Cambios y Mejoras en el Planificador

Este documento resume las correcciones y mejoras implementadas en el motor de generación y edición del planificador de carrera. El objetivo ha sido aumentar la robustez, corregir bugs críticos y optimizar la lógica para producir planes más eficientes.

---

## 1. Correcciones de Bugs Críticos

Esta sección detalla la solución a problemas que podían generar datos inconsistentes o planes académicamente inválidos.

### 1.1. Eliminación del Bug `NaNhs` en el Cálculo de Horas

*   **Problema:** En varias partes de la aplicación (al generar, editar o cargar un plan), los cuatrimestres mostraban `NaNhs` en lugar de un número de horas.
*   **Causa Raíz:** Se realizaban operaciones matemáticas (sumas o restas) con valores que podían ser `undefined` (ej. `undefined - 5`), lo que resulta en `NaN` (Not a Number).
*   **Solución:** Se implementó un patrón de "código defensivo" en todas las funciones que manipulan horas y créditos, utilizando la expresión `(valor || 0)` para asegurar que cualquier valor `undefined` o `null` sea tratado como `0` antes de la operación.
*   **Archivos Afectados:**
    *   `editEngine.ts`: En las funciones `addSubjectToPlan` y `removeSubjectFromPlan`.
    *   `planningAlgorithm.ts`: En la función `generatePlan`.
    *   `usePlanner.ts`: En la función `loadFromSaved`.

### 1.2. Corrección de la Cascada Inversa (Dependencias Laterales)

*   **Problema:** Al mover una materia hacia atrás en el tiempo (ej. `Cálculo III`), la cascada inversa movía correctamente sus prerrequisitos (`Cálculo II`, `Cálculo I`), pero no verificaba si esos prerrequisitos eran también necesarios para otras materias (`Física I`), dejando el plan en un estado inválido. (Ver `ANALISIS_CASCADA_INVERSA.md`).
*   **Solución:** Se añadió una validación estricta dentro de la función `resolvePrerequisiteRecursive` en `editEngine.ts`.
    1.  Se creó una nueva función `findLateralDependents` para identificar a las materias "espectadoras" que dependen del prerrequisito que se está moviendo.
    2.  Antes de confirmar el movimiento del prerrequisito, se verifica si su nueva posición dejaría a alguna de estas dependencias laterales en un período inválido.
    3.  Si se detecta un conflicto, toda la operación se aborta con un error claro, previniendo la corrupción del plan.

---

## 2. Mejoras de Lógica y Optimización del Plan

Esta sección cubre las mejoras para que el planificador no solo sea correcto, sino también más inteligente y eficiente.

### 2.1. Relleno Inteligente de Huecos Durante la Edición

*   **Problema:** Al editar el plan, el efecto cascada a menudo empujaba materias hacia el futuro, dejando cuatrimestres con pocas horas o completamente vacíos, resultando en un plan poco compacto. (Ver `ANALISIS_OPTIMIZACION_PLAN.md`).
*   **Solución:** Se mejoró la lógica de la función `resolveSubjectRecursive` en `editEngine.ts`.
    1.  Ahora, para cada materia que debe ser reacomodada, en lugar de buscar un hueco desde un punto de partida fijo, primero se analiza el plan actual para encontrar la ubicación del **último prerrequisito ya ubicado**.
    2.  Esto establece un "piso" académico real y permite que la función `findBestTerm` busque y **aproveche los espacios libres en cuatrimestres anteriores** que respeten las correlatividades.
*   **Impacto:** El plan ahora se "auto-compacta" después de una edición, ya que el algoritmo es capaz de rellenar huecos de manera inteligente, produciendo un resultado más realista y eficiente.

---

## 3. Sesión del 01/07/2026: Año/Cuatrimestre Sabático + Corrección de Electivas

### 3.1. Bug: Horas de Bloques Genéricos (UNAHUR/Electivas) No Contabilizadas

*   **Problema:** Las horas de las electivas/UNAHUR no se sumaban a ningún límite horario, y todas caían siempre en el primer cuatrimestre del plan en vez de distribuirse.
*   **Causa Raíz:** `calculateTermHours`, `findBestTerm` y `findBestTermBackwards` solo leían `semester.total_hours` (materias reales); las horas de `generic_blocks` nunca se sumaban ahí.
*   **Solución:** Nueva función `getGenericBlockHours()` sumada en los 3 puntos de control horario, y el loop de bloques pasó a usar `findBestTerm()` para distribuirse en vez de un período fijo.
*   **Archivos Afectados:** `planningAlgorithm.ts`, `validationService.ts`, `SemesterRow.tsx`.

### 3.2. Bug: `NaNhs` al Abrir un Plan Guardado

*   **Problema:** Los planes ya guardados (no recién generados) mostraban `NaNhs` en cada cuatrimestre.
*   **Causa Raíz:** `weekly_hours` vive en el modelo `Subject`, no en `PlanSubject`. El endpoint de planes guardados no aplanaba ese campo (a diferencia del endpoint de datos en vivo), y `loadFromSaved` leía un campo que no existía en esa respuesta → `undefined`, que se propaga como `NaN` en las sumas.
*   **Solución:** `loadFromSaved` ahora lee `plan_subject.subject.weekly_hours`, con fallback a `0`.
*   **Archivos Afectados:** `usePlanner.ts`, `model/planner.ts`, `planManagerService.ts`.

### 3.3. Feature Nueva: Año/Cuatrimestre Sabático

*   **Qué hace:** Botón "Sabático" (solo en modo edición) que abre un modal para marcar un año o cuatrimestre puntual como descanso. El planificador vacía ese período y corre todo lo posterior un lugar (o dos, si es año completo), sin reordenar el contenido entre sí. Se puede cancelar desde el mismo modal o desde un botón inline en la casilla marcada.
*   **Backend:** Tabla nueva `custom_study_plan_sabbaticals` (`id_custom_study_plan`, `year`, `term`), relacionada a `CustomStudyPlan` (no a `Student`, para que cada plan tenga su propio timeline). CRUD deliberadamente incompleto (sin `update`): `GET/POST/DELETE /api/custom-study-plans/:planId/sabbaticals`.
*   **Motor de corrimiento:** `sabbaticalEngine.ts` (nuevo) — aplana el plan a una secuencia lineal de cuatrimestres, inserta/saca huecos con `splice`, y relabelea el año/cuatrimestre calendario de todo lo posterior. Como el desplazamiento es uniforme, nunca hace falta re-validar correlativas.
*   **Protección:** los períodos marcados como sabáticos se ven con un badge distintivo y no aceptan que se les arrastre una materia (droppable deshabilitado + segunda validación en `useDndTimeline`).
*   **Bug de consistencia corregido en la misma sesión:** cancelar un sabático borraba la fila del backend de inmediato, pero el corrimiento inverso solo vivía en memoria hasta guardar manualmente — si el usuario no guardaba (o cancelaba los cambios) después, el marcador desaparecía mientras las materias quedaban corridas para siempre. Ahora aplicar/cancelar dispara un guardado automático, sin depender de un click manual en "Guardar".
*   **Archivos Afectados (nuevos):** `services/sabbaticalService.ts`, `services/sabbaticalEngine.ts`, `hooks/useSabbatical.ts`, `components/SabbaticalModal.tsx`, más el CRUD completo en el backend (`models/customStudyPlanSabbatical.js`, `middlewares/`, `controllers/`, `routes/`).

### 3.4. Bug de Scroll en Planes Extensos

*   **Problema:** Con un plan de varios años, hacer scroll manual hacia arriba se sentía "trabado" — la vista saltaba sola.
*   **Causa Raíz:** Un mismo callback (`onYearVisible`) se usaba tanto para navegación manual (tabs/dropdown/sidebar) como para el tracking pasivo por `IntersectionObserver` mientras se scrollea. Un `useEffect` reaccionaba a *cualquier* cambio de año activo forzando un `scrollIntoView`, peleando contra el scroll natural del usuario.
*   **Solución:** Se separaron las dos responsabilidades — navegación explícita (`scrollToYear`) fuerza el scroll; el observer pasivo solo actualiza qué tab está resaltado.
*   **Archivos Afectados:** `PlannerDetailView.tsx`.

### 3.5. Bug: Electivas Nunca Generaban Bloque

*   **Problema:** La Fase 4 del refactor anterior prometía bloques para "UNAHUR y electivas", pero solo UNAHUR funcionaba.
*   **Causa Raíz:** El campo que marca una electiva (`PlanSubject.is_elective`) nunca viajaba del backend (`getPlannerData`) al frontend; el código leía un campo `block_type` que no existía en ningún lado del pipeline real.
*   **Solución:** Se sumó `is_elective` a la respuesta de `getPlannerData` y se leyó de verdad en `planningAlgorithm.ts`.
*   **Bug de seguimiento (detectado y corregido en la misma sesión):** el loop que ubicaba los bloques arrancaba siempre desde el primer cuatrimestre del plan **sin mirar las correlativas propias del bloque**. Con datos reales (5 electivas de 4hs = 20hs exactas, todas con correlativa contra Matemática I/Programación I), esto llenaba el primer cuatrimestre por completo antes de que las materias reales sin prerequisitos tuvieran su turno, empujando *todo* el plan un cuatrimestre hacia adelante — reproducido y confirmado con los datos de seed reales.
*   **Decisión final:** en vez de mantenerlas como "bloque informativo" separado, se eliminó el concepto de `generic_block` para electivas/UNAHUR — ahora son `PlannedSubject` reales (drag & drop y cascada de correlativas gratis, mismo motor que cualquier materia), diferenciadas solo visualmente con un tag `block_type` (verde esmeralda para electivas, gris para UNAHUR). Efecto colateral positivo: al ser materias reales, ahora se guardan y cargan correctamente (antes, como bloques informativos, nunca se persistían).
*   **Archivos Afectados:** `studentController.js`, `model/planner.ts`, `planningAlgorithm.ts`, `editEngine.ts`, `usePlanner.ts`, `SubjectCard.tsx`, `SemesterRow.tsx`.

### 3.6. El Proyecto Final Podía Quedar "en el Medio" del Cronograma

*   **Problema:** Ahora que las electivas se proyectan como materias reales (ver 3.5), podían terminar ubicadas en un cuatrimestre posterior al del Proyecto Final — por ejemplo, si el límite horario obligaba a una electiva a buscar espacio varios cuatrimestres más adelante de lo esperado. El Proyecto Final es una materia terminal (nada depende de ella) y su propia cadena de correlativas puede resolverse relativamente temprano, así que la asignación greedy normal no garantiza que quede al final de *todo* el plan.
*   **Causa Raíz:** La Fase 3 ubica cada materia únicamente en base a sus propias correlativas (`findLatestPrerequisitePeriod`), sin ningún concepto de "esto tiene que ser lo último, sin excepción, del cronograma completo".
*   **Decisión de diseño:** en vez de inferir automáticamente cuál materia es "el proyecto final" (heurística de grafo, propensa a fallar con planes que tengan más de una materia terminal igual de profunda), se agregó un flag explícito `is_final_project` en `PlanSubject` — mismo patrón que `is_elective`/`is_unahur`. Marcado a mano en el seeder para "Proyecto Final Computación" y "Proyecto Final Ambiental".
*   **Solución:** la Fase 3 ahora procesa las materias marcadas `is_final_project` en una **segunda pasada**, después de ubicar absolutamente todo lo demás (incluidas las electivas). Cada una se agenda como mínimo un cuatrimestre después del último período ocupado en *todo* el plan (no solo después de sus propias correlativas), usando la nueva función `findLastOccupiedPeriod()`.
*   **Archivos Afectados:** `models/planSubject.js` (columna nueva), `studentController.js`, `seeders/planSubjects.seeder.js`, `controllers/planSubjectController.js`, `model/planner.ts`, `planningAlgorithm.ts`.

### 3.7. Feature Nueva: Selección de Electivas ("elegí N de M")

*   **Motivación:** con todas las electivas de un plan proyectadas como materias reales (ver 3.5), un plan con 5 opciones electivas las mostraba las 5 — cuando en la práctica el estudiante solo cursa 1 o 2 (`min_required` del bloque, no todas). Se aprovechó que el proyecto **ya tenía** un sistema de bloques electivos armado (`PlanElectiveBlock` + `PlanElectiveBlockSubject`, con `min_required` propio por bloque — ej. Ingeniería en Computación tiene 2 bloques, "elegí 1 de 2" y "elegí 2 de 3") que no estaba conectado al planificador personalizado.
*   **Persistencia:** la elección vive **por plan** (`CustomStudyPlan`), no por estudiante — así, dos planes distintos del mismo estudiante (ej. comparando escenarios) pueden tener electivas diferentes. Tabla nueva `custom_study_plan_elective_choices` (`id_custom_study_plan`, `id_elective_block`, `plan_subject_id`), con el mismo patrón CRUD que `custom_study_plan_sabbaticals`. El backend valida server-side que la materia elegida pertenezca al pool del bloque y que no se supere `min_required`.
*   **Algoritmo:** `generatePlan()` recibe dos parámetros nuevos opcionales — `electivePoolIds` (todas las materias que pertenecen a algún bloque) y `chosenElectiveIds` (el subconjunto elegido para este plan). Una materia del pool que no fue elegida se excluye de la proyección, igual que una finalizada/regularizada. Un plan nuevo sin elecciones no proyecta ninguna electiva hasta que el estudiante elige.
*   **Edición en vivo:** nuevas funciones `addElectiveSubject`/`removeElectiveSubject` en `editEngine.ts` — a diferencia de mover una materia (`processMove`), no disparan ninguna cascada porque las electivas no tienen dependientes (son terminales). Mismo mecanismo de auto-guardado que el sabático (ver 3.3) para que la elección persistida y el plan en memoria nunca queden desincronizados.
*   **Cuidado técnico:** `electivePoolIds`/`chosenElectiveIds` se leen desde un `ref` dentro de `usePlanner`, no como dependencia directa de `generate()` — si entraran en las dependencias, elegir una electiva en un plan ya existente dispararía una regeneración completa desde cero, descartando cualquier edición manual ya aplicada (drags, sabáticos).
*   **UI:** botón "Electivas" (junto a "Sabático", solo en modo edición) abre un modal que agrupa por bloque, muestra `X/min_required elegidas` y deshabilita el checkbox de una materia no elegida una vez alcanzado el límite del bloque.
*   **Archivos Afectados (nuevos):** `models/customStudyPlanElectiveChoice.js`, `middlewares/`, `controllers/customStudyPlanElectiveChoiceController.js`, `routes/`; `services/electiveChoiceService.ts`, `hooks/useElectiveChoices.ts`, `components/ElectiveModal.tsx`.
*   **Archivos Afectados (modificados):** `planningAlgorithm.ts`, `editEngine.ts`, `usePlanner.ts`, `useMyPlannerPage.ts`, `PlannerActions.tsx`, `PlannerDetailView.tsx`, `PlannerHeader.tsx`, `MyPlannerPage.tsx`, `customStudyPlanController.js`.
*   **Bug de seguimiento corregido en la misma sesión:** `useElectiveChoices` solo cargaba los bloques (`blocks`) cuando se abría el modal — pero `generatePlan()` necesita el pool *antes*, al generar el plan por primera vez. Si nadie había abierto el modal todavía, el pool llegaba vacío y el filtro nunca excluía nada (se veían las 5 electivas en un plan nuevo). Se agregó un `useEffect` en `useElectiveChoices.ts` que carga los bloques automáticamente en cuanto se conoce el `studyPlanId`, sin depender de que se abra el modal. **Nota:** un plan ya guardado ANTES de este fix quedó con las electivas de más incluidas de forma permanente — no hay acción de "eliminar materia" en el planificador todavía, así que hay que borrar ese plan puntual y crear uno nuevo.
*   **Pendiente (fuera de esta sesión):** el mismo mecanismo de selección (bloques, `min_required`, modal, exclusión en `generatePlan`) está pensado para aplicarse también a materias UNAHUR — hoy solo se implementó para electivas porque `PlanUnahurBlock` no tiene todavía una tabla de "pool de materias candidatas" (`PlanUnahurBlockSubject`, no existe) ni materias UNAHUR reales cargadas en el seeder. Para replicarlo haría falta: 1) crear `PlanUnahurBlockSubject` (mismo patrón que `PlanElectiveBlockSubject`), 2) cargar en el seeder las materias `is_unahur:true` ya existentes (Ética Profesional, etc.) vinculadas a los planes de estudio, 3) reutilizar `CustomStudyPlanElectiveChoice`/`ElectiveModal`/la lógica de `generatePlan` generalizándolas a ambos tipos de bloque (o duplicando el mismo patrón para UNAHUR).

---

## Conclusión

Con estas refactorizaciones, el planificador ha evolucionado significativamente:

-   **Es más robusto:** Los cálculos de horas y créditos son a prueba de `NaN`.
-   **Es más seguro:** Ya no es posible generar un plan académicamente inválido a través de la cascada inversa.
-   **Es más inteligente:** El motor de edición no solo resuelve conflictos, sino que también optimiza la distribución de las materias para crear planes más compactos y eficientes.
-   **Es más flexible:** el estudiante puede marcar años/cuatrimestres sabáticos y el plan se reacomoda solo, sin perder el orden de las correlativas.
-   **Es más consistente:** electivas y UNAHUR son materias reales (con drag & drop, cascada y persistencia propias) en vez de bloques informativos separados que se perdían al guardar.
-   **Respeta la estructura curricular:** el Proyecto Final (u otra materia marcada como terminal) siempre queda al final del cronograma, sin importar cómo se acomoden las electivas u otras materias alrededor.
-   **Refleja la realidad del plan de estudios:** el estudiante elige exactamente las electivas que va a cursar (respetando el "elegí N de M" real de cada bloque curricular), en vez de ver todas las opciones disponibles proyectadas a la vez.