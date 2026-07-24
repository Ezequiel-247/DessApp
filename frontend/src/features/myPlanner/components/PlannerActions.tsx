import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@/widgets/ui/Button";
import { Dropdown } from "@/widgets/ui/Dropdown";
import type { SavedPlan } from "@/features/myPlanner/customPlan/model/planner";

interface Props {
  isEditing: boolean;
  plans: SavedPlan[];
  activePlanId: number | null;
  onLoadPlan: (planId: number) => void;
  onClone: (planId: number) => void;
  onSave: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onCancelEdit: () => void;
  onBack: () => void;
  onOpenSabbatical: () => void;
  onOpenElectives: () => void;
  onOpenUnahur: () => void;
}

interface TooltipButtonProps {
  tooltip: string;
  variant?: "primary" | "secondary";
  className?: string;
  onClick: () => void;
  children: ReactNode;
}

function TooltipButton({ tooltip, variant = "secondary", className, onClick, children }: TooltipButtonProps) {
  return (
    <div className="relative group">
      <Button variant={variant} size="sm" onClick={onClick} className={className}>
        {children}
      </Button>
      <span className="pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mt-2 whitespace-nowrap rounded-lg bg-inverse-surface px-3 py-1.5 text-xs font-medium text-inverse-on-surface opacity-0 shadow-md transition-opacity duration-150 group-hover:opacity-100 z-10">
        {tooltip}
      </span>
    </div>
  );
}

interface OverflowMenuItem {
  key: string;
  label: string;
  icon: string;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}

// Menú "⋮" para pantallas chicas: agrupa las acciones secundarias del toolbar del
// planificador (tanto en modo edición como fuera de él) para que dejen de forzar
// scroll horizontal o cortarse contra el borde. En xl+ estas acciones se muestran
// sueltas como siempre (ver render).
function OverflowMenu({ items }: { items: OverflowMenuItem[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <Button
        variant="secondary"
        onClick={() => setIsOpen(v => !v)}
        aria-label="Más acciones"
        aria-expanded={isOpen}
      >
        <span className="material-symbols-outlined">more_vert</span>
        <span className="hidden sm:inline">Ver más</span>
      </Button>
      {isOpen && (
        <div className="absolute z-30 top-full mt-1 right-0 min-w-[220px] bg-white border border-outline-variant rounded-xl shadow-lg overflow-hidden py-1">
          {items.map(item => (
            <button
              key={item.key}
              type="button"
              disabled={item.disabled}
              onClick={() => {
                if (item.disabled) return;
                item.onClick();
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 transition-colors hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent ${
                item.danger ? "text-error hover:bg-error/5" : "text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined shrink-0" style={{ fontSize: "20px" }}>
                {item.icon}
              </span>
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function PlannerActions({
  isEditing, plans, activePlanId,
  onLoadPlan, onClone,
  onSave, onDelete,
  onEdit, onCancelEdit,
  onBack,
  onOpenSabbatical,
  onOpenElectives,
  onOpenUnahur,
}: Props) {
  const selectedId = activePlanId != null ? String(activePlanId) : "";
  const activePlan = plans.find(p => p.id === activePlanId);

  // El selector de plan (Dropdown) y el menú "⋮" (OverflowMenu) abren contenido
  // posicionado en absoluto por debajo del botón. Si quedan dentro del contenedor con
  // `overflow-x-auto`, el navegador fuerza también `overflow-y` a `auto` (comportamiento
  // estándar de CSS cuando un eje es "auto"/"scroll" y el otro "visible"), y ese overflow-y
  // termina recortando el menú desplegado — se abre pero no se ve. Por eso van AFUERA del
  // wrapper con scroll, como hermanos flex-shrink-0.
  return (
    <div className="flex items-center gap-2 flex-nowrap w-full xl:w-auto">
      {!isEditing && (
        <div className="flex-shrink-0">
          <Dropdown
            icon="folder"
            label={activePlan?.name ?? "Plan actual"}
            allLabel=""
            value={selectedId}
            hideAllOption
            onChange={(v) => onLoadPlan(Number(v))}
            options={plans.map(p => ({ value: String(p.id), label: p.name }))}
            className="max-w-[140px] sm:max-w-[200px]"
          />
        </div>
      )}

      {/* Debajo de xl solo hay UN botón acá (editar o guardar, el resto vive en el
          menú "Ver más") — flex-shrink-0 evita que la fila lo comprima a una lasca
          invisible al competir por espacio contra el Dropdown y "Ver más", que tampoco
          se achican. En xl+ sí puede haber varios botones sueltos, ahí se restaura el
          min-w-0/scroll original para que no rompan el layout. */}
      <div className="flex items-center gap-2 flex-nowrap overflow-x-auto md:overflow-x-visible pb-1 min-w-0 flex-shrink-0 xl:flex-shrink no-scrollbar">
        {!isEditing && (
          <div className="hidden xl:contents">
            <Button variant="secondary" onClick={() => activePlanId != null && onClone(activePlanId)} disabled={activePlanId == null}>
              <span className="material-symbols-outlined">file_copy</span>
              Clonar
            </Button>
            <div className="w-px h-5 bg-outline-variant/50" />
          </div>
        )}
        {isEditing ? (
          <>
            <TooltipButton variant="primary" onClick={onSave} tooltip="Guardar los cambios del plan">
              <span className="material-symbols-outlined">save</span>
            </TooltipButton>

            {/* xl+: acciones sueltas, igual que antes */}
            <div className="hidden xl:contents">
              <TooltipButton onClick={onOpenSabbatical} tooltip="Marcá un cuatrimestre como año sabático">
                <span className="material-symbols-outlined">beach_access</span>
                Sabático
              </TooltipButton>
              <TooltipButton onClick={onOpenElectives} tooltip="Elegí qué materias electivas vas a cursar">
                <span className="material-symbols-outlined">auto_awesome</span>
                Electivas
              </TooltipButton>
              <TooltipButton onClick={onOpenUnahur} tooltip="Elegí qué materia UNAHUR vas a cursar">
                <span className="material-symbols-outlined">school</span>
                UNAHUR
              </TooltipButton>
              <TooltipButton
                variant="primary"
                onClick={onDelete}
                className="!bg-error !text-on-error hover:!bg-error/90 shadow-sm shadow-error/20"
                tooltip="Eliminar este plan"
              >
                <span className="material-symbols-outlined">delete</span>
              </TooltipButton>
              <TooltipButton onClick={onCancelEdit} tooltip="Descartar los cambios sin guardar">
                <span className="material-symbols-outlined">close</span>
                Cancelar cambios
              </TooltipButton>
            </div>
          </>
        ) : (
          <>
            <TooltipButton variant="primary" onClick={onEdit} tooltip="Editar este plan">
              <span className="material-symbols-outlined">edit</span>
            </TooltipButton>
            <div className="hidden xl:contents">
              <TooltipButton
                variant="primary"
                onClick={onDelete}
                className="!bg-error !text-on-error hover:!bg-error/90 shadow-sm shadow-error/20"
                tooltip="Eliminar este plan"
              >
                <span className="material-symbols-outlined">delete</span>
              </TooltipButton>
              <TooltipButton onClick={onBack} tooltip="Volver a la lista de planes">
                <span className="material-symbols-outlined">arrow_back</span>
                Volver al menú
              </TooltipButton>
            </div>
          </>
        )}
      </div>

      {/* Debajo de xl: acciones secundarias agrupadas en el menú "⋮" — fuera del
          wrapper con scroll para que el desplegable no quede clippeado (ver comentario arriba).
          Se muestra tanto en modo edición como fuera de él. `ml-auto` lo empuja al borde
          derecho del header: como el desplegable se abre con `right-0` relativo a este
          botón, así queda anclado al borde real de la pantalla en vez de quedar flotando
          a la izquierda con un hueco vacío al lado. */}
      <div className="xl:hidden flex-shrink-0 ml-auto">
        {isEditing ? (
          <OverflowMenu
            items={[
              { key: "sabbatical", label: "Sabático", icon: "beach_access", onClick: onOpenSabbatical },
              { key: "electives", label: "Electivas", icon: "auto_awesome", onClick: onOpenElectives },
              { key: "unahur", label: "UNAHUR", icon: "school", onClick: onOpenUnahur },
              { key: "cancel", label: "Cancelar cambios", icon: "close", onClick: onCancelEdit },
              { key: "delete", label: "Eliminar plan", icon: "delete", onClick: onDelete, danger: true },
            ]}
          />
        ) : (
          <OverflowMenu
            items={[
              { key: "clone", label: "Clonar", icon: "file_copy", onClick: () => activePlanId != null && onClone(activePlanId), disabled: activePlanId == null },
              { key: "delete", label: "Eliminar plan", icon: "delete", onClick: onDelete, danger: true },
              { key: "back", label: "Volver al menú", icon: "arrow_back", onClick: onBack },
            ]}
          />
        )}
      </div>
    </div>
  );
}
