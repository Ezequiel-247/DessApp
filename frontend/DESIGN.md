# Design System - AcademiaPro

## Overview

Sistema de diseño basado en **Stitch Design System - Academic Precision**. Orientado a entornos institucionales de alta densidad informativa donde la claridad y autoridad son primordiales. Personalidad de marca: académico, disciplinado y confiable.

---

## Color Palette

### Primary Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `primary` | `#003441` | Navegación principal, headers, acciones primarias |
| `primary-container` | `#0f4c5c` | Fondos de acento, elementos interactivos |
| `on-primary` | `#ffffff` | Texto sobre primary |
| `on-primary-container` | `#87bbce` | Texto sobre primary-container |

### Secondary Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `secondary` | `#006c49` | Estados "aprobado", "completado", "verificado" |
| `secondary-container` | `#6cf8bb` | Fondos de badges de éxito |
| `on-secondary` | `#ffffff` | Texto sobre secondary |
| `on-secondary-container` | `#00714d` | Texto sobre secondary-container |

### Tertiary Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `tertiary` | `#482700` | Color terciario |
| `on-tertiary` | `#ffffff` | Texto sobre tertiary |
| `tertiary-container` | `#623d13` | Fondo de elementos terciarios |
| `on-tertiary-container` | `#dda975` | Texto sobre tertiary-container |
| `tertiary-fixed-dim` | `#f3bc87` | Estados "regular", "en progreso" |
| `on-tertiary-fixed` | `#2c1600` | Texto sobre tertiary-fixed |

### Surface Colors (Backgrounds)

| Token | Hex | Usage |
|-------|-----|-------|
| `background` | `#f8f9ff` | Fondo general de la aplicación |
| `surface` | `#f8f9ff` | Fondo de secciones |
| `surface-dim` | `#cbdbf5` | Superficies reducidas |
| `surface-bright` | `#f8f9ff` | Superficies brillantes |
| `surface-container-lowest` | `#ffffff` | Cards, contenedores elevados |
| `surface-container-low` | `#eff4ff` | Elementos dentro de cards |
| `surface-container` | `#e5eeff` | Contenedores de nivel medio |
| `surface-container-high` | `#dce9ff` | Niveles superiores |
| `surface-container-highest` | `#d3e4fe` | Nivel más alto |
| `surface-variant` | `#d3e4fe` | Variantes de superficie y fondos secundarios |
| `surface-tint` | `#306576` | Tintado de superficie (accent) |

### Text Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `on-surface` | `#0b1c30` | Texto principal |
| `on-surface-variant` | `#40484b` | Texto secundario, descripciones |
| `on-background` | `#0b1c30` | Texto sobre background |
| `outline` | `#70787c` | Placeholders, iconos secundários |
| `outline-variant` | `#c0c8cb` | Bordes, separadores |

### Status Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `error` | `#ba1a1a` | Estados de error |
| `error-container` | `#ffdad6` | Fondo de alertas de error |
| `on-error` | `#ffffff` | Texto sobre error |
| `on-error-container` | `#93000a` | Texto sobre error-container |

### Inverse Colors (Dark Mode)

| Token | Hex | Usage |
|-------|-----|-------|
| `inverse-surface` | `#213145` | Superficie invertida |
| `inverse-on-surface` | `#eaf1ff` | Texto sobre superficie invertida |
| `inverse-primary` | `#9acee1` | Color primario invertido |

### Fixed Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `primary-fixed` | `#b6ebfe` | Color fijo primario |
| `primary-fixed-dim` | `#9acee1` | Variante reducida |
| `on-primary-fixed` | `#001f28` | Texto sobre primary-fixed |
| `on-primary-fixed-variant` | `#114d5d` | Texto variante |
| `secondary-fixed` | `#6ffbbe` | Color fijo secundario |
| `secondary-fixed-dim` | `#4edea3` | Variante reducida |
| `on-secondary-fixed` | `#002113` | Texto sobre secondary-fixed |
| `on-secondary-fixed-variant` | `#005236` | Texto variante |
| `tertiary-fixed` | `#ffdcbe` | Color fijo terciario |
| `on-tertiary-fixed` | `#2c1600` | Texto sobre tertiary-fixed |
| `on-tertiary-fixed-variant` | `#643e14` | Texto variante |

---

## Typography

### Font Family

**Inter** para toda la tipografía. Excepcional legibilidad en layouts de alta densidad de datos.

```css
font-family: 'Inter', sans-serif;
```

### Type Scale

| Class | Font Size | Line Height | Letter Spacing | Font Weight |
|-------|-----------|-------------|----------------|-------------|
| `display-lg` | 36px | 44px | -0.02em | 700 |
| `headline-md` | 24px | 32px | -0.01em | 600 |
| `title-sm` | 18px | 28px | - | 600 |
| `body-md` | 16px | 24px | - | 400 |
| `body-sm` | 14px | 20px | - | 400 |
| `label-caps` | 12px | 16px | 0.05em | 600 |

### Usage Guidelines

- **display-lg**: Títulos de página principales (Login, Register)
- **headline-md**: Títulos de sección, nombres de usuario
- **title-sm**: Títulos de cards, nombres de secciones
- **body-md**: Texto de párrafos, descripciones
- **body-sm**: Texto secundario, metadata
- **label-caps**: Labels de formularios, tags, badges (SIEMPRE uppercase + letter-spacing)

---

## Spacing System

Base: **4px** (escalado logarítmico)

| Token | Value | Usage |
|-------|-------|-------|
| `base` | 4px | Espaciado mínimo |
| `xs` | 8px | Entre elementos relacionados |
| `sm` | 16px | Padding interno de componentes |
| `md` | 24px | Gaps estándar |
| `lg` | 32px | Separación entre secciones |
| `xl` | 48px | Márgenes de página |
| `gutter` | 24px | Separación entre cards/bento items |
| `margin` | 32px | Márgenes externos del contenido |

---

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `sm` | 0.125rem (2px) | Controles compactos |
| `DEFAULT` | 0.25rem (4px) | Inputs y botones estándar |
| `md` | 0.375rem (6px) | Tarjetas pequeñas |
| `lg` | 0.5rem (8px) | Cards, elementos medianos |
| `xl` | 0.75rem (12px) | Modals, contenedores grandes |
| `full` | 9999px | Avatares, chips totalmente redondeados |

---

## Icons

### Material Symbols Outlined

Usar Google Fonts Material Symbols Outlined para todos los iconos.

```html
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet">
```

```jsx
<span class="material-symbols-outlined">icon_name</span>
```

### Icon States

- **Default**: `font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24`
- **Filled**: `style={{ fontVariationSettings: "'FILL' 1" }}`

### Common Icons by Context

| Context | Icon |
|---------|------|
| Dashboard | `dashboard` |
| Perfil | `account_circle` |
| Progreso | `analytics` |
| Planificador | `event_note` |
| Materiales | `menu_book` |
| Sesiones | `groups` |
| Red Social | `hub` |
| Logout | `logout` |
| Search | `search` |
| Notifications | `notifications` |
| Settings | `settings` |
| Help | `help` |
| Email | `mail` |
| Password | `lock` |
| Camera | `photo_camera` |
| Shield | `shield_person` |
| Public | `public` |
| School | `school` |
| Save | `save` |

---

## Layout System

### Page Layout

```
┌─────────────────────────────────────────────────────┐
│                    TopBar (sticky)                 │
├──────────┬──────────────────────────────────────────┤
│          │                                          │
│ Sidebar  │           Main Content                   │
│ (fixed)  │           (scrollable)                   │
│  w-64    │                                          │
│          │                                          │
└──────────┴──────────────────────────────────────────┘
```

- **Sidebar**: `fixed`, `w-64`, `h-screen`, `bg-[#0F4C5C]`
- **Main content**: `lg:ml-64` para compensar sidebar
- **TopBar**: `sticky top-0`, `h-16`, `bg-white/95 backdrop-blur-md`
- **Page content**: `p-margin` (32px) en desktop, `p-sm` en mobile

### Responsive Breakpoints

- **Mobile**: < 768px (hamburger menu, sidebar overlay)
- **Desktop**: ≥ 768px (sidebar visible, full layout)

---

## Components

### Button

**Primary**: `bg-primary text-on-primary hover:bg-primary-container`
- Usar para acciones principales (Submit, Guardar)
- Border-radius: `rounded-DEFAULT`
- Padding: `px-6 py-2.5`
- Font: `font-title-sm text-title-sm`

**Secondary**: `border border-outline-variant text-primary hover:bg-surface-container`
- Usar para acciones secundarias (Cancelar)
- Border-radius: `rounded-full` para look más suave

### Input

- Label: `font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider`
- Input field: `bg-surface-bright border border-outline-variant rounded-DEFAULT py-sm pl-[44px]`
- Icon slot: `absolute left-sm top-1/2 -translate-y-1/2`
- Focus: `focus:ring-1 focus:ring-primary focus:border-primary`

### Card

- Background: `bg-surface-container-lowest`
- Border: `border border-outline-variant`
- Border-radius: `rounded-xl`
- Shadow: `shadow-sm`
- Header optional: `bg-surface-bright border-b border-outline-variant rounded-t-xl`

### Toggle (Switch)

- On: `bg-primary` con círculo `bg-on-primary`
- Off: `bg-surface-variant` con círculo `bg-outline`
- Size: `h-6 w-11 rounded-full`
- Transition: `transition-colors duration-200 ease-in-out`

### Badge / Status Chips

- `APROBADA`: `bg-secondary-container text-on-secondary-container`
- `REGULAR`: `bg-tertiary-fixed-dim text-on-tertiary-fixed`
- `PENDIENTE`: `bg-surface-container text-on-surface-variant border border-outline-variant`
- `EN CURSO`: `bg-surface-container text-primary-container`
- `EXCELENTE`: `bg-secondary/10 text-secondary`
- `EN RIESGO`: `bg-error-container text-on-error-container`
- `BUENO`: `bg-surface-container-high text-primary-container`
- Font: `font-label-caps text-label-caps` (uppercase)
- Size: `px-2 py-1 rounded`

### Avatar

- Size: `w-32 h-32 rounded-full` (profile), `w-8 h-8` (header), `w-10 h-10` (contacts)
- Border: `border-4 border-surface-container-lowest`
- Fallback: Material icon `person`

### Table (Data Dense)

- Header: `bg-surface` or `bg-surface-container-low` + `font-label-caps`
- Rows: `border-b border-outline-variant/50` + `hover:bg-surface` + zebra opcional (`bg-surface/30`)
- Sin bordes verticales; alineaciones por columna

### Feed / Cards de Actividad

- Post base: `bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-sm`
- Post destacado: `bg-secondary-container` + icono gigante `emoji_events`
- Acciones: botones `font-label-caps` con icono y `hover:text-primary`

### Calendar (Sesiones)

- Grid: `grid grid-cols-7 grid-rows-6 gap-px bg-outline-variant/20`
- Día actual: círculo `bg-primary-container text-white`
- Evento: chip pequeño `text-[10px] font-semibold` con color según tipo

### Chips de Filtros

- Activo: `bg-primary-container text-on-primary-container border border-primary-container`
- Inactivo: `bg-surface text-on-surface-variant border border-outline-variant`
- Tamaño: `px-3 py-1.5 rounded-full font-label-caps`

### Bottom Nav (Mobile)

- Contenedor: `fixed bottom-0 bg-surface-container-lowest shadow-[0_-4px_20px_rgba(15,76,92,0.08)]`
- Ítems: icono + label `text-[10px] font-label-caps`
- Activo: `text-primary-container` + icono `FILL 1`

---

## Layout Patterns

### Bento Grid (Dashboard)

```jsx
<div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
  <div className="md:col-span-8">...</div>  // Progreso
  <div className="md:col-span-4">...</div>  // Sesiones
  <div className="md:col-span-8">...</div>  // Tabla materias
  <div className="md:col-span-4">...</div>  // Contactos
</div>
```

### Profile Grid

```jsx
<div className="grid grid-cols-12 gap-gutter">
  <div className="col-span-12 lg:col-span-4">Personal Info Card</div>
  <div className="col-span-12 lg:col-span-8">Privacy Settings Card</div>
</div>
```

### Progress Stats Grid

```jsx
<div className="grid grid-cols-12 gap-gutter">
  <div className="col-span-12 lg:col-span-6">Progress Bar</div>
  <div className="col-span-6 lg:col-span-3">Average</div>
  <div className="col-span-6 lg:col-span-3">Alerts</div>
</div>
```

### Feed + Aside (Red Social)

```jsx
<div className="grid grid-cols-12 gap-gutter">
  <div className="col-span-12 lg:col-span-8">Actividad / Feed</div>
  <aside className="col-span-12 lg:col-span-4">Solicitudes + Sugerencias</aside>
</div>
```

### Calendar + Upcoming (Sesiones)

```jsx
<div className="grid grid-cols-1 xl:grid-cols-12 gap-gutter">
  <div className="xl:col-span-8">Calendario</div>
  <div className="xl:col-span-4">Próximas sesiones</div>
</div>
```

---

## Form Patterns

### Login Form

- Split layout: form left (md:max-w-xl), image right (hidden md:block)
- Brand header: icon `school` + "AcademiaPro"
- Greeting: "Bienvenido." (display-lg)
- Inputs: email + password con iconos
- Options: checkbox + link "¿Olvidé mi contraseña?"
- Submit: full-width, bg-primary, icon `arrow_forward`
- Footer: "¿Nuevo en la plataforma? Regístrate aquí"

### Register Form

- Card layout: max-w-6xl, rounded-xl, shadow-sm
- Left panel: branding con gradient overlay
- Right panel: form con progress stepper
- Stepper: circles (1, 2) + connecting line
- Form fields: 2-column grid (nombres, apellidos), email, password
- Password toggle: visibility icon
- Actions: "Siguiente Paso" + "Iniciar Sesión" link

---

## Navigation

### Sidebar

- Background: `bg-[#0F4C5C] dark:bg-slate-900`
- Logo area: w-10 h-10 rounded bg-white/20 + icon `school` + "Portal Académico"
- Nav items: flat list (NO sections), icon + label
- Active state: `bg-white/10 text-white border-l-4 border-white`
- Inactive: `text-teal-100/70 hover:text-white hover:bg-white/5`
- Icons: Material Symbols con `FILL` 0 (inactive) o 1 (active)
- Footer: border-t + "Cerrar Sesión" con icon `logout`

### TopBar

- Brand: "AcademiaPro" (hidden md:block)
- Search: rounded-full bg-surface-container-low (hidden md:flex)
- Actions: notifications (con dot), settings, help (icon buttons)
- Avatar: w-9 h-9 rounded-full

### Bottom Navigation (Mobile)

- Visible solo en mobile (`md:hidden`)
- Espaciado: `px-2 py-xs pb-4`
- Active: color `text-primary-container` y `FILL 1`

---

## Dark Mode

- Toggle: ThemeToggle component
- Persistencia: localStorage
- Colors: Usar inverse tokens cuando sea necesario
- Background: `dark:bg-slate-900`
- Surface: `dark:bg-zinc-900`
- Text: `dark:text-inverse-on-surface`

---

## Elevation System

Niveles tonales, NO sombras pesadas:

| Level | Usage | Style |
|-------|-------|-------|
| 0 | Background general | `bg-background` |
| 1 | Cards, contenedores | `bg-surface-container-lowest border border-outline-variant shadow-sm` |
| 2 | Dropdowns, modals | White bg + ambient shadow `0px 4px 20px rgba(15,76,92,0.08)` |
| 3 | Popovers | Borde más visible |

### Shadows usadas en vistas

- `shadow-sm` para cards y botones
- `shadow-[0_4px_20px_rgba(15,76,92,0.03)]` para bento cards
- `shadow-[0_4px_20px_rgba(15,76,92,0.08)]` para paneles elevados
- `shadow-[0_-4px_20px_rgba(15,76,92,0.08)]` para bottom nav

---

## Animations & Transitions

- **Duration**: 150ms para interacciones, 200ms para componentes
- **Easing**: `ease-out` para mayoría, `ease-in-out` para toggles
- **Button press**: `active:scale-[0.98]`
- **Hover states**: Transición de color únicamente
- **Sidebar mobile**: `transform transition-transform duration-200 ease-out`

---

## Accessibility

- Focus rings: `focus:ring-2 focus:ring-primary focus:ring-offset-2`
- Color contrast: Mínimo 4.5:1 para texto
- Touch targets: Mínimo 44x44px
- Icon buttons: `w-10 h-10 rounded-full`
- ARIA labels en elementos interactivos

---

## CSS Custom Properties (Tailwind Config)

```js
colors: {
  primary: '#003441',
  'primary-container': '#0f4c5c',
  'surface-variant': '#d3e4fe',
  'surface-tint': '#306576',
  'on-tertiary': '#ffffff',
  'on-tertiary-container': '#dda975',
  // ... toda la paleta
},
borderRadius: {
  sm: '0.125rem',
  DEFAULT: '0.25rem',
  md: '0.375rem',
  lg: '0.5rem',
  xl: '0.75rem',
  full: '9999px',
},
spacing: {
  margin: '32px',
  gutter: '24px',
  sm: '16px',
  xs: '8px',
  lg: '32px',
  base: '4px',
  md: '24px',
  xl: '48px',
},
fontFamily: {
  sans: ['Inter', 'sans-serif'],
},
fontSize: {
  'display-lg': ['36px', { lineHeight: '44px', letterSpacing: '-0.02em', fontWeight: '700' }],
  'headline-md': ['24px', { lineHeight: '32px', letterSpacing: '-0.01em', fontWeight: '600' }],
  'title-sm': ['18px', { lineHeight: '28px', fontWeight: '600' }],
  'body-md': ['16px', { lineHeight: '24px', fontWeight: '400' }],
  'body-sm': ['14px', { lineHeight: '20px', fontWeight: '400' }],
  'label-caps': ['12px', { lineHeight: '16px', letterSpacing: '0.05em', fontWeight: '600' }],
}
```

---

## Quick Reference

### Color Usage by Component

| Component | Background | Border | Text |
|-----------|------------|--------|------|
| Page | `bg-surface` | - | `text-on-surface` |
| Card | `bg-surface-container-lowest` | `border-outline-variant` | - |
| Card Header | `bg-surface-bright` | `border-b border-outline-variant` | `text-on-surface` |
| Input | `bg-surface-bright` | `border-outline-variant` | `text-on-surface` |
| Button Primary | `bg-primary` | - | `text-on-primary` |
| Sidebar | `bg-[#0F4C5C]` | `border-teal-800` | `text-teal-100/70` |
| TopBar | `bg-white/95 backdrop-blur-md` | `border-slate-200` | `text-slate-500` |

### Typography by Context

| Context | Class | Example |
|---------|-------|---------|
| Page Title | `text-display-lg` | "Bienvenido." |
| Section Title | `text-headline-md` | "Mi Perfil y Privacidad" |
| Card Title | `text-title-sm` | "Configuración de Privacidad" |
| Body Text | `text-body-md` | Descripciones |
| Secondary Text | `text-body-sm` | Metadata, timestamps |
| Label | `text-label-caps uppercase` | "CORREO ELECTRÓNICO" |
| Badge | `text-label-caps` | "APROBADA" |

---

## Responsive Rules

- **sm**: acciones compactas, chips con `text-[10px]`
- **md**: sidebar visible, `ml-64`, topbar completa, grids a 12 columnas
- **lg**: bento con 8/4, cards más densas
- **xl**: calendario + upcoming split (8/4)
- **Mobile**: bottom nav visible, sidebar oculta, search comprimido

---

## States & Labels

- **Active nav**: `bg-white/10 text-white border-l-4 border-white`
- **Hover nav**: `hover:bg-white/5` + `hover:text-white`
- **Focus inputs**: `focus:ring-1 focus:ring-primary focus:border-primary`
- **Disabled**: `opacity-70` + `cursor-not-allowed`
- **Label caps**: `uppercase tracking-wider` (formularios y chips)
