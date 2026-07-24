import { SectionCard } from "@/widgets/ui/SectionCard";
import { EmptyState } from "@/widgets/ui/EmptyState";
import type { ModerationStats } from "@/shared/api/adminReportApi";

function MiniStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4 text-center">
      <p className={`text-3xl font-black ${color}`}>{value}</p>
      <p className="text-body-sm text-on-surface-variant mt-1">{label}</p>
    </div>
  );
}

interface ModerationStatsSectionProps {
  stats: ModerationStats;
}

export function ModerationStatsSection({ stats }: ModerationStatsSectionProps) {
  const totalResolved = stats.by_status.verified + stats.by_status.rejected;

  return (
    <div className="space-y-gutter">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MiniStat label="Total denuncias" value={stats.total_reports} color="text-on-surface" />
        <MiniStat label="Pendientes" value={stats.by_status.pending} color="text-warning" />
        <MiniStat label="Verificadas" value={stats.by_status.verified} color="text-error" />
        <MiniStat label="Rechazadas" value={stats.by_status.rejected} color="text-success" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
        <SectionCard title="Tasa de resolución" icon="check_circle" bodyClassName="p-gutter">
          <div className="flex items-center gap-4">
            <div className="flex-1 h-4 rounded-full bg-surface-variant overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${stats.resolution_rate}%` }}
              />
            </div>
            <span className="text-body-sm font-semibold text-on-surface tabular-nums">{stats.resolution_rate}%</span>
          </div>
          <p className="text-body-xs text-on-surface-variant mt-2">
            {totalResolved} de {stats.total_reports} denuncias resueltas
          </p>
        </SectionCard>

        <SectionCard title="Denuncias por motivo" icon="list" bodyClassName="p-gutter">
          {stats.by_reason.length === 0 ? (
            <EmptyState>Sin datos de motivos.</EmptyState>
          ) : (
            <div className="space-y-2">
              {stats.by_reason.map((r) => (
                <div key={r.reason_name} className="flex items-center justify-between">
                  <span className="text-body-sm text-on-surface truncate">{r.reason_name}</span>
                  <span className="text-body-sm font-semibold text-on-surface tabular-nums ml-2">{r.count}</span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      <SectionCard title="Denuncias por tipo de contenido" icon="category" bodyClassName="p-gutter">
        {stats.by_content_type.length === 0 ? (
          <EmptyState>Sin datos de tipos de contenido.</EmptyState>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {stats.by_content_type.map((c) => (
              <div key={c.content_type} className="rounded-xl border border-outline-variant bg-surface-container-lowest p-3 flex items-center justify-between">
                <span className="text-body-sm text-on-surface capitalize">{c.content_type}</span>
                <span className="text-body-sm font-semibold text-on-surface tabular-nums">{c.count}</span>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
