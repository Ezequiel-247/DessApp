import { Modal } from "@/widgets/ui/Modal";
import { Badge } from "@/widgets/ui/Badge";
import type { DeviationData } from "../model/deviation";

interface Props {
  data: DeviationData | null;
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
}

const deviationConfig: Record<string, { label: string; variant: "success" | "info" | "error" | "default" }> = {
  on_time: { label: "A tiempo", variant: "success" },
  ahead: { label: "Adelantada", variant: "info" },
  delayed: { label: "Retrasada", variant: "error" },
  unknown: { label: "Sin datos", variant: "default" },
};

export function DeviationModal({ data, isLoading, error, onClose }: Props) {
  return (
    <Modal isOpen onClose={onClose} title={data?.plan_name ?? "Desvío y Rendimiento"} size="md">
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-pulse text-center space-y-4">
            <span className="material-symbols-outlined text-primary text-4xl animate-spin block">progress_activity</span>
            <p className="text-on-surface-variant text-sm">Calculando desvío...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-error-container/10 border border-error/30 rounded-2xl p-6 text-center">
          <span className="material-symbols-outlined text-error text-4xl mb-3">error_outline</span>
          <p className="text-error font-semibold mb-1">Error</p>
          <p className="text-on-surface-variant text-sm">{error}</p>
        </div>
      )}

      {!isLoading && !error && data && (
        <div className="space-y-6">
          <div className="grid grid-cols-4 gap-3">
            <SummaryCard label="A tiempo" value={data.summary.on_time} color="success" />
            <SummaryCard label="Adelantadas" value={data.summary.ahead} color="info" />
            <SummaryCard label="Retrasadas" value={data.summary.delayed} color="error" />
            <SummaryCard label="Promedio retraso" value={`${data.summary.average_delay_terms} cuat.`} color="neutral" />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-on-surface">Materias</p>
            {data.subjects.map((subject) => {
              const cfg = deviationConfig[subject.deviation] ?? deviationConfig.unknown;
              return (
                <div
                  key={subject.plan_subject_id}
                  className="flex items-center justify-between gap-4 p-3 rounded-xl border border-outline-variant/30"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-on-surface truncate">{subject.subject_name}</p>
                    <p className="text-xs text-on-surface-variant">
                      Planeado: {subject.planned_year} · C{subject.planned_term}
                      {" → "}
                      Real: {subject.actual_year} · C{subject.actual_term}
                      {subject.grade && ` · Nota: ${subject.grade}`}
                    </p>
                  </div>
                  <Badge variant={cfg.variant}>{cfg.label}</Badge>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Modal>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: number | string; color: string }) {
  const colorMap: Record<string, string> = {
    success: "bg-success-container/10 border-success/30 text-success",
    info: "bg-info-container/10 border-info/30 text-info",
    error: "bg-error-container/10 border-error/30 text-error",
    neutral: "bg-surface-container-low border-outline-variant/40 text-on-surface-variant",
  };

  return (
    <div className={`rounded-xl border p-3 text-center ${colorMap[color] ?? colorMap.neutral}`}>
      <p className="text-display-sm font-display-sm">{value}</p>
      <p className="text-xs mt-1">{label}</p>
    </div>
  );
}
