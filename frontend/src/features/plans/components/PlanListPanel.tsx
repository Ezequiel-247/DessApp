import { Card } from "@/widgets/ui/Card";
import { EmptyState } from "@/widgets/ui/EmptyState";
import { PlanListItem } from "./PlanListItem";
import type { PlanItem } from "../hooks/usePlansData";

interface Props {
  filteredPlans: PlanItem[];
  selectedPlanId: string | null;
  onSelectPlan: (id: string) => void;
  formatCareerName: (id: string) => string;
  formatInstituteNameFromCareer: (id: string) => string;
  statusVariant: (s: string) => string;
  statusLabel: (s: string) => string;
  hideHeader?: boolean;
}

export function PlanListPanel({
  filteredPlans,
  selectedPlanId,
  onSelectPlan,
  formatCareerName,
  formatInstituteNameFromCareer,
  statusVariant,
  statusLabel,
  hideHeader,
}: Props) {
  return (
    <Card
      className={`xl:col-span-5 flex flex-col h-full ${hideHeader ? '!rounded-none !border-t-0' : ''}`}
      header={hideHeader ? null : <h2 className="font-title-sm text-title-sm text-on-surface">Listado de planes</h2>}
      bodyClassName="flex-1 overflow-y-auto space-y-3"
    >
      {filteredPlans.length === 0 ? (
        <EmptyState>Sin resultados</EmptyState>
      ) : (
        filteredPlans.map((plan) => (
          <PlanListItem
            key={plan.id}
            plan={plan}
            isActive={plan.id === selectedPlanId}
            onSelect={onSelectPlan}
            formatCareerName={formatCareerName}
            formatInstituteNameFromCareer={formatInstituteNameFromCareer}
            statusVariant={statusVariant}
            statusLabel={statusLabel}
          />
        ))
      )}
    </Card>
  );
}
