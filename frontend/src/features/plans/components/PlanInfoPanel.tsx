import { Button } from "@/widgets/ui/Button";
import { Card } from "@/widgets/ui/Card";
import { PlanBreakdown } from "./PlanBreakdown";
import { PlanInfoCard } from "./PlanInfoCard";
import type { PlanItem } from "../hooks/usePlansData";

interface Props {
  selectedPlan: PlanItem | null;
  formatCareerName: (id: string) => string;
  formatInstituteNameFromCareer: (id: string) => string;
  statusVariant: (s: string) => string;
  statusLabel: (s: string) => string;
  onNewPlan: () => void;
  onEdit?: () => void;
  onDeleteOpen: () => void;
}

export function PlanInfoPanel({
  selectedPlan,
  formatCareerName,
  formatInstituteNameFromCareer,
  statusVariant,
  statusLabel,
  onNewPlan,
  onEdit,
  onDeleteOpen,
}: Props) {
  return (
    <Card
      header={
        <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between w-full">
          <h2 className="font-title-sm text-title-sm text-on-surface">Información del plan</h2>
          {selectedPlan && (
            <div className="flex items-center gap-2">
              <Button variant="primary" onClick={onEdit}>
                <span className="material-symbols-outlined">edit</span>
              </Button>
              <Button variant="danger" onClick={onDeleteOpen}>
                <span className="material-symbols-outlined">delete</span>
              </Button>
            </div>
          )}
        </div>
      }
    >
      {!selectedPlan ? (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
              <span className="material-symbols-outlined text-primary text-4xl">event_busy</span>
            </div>
            <h3 className="font-headline-md text-primary mb-2">Nuevo plan de estudio</h3>
            <p className="text-slate-500 mb-8 max-w-md mx-auto">
              Comienza creando un nuevo plan de estudio con información de su foja académica.
            </p>
            <Button variant="primary" onClick={onNewPlan}>
              <span className="material-symbols-outlined">add</span>
              Crear plan de estudio
            </Button>
          </div>
        </div>
      ) : (
        <PlanInfoCard
          name={selectedPlan.name}
          status={selectedPlan.status}
          careerName={formatCareerName(selectedPlan.careerId)}
          instituteName={formatInstituteNameFromCareer(selectedPlan.careerId)}
          duration={selectedPlan.duration}
          minTotalCredits={selectedPlan.minTotalCredits}
          statusVariant={statusVariant}
          statusLabel={statusLabel}
        />
      )}
    </Card>
  );
}
