import { StatusBadge } from "@/widgets/ui/StatusBadge";

interface Props {
  name: string;
  status: string;
  careerName: string;
  instituteName: string;
  duration: number;
  minTotalCredits: number | null;
  statusVariant: (s: string) => string;
  statusLabel: (s: string) => string;
  hideBadge?: boolean;
}

export function PlanInfoCard({
  name,
  status,
  careerName,
  instituteName,
  duration,
  minTotalCredits,
  statusVariant,
  statusLabel,
  hideBadge = false,
}: Props) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-title-sm text-title-sm text-on-surface">{name || "Sin nombre"}</h3>
        {!hideBadge && (
          <StatusBadge
            variant={statusVariant(status)}
            label={statusLabel(status)}
          />
        )}
      </div>
      <div className="flex items-center gap-2 text-body-sm text-on-surface-variant pt-1">
        <span className="material-symbols-outlined text-[16px] text-outline">school</span>
        <span>{careerName || "Sin carrera"}</span>
      </div>
      <div className="flex items-center gap-2 text-body-sm text-on-surface-variant">
        <span className="material-symbols-outlined text-[16px] text-outline">apartment</span>
        <span>{instituteName || "Sin instituto"}</span>
      </div>
      <div className="flex items-center text-body-sm text-on-surface-variant">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px] text-outline">schedule</span>
          <span>{duration} años</span>
        </div>
        <span className="mx-2">•</span>
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px] text-outline">workspace_premium</span>
          <span>{minTotalCredits && minTotalCredits > 0 ? `${minTotalCredits} créditos mínimos` : "Sin créditos"}</span>
        </div>
      </div>
    </div>
  );
}
