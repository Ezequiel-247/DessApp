Eres un documentador técnico. Genera la documentación de la fase <FASE> del plan de refactorización a sistema de bloques (`refactor-bloques-plan.md`).

## Contexto del proyecto

- Backend: Node.js + Express + Sequelize (MySQL), sin migraciones (`sync()`)
- Frontend: React + TypeScript + Vite
- Convención backend: respuestas `{ data, message, ok }` / errores `{ message, error }`
- Convención frontend: entidades con `normalize()` (snake_case → camelCase) y `denormalize()` (camelCase → snake_case)
- Autenticación: `requireRole('admin')` para rutas admin
- Documentos existentes: `STRUCTURE.md`, `backend.md`, `plan-corregido.md`, `refactor-bloques-plan.md`

## Documento a generar: `API-CONTRACT.md`

> ⚠️ **Disclaimer:** Cada frente (backend/frontend) documenta **exclusivamente** los cambios de su lado. Si un punto del formato no aplica a la fase actual, se omite — no se documenta con información falsa o inventada. Solo se escribe lo que realmente cambia.

Agrega o modifica la sección `## Fase <N> — <nombre>` siguiendo este formato exacto:

```
## Fase <N> — <nombre>

### Backend — Lo que la API expone

#### Endpoints nuevos
<method> <ruta>
  Auth: requireRole('admin') | pública
  Query params: ?campo=valor
  Request body: { campo: tipo }
  Response éxito (200): { data: { ... }, ok: true, message: "..." }
  Response error (400/404/409): { message: "...", error: "..." }
  Ejemplo consumo (axios):
    axios.get('/api/...', { params: { ... } })

#### Endpoints modificados
<method> <ruta>
  ANTES response: { campo_viejo, ... }
  AHORA response: { campo_nuevo, ... }
  → Frontend: el normalize de <entidad> debe mapear campo_nuevo

#### Endpoints eliminados
<method> <ruta>

#### Modelos nuevos
<nombre_tabla> (tabla):
  campo: tipo (PK/FK/default/null)

Asociaciones Sequelize:
  - <Modelo>.belongsTo(<OtroModelo>, { foreignKey: '...', onDelete: 'CASCADE' })
  - <Modelo>.hasMany(<OtroModelo>, { foreignKey: '...' })

#### Modelos modificados
<nombre_tabla>:
  - Se agregó: campo (tipo, restricciones)
  - Se eliminó: campo

Asociaciones modificadas:
  - <Modelo> ya no tiene belongsTo <OtroModelo>
  - Se agregó: <Modelo>.hasMany(<NuevoModelo>)

#### Modelos eliminados
<nombre_tabla>
  - <modelo_asociado> se retira de models/index.js

#### Seeders afectados
- <archivo.seeder.js>: qué se agrega/elimina/modifica

#### Validaciones / Reglas de negocio
- <campo>: <regla> (ej: min_required >= 1, sort_order único por plan)

### Frontend — Cómo consumir y qué cambia

#### Entities nuevas
<Entidad> (`src/entities/<Entidad>/`):
  Interfaz: { campo: tipo }
  normalize(): mapeo snake_case → camelCase
  denormalize(): mapeo camelCase → snake_case
  api/: <método> <ruta> — archivo de servicio API con llamados axios

#### Entities modificadas
<Entidad>:
  - Se agregó campo: camelCase
  - Se eliminó campo: camelCase
  - api/: se agregó/eliminó método <método> <ruta>

#### Entities eliminadas
<Entidad>
  - Se elimina api/, model/, index.ts

#### Tipos compartidos / Interfaces globales
- <tipo_o_interfaz>: <cambio> (ej: se movió a entidad propia, se unificó con otro tipo, etc.)

#### Hooks/Services afectados
<hook o service>:
  - Cambio: qué se modifica
  - Consume: <método> <ruta>
  - Ahora usa: campo_nuevo en vez de campo_viejo

#### Componentes afectados
<Componente>:
  - Cambio visual: descripción
  - Props nuevas: descripción
  - Props eliminadas: descripción

#### Tests / Mocks afectados
- <archivo.test.ts o mockData.ts>: <cambio>

#### Notas de implementación
- Backend: <nota relevante para la implementación backend>
- Frontend: <nota relevante para la implementación frontend>
```

## Información de la fase

<pegar aquí el contenido de la fase desde refactor-bloques-plan.md>
