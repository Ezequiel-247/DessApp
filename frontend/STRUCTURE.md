# Structure - Frontend

## Shared (`src/shared/`)

### `lib/`
- `mockData.ts` / `mockData.js` — Mock data for development/testing across features.
- `api.ts` — TypeScript API helper, defines `ApiResponse<T>` (wraps `{ data: T, ok, message }`) and `PaginatedResponse<T>` (`{ data: T[], total, page, limit }`).

### `api/`
- `apiClient.js` — Axios instance configurado con baseURL desde env, interceptors para auth token y manejo global de errores.

---

## Widgets UI (`src/widgets/ui/`)

Componentes reutilizables del design system (Stitch). Todos exponen un `index.js` con el componente nombrado.

| Carpeta | Descripción |
|---|---|
| `Avatar/` | Avatar de usuario con iniciales o imagen |
| `Badge/` | Badge pequeño para etiquetas/estados |
| `Button/` | Botón primario, secundario, outline, texto |
| `Card/` | Contenedor tipo card elevado |
| `EmptyState/` | Estado vacío con icono y mensaje |
| `FormField/` | Wrapper form con label + error |
| `Input/` | Input de texto con variantes |
| `Modal/` | Modal overlay con header/cuerpo/footer |
| `PageHeader/` | Encabezado de página con título y acciones |
| `PillButton/` | Botón tipo pill (redondeado) |
| `SearchInput/` | Input de búsqueda con icono lupa |
| `SectionCard/` | Card seccionada con borde y padding |
| `SectionTabs/` | Tabs para dividir secciones (perfil, directorio) |
| `Select/` | Select dropdown estilizado |
| `StatusBadge/` | Badge específico para estados (aprobado, pendiente, etc.) |
| `ThemeToggle/` | Toggle claro/oscuro |
| `Toggle/` | Toggle switch on/off genérico |

---

## Features (`src/features/`)

Cada feature es autocontenida con su carpeta de componentes y hooks.

Layout esperado por feature:
```
features/<feature-name>/
  components/
  hooks/
  api/          (opcional, si no usa entities)
  model/        (opcional, si no usa entities)
```
