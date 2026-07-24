# Año / Cuatrimestre Sabático — Documentación de Implementación

## 1. Qué es

Permite que un estudiante marque un año completo o un cuatrimestre puntual de su plan personalizado (`CustomStudyPlan`) como "sabático" (descanso), y poder cancelarlo después. Es una feature de dos partes con estados de avance distintos:

| Parte | Estado |
|---|---|
| Backend: modelo, persistencia, endpoints CRUD | ✅ Implementado y probado |
| Frontend: botón, wizard/modal, alta y baja contra el backend | ✅ Implementado y probado |
| Frontend: algoritmo de "corrimiento" (vaciar el período y empujar todo lo posterior en el timeline) | ✅ Implementado y probado (`sabbaticalEngine.ts`) |
| Persistencia del corrimiento al guardar el plan | ⚠️ Reutiliza el mecanismo de guardado existente (ver sección 6.2) |

Hoy el estudiante puede marcar/cancelar un período sabático y **ve el efecto inmediatamente en el timeline en memoria**: el cuatrimestre elegido queda vacío y todo lo posterior se corre un lugar (o dos, si es año completo), sin reordenar materias entre sí. Para que ese corrimiento quede guardado hay que apretar "Guardar" (mismo botón y mecanismo que cualquier otra edición del plan).

---

## 2. Modelo de datos

### Por qué una tabla nueva y no reutilizar `CustomStudyPlanItem`

`CustomStudyPlanItem` representa "esta materia (`plan_subject_id`, `NOT NULL` con FK a `plan_subjects`) está ubicada en tal período". Un sabático no es una materia — es una propiedad de un *período del plan*, independiente de qué materias haya ahí. Forzarlo en `CustomStudyPlanItem` hubiera requerido hacer `plan_subject_id` nullable y agregar un `status: 'sabbatical'` especial, ensuciando toda consulta que asume "cada item de este array es una materia real" (`getPrerequisiteStatus`, `getSubjectsInPeriod`, etc. del lado frontend).

Este proyecto además ya tiene el patrón establecido de "una tabla por concepto de bloque" (`PlanCreditBlock`, `PlanElectiveBlock`, `PlanUnahurBlock`), así que se siguió esa misma convención.

### Por qué relaciona con `CustomStudyPlan` y no con `Student`

Un estudiante puede tener varios planes guardados (clones, alternativas). Si el sabático colgara de `Student`, todos los planes del estudiante compartirían el mismo sabático, rompiendo el caso de uso "plan A con sabático en 2027 vs. plan B (clon) sin él, para comparar escenarios". Colgado del plan, cada plan mantiene su propio timeline independiente — y al clonar un plan, se decide explícitamente si se copian también los sabáticos (ver `clone()` en el controller, sección 3.4).

### Esquema

```
CustomStudyPlan (1) ───< CustomStudyPlanItem       (las materias ubicadas)
                 └────< CustomStudyPlanSabbatical  (los períodos bloqueados)
```

**Tabla `custom_study_plan_sabbaticals`** — [`backend/src/models/customStudyPlanSabbatical.js`](../../../../../backend/src/models/customStudyPlanSabbatical.js):

| Columna | Tipo | Notas |
|---|---|---|
| `id` | INTEGER PK autoincrement | |
| `id_custom_study_plan` | INTEGER, `NOT NULL` | FK → `custom_study_plans.id` |
| `year` | INTEGER, `NOT NULL` | Año calendario (ej: 2027) |
| `term` | INTEGER, `NOT NULL` | `1` o `2` (validado con `isIn: [[1, 2]]`) |
| `created_at` / `updated_at` | timestamps | |

Índice único: `(id_custom_study_plan, year, term)` — evita marcar el mismo período dos veces.

**Por qué "año completo" son 2 filas y no un `term` nullable**: evita tener que chequear `term === null` en todos lados. El wizard simplemente inserta 1 o 2 filas según la respuesta del usuario.

**Asociación** (`backend/src/models/index.js`):

```javascript
CustomStudyPlan.hasMany(CustomStudyPlanSabbatical, {
  foreignKey: 'id_custom_study_plan',
  as: 'sabbaticals',
  onDelete: 'CASCADE',
});
CustomStudyPlanSabbatical.belongsTo(CustomStudyPlan, { foreignKey: 'id_custom_study_plan' });
```

### Nota sobre "migraciones"

Este proyecto **no usa migraciones de Sequelize CLI** — el schema se sincroniza automáticamente con `sequelize.sync({ alter: true })` al levantar el backend (`src/index.js`). La tabla `custom_study_plan_sabbaticals` se crea sola la primera vez que se arranca el server después de este cambio; no hay ningún script de migración manual que correr.

---

## 3. Backend

### 3.1 Middleware — [`customStudyPlanSabbaticalMiddleware.js`](../../../../../backend/src/middlewares/customStudyPlanSabbaticalMiddleware.js)

Dos validadores, sin librería externa (mismo estilo que `customStudyPlanMiddleware.js`):

- `validateSabbaticalData`: valida el body del `POST` — `year` entero positivo; `terms` array no vacío, solo con valores `1`/`2`, sin duplicados.
- `validateSabbaticalDeleteQuery`: valida el query string del `DELETE` — `year` obligatorio; `term`, si viene, debe ser `'1'` o `'2'`.

### 3.2 Controller — [`customStudyPlanSabbaticalController.js`](../../../../../backend/src/controllers/customStudyPlanSabbaticalController.js)

Un CRUD deliberadamente **incompleto** — sin `update` (editar un sabático no tiene sentido de negocio: se cancela y se crea uno nuevo) y sin `getById` individual (siempre se consulta en el contexto de un plan):

| Método | Qué hace |
|---|---|
| `getAll` | Lista los sabáticos de un plan (`id_custom_study_plan = planId`), ordenados por año/término. |
| `create` | Recibe `{ year, terms: number[] }`. Valida que el plan exista (404 si no). Por cada `term` en `terms`, hace `findOrCreate` — así es **idempotente**: si el período ya estaba marcado, no falla, lo devuelve tal cual. |
| `delete` | Recibe `year` (obligatorio) y `term` (opcional) por query string. Si `term` no viene, borra **ambas** filas de ese año (cancela el año completo con un solo llamado). Devuelve 404 si no había nada que borrar. |

### 3.3 Rutas — [`customStudyPlanSabbaticalRoutes.js`](../../../../../backend/src/routes/customStudyPlanSabbaticalRoutes.js)

Router con `mergeParams: true` (mismo patrón que `planCreditBlockRoutes.js`), montado en `backend/src/index.js`:

```javascript
app.use('/api/custom-study-plans/:planId/sabbaticals', customStudyPlanSabbaticalRoutes);
```

Endpoints resultantes:

```
GET    /api/custom-study-plans/:planId/sabbaticals
POST   /api/custom-study-plans/:planId/sabbaticals       body: { year: number, terms: number[] }
DELETE /api/custom-study-plans/:planId/sabbaticals?year=2027&term=1   (term opcional → borra ambos)
```

**Nota de seguridad pendiente**: estas rutas, igual que el resto de `customStudyPlanRoutes.js`, no tienen `authenticate` ni chequeo de que el plan pertenezca al usuario que hace el request. Es consistente con el patrón existente en ese recurso, pero queda como deuda técnica marcada, no algo que se haya resuelto acá.

### 3.4 Integración con `customStudyPlanController.js`

- `planIncludes` ahora incluye `{ model: CustomStudyPlanSabbatical, as: 'sabbaticals' }`, así que `GET /api/custom-study-plans` y `GET /api/custom-study-plans/:id` devuelven los sabáticos junto con `items` en la misma respuesta.
- `clone()` copia también las filas de `sabbaticals` del plan origen al plan clonado (antes de este cambio, ni siquiera existía el concepto; se agregó el `bulkCreate` correspondiente para que clonar un plan no pierda esta información silenciosamente).

---

## 4. Frontend

### 4.1 Servicio — [`customPlan/services/sabbaticalService.ts`](customPlan/services/sabbaticalService.ts)

Tres funciones delgadas sobre `apiClient` (el wrapper de `fetch` del proyecto, no axios — `apiClient.get/post/delete` devuelven directamente el JSON parseado del backend, por eso se accede a `res.data`):

```typescript
fetchSabbaticals(planId): Promise<SabbaticalPeriod[]>
createSabbatical(planId, year, terms): Promise<SabbaticalPeriod[]>
deleteSabbatical(planId, year, term?): Promise<void>
```

### 4.2 Hook — [`customPlan/hooks/useSabbatical.ts`](customPlan/hooks/useSabbatical.ts)

Mismo patrón que `useDeviation.ts`/`usePlanManager.ts`: estado local (`sabbaticals`, `isLoading`, `isSaving`, `error`) + funciones que llaman al servicio y refrescan la lista:

```typescript
const { sabbaticals, isLoading, isSaving, error, refresh, addSabbatical, cancelSabbatical } =
  useSabbatical(planId);
```

`refresh()` **no se dispara automáticamente** al cambiar `planId` (a diferencia de `usePlanManager`) — se llama explícitamente cuando se abre el modal, igual que `useDeviation.loadDeviation`, porque la lista de sabáticos solo hace falta mientras el modal está abierto.

### 4.3 Modal — [`customPlan/components/SabbaticalModal.tsx`](customPlan/components/SabbaticalModal.tsx)

Reutiliza el patrón visual de `OptimizePlanModal.tsx` (selector de año + toggle de cuatrimestre), con dos diferencias:

1. El toggle tiene **3 opciones** en vez de 2: "1° Cuatrimestre", "2° Cuatrimestre", "Año completo" (`terms: [1,2]`).
2. Debajo, si `sabbaticals.length > 0`, muestra la lista de **sabáticos activos** del plan, cada uno con un botón "Cancelar" — así se resuelve el requisito de poder deshacer un sabático.

Props:

```typescript
interface Props {
  years: number[];                                        // años disponibles en el plan actual
  sabbaticals: SabbaticalPeriod[];                         // sabáticos ya persistidos
  isSaving: boolean;
  onConfirm: (year: number, terms: number[]) => void;      // crear
  onCancelSabbatical: (year: number, term: number) => void; // cancelar uno puntual
  onClose: () => void;
}
```

### 4.4 Botón disparador — [`components/PlannerActions.tsx`](components/PlannerActions.tsx)

Nuevo botón "Sabático" (ícono `beach_access` de Material Symbols, `variant="secondary"`), ubicado junto a "Guardar" — **solo visible en modo edición** (`isEditing`), mismo criterio que el resto de las acciones que modifican la estructura del plan.

### 4.5 Cableado end-to-end

```
useMyPlannerPage.ts                     (estado: sabbaticalOpen, hook useSabbatical)
  └─ MyPlannerPage.tsx                  (pasa las props del VM al detalle)
       └─ PlannerDetailView.tsx         (renderiza <SabbaticalModal /> cuando sabbaticalOpen)
            └─ PlannerActions.tsx       (botón "Sabático" → onOpenSabbatical)
```

`useMyPlannerPage.ts` agrega:

```typescript
const [sabbaticalOpen, setSabbaticalOpen] = useState(false);
const { sabbaticals, isSaving: isSabbaticalSaving, refresh: refreshSabbaticals, addSabbatical, cancelSabbatical } =
  useSabbatical(activePlanId);

const openSabbatical = useCallback(() => {
  setSabbaticalOpen(true);
  refreshSabbaticals();
}, [refreshSabbaticals]);
```

### 4.6 Efecto colateral encontrado: `PlannerHeader.tsx`

Al tipar el nuevo prop `onOpenSabbatical` como obligatorio en `PlannerActions`, el typecheck reveló un segundo consumidor del componente: `features/myPlanner/components/PlannerHeader.tsx`. Un `grep` confirmó que **nadie importa `PlannerHeader`** — es un remanente muerto de una versión anterior del layout (reemplazado por el header inline que arma `PlannerDetailView.tsx` con el widget `PageHeader`). Se lo actualizó para no dejar el build roto (agregar y pasar el prop), pero no se eliminó el archivo por no ser parte del alcance pedido.

---

## 5. Flujo de uso actual (lo que funciona hoy)

1. Usuario entra en modo edición de un plan (`isEditing = true`).
2. Click en "Sabático" → `openSabbatical()` → abre el modal y dispara `GET .../sabbaticals` para traer los sabáticos ya marcados.
3. Elige año + cuatrimestre (o "Año completo") → "Tomar sabático" → `POST .../sabbaticals` con `{ year, terms }` → se persiste (o no hace nada si ya existía, gracias al `findOrCreate`) → se refresca la lista dentro del mismo modal.
4. Si ya hay sabáticos activos, aparecen listados con un botón "Cancelar" → `DELETE .../sabbaticals?year=...&term=...` → se refresca la lista.
5. El usuario puede repetir el paso 3/4 varias veces antes de cerrar el modal con "Cerrar".

## 6. El motor de corrimiento — [`customPlan/services/sabbaticalEngine.ts`](customPlan/services/sabbaticalEngine.ts)

Dos funciones puras, sin dependencias de React ni del backend:

```typescript
insertSabbaticalGap(plan, targetPeriod, count, existingPeriods?): SabbaticalShiftResult
removeSabbaticalGap(plan, targetPeriod, count, existingPeriods?): SabbaticalShiftResult
// SabbaticalShiftResult = { plan: Plan, movedPeriods: { from, to }[] }
```

### 6.1 Cómo funciona

1. **Aplanar** `Plan.years` a una secuencia lineal cronológica de cuatrimestres (`flattenPlan`) — los años son calendario reales (2026, 2027...), no "año 1, año 2", así que el índice de cada slot se calcula como `(year - startYear) * 2 + (term - 1)`.
2. **Insertar** (`insertSabbaticalGap`) uno o dos cuatrimestres en blanco (`createEmptySemester`) en la posición del período elegido, con `Array.splice`. Si el período pedido cae más allá del final actual del plan, se rellena con cuatrimestres vacíos hasta llegar ahí.
3. Como la inserción es un `splice` uniforme sobre toda la cola, **el orden relativo entre materias nunca se invierte** — por eso no hace falta re-validar correlativas ni límites de horas; a diferencia del motor de cascada (`editEngine.ts`), acá no hay ninguna decisión que tomar, solo desplazar.
4. **Reagrupar** (`rebuildPlan`) la secuencia de vuelta en años calendario, relabeleando cada slot como `startYear + índice/2`. Si queda un cuatrimestre impar al final (por una inserción de 1 solo término), se completa con un blanco extra para no romper el par C1/C2. Al final se recortan años completamente vacíos que hayan quedado colgando al final del plan (evita que el plan crezca sin límite tras sucesivos altas/bajas).
5. **Reetiquetar sabáticos existentes** (`diffMovedPeriods`): si el plan ya tenía otros períodos marcados como sabáticos y la nueva inserción/remoción cae *antes* de alguno de ellos, esos también cambian de año/cuatrimestre. La función recibe `existingPeriods` y devuelve `movedPeriods` con el mapeo `{ from, to }` de los que efectivamente cambiaron, para que el llamador sincronice esas filas en el backend.
6. `removeSabbaticalGap` es la inversa exacta: saca el hueco (`splice` de remoción) y corre todo un lugar hacia atrás, con la misma lógica de reetiquetado.

Probado en [`sabbaticalEngine.test.ts`](customPlan/services/sabbaticalEngine.test.ts): cuatrimestre puntual, año completo, reetiquetado de sabáticos existentes, y round-trip insert→remove.

### 6.2 Integración con `usePlanner.ts` / `useMyPlannerPage.ts`

`usePlanner.ts` expone `applySabbatical(year, terms, existingPeriods, onMoved?)` y `undoSabbatical(year, term, existingPeriods, onMoved?)`, que aplican el motor sobre el `Plan` en memoria vía `setData` (mismo patrón que `moveSubject`).

`useMyPlannerPage.ts` combina ambas mitades del feature en `addSabbatical`/`cancelSabbatical`:

1. Persiste el alta/baja contra el backend (`persistSabbatical`/`persistCancelSabbatical`, los `addSabbatical`/`cancelSabbatical` originales de `useSabbatical`, renombrados internamente).
2. Si la persistencia fue exitosa, aplica el corrimiento al plan en memoria (`applySabbatical`/`undoSabbatical`).
3. Si el corrimiento reetiqueta sabáticos ya existentes (`movedPeriods`), `reconcileMovedSabbaticals` sincroniza esas filas en el backend (borra la etiqueta vieja, crea la nueva) para que la lista de "Sabáticos activos" del modal no quede desactualizada.

**Por qué no se re-aplica el corrimiento al cargar un plan guardado**: `CustomStudyPlanItem.target_year/target_term` guardan la posición final ya corrida — no existe un "plan canónico sin sabáticos" en la base. Igual que cualquier otra edición manual, el corrimiento se aplica una vez en memoria y se persiste con el botón "Guardar" existente; `loadFromSaved()` no necesita (ni debe) volver a aplicarlo.

---

## 7. Archivos tocados/creados — resumen

**Backend (nuevo)**:
- `models/customStudyPlanSabbatical.js`
- `middlewares/customStudyPlanSabbaticalMiddleware.js`
- `controllers/customStudyPlanSabbaticalController.js`
- `routes/customStudyPlanSabbaticalRoutes.js`

**Backend (modificado)**:
- `models/index.js` — asociación + export
- `index.js` — mount de la ruta
- `controllers/customStudyPlanController.js` — `planIncludes` + `clone()`

**Frontend (nuevo)**:
- `customPlan/services/sabbaticalService.ts`
- `customPlan/services/sabbaticalEngine.ts` — motor puro de corrimiento
- `customPlan/services/sabbaticalEngine.test.ts`
- `customPlan/hooks/useSabbatical.ts`
- `customPlan/components/SabbaticalModal.tsx`

**Frontend (modificado)**:
- `customPlan/index.ts` — exports del barrel
- `customPlan/hooks/usePlanner.ts` — `applySabbatical`/`undoSabbatical`
- `components/PlannerActions.tsx` — botón + prop
- `components/PlannerDetailView.tsx` — props + render del modal
- `components/PlannerHeader.tsx` — prop nueva (componente muerto, no eliminado)
- `hooks/useMyPlannerPage.ts` — estado + wiring del hook + reconciliación de sabáticos reetiquetados
- `pages/StudentPage/MyPlannerPage.tsx` — paso de props

**Verificación realizada**: `tsc --noEmit` completo del frontend (51 errores preexistentes, 0 nuevos), suite de tests del backend (713/713) y de `myPlanner` en frontend (9/10 — el `sabbaticalEngine` suma 4 tests nuevos, todos verdes; la única falla es el bug de electivas preexistente y documentado, no relacionado con esta feature).
