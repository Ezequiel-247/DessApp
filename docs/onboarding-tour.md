# Tour guiado de onboarding

Recorrido guiado tipo "product tour" que le muestra a un usuario las secciones y botones principales de cada pantalla la primera vez que entra, con un tooltip explicativo por elemento. Cubre las 9 secciones del rol estudiante y las 8 del rol admin (17 páginas en total). Es una feature 100% de frontend: no agrega endpoints, tablas ni lógica de backend.

## Por qué esta solución

Para "llevar de la mano" al usuario por la app había dos caminos: escribir un componente de tour a medida (overlay + spotlight + posicionamiento del tooltip) o apoyarse en una librería ya probada. Se optó por una librería porque la parte difícil de resolver a mano no es el diseño visual sino el comportamiento: hacer scroll automático hasta el elemento, recalcular la posición del tooltip si la ventana cambia de tamaño, recortar el overlay oscuro exactamente sobre el botón resaltado, etc.

Se usó **[react-joyride](https://www.npmjs.com/package/react-joyride) en su versión `2.9.3`**, no la última (`3.x`). La versión 3 es una reescritura muy reciente de toda la API (cambia el export por defecto, el sistema de callbacks, los tipos) con poca documentación y adopción todavía. La 2.9.3 es la última de la serie 2.x, estable desde hace años y con la API que aparece en casi toda la documentación/ejemplos de la comunidad.

## Estructura de archivos

Todo lo nuevo vive en un feature propio, sin tocar la lógica de las páginas más de lo necesario:

```
frontend/src/features/onboarding/
├── ProductTour.tsx   # Componente principal: wrappea <Joyride>, persistencia y botón de reinicio
├── TourTooltip.tsx   # Tooltip a medida (usa el Button y los colores del design system)
└── index.ts          # Barrel export: ProductTour + el tipo TourStep
```

Y un cambio en un componente compartido:

```
frontend/src/widgets/ui/SectionCard/SectionCard.jsx
```
`SectionCard` no reenviaba props extra al `<section>` que renderiza. Se le agregó `...props` para que pueda recibir el atributo `data-tour` que usa el tour para anclar el spotlight (mismo patrón que ya tenían `Card` y `Button`).

Y un cambio equivalente en los 5 paneles de formulario del admin (master-detail de Carreras, Materias, Actividades, Institutos y Directorio):

```
frontend/src/features/careers/components/CareerFormPanel.tsx
frontend/src/features/subjects/components/SubjectFormPanel.tsx
frontend/src/features/activities/components/ActivityFormPanel.tsx
frontend/src/features/institutes/components/InstituteFormPanel.tsx
frontend/src/features/directory/components/UserFormPanel.tsx
```
Estos paneles son componentes tipados (`interface Props { ... }` sin index signature) que renderizan un `Card` como raíz con clases de grid (`xl:col-span-7 ...`) puestas directamente en ese `Card`. Envolverlos en un `<div data-tour="...">` desde la página hubiese roto el layout de grid (el `div` pasaría a ser el ítem de grid en vez del `Card`, sin sus clases de `col-span`). En vez de eso se les agregó una prop opcional `dataTour?: string` que cada uno reenvía como `data-tour={dataTour}` al `Card` que ya rendereaban, sin tocar el layout.

## Cómo funciona `ProductTour`

```tsx
<ProductTour tourId="dashboard" steps={dashboardTourSteps} />
```

Cada página monta una instancia de `ProductTour` con:
- **`tourId`**: identificador único de ese recorrido (una página = un tour).
- **`steps`**: array de pasos de `react-joyride` (`title`, `content`, `target`, `placement`).

Internamente (`ProductTour.tsx`):

1. **Autoinicio una sola vez.** Al montarse, revisa `localStorage.getItem("nexo_tour_seen_<tourId>")`. Si no existe, espera 500ms (para que la sección termine de pintar sus datos reales antes de medir dónde está cada elemento) y arranca el tour (`run = true`).
2. **Persistencia.** Cuando el tour termina, se salta, o se cierra con la X (`STATUS.FINISHED`, `STATUS.SKIPPED` o `ACTIONS.CLOSE`), se guarda `"1"` en esa clave de `localStorage` para que no se vuelva a mostrar solo en próximas visitas.
3. **Botón de reinicio.** Se renderiza un botón circular fijo (`?`) abajo a la derecha (`bottom-24 right-4` en mobile, para no chocar con el bottom nav; `bottom-6 right-6` en desktop). Al clickearlo, vuelve a poner `run = true` sin importar el localStorage, así el usuario puede repasar el tour cuando quiera.
4. **Estilos.** Se le pasa un `tooltipComponent` propio (`TourTooltip`) en vez de usar el tooltip por defecto de la librería, para que visualmente sea indistinguible del resto de la app.

## El tooltip (`TourTooltip.tsx`)

`react-joyride` permite reemplazar completamente su tooltip por un componente propio vía la prop `tooltipComponent`, recibiendo como props el paso actual, los handlers de los botones (`backProps`, `primaryProps`, `skipProps`) y metadata (`index`, `size`, `isLastStep`).

El componente arma una tarjeta blanca con:
- Título y contenido del paso (texto libre, en español).
- Contador `2 / 6` (paso actual / total).
- Botón "Saltar" (texto), "Atrás" y "Siguiente"/"Finalizar" usando el mismo componente `Button` que usa el resto de la app (`variant="secondary"` / `"primary"`), para que el color y la tipografía sean exactamente los del design system en vez de los genéricos de la librería.
- `data-testid="tour-tooltip"` en el contenedor — no cumple ninguna función visual, se usa solo para poder testear el tour con Playwright (ver más abajo).

## Cómo se conecta cada página

El patrón es siempre el mismo en las 17 páginas donde está instalado (9 del rol estudiante + 8 del rol admin):

1. **Marcar los elementos a resaltar** agregándoles un atributo `data-tour="algun-id"` (a un `Button`, un `Card`/`SectionCard`, o un `<div>` envolvente si el elemento real no admite props extra, p. ej. `SegmentedControl` o el feed de Novedades).
2. **Definir el array de pasos** (`TourStep[]`) en la misma página, con un primer paso de bienvenida sin `target` real (`target: "body"`, `placement: "center"`) y un paso por cada `data-tour` marcado, en el orden en que se quiere que aparezcan.
3. **Montar `<ProductTour tourId="..." steps={...} />`** una sola vez, al final del JSX de la página, después de que los datos ya cargaron (para que los elementos existan en el DOM cuando el tour intenta medirlos).

Ejemplo real (`DashboardPage.tsx`):

```tsx
const dashboardTourSteps: TourStep[] = [
  { target: "body", placement: "center", title: "¡Bienvenido a Nexo!", content: "..." },
  { target: '[data-tour="db-progress"]', title: "Progreso de Carrera", content: "..." },
  { target: '[data-tour="db-sessions-add"]', title: "Crear sesión de estudio", content: "..." },
  // ...
];

// en el JSX:
<SectionCard data-tour="db-progress" ...>...</SectionCard>
<button data-tour="db-sessions-add" onClick={...}>...</button>
...
<ProductTour tourId="dashboard" steps={dashboardTourSteps} />
```

### Detalle por página

| Página | `tourId` | Elementos resaltados |
|---|---|---|
| Resumen (`/student/dashboard`) | `dashboard` | Progreso de carrera, botón "+" de sesiones, lista de próximas sesiones, "Ver historial completo", "Ver conexiones" |
| Calificaciones (`/student/academic-record`) | `academic-record` | Importar Excel, Agregar registro, filtros, tabla de historial |
| Mi Progreso (`/student/myProgress`) | `my-progress` | Carrusel de avance, selector materias/actividades, desglose por año, finales pendientes |
| Mi Planificador (`/student/myPlanner`) | `my-planner` | Vista previa del plan actual, simulador de correlativas |
| Materiales (`/student/materials`) | `materials` | Subir material, buscador, filtro por materia, filtro por formato |
| Sesiones (`/student/sessions`) | `sessions` | Crear sesión, filtro por materia, filtros (modalidad/inscripto/propios), listado |
| Conexiones (`/student/connections`) | `connections` | Pestañas de estado, invitar por email, directorio de estudiantes |
| Novedades (`/student/novelties`) | `novelties` | Crear posteo, el feed |
| Mi Perfil (`/student/profile`) | `profile` | Cambiar foto, pestañas privacidad/carreras, panel de configuración |

**Admin:**

| Página | `tourId` | Elementos resaltados |
|---|---|---|
| Dashboard (`/admin/dashboard`) | `admin-dashboard` | Pestañas de categorías, contenido de reportes |
| Carreras (`/admin/careers`) | `admin-careers` | Nueva carrera, filtros, listado, formulario |
| Materias (`/admin/subjects`) | `admin-subjects` | Nueva materia, filtros, listado, formulario |
| Actividades (`/admin/activities`) | `admin-activities` | Nueva actividad, filtros, listado, formulario |
| Planes (`/admin/plans`) | `admin-plans` | Crear plan (asistente), filtros, listado, detalle del plan |
| Institutos (`/admin/institutes`) | `admin-institutes` | Nuevo instituto, filtros, listado, formulario |
| Directorio (`/admin/directory`) | `admin-directory` | Nuevo usuario, filtros, listado, formulario |
| Moderación (`/admin/moderation`) | `admin-moderation` | Estadísticas de moderación, pestañas pendientes/historial, listado de materiales denunciados |

Las 5 páginas master-detail de admin (Carreras, Materias, Actividades, Institutos, Directorio) comparten exactamente la misma estructura de 4 pasos: botón "Nuevo X", filtros, listado, formulario. La fila de filtros y el listado solo son visibles en pantallas ≥1280px (`hidden xl:block`) — por debajo de ese ancho el admin usa un botón flotante que abre un drawer con la lista, así que estos tours están pensados para el uso de escritorio del panel de administración, igual que el resto de esas pantallas.

### Manejo de estados vacíos / condicionales

Algunos elementos solo existen en ciertos estados (por ejemplo, en Mi Planificador el header con el selector de plan y el botón "Crear nueva" solo aparece si el alumno ya tiene planes creados). En esos casos el `data-tour` se puso sobre un contenedor que **siempre** está en el DOM sin importar el estado (por ejemplo, la tarjeta principal completa en vez del botón interno), para que el tour nunca intente apuntar a un elemento que podría no existir. Esto se probó explícitamente con una cuenta sin planificaciones creadas.

## Cómo se probó

No hay tests automatizados agregados al repo para esta feature (es puramente visual). Se verificó manualmente con un script de Playwright que:

1. Levanta el frontend (`npm run dev`) contra el backend local.
2. Inicia sesión como `student1@example.com` (rol estudiante) y por separado como `admin@example.com` (rol admin).
3. Visita cada una de las 17 páginas, espera a que aparezca `[data-testid="tour-tooltip"]`, hace click en "Siguiente" un par de veces y saca una captura en cada paso.
4. Chequea que no haya errores de consola (`console.error` / excepciones no capturadas) en ninguna página.
5. Se probó también el botón "?" de reinicio y el layout en viewport mobile (390px) para confirmar que el botón no se superpone con el bottom nav (en las páginas de estudiante).

El script no quedó versionado en el repo (se corrió desde un directorio temporal fuera del proyecto).

## Cómo agregar el tour a una nueva sección

1. Elegir 4-6 elementos funcionales clave de la pantalla.
2. Agregarles `data-tour="mi-seccion-algo"` (usando un wrapper `<div>` si el componente no reenvía props).
3. Definir `const miSeccionTourSteps: TourStep[] = [...]` con un primer paso de bienvenida (`target: "body"`) y un paso por cada `data-tour`.
4. Importar `{ ProductTour, type TourStep } from "@/features/onboarding"` y montar `<ProductTour tourId="mi-seccion" steps={miSeccionTourSteps} />` al final del JSX.
5. Elegir un `tourId` único (no puede repetirse entre páginas: define la clave de `localStorage`).
6. Si el elemento a marcar es un componente propio (no `Button`/`Card`/`SectionCard`) que ya trae clases de grid (`col-span-*`) en su raíz, no lo envuelvas en un `<div>` — le vas a romper el layout. Agregale una prop `dataTour?: string` y reenviala al elemento raíz, como se hizo en los `FormPanel` del admin.

## Dependencia agregada

```json
"react-joyride": "2.9.3"
```

Es la única dependencia nueva del proyecto para esta feature (antes no había ninguna librería de UI/tour instalada). No requiere configuración adicional ni variables de entorno.
