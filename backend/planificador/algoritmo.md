# Algoritmo de Planificación de Carrera

## Índice
1. [Visión General](#visión-general)
2. [Arquitectura y Archivos Implicados](#arquitectura-y-archivos-implicados)
3. [Planner Algorithm (Motor de Planificación)](#planner-algorithm-motor-de-planificación)
4. [Correlativity Engine (Motor de Correlatividades)](#correlativity-engine-motor-de-correlatividades)
5. [Deviation Service (Métricas de Desvío)](#deviation-service-métricas-de-desvío)
6. [Custom Study Plan CRUD](#custom-study-plan-crud)
7. [Endpoints del Planificador](#endpoints-del-planificador)
8. [Modelos de Datos](#modelos-de-datos)
9. [Seeders](#seeders)
10. [Flujo Completo Frontend → Backend](#flujo-completo-frontend--backend)

---

## Visión General

El sistema de planificación permite a un alumno generar una proyección de su carrera organizando las materias pendientes en cuatrimestres futuros, respetando:

- **Correlatividades** (materias requeridas según su tipo: regularidad/aprobación/finalizada).
- **Límite de horas semanales** configurado por el alumno.
- **Priorización**: obligatorias antes que electivas, materias que destrancan más correlativas primero.
- **Año de cursada actual** calculado desde la fecha de ingreso (`enrolled_at`).

El sistema también soporta simulación ("¿Qué pasa si...?"), validación de ubicación de materias (drag & drop), impacto en cascada al mover materias, y persistencia de planes personalizados.

---

## Arquitectura y Archivos Implicados

```
backend/
├── src/
│   ├── models/
│   │   ├── index.js                          # Asociaciones entre modelos
│   │   ├── studyPlan.js                      # Plan de estudios oficial
│   │   ├── studyPlanRequirement.js           # Requisitos del plan (créditos, inglés, etc.)
│   │   ├── planSubject.js                    # Materia dentro de un plan de estudios
│   │   ├── subject.js                        # Materia (catálogo general)
│   │   ├── correlativity.js                  # Relación de correlatividad
│   │   ├── academicRecord.js                 # Registro académico del alumno
│   │   ├── finalExam.js                      # Examen final
│   │   ├── customStudyPlan.js                # Plan personalizado del alumno
│   │   ├── customStudyPlanItem.js            # Ítem de un plan personalizado
│   │   ├── studentCareerEnrollment.js        # Inscripción del alumno a una carrera
│   │   └── student.js                        # Alumno (datos extendidos)
│   │
│   ├── services/
│   │   ├── plannerEngine.js                  ★ ALGORITMO PRINCIPAL (generar plan)
│   │   ├── correlativityEngine.js            ★ MOTOR DE CORRELATIVIDADES
│   │   ├── deviationService.js               ★ MÉTRICAS DE DESVÍO
│   │   └── academicRecordService.js          ★ Servicio de registros académicos (soporte)
│   │
│   ├── controllers/
│   │   ├── studentController.js              ★ Controlador que expone los endpoints del planificador
│   │   ├── customStudyPlanController.js      ★ CRUD de planes personalizados
│   │   ├── studyPlanController.js            CRUD de planes de estudio oficiales
│   │   ├── studyPlanRequirementController.js CRUD de requisitos del plan
│   │   ├── planSubjectController.js          CRUD de materias del plan
│   │   └── correlativityController.js        CRUD de correlatividades
│   │
│   ├── routes/
│   │   ├── studentRoutes.js                  ★ Rutas del planificador (anidadas bajo /:id)
│   │   ├── customStudyPlanRoutes.js          ★ CRUD de planes personalizados
│   │   ├── studyPlanRoutes.js                Rutas de planes oficiales
│   │   ├── studyPlanRequirementRoutes.js     Rutas de requisitos
│   │   ├── planSubjectRoutes.js              Rutas de materias del plan
│   │   └── correlativityRoutes.js            Rutas de correlatividades
│   │
│   └── middlewares/
│       ├── customStudyPlanMiddleware.js      ★ Validación de datos de plan personalizado
│       ├── studyPlanMiddleware.js            Validación de plan oficial
│       ├── studyPlanRequirementMiddleware.js Validación de requisitos
│       ├── planSubjectMiddleware.js          Validación de materias del plan
│       └── correlativityMiddleware.js        Validación de correlatividades
│
├── planificador/
│   └── plan-corregido.md                     Documentación de arquitectura del Módulo 4
│
└── algoritmo.md                              ★ ESTE DOCUMENTO
```

---

## Planner Algorithm (Motor de Planificación)

**Archivo:** `src/services/plannerEngine.js`

### Función Principal: `generatePlan(userId, weeklyHoursLimit, options)`

#### Input
```js
{
  userId: number,              // ID del alumno (student_id)
  weeklyHoursLimit: number,    // Horas semanales disponibles (ej: 20)
  options: {
    startYear?: number,        // Año desde el cual empezar a planificar (opcional)
    startTerm?: number         // Cuatrimestre desde el cual empezar (1 o 2, opcional)
  }
}
```

#### Output
```js
{
  plan: [
    {
      academic_year: number,        // Año académico (ej: 2026)
      term: number,                 // Cuatrimestre (1 o 2)
      subjects: [
        {
          plan_subject_id: number,
          subject_id: number,
          subject_name: string,
          credits: number,
          is_elective: boolean,
          weekly_hours: number,
          term_type: string          // 'cuatrimestral' | 'anual'
        }
      ],
      total_weekly_hours: number    // Suma de horas semanales del cuatrimestre
    }
  ]
}
```

### Paso a Paso del Algoritmo

1. **Obtener inscripción activa del alumno**
   - Busca `StudentCareerEnrollment` donde `student_id = userId`, `is_active = true`, `status = 'active'`.
   - Si no existe o no tiene `study_plan_id`, lanza error.

2. **Cargar todas las materias del plan de estudios**
   - Busca todos los `PlanSubject` del plan asociado.
   - Incluye (`include`):
     - `Subject` (datos de la materia).
     - `RequiredSubjects` (correlativas requeridas, con el `type` desde la tabla pivote `Correlativity`).
     - `RequirementFor` (materias que dependen de esta, para calcular `unlockScore`).

3. **Cargar registros académicos del alumno**
   - Busca todos los `AcademicRecord` del alumno.
   - Incluye `final_exams` (exámenes finales asociados).

4. **Clasificar materias ya cursadas**
   - Para cada `PlanSubject`, busca su `AcademicRecord` y clasifica:
     - **Finalizada** (`_isFinalizada`): `status = 'aprobado'` **O** (`status = 'pendiente'`, grade 4-6, y tiene un `final_exam` con `status = 'aprobado'`).
     - **Regularizada** (`_isRegularizada`): `status = 'pendiente'`, grade 4-6, `regularity_expires_at >= TODAY`, sin final aprobado.
   - Las materias finalizadas o regularizadas se agregan a `plannedIds` (ya están resueltas).

5. **Calcular "unlock scores"**
   - Para cada materia del plan, cuenta cuántas otras materias la tienen como correlativa (`RequirementFor.length`).
   - Las materias con más dependientes tienen prioridad (destraban más materias a futuro).

6. **Determinar período académico actual**
   - Calcula el año de cursada: `floor(mesesDesdeInscripción / 12) + 1`.
   - Determina el cuatrimestre actual según el mes (Marzo-Julio → T1, Agosto-Febrero → T2).
   - Si se proporcionan `startYear`/`startTerm` en options, se usan esos.

7. **Construir cuatrimestres iterativamente** (hasta 20 iteraciones = ~10 años)
   - **Obtener materias disponibles**: Llama a `correlativityEngine.getAvailableSubjects()` con `simulatedFinalizadas` conteniendo todos los `plannedIds` (materias ya resueltas + las agendadas en iteraciones previas). El motor verifica correlatividades contra este conjunto simulado.
   - **Filtrar** materias ya planificadas.
   - **Calcular año y cuatrimestre** según el índice de iteración.
   - **Scoring y ordenamiento**: Las materias disponibles se ordenan por:
     1. Obligatorias primero (`is_elective = false` primero).
     2. Mayor `unlockScore` (las que más correlativas destraban).
     3. Menor `suggestedYear` (año sugerido en el plan).
     4. Menor `suggestedTerm` (cuatrimestre sugerido).
   - **Empaquetar materias en el cuatrimestre**: Recorre las materias ordenadas y las agrega al cuatrimestre actual si sumando sus `weekly_hours` no supera el límite configurado.
   - **Detener** si no se puede colocar ninguna materia en un cuatrimestre (restricción de horas o no hay más materias disponibles).

8. **Retornar el plan** como array de cuatrimestres con sus materias y total de horas.

### Funciones Auxiliares

#### `_isFinalizada(record)`
```js
{status: 'aprobado'}                                                         → true
{status: 'pendiente', grade: '5', final_exam con status: 'aprobado'}         → true
{status: 'pendiente', grade: '5', sin final_exam aprobado}                   → false
{status: 'enrolled'}                                                         → false
{status: 'desaprobado'}                                                      → false
null                                                                         → false
```

#### `_isRegularizada(record)`
```js
{status: 'pendiente', grade: '5', regularity_expires_at: future, sin final_exam aprobado} → true
{status: 'pendiente', grade: '5', regularity_expires_at: past, sin final_exam aprobado}   → false (vencida)
{status: 'aprobado'}                                                                      → false
{status: 'enrolled'}                                                                      → false
null                                                                                      → false
```

---

## Correlativity Engine (Motor de Correlatividades)

**Archivo:** `src/services/correlativityEngine.js`

Es el corazón de la validación de prerrequisitos. Proporciona 5 funciones:

### `getAvailableSubjects(userId, options)`

Determina qué materias del plan de estudios están disponibles para cursar.

**Input:**
```js
{
  userId: number,
  options: {
    simulatedFinalizadas: number[]  // IDs de PlanSubject a simular como finalizadas
  }
}
```

**Lógica:**
1. Obtiene la inscripción activa del alumno (con `study_plan_id`).
2. Carga todos los `PlanSubject` del plan con sus `RequiredSubjects` (autoreferencia muchos-a-muchos vía `Correlativity`).
3. Carga todos los `AcademicRecord` del alumno con sus `final_exams`.
4. Construye un `statusMap` con cada `PlanSubject` → su estado real (finalizada/regularizada/hasApprovedFinal).
5. Aplica las simulaciones: si un `plan_subject_id` está en `simulatedFinalizadas`, lo marca como finalizada en el mapa.
6. Para cada materia del plan que NO está finalizada ni regularizada:
   - Revisa todas sus correlativas (`RequiredSubjects`).
   - Según el `type` de la correlatividad, verifica:

| Tipo | Requisito |
|------|-----------|
| `'regularidad'` | La materia requerida debe estar finalizada **o** regularizada |
| `'aprobacion'` o `null` | La materia requerida debe estar finalizada |
| `'finalizada'` | La materia requerida debe estar finalizada **y** tener final aprobado |

7. Si todas las correlativas se cumplen, la materia se agrega al array de disponibles.

**Output:**
```js
[
  {
    plan_subject_id: number,
    subject_id: number,
    subject_name: string,
    suggested_year: number,
    suggested_term: number,
    credits: number,
    is_elective: boolean,
    weekly_hours: number,
    term_type: string
  }
]
```

### `simulateWhatIf(userId, simulatedIds)`

Simula qué materias se destrabarían si el alumno aprobara ciertas materias.

**Input:**
```js
{
  userId: number,
  simulatedIds: number[]  // IDs de PlanSubject a simular como aprobadas
}
```

**Lógica:**
1. Obtiene las materias que el alumno tiene actualmente "en curso" (`status = 'enrolled'`).
2. Llama a `getAvailableSubjects(userId)` → `baseline` (materias disponibles SIN simulación).
3. Llama a `getAvailableSubjects(userId, { simulatedFinalizadas: simulatedIds })` → `simulated` (materias disponibles CON simulación).
4. Calcula la diferencia: materias en `simulated` que no están en `baseline` → `newlyUnlocked`.
5. Para cada materia recién destrabada, averigua cuál(es) de las materias simuladas la destrabaron (`unlocked_by`), revisando sus `RequiredSubjects`.

**Output:**
```js
{
  currently_in_course: [
    { plan_subject_id: number, subject_name: string }
  ],
  simulated_subjects: [
    { plan_subject_id: number, subject_name: string }
  ],
  newly_unlocked: [
    {
      plan_subject_id: number,
      subject_name: string,
      suggested_year: number,
      suggested_term: number,
      credits: number,
      is_elective: boolean,
      weekly_hours: number,
      term_type: string,
      unlocked_by: number[]  // IDs de PlanSubject que la destrabaron
    }
  ],
  currently_available: [ /* baseline actual */ ]
}
```

### `validateSubjectPlacement(userId, planSubjectId, targetYear, targetTerm, fixedSubjectIds)`

Valida si una materia específica puede cursarse en un cuatrimestre determinado, considerando correlatividades y materias ya fijadas manualmente.

**Input:**
```js
{
  userId: number,
  planSubjectId: number,
  targetYear: number,
  targetTerm: number,
  fixedSubjectIds: number[]  // Materias ya colocadas manualmente en el plan
}
```

**Output:**
```js
// Si es válido:
{ valid: true }

// Si no es válido:
{
  valid: false,
  reason: 'Unmet prerequisites',
  unmet_requirements: [
    {
      required_plan_subject_id: number,
      required_subject_name: string,
      correlativity_type: string
    }
  ]
}
```

### `getCascadingImpact(userId, planSubjectId)`

Obtiene las materias que dependen directamente de una materia (para advertir al usuario si la mueve).

**Input:** `userId`, `planSubjectId`

**Output:**
```js
[
  {
    plan_subject_id: number,
    subject_id: number,
    subject_name: string,
    suggested_year: number,
    suggested_term: number
  }
]
```

### `calculateTermHours(planSubjectIds)`

Calcula la suma de horas semanales de un conjunto de materias.

**Input:** `planSubjectIds: number[]`

**Output:**
```js
{
  total_weekly_hours: number,
  subjects: [
    { plan_subject_id: number, subject_name: string, weekly_hours: number }
  ]
}
```

---

## Deviation Service (Métricas de Desvío)

**Archivo:** `src/services/deviationService.js`

### `getDeviationMetrics(studentId, planId)`

Compara un plan guardado contra los registros académicos reales del alumno para medir desvíos.

**Lógica:**
1. Busca el `CustomStudyPlan` con sus items en `status = 'completado'`.
2. Para cada item completado, busca el `AcademicRecord` real.
3. Calcula:
   - `deviationFromPlan`: diferencia entre el cuatrimestre planificado y el real.
   - `deviationFromOfficial`: diferencia entre el cuatrimestre oficial (suggested) y el real.
4. Clasifica: `on_time` (0), `ahead` (<0), `delayed` (>0).

**Output:**
```js
{
  plan_name: string,
  summary: {
    total_subjects: number,
    completed_subjects: number,
    on_time: number,
    ahead: number,
    delayed: number,
    average_delay_terms: number
  },
  subjects: [
    {
      plan_subject_id: number,
      subject_name: string,
      official_year: number,
      official_term: number,
      planned_year: number,
      planned_term: number,
      actual_year: number,
      actual_term: number,
      grade: string,
      status: string,
      deviation: 'on_time' | 'ahead' | 'delayed',
      deviation_terms: number,
      deviation_from_official: 'on_time' | 'ahead' | 'delayed',
      deviation_terms_from_official: number
    }
  ]
}
```

---

## Custom Study Plan CRUD

**Archivos:**
- `src/controllers/customStudyPlanController.js`
- `src/routes/customStudyPlanRoutes.js`
- `src/middlewares/customStudyPlanMiddleware.js`
- `src/models/customStudyPlan.js`
- `src/models/customStudyPlanItem.js`

### Rutas

| Método | Ruta | Middleware | Descripción |
|--------|------|-----------|-------------|
| `GET` | `/api/custom-study-plans` | — | Lista todos los planes (filtro por `?studentId=`) |
| `GET` | `/api/custom-study-plans/:id` | — | Obtener plan por ID (con items) |
| `POST` | `/api/custom-study-plans` | `validateCustomStudyPlanData` | Crear plan nuevo |
| `PUT` | `/api/custom-study-plans/:id` | `validateCustomStudyPlanUpdateData` | Actualizar plan (reemplaza items) |
| `PATCH` | `/api/custom-study-plans/:id` | `validateCustomStudyPlanUpdateData` | Actualizar plan (reemplaza items) |
| `DELETE` | `/api/custom-study-plans/:id` | — | Eliminar plan (cascade a items) |
| `GET` | `/api/custom-study-plans/:id/deviation` | — | Métricas de desvío (requiere `?studentId=`) |
| `POST` | `/api/custom-study-plans/clone/:id` | — | Clonar un plan existente |

### Reglas de Negocio del CRUD

- **Create**: Recibe `{ id_student, name, weekly_hours?, items[] }`. Crea el plan y sus items en bulk.
- **Update**: Si se envía `items[]`, elimina todos los items existentes y los recrea (reemplazo completo).
- **Clone**: Copia el plan fuente con un nuevo nombre (por defecto "`{nombre} (copia)`") y duplica todos sus items con `status = 'planificado'`.
- **Deviation**: Requiere `studentId` como query param. Verifica que el plan pertenezca al studentId.

### Validaciones del Middleware

**`validateCustomStudyPlanData`** (POST):
- `id_student`: requerido, entero válido
- `name`: requerido, string no vacío

**`validateCustomStudyPlanUpdateData`** (PUT/PATCH):
- `name`: opcional, string no vacío si se envía

---

## Endpoints del Planificador

Montados en `src/routes/studentRoutes.js` bajo `/api/students/:id/`.

| Método | Ruta | Controlador | Input | Output |
|--------|------|-------------|-------|--------|
| `POST` | `/api/students/:id/generate-plan` | `studentController.generatePlan` | `{ weekly_hours_limit, start_year?, start_term? }` | `{ data: { plan: [...] } }` |
| `POST` | `/api/students/:id/simulate-what-if` | `studentController.simulateWhatIf` | `{ simulated_completed_ids: number[] }` | `{ data: { currently_in_course, simulated_subjects, newly_unlocked, currently_available } }` |
| `POST` | `/api/students/:id/validate-placement` | `studentController.validatePlacement` | `{ plan_subject_id, target_year, target_term, fixed_subject_ids? }` | `{ data: { valid, reason?, unmet_requirements? } }` |
| `GET` | `/api/students/:id/cascading-impact/:planSubjectId` | `studentController.getCascadingImpact` | — | `{ data: [...] }` |
| `POST` | `/api/students/:id/calculate-term-hours` | `studentController.calculateTermHours` | `{ plan_subject_ids: number[] }` | `{ data: { total_weekly_hours, subjects } }` |
| `POST` | `/api/students/:id/save-plan` | `studentController.savePlan` | `{ name, weekly_hours_limit, plan: [...] }` | `{ message, data }` |

### Endpoint `POST /api/students/:id/save-plan`

Es un "atajo" que recibe el plan generado por `generatePlan` y lo persiste directamente como `CustomStudyPlan` + `CustomStudyPlanItem`. Evita tener que llamar a `POST /api/custom-study-plans` con el formato transformado manualmente.

---

## Modelos de Datos

### CustomStudyPlan
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | INTEGER PK | ID del plan |
| `id_student` | INTEGER FK | Alumno propietario |
| `name` | STRING | Nombre del plan |
| `weekly_hours` | INTEGER | Horas semanales configuradas |
| `createdAt` | DATE | Timestamp |
| `updatedAt` | DATE | Timestamp |

### CustomStudyPlanItem
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | INTEGER PK | ID del ítem |
| `id_custom_study_plan` | INTEGER FK | Plan al que pertenece |
| `plan_subject_id` | INTEGER FK | Materia del plan |
| `target_year` | INTEGER | Año objetivo |
| `target_term` | INTEGER | Cuatrimestre objetivo (1 o 2) |
| `order` | INTEGER | Orden opcional |
| `status` | ENUM('planificado','cursando','completado') | Estado del ítem |
| `createdAt` | DATE | Timestamp |
| `updatedAt` | DATE | Timestamp |

### PlanSubject
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | INTEGER PK | |
| `id_study_plan` | INTEGER FK | Plan de estudios |
| `id_subject` | INTEGER FK | Materia |
| `suggested_year` | INTEGER | Año sugerido (1, 2, 3...) |
| `suggested_term` | INTEGER | Cuatrimestre sugerido (1 o 2) |
| `weekly_hours` | INTEGER | Horas semanales estimadas |
| `credits` | INTEGER | Créditos que otorga |
| `is_elective` | BOOLEAN | ¿Es electiva? |
| `term_type` | ENUM('cuatrimestral','anual') | Tipo de cursada |

### Correlativity
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | INTEGER PK | |
| `id_plan_subject_target` | INTEGER FK | Materia que requiere la correlativa |
| `id_required_plan_subject` | INTEGER FK | Materia requerida |
| `type` | STRING | `'regularidad'`, `'aprobacion'`, `'finalizada'`, o `null` |

### Associations (src/models/index.js)
```
StudyPlan.hasMany(PlanSubject)
PlanSubject.belongsTo(StudyPlan)
PlanSubject.belongsTo(Subject)

PlanSubject.belongsToMany(PlanSubject, {
  as: 'RequiredSubjects',
  through: Correlativity,
  foreignKey: 'id_plan_subject_target',
  otherKey: 'id_required_plan_subject'
})

PlanSubject.belongsToMany(PlanSubject, {
  as: 'RequirementFor',
  through: Correlativity,
  foreignKey: 'id_required_plan_subject',
  otherKey: 'id_plan_subject_target'
})

CustomStudyPlan.hasMany(CustomStudyPlanItem, { as: 'items' })
CustomStudyPlanItem.belongsTo(CustomStudyPlan)
CustomStudyPlanItem.belongsTo(PlanSubject)

AcademicRecord.belongsTo(PlanSubject, { as: 'plan_subject' })
AcademicRecord.hasMany(FinalExam, { as: 'final_exams' })

StudentCareerEnrollment.belongsTo(StudyPlan, { as: 'studyPlan' })
```

---

## Seeders

| Archivo | Descripción |
|---------|-------------|
| `seeders/studyPlans.seeder.js` | 10 planes de estudio para distintas carreras |
| `seeders/planSubjects.seeder.js` | Materias del plan (Computación: 18 materias en 4 años; otras carreras: 2-6 materias) |
| `seeders/correlativities.seeder.js` | 20 relaciones de correlatividad con tipos variados |
| `seeders/customStudyPlans.seeder.js` | 3 planes personalizados de ejemplo |
| `seeders/customStudyPlanItems.seeder.js` | Items para los planes de ejemplo |

---

## Flujo Completo Frontend → Backend

### Generar Plan Automático
```
Frontend                              Backend
   │                                     │
   │  POST /api/students/:id/generate-plan
   │  { weekly_hours_limit: 20 }         │
   │────────────────────────────────────>│
   │                                     │
   │                plannerEngine.generatePlan()
   │                ├─ Buscar enrollment activo
   │                ├─ Cargar planSubjects + RequiredSubjects
   │                ├─ Cargar academicRecords
   │                ├─ Clasificar materias cursadas
   │                ├─ Calcular unlockScores
   │                ├─ Iterar cuatrimestres:
   │                │   ├─ getAvailableSubjects() ← correlativityEngine
   │                │   ├─ Filtrar ya planificadas
   │                │   ├─ Scoring y ordenamiento
   │                │   └─ Empaquetar por horas
   │                └─ Retornar plan[]
   │                                     │
   │  { data: { plan: [...] } }          │
   │<────────────────────────────────────│
```

### Guardar Plan
```
Frontend                              Backend
   │                                     │
   │  POST /api/students/:id/save-plan
   │  { name: "Mi Plan", weekly_hours_limit: 20, plan: [...] }
   │────────────────────────────────────>│
   │                                     │
   │              studentController.savePlan()
   │              ├─ Crear CustomStudyPlan
   │              └─ Crear CustomStudyPlanItems en bulk
   │                                     │
   │  { message: "Plan saved successfully", data: {...} }
   │<────────────────────────────────────│
```

### Simular "¿Qué pasa si...?"
```
Frontend                              Backend
   │                                     │
   │  POST /api/students/:id/simulate-what-if
   │  { simulated_completed_ids: [1, 5, 8] }
   │────────────────────────────────────>│
   │                                     │
   │         correlativityEngine.simulateWhatIf()
   │         ├─ Obtener materias "en curso"
   │         ├─ getAvailableSubjects() → baseline
   │         ├─ getAvailableSubjects(simulated) → simulated
   │         ├─ Diferencia = newly_unlocked
   │         └─ Calcular unlocked_by por materia
   │                                     │
   │  { data: { currently_in_course, simulated_subjects, newly_unlocked, currently_available } }
   │<────────────────────────────────────│
```

### Validar Drag & Drop
```
Frontend                              Backend
   │                                     │
   │  POST /api/students/:id/validate-placement
   │  { plan_subject_id: 3, target_year: 2026, target_term: 2, fixed_subject_ids: [1,5] }
   │────────────────────────────────────>│
   │                                     │
   │      correlativityEngine.validateSubjectPlacement()
   │      ├─ Construir statusMap + fixedSubjectIds
   │      └─ Verificar RequiredSubjects contra statusMap
   │                                     │
   │  { data: { valid: true/false, reason?, unmet_requirements? } }
   │<────────────────────────────────────│
```
