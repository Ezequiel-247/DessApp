# Plan de Implementación y Arquitectura: Módulo 4 - Asistente Académico

Este documento detalla la estructura de páginas, el orden de implementación por niveles de dificultad y la estrategia del algoritmo para el **Módulo 4: Asistente Académico**. El objetivo es acompañar la cursada de los estudiantes universitarios permitiéndoles diagnosticar su estado actual y simular escenarios futuros de planificación.

---

### Paso 0 (Fundacional): Agregar `enrolled` a AcademicRecord

**Contexto:** El simulador (`currently_in_course`) no reconocía materias como "en curso" porque el frontend nunca enviaba `status = 'enrolled'`. El AcademicRecord solo soportaba `approved / pending / failed`. Las materias "En curso" se importaban como `pending` (→ `'pendiente'` en DB), que el backend interpretaba como "regularizada", no "en curso".

**Solución:** Agregar `enrolled` como cuarto status válido, reemplazar `pending` por `enrolled` en los dropdowns de formularios, y auto-derivar `pending` cuando el usuario selecciona `approved` con nota 4-6.

| Dropdown (3 opciones) | Grade | Auto-derivación | Payload al backend |
|---|---|---|---|
| `enrolled` (En curso) | — | — | `{ status: "enrolled" }` |
| `approved` (Aprobada) | 7–10 | — | `{ status: "aprobado", grade }` |
| `approved` (Aprobada) | 4–6 | → `pending` + expiry +2y | `{ status: "pendiente", regularity_expires_at }` |
| `failed` (Desaprobada) | 1–3 | — | `{ status: "desaprobado", grade }` |

**Archivos modificados (frontend):**

- [x] `academicRecord.ts` — `ENROLLED: "enrolled"` en `ACADEMIC_STATUS`
- [x] `academicRecordApi.ts` — `enrolled` en ambos maps de traducción FE/DB
- [x] `useAcademicRecord.ts` — Draft default `enrolled`, fieldChange, auto-derivación, validación, eligibility
- [x] `useAcademicRecordCrud.ts` — `enrolled` limpia grade como `pending`
- [x] `AcademicRecordPage.tsx` — Labels/styles, dropdown, grade input, expiry en `approved`+4-6
- [x] `import-rules.ts` — `enrolled` en `GRADE_RANGES`
- [x] `useImportExcel.ts` — `"En curso"` → `"enrolled"`, auto-derivación en importación
- [x] `ImportExcelModal.tsx` — Dropdown, grade disabled, status handler
- [x] `useDashboard.ts` — `currentTermPending` incluye `enrolled`
- [ ] **Backend** — Agregar `'enrolled'` como valor válido en `academic_records.status` (DB schema)

---

## 1. Arquitectura de la Información: Propuesta de Páginas

Para optimizar la experiencia de usuario (UX) y separar las acciones **consultivas** de las **interactivas**, se propone dividir el módulo en dos pantallas principales.

### Terminología Académica

A lo largo de este plan se usan los siguientes conceptos:

* **Materia Finalizada:** Una materia se considera finalizada cuando el alumno la completó, lo cual puede darse por cualquiera de estas vías:
  - Nota >= 7 en la cursada (promoción directa, sin examen final).
  - Nota entre 4 y 6 en la cursada + examen final aprobado.
  - Nota "C" (Cumplida) con `status = 'aprobado'`.
  - Nota "equivalencia" o nota vacía con `status = 'aprobado'` (materia convalidada de otro plan/instituto — pendiente de normalizar en seeders).
* **Materia Regularizada:** Una materia se considera regularizada cuando el alumno aprobó la cursada (nota entre 4 y 6 inclusive, es decir `grade > 3 AND grade < 7`) pero aún no aprobó el examen final. En el modelo, se identifica por `status = 'pendiente'`, `regularity_expires_at` no vencido, y sin un `final_exam` con `status = 'aprobado'`.
* **Materia en Curso:** Materia que el alumno está cursando actualmente (`status = 'enrolled'`).
* **Materia Faltante:** Materia del plan de estudios que el alumno no tiene ni finalizada ni regularizada ni en curso.

### Mapeo de estados en base de datos

| Concepto | status | grade | regularity_expires_at | final_exam.status |
|---|---|---|---|---|
| En curso | `'enrolled'` | `null` | `null` | — |
| Regularizada | `'pendiente'` | `> 3 AND < 7` | `>= TODAY` y NOT NULL | sin `'aprobado'` |
| Finalizada (promoción) | `'aprobado'` | `>= 7` | `null` | — |
| Finalizada (cursada+final) | `'aprobado'` | `4-6` | `null` | `'aprobado'` |
| Finalizada (Cumplida) | `'aprobado'` | `'C'` | `null` | — |
| Finalizada (equivalencia) | `'aprobado'` | vacío | `null` | — |
| Desaprobado | `'desaprobado'` | `< 4` | `null` | — |

### Pantalla 1: "Mi Progreso" (Módulo 4.1)
Esta pantalla centraliza el diagnóstico de la situación académica real del alumno. Es de carácter informativo y utiliza componentes visuales claros (tarjetas, barras de progreso y listas).

* **Dashboard de Avance (Sección Superior):**
    * **Porcentaje de avance general:** Barra de progreso calculada sobre créditos obtenidos vs. créditos requeridos del plan.
        - [x] **Cambios o features backend:** Reutilizar el método `getAcademicSummary()` existente en `academicRecordService.js` que ya suma créditos de materias finalizadas (`plan_subjects.credits`) más créditos de actividades extracurriculares (`ExtracurricularActivity.credits`) y divide por el total de créditos requeridos. Ajustar la lógica de "materia finalizada" según la terminología definida. Verificar que filtra solo registros con `status: 'aprobado'` (excluye regularizadas que ahora serán `'pendiente'`). Confirmar que materias con equivalencia (grade vacío + `status: 'aprobado'`) sean incluidas en el conteo.
        - [x] **Cambios o features frontend:** Componente de barra de progreso que consuma el endpoint de resumen académico. → Archivos: `src/features/my-progress/hooks/useMyProgress.ts` | `src/features/my-progress/components/ProgressOverviewCard.tsx`
        - CONECTADO AMBOS FRENTES
    * **Contadores de Condiciones de Egreso:** Créditos obtenidos vs. requeridos (sumando `plan_subjects.credits` de materias finalizadas más `ExtracurricularActivity.credits`), materias UNAHUR finalizadas vs. requeridas, y niveles de inglés.
        - [x] **Cambios o features backend:** Los valores requeridos se obtienen de `StudyPlan.required_credits`, `StudyPlan.required_unahur_subjects` y `StudyPlan.required_english_levels`, o del modelo `StudyPlanRequirement`. Este dato ya lo retorna `getAcademicSummary()`.
        - [x] **Cambios o features frontend:** Componentes de contadores que muestren los valores retornados por la API. → Archivos: `src/features/my-progress/hooks/useMyProgress.ts` | `src/features/my-progress/components/ConditionsGrid.tsx`
        - CONECTADO AMBOS FRENTES
    * **Indicador de Año de Cursada Actual (Opcional - Post-Lanzamiento):** Leyenda que indica el año académico que cursa el alumno (ej. "2.5 años" o "3er Año, 1er Cuatrimestre") según su fecha de ingreso y el período actual.
        - [x] **Cambios o features backend:** Crear endpoint/función que calcule la antigüedad del alumno usando `StudentCareerEnrollment.enrolled_at`.
        - [x] **Cambios o features frontend:** Componente de indicador textual. → Archivos: `src/features/my-progress/hooks/useMyProgress.ts`
        - CONECTADO AMBOS FRENTES
* **Análisis Desglosado por Año (Sección Central):**
    * Componente de tipo acordeón o pestañas desplegables para cada año del plan de estudios (1°, 2°, 3°, etc.). Al abrir cada año, se muestra un resumen cuantitativo: *X Finalizadas, Y Regularizadas, Z en Curso, W Faltantes*.
        - [x] **Cambios o features backend:** Crear servicio que agrupe `plan_subjects` por `suggested_year`, los cruce con `academic_records` del alumno y clasifique cada materia según la terminología definida. Debe retornar el resumen por año.
        - [x] **Campos adicionales backend — `available` + `prerequisites`:** Cada subject del breakdown ahora incluye:
            - `available: boolean` — `true` si todas las correlatividades están cumplidas.
            - `prerequisites: array` — Lista de prerequisitos con `{ subject_name, required_status, current_status }`. Vacío si no tiene correlativas.
        - [x] **Cambios o features frontend:** Componente de acordeón con tarjetas y contadores por año. → Archivos: `src/features/my-progress/hooks/useMyProgress.ts` | `src/features/my-progress/components/YearAccordion.tsx`
        - CONECTADO AMBOS FRENTES
    * **Indicadores 🔒/🔓 en materias Faltantes:**
        - Las materias `faltante` muestran 🔓 si `available: true` (sin tooltip), o 🔒 si `available: false` (tooltip con lista de prerequisitos).
        - Tooltip en 🔒: cada prerequisito muestra nombre, estado requerido y estado actual del alumno. Verde ✅ si cumplido, rojo ❌ si no.
        - Las materias con otro estado (`finalizada / regularizada / en_curso`) **no** muestran indicador.
* **Alertas Académicas y Disponibilidad (Sección Lateral/Inferior):**
    * **Finales Pendientes:** Listado de materias regularizadas (nota entre 4 y 6 inclusive, es decir `grade > 3 AND grade < 7`) que aún no tienen un `final_exam` con estado 'aprobado'. Cada materia se incluye mientras su `regularity_expires_at` no haya vencido. Cada tarjeta muestra la cantidad de intentos previos (obtenidos de `final_exam` donde `status = 'desaprobado'`) y la fecha exacta o cuatrimestre en que vence la regularidad.
        - [x] **Cambios o features backend:** Crear servicio que consulte `academic_records` con la lógica definida y cuente los `final_exam` asociados.
        - [x] **Cambios o features frontend:** Lista de tarjetas con datos de la materia, intentos y fecha de vencimiento. → Archivos: `src/features/my-progress/hooks/useMyProgress.ts` | `src/features/my-progress/components/PendingFinalsSection.tsx`
        - CONECTADO AMBOS FRENTES
    
    
    --ESTA DE ABAJO POR AHORA NO!!!
    
    * **Oferta de Inscripción Teórica:** Listado de materias que el alumno tiene habilitadas para cursar inmediatamente, filtradas por el cumplimiento estricto de correlatividades.
        - [ ] **Cambios o features backend:** Depende del Motor de Validación de Correlativas (Punto 6 del Nivel 3). Endpoint que retorne las materias inscribibles.
        - [ ] **Cambios o features frontend:** Lista de materias disponibles.

### Pantalla 2: "Planificador de Carrera" (Módulo 4.2)
Espacio interactivo tipo *sandbox* donde el alumno diseña y proyecta su trayectoria de cara al futuro.

* **Panel "¿Qué pasa si...?" (Simulador Corto Plazo):**
    * *Estado Activo:* Si el alumno posee materias en curso, se despliega un listado con selectores (checks). Al marcar una o varias materias simulando que las aprueba/regulariza, un panel contiguo muestra qué materias se "destraban" (desbloqueo de correlativas) para el próximo cuatrimestre.
    * *Estado Vacío:* Si no registra materias en curso, el panel muestra un mensaje explicativo deshabilitando la función.
        - [x] **Cambios o features backend:** Endpoint que reciba un listado de `plan_subject_id` a simular como finalizadas, ejecute el Motor de Validación de Correlativas (Punto 7 del Nivel 3) sobre un clon del `academic record`, y retorne las materias desbloqueadas. Cada materia desbloqueada incluye `unlocked_by: number[]` con los IDs de las materias simuladas que la desbloquean.
        - [x] **Cambios o features frontend:** Panel con checkboxes (`SimulatorView`) conectado al endpoint via `simulatorService.simulateWhatIf()`. Estados: loading, error, empty ("No tenés materias en curso"), resultados con periodo sugerido. Agrupa resultados por `unlocked_by` para mostrar bajo qué materia se desbloquea cada una.
        - CONECTADO AMBOS FRENTES
* **Línea de Tiempo del Planificador (Medio/Largo Plazo):**
    * **Configuración Inicial:** Formulario flotante o modal donde el usuario introduce sus horas semanales disponibles. El tope de materias por cuatrimestre se deriva automáticamente del límite de horas semanales.
        - [x] **Cambios o features backend:** No requiere backend específico. El cálculo de tope de materias se realiza en frontend según `plan_subjects.weekly_hours`.
        - [x] **Cambios o features frontend:** Modal (`SetupModal`) con ajuste de horas (+/- 1) y derivación de tope de materias. → Archivos: `src/features/myPlanner/components/SetupModal.tsx` | `src/features/myPlanner/hooks/usePlannerSetup.ts` | `src/features/myPlanner/customPlan/hooks/usePlanner.ts`
        - CONECTADO AMBOS FRENTES
    * **Canvas de Planificación:** Cronograma visual con semestres como filas y materias como cards, integrado con el endpoint `generate-plan`.
        - [x] **Cambios o features backend:** Endpoint del Algoritmo del Planificador Automático (Punto 8 del Nivel 4) que reciba configuración y retorne la planificación sugerida.
        - [x] **Cambios o features frontend:** TimelineContent que renderiza el plan del API con layout por años/semestres, subject cards, sidebar de navegación y footer con créditos. → Archivos: `src/features/myPlanner/customPlan/components/TimelineContent.tsx` | `src/features/myPlanner/customPlan/components/SemesterRow.tsx` | `src/features/myPlanner/customPlan/components/SubjectCard.tsx` | `src/features/myPlanner/customPlan/components/YearNavSidebar.tsx` | `src/features/myPlanner/customPlan/components/PlannerFooter.tsx` | `src/features/myPlanner/customPlan/services/plannerService.ts`
        - CONECTADO AMBOS FRENTES
    * **Interacción Drag & Drop:** Permite arrastrar materias entre diferentes cuatrimestres para personalizar el recorrido.
        - [x] **Cambios o features backend:** No requiere backend. La validación de restricciones (correlatividades, horas) se apoya en los servicios backend existentes.
        - [x] **Cambios o features frontend:** DnD implementado con `@dnd-kit/core`. Cards draggable, semestres droppable, `DragOverlay` con clone visual. → Archivos: `src/features/myPlanner/customPlan/hooks/useDndTimeline.ts` | `src/features/myPlanner/customPlan/components/SubjectCard.tsx` | `src/features/myPlanner/customPlan/components/SemesterRow.tsx`
        - CONECTADO AMBOS FRENTES
* **Gestor de Planes:**
    * Selector para guardar el plan actual con un nombre personalizado (ej. "Plan Trabajo Turno Noche", "Plan Intensivo") y la posibilidad de alternar entre distintos planes guardados (`custom_study_plan` + `custom_study_plan_items`).
        - [x] **Cambios o features backend:** CRUD completo de `CustomStudyPlan` + `CustomStudyPlanItem` (Punto 9 del Nivel 4).
        - [x] **Cambios o features frontend:** `PlanSelector` (dropdown en header), `SavePlanModal` (nombre + guardar), `PlannerMenu` actualizado con lista de planes guardados, integración completa en `MyPlannerPage`. → Archivos: `src/features/myPlanner/customPlan/services/planManagerService.ts` | `src/features/myPlanner/customPlan/hooks/usePlanManager.ts` | `src/features/myPlanner/customPlan/components/PlanSelector.tsx` | `src/features/myPlanner/customPlan/components/SavePlanModal.tsx` | `src/features/myPlanner/components/PlannerMenu.tsx` | `src/pages/StudentPage/MyPlannerPage.tsx`
        - CONECTADO AMBOS FRENTES

---

## 2. Plan de Implementación Ordenado por Dificultad

El desarrollo se estructura en cuatro niveles progresivos, asegurando que las bases de datos y las consultas más simples queden firmes antes de avanzar hacia la lógica algorítmica.

```
+-------------------------------------------------------+
|  NIVEL 1: Métricas de Lectura y Filtros Simples        |
+-------------------------------------------------------+
                           |
                           v
+-------------------------------------------------------+
|  NIVEL 2: Lógica Temporal e Historial Académico       |
+-------------------------------------------------------+
                           |
                           v
+-------------------------------------------------------+
|  NIVEL 3: Árbol de Correlatividades y Simulación      |
+-------------------------------------------------------+
                           |
                           v
+-------------------------------------------------------+
|  NIVEL 4: Algoritmo de Optimización y Persistencia    |
+-------------------------------------------------------+
```

### Nivel 0 (Previo): Migración de seeders al contrato del plan
Ejecutar antes del Nivel 1 para que los datos de prueba coincidan con la terminología definida.

- [x] **Seeder `academicRecords.seeder.js`** — Cambiar 7 registros:
    - 4 registros con `status: 'pendiente'`, `grade: null` → `status: 'enrolled'`, `grade: null` (en curso).
    - 3 registros con `status: 'aprobado'`, `grade: '4'-'6'` → `status: 'pendiente'`, `grade: '4'-'6'` (regularizada). Mantener `regularity_expires_at`.
- [x] **Seeder `finalExams.seeder.js`** — Verificar que los `final_exam` apunten a los `academic_records` correctos después del cambio de status. Los registros con `final_exam` aprobado deben conservar `status: 'aprobado'`.
- [x] **Test mocks (`tests/mocks/mockData.js`)** — Actualizar `academicRecordsMock` si usa la convención vieja (`'pendiente'` como en curso).

### Nivel 1: Dificultad Baja (Métricas de Lectura)
Consultas directas y agregaciones matemáticas sobre el estado actual del `academic record`.

1.  **Cálculo del Porcentaje de Avance:**
    - [x] **Cambios o features backend:** Reutilizar `getAcademicSummary()` de `academicRecordService.js`. Ajustar la lógica para que considere la definición completa de materia finalizada (nota >= 7, nota "C", nota con equivalencia, nota vacía con `status = 'aprobado'`, o nota 4-6 con `final_exam` aprobado).
    - [x] **Cambios o features frontend:** Ninguno. Este punto es enteramente de lógica backend. → Archivos: `src/features/my-progress/hooks/useMyProgress.ts` | `src/features/my-progress/components/ProgressOverviewCard.tsx`
    - CONECTADO AMBOS FRENTES

2.  **Contador de Créditos y Materias UNAHUR:**
    - [x] **Cambios o features backend:** Cruzar materias finalizadas del `academic record` con `subject.is_unahur`. Sumar `plan_subjects.credits`. Contrastar contra `StudyPlan.required_unahur_subjects` y `StudyPlan.required_english_levels`, o `StudyPlanRequirement`.
    - [x] **Cambios o features frontend:** Ninguno. Este punto es enteramente de lógica backend. El frontend solo consume el resultado. → Archivos: `src/features/my-progress/hooks/useMyProgress.ts`
    - CONECTADO AMBOS FRENTES

3.  **Estructura del Análisis por Año:**
    - [x] **Cambios o features backend:** Crear servicio que agrupe `plan_subjects` por `suggested_year`, los cruce con `academic_records` del alumno y clasifique cada materia en las cuatro categorías (Finalizada / Regularizada / En Curso / Faltante) según la terminología definida.
    - [x] **Campos adicionales backend:** Se agregaron `available: boolean` y `prerequisites: array` a cada subject. Disponibilidad calculada con el mismo Motor de Correlatividades del Punto 6. Ver `backend-ayuda4.md` para detalle.
    - [x] **Cambios o features frontend:** Acordeón por año con tabla de materias. Cada `faltante` muestra 🔒 o 🔓 con tooltip de prerequisitos. → Archivos: `src/features/my-progress/hooks/useMyProgress.ts` | `src/features/my-progress/components/YearAccordion.tsx` | `src/features/my-progress/services/progressService.ts` | `src/features/my-progress/model/progress.ts`
    - CONECTADO AMBOS FRENTES

### Nivel 2: Dificultad Media-Baja (Lógica Temporal e Historial)
Operaciones que involucran cálculos de fechas, cuatrimestres y recuento de sub-entidades vinculadas.

4.  **Cálculo del Año de Cursada Actual (Opcional - Post-Lanzamiento):**
    - [x] **Cambios o features backend:** Función que calcule la antigüedad del alumno usando `StudentCareerEnrollment.enrolled_at` contra el período actual.
    - [x] **Cambios o features frontend:** Ninguno. El frontend solo muestra el valor retornado. → Archivos: `src/features/my-progress/hooks/useMyProgress.ts`
    - CONECTADO AMBOS FRENTES

5.  **Alertas de Finales Pendientes y Vencimientos:**
    - [x] **Cambios o features backend:** Servicio que consulte `academic_records` cumpliendo: `status = 'pendiente'`, `grade > 3 AND grade < 7`, `regularity_expires_at IS NOT NULL` y `regularity_expires_at >= CURRENT_DATE`, sin `final_exam` con `status = 'aprobado'`. Contar los `final_exam` con `status = 'desaprobado'` como intentos previos.
    - [x] **Cambios o features frontend:** Ninguno. El frontend recibe el listado ya procesado y lo muestra. → Archivos: `src/features/my-progress/hooks/useMyProgress.ts` | `src/features/my-progress/components/PendingFinalsSection.tsx`
    - CONECTADO AMBOS FRENTES

### Nivel 3: Dificultad Media-Alta (Árbol de Correlatividades)
Evaluación de dependencias lógicas y alteración del entorno en memoria para simulaciones. Toda la lógica de este nivel debe implementarse en un servicio backend dedicado.

6.  **Motor de Validación de Correlativas (Materias Disponibles):**
    - [x] **Cambios o features backend:** Crear `services/correlativityEngine.js` con una función que recorra las materias que el alumno aún no tiene finalizadas y verifique sus correlativas requeridas según `Correlativity.type`:
        - `'regularidad'` — la materia requerida debe estar regularizada o finalizada.
        - `'aprobacion'` — la materia requerida debe estar finalizada.
        - `'finalizada'` — la materia requerida debe estar finalizada y tener `final_exam` aprobado.
        - `null` — se considera `'aprobacion'` por defecto.
    - [x] **Cambios o features frontend:** Ninguno (el motor es interno, lo consume el endpoint del Punto 7).

7.  **Simulador "¿Qué pasa si...?":**
    - [x] **Cambios o features backend:** Endpoint que reciba una lista de `plan_subject_id` a simular como finalizadas, cree un clon del `academic record` en memoria con esas materias marcadas como finalizadas, ejecute el Motor de Validación de Correlativas (Punto 6) y retorne la diferencia de materias desbloqueadas. Cada materia desbloqueada incluye `unlocked_by: number[]` con los IDs de las materias simuladas que la desbloquean.
    - [x] **Cambios o features frontend:** Panel con checkboxes (`SimulatorView`) conectado al endpoint via `simulatorService.simulateWhatIf()`. Estados: loading, error, empty ("No tenés materias en curso"), resultados con periodo sugerido. Agrupa resultados por `unlocked_by`.
    - CONECTADO AMBOS FRENTES

### Nivel 4: Dificultad Alta (El Algoritmo de Planificación y Persistencia)
Construcción del motor de optimización bajo restricciones y guardado de configuraciones.

8.  **Algoritmo del Planificador Automático:**
    - [x] **Cambios o features backend:** Implementar el algoritmo en un servicio backend que:
        - Use `plan_subjects.weekly_hours` (ya existe, no hace falta agregarlo a `subject`).
        - Opere por lotes secuenciales (cuatrimestres futuros).
        - Clasifique materias: obligatorias (`is_elective = false`) primero, anuales (`term_type = 'anual'`) como bloque, cuatrimestrales por cuatrimestre.
        - Priorice materias que abren más correlativas a futuro.
        - No supere las horas semanales indicadas por el alumno.
        - Derive el tope de materias del límite de horas.
    - [x] **Cambios o features frontend:** `usePlanner` llama a `generatePlan()` y `TimelineContent` renderiza el plan en el canvas. → Archivos: `src/features/myPlanner/customPlan/services/plannerService.ts` | `src/features/myPlanner/customPlan/hooks/usePlanner.ts` | `src/features/myPlanner/customPlan/components/TimelineContent.tsx`
    - CONECTADO AMBOS FRENTES

9.  **Persistencia y Clonación de Planes (`custom_study_plan` + `CustomStudyPlanItem`):**
    - [x] **Cambios o features backend:**
         1. [x] **Corregir bug en `addFinalExam`:** Cambiar `record.status === 'approved'` (inglés) por `record.status === 'aprobado'` (español) en la línea ~248 de `academicRecordService.js`. Actualmente nunca se dispara porque ningún registro tiene `'approved'`, pero rompería al intentar agregar un final a una materia ya finalizada.
         2. [x] Crear modelo `CustomStudyPlanItem` con: `id`, `id_custom_study_plan` (FK), `plan_subject_id` (FK), `target_year`, `target_term`, `order`, `status` (opcional: 'planificado', 'cursando', 'completado'), `createdAt`, `updatedAt`.
         3. [x] Crear archivo del modelo en `src/models/`. El proyecto usa `sequelize.sync()` (sin migraciones), la tabla se crea automáticamente.
         4. [x] Registrar asociación en `src/models/index.js`: `CustomStudyPlan.hasMany(CustomStudyPlanItem)` y `CustomStudyPlanItem.belongsTo(CustomStudyPlan)`.
         5. [x] Desarrollar CRUD para guardar/cargar/clonar planes.
    - [x] **Cambios o features frontend:** `PlanSelector` (dropdown), `SavePlanModal`, `usePlanManager` hook, `PlannerMenu` con lista de planes guardados, integración completa en `MyPlannerPage`. → Archivos: `src/features/myPlanner/customPlan/services/planManagerService.ts` | `src/features/myPlanner/customPlan/hooks/usePlanManager.ts` | `src/features/myPlanner/customPlan/components/PlanSelector.tsx` | `src/features/myPlanner/customPlan/components/SavePlanModal.tsx` | `src/features/myPlanner/components/PlannerMenu.tsx` | `src/pages/StudentPage/MyPlannerPage.tsx`
    - CONECTADO AMBOS FRENTES

10. **Módulo Plus de Desvío y Rendimiento (Opcional - Post-Lanzamiento):**
    - [x] **Cambios o features backend:** Al cerrar un cuatrimestre real, contrastar `academic record` contra los hitos guardados en `CustomStudyPlanItem` con `status = 'completado'`. Calcular métricas de desvío.
    - [x] **Cambios o features frontend:** Componente que muestre las métricas de desvío (ej. "Te atrasaste 1 cuatrimestre"). → Archivos: `src/features/myPlanner/customPlan/components/DeviationModal.tsx` | `src/features/myPlanner/customPlan/hooks/useDeviation.ts` | `src/features/myPlanner/customPlan/services/deviationService.ts`
    - CONECTADO AMBOS FRENTES

---

## 3. Estrategia y Comportamiento del Algoritmo ante Cambios Manuales

**Pregunta del equipo:** *¿Debería el algoritmo reacomodar automáticamente todo el plan sugerido cuando el usuario realiza un cambio manual (mueve una materia)?*

### Recomendación Técnica: Enfoque "Reactivo por Bloqueo y Re-cálculo Manual"

**No se recomienda que el algoritmo reacomode todo el plan de forma automática e inmediata** ante cada movimiento del usuario. Si el usuario mueve una materia para acomodar sus horarios personales y el sistema, de forma imprevista, reestructura toda la carrera hacia adelante, el estudiante experimentará una sensación de pérdida de control sobre la interfaz (UX frustrante).

En su lugar, el comportamiento debe seguir las siguientes tres reglas de negocio:

1.  **Validación de Restricciones en Tiempo Real (Bloqueo):**
    Si el usuario arrastra una materia a un cuatrimestre donde aún no cumple con las correlativas previas, o si la suma de las horas de las materias en ese bloque supera el límite semanal que él mismo configuró, la interfaz debe pintar el contenedor de **rojo**, bloquear el movimiento y lanzar un *toast* o alerta explicativa (ej. *"No podés cursar esta materia en este período porque adeudas la correlativa X"* o *"Superas el límite de horas semanales por Y horas"*).
    - [x] **Cambios o features backend:** El Motor de Validación de Correlativas (Punto 6) debe exponer un endpoint que evalúe si una materia específica puede cursarse en un cuatrimestre dado. También debe proveer un endpoint que calcule la suma de horas de un conjunto de `plan_subject_id`.
    - [x] **Cambios o features frontend:** Llamadas a estos endpoints durante el drag & drop. Feedback visual inmediato (rojo, toast) si la validación falla. → Archivos: `src/features/myPlanner/customPlan/services/validationService.ts` | `src/features/myPlanner/customPlan/hooks/useDndTimeline.ts` | `src/features/myPlanner/customPlan/components/SemesterRow.tsx`
    - CONECTADO AMBOS FRENTES

2.  **Arrastre de Dependencias en Cascada (Validación Pasiva):**
    Si el usuario mueve una materia hacia el futuro (retrasando su cursada), el sistema debe identificar si esa materia es correlativa de otras programadas para los cuatrimestres inmediatamente posteriores. Si es así, debe mostrar un mensaje de advertencia.
    - [x] **Cambios o features backend:** Endpoint que reciba un `plan_subject_id` y un cuatrimestre destino, y retorne la cadena de materias afectadas aguas abajo (las que dependen de ella vía `Correlativity`).
    - [x] **Cambios o features frontend:** Diálogo de confirmación con la lista de materias afectadas antes de ejecutar el movimiento. → Archivos: `src/features/myPlanner/customPlan/components/CascadingImpactModal.tsx` | `src/features/myPlanner/customPlan/hooks/useDndTimeline.ts`
    - CONECTADO AMBOS FRENTES

3.  **Botón de Optimización Manual ("Recalcular desde aquí"):**
    Permitir al usuario realizar los ajustes manuales que desee. En la parte superior del canvas, colocar un botón de acción llamado **"Optimizar resto del plan"**. Al presionarlo, el algoritmo del planificador se ejecutará **únicamente desde el primer cuatrimestre modificado por el usuario hacia el futuro**, respetando las decisiones manuales previas y reacomodando el resto de las materias pendientes de forma eficiente.
    - [x] **Cambios o features backend:** El Algoritmo del Planificador (Punto 8) debe aceptar un parámetro de "cuatrimestre de inicio" para ejecutarse parcialmente respetando las asignaciones manuales previas.
    - [x] **Cambios o features frontend:** Botón de acción en el Canvas. Al presionarlo, enviar la configuración actual (materias ya fijadas manualmente) al endpoint con el cuatrimestre de inicio. → Archivos: `src/features/myPlanner/customPlan/components/OptimizePlanModal.tsx` | `src/features/myPlanner/customPlan/hooks/usePlanner.ts` | `src/pages/StudentPage/MyPlannerPage.tsx`
    - CONECTADO AMBOS FRENTES
