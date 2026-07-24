import { useMemo } from "react";
import { Card } from "@/widgets/ui/Card";
import type { MaterialsBySubjectRow, TopRatedMaterial, DashboardSummary } from "@/shared/api/adminReportApi";

function SummaryCard({ icon, label, value, color }: { icon: string; label: string; value: number; color: string }) {
  return (
    <Card bodyClassName="flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center shrink-0`}>
        <span className="material-symbols-outlined text-white text-[24px]">{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-2xl font-black text-on-surface">{value}</p>
        <p className="text-body-sm text-on-surface-variant">{label}</p>
      </div>
    </Card>
  );
}

function BarChart({ title, data }: { title: string; data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-3">
      <p className="font-title-sm text-title-sm text-on-surface font-semibold">{title}</p>
      <div className="space-y-3">
        {data.map((item, idx) => (
          <div key={`${item.label}-${idx}`} className="flex items-center gap-3">
            <span className="w-32 text-body-sm text-on-surface-variant truncate shrink-0">{item.label}</span>
            <div className="flex-1 h-5 rounded-lg bg-surface-variant overflow-hidden">
              <div
                className="h-full rounded-lg bg-primary transition-all"
                style={{ width: `${(item.value / max) * 100}%` }}
              />
            </div>
            <span className="w-10 text-right text-body-sm text-on-surface font-semibold tabular-nums">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface SummarySectionProps {
  rows: MaterialsBySubjectRow[];
  topRated: TopRatedMaterial[];
  summary: DashboardSummary;
}

export function SummarySection({ rows, topRated, summary }: SummarySectionProps) {
  const topSubjects = useMemo(
    () => rows.slice(0, 10).map((r) => ({ label: r.subject_name, value: r.total })),
    [rows],
  );

  const topMaterials = useMemo(
    () => topRated.slice(0, 10).map((r) => ({ label: r.title, value: r.total_upvotes })),
    [topRated],
  );

  return (
    <div className="space-y-gutter">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SummaryCard icon="people" label="Usuarios activos" value={summary.active_users} color="bg-primary" />
        <SummaryCard icon="menu_book" label="Materiales compartidos" value={summary.total_materials} color="bg-tertiary" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
        <Card>
          <BarChart title="Materias con más materiales compartidos" data={topSubjects} />
        </Card>
        <Card>
          <BarChart title="Materiales más valorados" data={topMaterials} />
        </Card>
      </div>
    </div>
  );
}
