import { PlannerActions } from "./PlannerActions";
import type { SavedPlan } from "../customPlan/model/planner";

interface PlannerHeaderProps {
  isEditing: boolean;
  setIsEditing: (isEditing: boolean) => void;
  onCancelEdit: () => void;
  activePlanName: string;
  plans: SavedPlan[];
  activePlanId: number | null;
  onLoadPlan: (id: number) => void;
  onClone: (id: number) => void;
  onNewPlan: () => void;
  onDeletePlan: () => void;
  onSave: () => void;
  onBack: () => void;
  onOpenSabbatical: () => void;
  onOpenElectives: () => void;
  onOpenUnahur: () => void;
}

export function PlannerHeader({
  isEditing,
  setIsEditing,
  onCancelEdit,
  activePlanName,
  plans,
  activePlanId,
  onLoadPlan,
  onClone,
  onNewPlan,
  onDeletePlan,
  onSave,
  onBack,
  onOpenSabbatical,
  onOpenElectives,
  onOpenUnahur,
}: PlannerHeaderProps) {
  return (
    <header className="flex-shrink-0 bg-surface-bright border-b border-outline-variant p-margin flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sticky top-0 z-20">
      <div>
        <h1 className="text-headline-sm font-headline-sm text-on-surface">
          {activePlanName}
        </h1>
        <p className="text-body-sm text-on-surface-variant">
          {isEditing ? "Modo edición: arrastra materias para reorganizar." : "Vista de solo lectura."}
        </p>
      </div>
      <PlannerActions
        isEditing={isEditing}
        plans={plans}
        activePlanId={activePlanId}
        onLoadPlan={onLoadPlan}
        onClone={onClone}
        onSave={onSave}
        onDelete={onDeletePlan}
        onEdit={() => setIsEditing(true)}
        onCancelEdit={onCancelEdit}
        onBack={onBack}
        onOpenSabbatical={onOpenSabbatical}
        onOpenElectives={onOpenElectives}
        onOpenUnahur={onOpenUnahur}
      />
    </header>
  );
}