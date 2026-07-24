import { StatusBadge } from "@/widgets/ui/StatusBadge";

const STATUS_VARIANTS: Record<string, string> = {
  vigente: "positive",
  en_transicion: "warning",
  discontinuado: "neutral",
};

const STATUS_LABELS: Record<string, string> = {
  vigente: "Vigente",
  en_transicion: "En transición",
  discontinuado: "Discontinuado",
};

function statusLabel(s: string) {
  return STATUS_LABELS[s] ?? s;
}

function statusVariant(s: string) {
  return STATUS_VARIANTS[s] ?? "neutral";
}

interface PlanInfo {
  name: string;
  status: string;
  careerName?: string;
  instituteName?: string;
  duration: number;
  minTotalCredits: number | null;
}

interface Props {
  plan: PlanInfo;
}

export function PlanInfoCard({ plan }: Props) {
  const displayName = plan.name || "Nuevo plan";
  const displayCareer = plan.careerName || "Sin carrera";
  const displayInstitute = plan.instituteName || "Sin instituto";
  const displayDuration = plan.duration ? `${plan.duration} años` : "Sin duración";
  const displayCredits = plan.minTotalCredits != null
    ? `${plan.minTotalCredits} créditos mínimos`
    : "Sin créditos";

  return (
    <div className="flex flex-col gap-1.5 p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-title-sm text-title-sm text-on-surface">{displayName}</h3>
        <StatusBadge
          variant={statusVariant(plan.status)}
          label={statusLabel(plan.status)}
        />
      </div>
      <div className="flex items-center gap-2 text-body-sm text-on-surface-variant pt-1">
        <span className="material-symbols-outlined text-[16px] text-outline">school</span>
        <span>{displayCareer}</span>
      </div>
      <div className="flex items-center gap-2 text-body-sm text-on-surface-variant">
        <span className="material-symbols-outlined text-[16px] text-outline">apartment</span>
        <span>{displayInstitute}</span>
      </div>
      <div className="flex items-center gap-6 text-body-sm text-on-surface-variant">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px] text-outline">schedule</span>
          <span>{displayDuration}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px] text-outline">workspace_premium</span>
          <span>{displayCredits}</span>
        </div>
      </div>
    </div>
  );
}
