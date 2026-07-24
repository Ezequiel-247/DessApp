import { PlanInfoCard } from "./PlanInfoCard";
import type { PlanItem } from "../hooks/usePlansData";

interface Props {
  plan: PlanItem;
  isActive: boolean;
  onSelect: (id: string) => void;
  formatCareerName: (id: string) => string;
  formatInstituteNameFromCareer: (id: string) => string;
  statusVariant: (s: string) => string;
  statusLabel: (s: string) => string;
}

export function PlanListItem({
  plan,
  isActive,
  onSelect,
  formatCareerName,
  formatInstituteNameFromCareer,
  statusVariant,
  statusLabel,
}: Props) {
  return (
    <article
      className={`rounded-xl border px-5 py-3 transition-colors ${
        isActive
          ? "border-primary-container bg-primary-container/5"
          : "border-outline-variant bg-surface-container-lowest hover:border-primary-container/40"
      }`}
    >
      <button
        type="button"
        onClick={() => onSelect(plan.id)}
        className="w-full text-left"
      >
        <PlanInfoCard
          name={plan.name}
          status={plan.status}
          careerName={formatCareerName(plan.careerId)}
          instituteName={formatInstituteNameFromCareer(plan.careerId)}
          duration={plan.duration}
          minTotalCredits={plan.minTotalCredits}
          statusVariant={statusVariant}
          statusLabel={statusLabel}
        />
      </button>
    </article>
  );
}
