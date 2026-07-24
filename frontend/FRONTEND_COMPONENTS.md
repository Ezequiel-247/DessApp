# Frontend Components - AcademiaPro

Este documento resume los componentes atomicos reutilizables del frontend. Se respetan los tokens y patrones del Stitch Design System (ver DESIGN.md) y la estructura FSD (ver STRUCTURE.md).

## Principios

- No cambiar el diseño ni el comportamiento: solo reutilizar markup existente.
- Crear un componente nuevo solo si el patron aparece en 2 o mas lugares.
- Mantener los tokens de color, tipografia y spacing del design system.
- Preferir `widgets/ui` para atomos y `widgets/layout` para layout.

## Catalogo de atomos

### PageHeader
- **Ubicacion:** `src/widgets/ui/PageHeader/PageHeader.jsx`
- **Uso:** encabezado de pagina con eyebrow, titulo, descripcion y acciones opcionales.
- **Props:** `eyebrow`, `title`, `description`, `actions`, `className`, `eyebrowClassName`, `titleClassName`, `descriptionClassName`

### SectionCard
- **Ubicacion:** `src/widgets/ui/SectionCard/SectionCard.jsx`
- **Uso:** contenedor con header opcional y cuerpo con padding controlado.
- **Props:** `header`, `children`, `className`, `headerClassName`, `bodyClassName`

### SearchInput
- **Ubicacion:** `src/widgets/ui/SearchInput/SearchInput.jsx`
- **Uso:** input de busqueda con icono integrado.
- **Props:** `value`, `onChange`, `placeholder`, `className`, `inputClassName`

### StatusBadge
- **Ubicacion:** `src/widgets/ui/StatusBadge/StatusBadge.jsx`
- **Uso:** chip de estado con estilos definidos por el caller.
- **Props:** `label`, `className`

### EmptyState
- **Ubicacion:** `src/widgets/ui/EmptyState/EmptyState.jsx`
- **Uso:** estado vacio con borde dashed y texto centrado.
- **Props:** `children`, `className`

### FormField
- **Ubicacion:** `src/widgets/ui/FormField/FormField.jsx`
- **Uso:** label + error para inputs y selects.
- **Props:** `label`, `error`, `children`, `className`, `labelClassName`, `stackClassName` (opcional; default `space-y-2`)

### PillButton
- **Ubicacion:** `src/widgets/ui/PillButton/PillButton.jsx`
- **Uso:** boton compacto tipo pill para acciones en listas.
- **Props:** `tone` ("neutral" | "danger"), `className`, `children`

## Uso rapido

```jsx
import { PageHeader } from "@/widgets/ui/PageHeader";
import { SectionCard } from "@/widgets/ui/SectionCard";
import { SearchInput } from "@/widgets/ui/SearchInput";
import { StatusBadge } from "@/widgets/ui/StatusBadge";
import { EmptyState } from "@/widgets/ui/EmptyState";
import { FormField } from "@/widgets/ui/FormField";
import { PillButton } from "@/widgets/ui/PillButton";
```

## Convencion de creacion

1. Duplicacion detectada en 2+ paginas o componentes.
2. Mantener clases y tokens del design system sin cambios visuales.
3. Crear el componente en `widgets/ui/<Nombre>/` con `index.js`.
4. Refactorizar paginas para usar el componente sin alterar la logica.
