# Plan: Refactor a Sistema de Bloques (Unidades de Cumplimiento)

Reemplazar el modelo plano `plan_subjects` por tres tipos de bloque (UNAHUR, electivas,
créditos), unificando el avance de carrera en "Unidades de Cumplimiento". Reseed (sin
scripts de migración), 5 fases independientes; **cada fase deja la suite de tests verde**.

## Fórmula de progreso (Unidades de Cumplimiento)

Especificación conceptual. Se implementa en:
- **Fase 4** (backend): `getAcademicSummary` + `getAcademicYearBreakdown`
- **Fase 5** (frontend): consumo en `my-progress` y `myPlanner`

```
Total      = mandatory_planSubjects
           + plan_unahur_blocks
           + plan_elective_blocks
           + plan_credit_blocks

Completado = approved_mandatory_count
           + MIN(unahur_aprobadas_distintas, nº_unahur_blocks)
           + Σ bloques_electivos con (aprobadas_del_pool >= min_required)
           + Σ bloques_credito con (MIN(Σ créditos_approved, max) >= min_credits)

% Progreso = Completado / Total × 100
```

## Fase 1 — Esquema y modelos backend

1. Crear modelos en `backend/src/models/`:
   - `planUnahurBlock` → `plan_unahur_blocks` (id, id_study_plan, suggested_year,
     suggested_term, sort_order).
   - `planElectiveBlock` → `plan_elective_blocks` (id, id_study_plan, name,
     min_required default 1, requires_approved_mandatory_count default 0,
     suggested_year, sort_order).
   - `planElectiveBlockSubject` → `plan_elective_block_subjects`
     (id, id_elective_block FK CASCADE, id_subject FK, UNIQUE(block, subject)).
   - `planCreditBlock` → `plan_credit_blocks` (id, id_study_plan, name,
     min_credits_required, max_credits_allowed, sort_order, UNIQUE(plan, name)).
2. Modificar modelos:
   - `planSubject`: quitar `is_elective`, `term_type`.
   - `studyPlan`: quitar `required_credits`, `required_unahur_subjects`, `required_english_levels`.
   - `extracurricularActivity`: agregar `id_credit_block` (FK), `approved` (BOOL default true),
     `description` (TEXT null).
3. Eliminar `StudyPlanRequirement` (modelo, controller, rutas) y sus asociaciones en
   `backend/src/models/index.js`; registrar asociaciones de los 4 modelos nuevos.
3.b. Limpieza de correlativas huérfanas: al eliminar `is_elective` de `PlanSubject`,
     eliminar las `Correlativity` donde `id_plan_subject_target` apunte a un PlanSubject
     cuya materia pertenezca a un bloque electivo.
4. Tests: eliminar/ajustar `studyPlanRequirement.*.test.js`; ajustar `planSubject` tests.

## Fase 2 — CRUD admin de bloques (backend) — depende de F1

5. Controllers + rutas CRUD de los 3 bloques (convención del proyecto:
   `{data}/{message}/{error}`, 200/201/400/404/409/500, `requireRole('admin')`):
   - `/api/plans/:planId/unahur-blocks`
   - `/api/plans/:planId/elective-blocks` (+ endpoints para block-subjects)
   - `/api/plans/:planId/credit-blocks`
5.b. Registrar las rutas de los 3 controllers en el router principal
     (`backend/src/routes/`). Pendiente de definir rutas exactas durante
     implementación (sugerencia de IA).
6. Ajustar `studyPlanController` (incluir bloques en `getById`, quitar `required_*`) y
   `planSubjectController` (quitar `is_elective`/`term_type`).
7. Reescribir seeders:
   - `studyPlans.seeder.js` — sacar `required_credits`, `required_unahur_subjects`,
     `required_english_levels`.
   - `planSubjects.seeder.js` — solo materias obligatorias (sin `is_elective`,
     sin `term_type`).
   - `extracurriculars.seeder.js` — agregar `id_credit_block`, `approved`.
   - Crear seeders nuevos: `planUnahurBlocks`, `planElectiveBlocks`,
     `planElectiveBlockSubjects`, `planCreditBlocks`.
   - `studyPlanRequirement.seeder.js` — NO ELIMINAR aún (ver punto post-implementación).
8. Tests: nuevos tests de los 3 controllers de bloque.

## Fase 3 — Admin frontend — depende de F2

9. Entities nuevas `UnahurBlock`, `ElectiveBlock`, `CreditBlock` (api + model, camelCase);
   ajustar `Plan` (quitar `requiredCredits/UnahurSubjects/EnglishLevels`) y
   `PlanSubject` (quitar `isElective/termType`).
9.b. Verificar si `GET /api/subjects?is_unahur=true` existe en `subjectController`.
     Si no existe, agregarlo.
10. `frontend/src/pages/AdminPage/PlansPage.tsx`: quitar campos `required_*`; agregar
    secciones para los 3 bloques reutilizando `SectionCard`/`Modal`/`FormField`.

## Fase 4 — Motor de progreso (backend) — toca academic-record, lo más tarde posible

11. Reescribir `getAcademicSummary` (L147) y `getAcademicYearBreakdown` (L285) en
    `backend/src/academicRecordService.js` con la fórmula de Unidades de Cumplimiento.
11.b. Verificar si `addRecord` necesita cambios para:
      - Aceptar UNAHUR sin `plan_subject_id` (solo con `id_subject`).
      - Validar que una materia electiva pertenezca a un bloque.
      Solo si es necesario — revisar implementación actual.
11.c. Definir el formato de respuesta de `getAcademicYearBreakdown` para incluir
      bloques. Los bloques deben incluirse como items especiales dentro de `subjects[]`
      con discriminador tipo `is_block: true / block_type: 'unahur'|'elective'|'credit'`.
12. Tests: ajustar `academicRecord` tests al nuevo summary.

## Fase 5 — Estudiante: progreso + planificador — depende de F4

13. `features/my-progress` (`progress.ts`, `useMyProgress`, `MyProgressPage`,
    `ProgressOverviewCard`, `YearAccordion`): consumir Unidades de Cumplimiento + bloques
    agrupados; barra de créditos con mínimo y tope visibles.
13.b. `studentApi.ts` — eliminar `is_elective` y `term_type` de los `plan_subjects`
      retornados (líneas ~69-80 en `src/entities/Student/api/studentApi.ts`).
14. `features/myPlanner` (`customPlan/model/planner.ts` → `RawPlanSubject` sin
    `is_elective`/`term_type`; `planningAlgorithm.ts`; `plannerDataService.ts`):
    componentes colapsables por bloque.
14.b. Simulador (`src/features/myPlanner/simulator/`):
      - `simulator.ts` (model) — eliminar `is_elective`, `term_type`.
      - `simulatorService.ts` — eliminar referencias.
14.c. Planificador (`customPlan/`):
      - `hooks/usePlanner.ts` — eliminar referencias a `is_elective`/`term_type`.
      - `services/planningAlgorithm.ts` — eliminar lógica de `is_elective`/`term_type`.
      - `services/editEngine.ts` — eliminar referencias.
      - `services/planManagerService.ts` — eliminar `is_elective`/`term_type`
        de `SavedPlanItem`.
15. Academic Record: render híbrido nota numérica (materias) vs C/NC (actividades,
    derivado de `approved`).

## Fase 6 — Limpieza final y revisión — depende de F5

16. Eliminar del frontend (confirmado huérfano post-Fase 3 — ningún import los referencia):
    - `frontend/src/entities/StudyPlanRequirement/index.ts`
    - `frontend/src/entities/StudyPlanRequirement/model/studyPlanRequirement.ts`
    - `frontend/src/entities/StudyPlanRequirement/api/studyPlanRequirementApi.ts`
    - `frontend/src/entities/StudyPlanRequirement/` (directorio vacío post-eliminación)
    - `frontend/src/features/plans/components/PlanRequirementsSection.tsx` — componente de 240 líneas sin uso
17. Evaluar `SubjectsPage` del admin:
    - Si la gestión de subjects en bloques electivos desde PlansPage es suficiente, no tocar.
    - Si se necesita, agregar sección que permita ver/asignar subjects a bloques electivos.
18. Verificar backend legacy:
    - Backend controllers ya no tienen referencias a `is_elective`, `term_type`, `required_credits`, `required_unahur_subjects`, `required_english_levels` (✅ limpiado en Fase 4).
    - Backend routes: `/api/plans/:studyPlanId/requirements` ya está desmontada (✅ Fase 1).
    - Ruta `StudyPlanRequirement` middleware/controller ya eliminados (✅ Fase 1).
19. Verificar que ningún test mock incluya los campos legacy eliminados.
20. Post-Fase 5: revisar que los archivos de myPlanner hayan eliminado `is_elective`/`term_type` en frontend (8 archivos identificados en Fase 5).

## Archivos relevantes

### Backend
- `src/models/index.js` — asociaciones de bloques agregadas, StudyPlanRequirement removido.
- `src/models/{planSubject,studyPlan,extracurricularActivity}.js` — modificados en F1.
- `src/models/{planUnahurBlock,planElectiveBlock,planElectiveBlockSubject,planCreditBlock}.js` — 4 modelos nuevos (F1).
- `src/academicRecordService.js` — getAcademicSummary y getAcademicYearBreakdown reescritos (F4).
- `src/controllers/{planUnahurBlock,planElectiveBlock,planCreditBlock}Controller.js` — 3 controllers nuevos (F2).
- `src/routes/planBlockRoutes.js` — rutas de bloques (F2).
- `src/middlewares/planBlockMiddleware.js` — 7 validadores (F2).
- `src/controllers/studentController.js` — limpiado getPlanSubjects, getPlannerData (F4).
- `src/seeders/` — 7 seeders activos: studyPlans, planSubjects, subjects, correlativities, extracurriculars, planUnahurBlocks, planElectiveBlocks, planElectiveBlockSubjects, planCreditBlocks.
- `tests/planBlockController.test.js` — 25 tests (F2).
- `tests/studentController.test.js` — test de getAcademicSummary actualizado (F4).

### Frontend
- `src/entities/{UnahurBlock,ElectiveBlock,CreditBlock}/` — 3 entities nuevas (F3).
- `src/entities/Plan/model/plan.ts` — sin requiredCredits/UnahurSubjects/EnglishLevels (F3).
- `src/entities/StudyPlanRequirement/` — **pendiente de eliminar** (F6).
- `src/features/plans/components/PlanRequirementsSection.tsx` — **pendiente de eliminar** (F6).
- `src/pages/AdminPage/PlansPage.tsx` — modificado con secciones de bloques (F3).
- `src/features/myPlanner/customPlan/model/planner.ts` — pendiente de limpiar is_elective/term_type (F5).
- `src/features/myPlanner/simulator/model/simulator.ts` — pendiente de limpiar (F5).
- `src/features/myPlanner/{planningAlgorithm,editEngine,planManagerService}.ts` — pendiente de limpiar (F5).
- `src/features/myPlanner/hooks/usePlanner.ts` — pendiente de limpiar (F5).
- `src/entities/Student/api/studentApi.ts` — pendiente de limpiar is_elective/term_type (F5).

## Decisiones cerradas

| Tema | Decisión |
|------|----------|
| Datos existentes | Reseed (reset DB + nuevos seeders). Sin scripts de migración. |
| Tracking UNAHUR | Computar al vuelo. Sin tabla de tracking ni motor/hook. |
| Slots UNAHUR | Mantener filas en `plan_unahur_blocks` (para el planner). |
| Actividades/créditos | Booleano `approved` (default true). Sin moderación admin. C/NC derivado en UI. |
| `plan_subject_id` | Ya nullable. Sin cambio de esquema. |
| Tests | Cada fase deja la suite verde (ajuste de tests por fase). |

## Excluido por ahora

- Tabla `block_prerequisites` (sugerencia futura del doc).
- Moderación admin de actividades extracurriculares (pending/rejected).

## Verificación

1. `npm run db:reset && npm run db:seed` (backend) sin errores.
2. `npm test` backend verde al final de cada fase.
3. `npm run lint` backend.
4. Build Vite frontend; chequeo manual de PlansPage (admin) y MyProgress (estudiante).

## Modelo final

```
StudyPlan
├── PlanSubject (solo obligatorias — sin is_elective/term_type)
├── PlanUnahurBlock × N (slots → pool subjects.is_unahur=true)
├── PlanElectiveBlock × N
│     └── PlanElectiveBlockSubject × M → Subject
├── PlanCreditBlock × N
│     └── ExtracurricularActivity (id_credit_block + approved)
└── Correlativity (solo obligatorias)

AcademicRecord.plan_subject_id → nullable (solo obligatorias)
study_plan_requirements: ELIMINADA
```
