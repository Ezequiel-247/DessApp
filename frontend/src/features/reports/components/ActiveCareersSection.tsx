import { useCallback, useEffect, useMemo, useState } from "react";
import { SectionCard } from "@/widgets/ui/SectionCard";
import { EmptyState } from "@/widgets/ui/EmptyState";
import { getMostActiveCareers } from "@/shared/api/adminReportApi";
import type { ActiveCareer } from "@/shared/api/adminReportApi";

const METRICS = [
  { key: "total_materials", label: "Materiales", color: "bg-primary" },
  { key: "total_sessions", label: "Sesiones", color: "bg-tertiary" },
  { key: "total_registrations", label: "Participaciones", color: "bg-secondary" },
  { key: "total_connections", label: "Conexiones", color: "bg-error" },
] as const;

const MONTH_COLORS = ["#2563eb", "#7c3aed", "#059669", "#dc2626"];

function MiniSparkBar({ data, color }: { data: { month: string; value: number }[]; color: string }) {
  const max = Math.max(...data.map(d => d.value), 1);
  const w = 100 / data.length;
  return (
    <div className="flex items-end h-8 gap-px">
      {data.map(d => (
        <div
          key={d.month}
          className="rounded-t transition-all hover:opacity-80"
          style={{ width: `${w}%`, height: `${(d.value / max) * 100}%`, backgroundColor: color, minHeight: d.value > 0 ? '2px' : '0' }}
          title={`${d.month}: ${d.value}`}
        />
      ))}
    </div>
  );
}

export function ActiveCareersSection() {
  const [careers, setCareers] = useState<ActiveCareer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const maxStudents = useMemo(() => Math.max(...careers.map(c => c.total_students), 1), [careers]);

  const fetchData = useCallback(async (sd: string, ed: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getMostActiveCareers({
        start_date: sd || undefined,
        end_date: ed || undefined,
      });
      setCareers(result);
    } catch (err: any) {
      setError(err.message || "Error al cargar datos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(startDate, endDate);
  }, [startDate, endDate, fetchData]);

  const handleClearDates = () => {
    setStartDate("");
    setEndDate("");
  };

  if (loading) {
    return (
      <SectionCard title="Carreras con comunidad más activa" icon="school" bodyClassName="p-gutter">
        <div className="flex items-center justify-center py-12 text-on-surface-variant">
          <span className="material-symbols-outlined animate-spin mr-2">refresh</span> Cargando...
        </div>
      </SectionCard>
    );
  }

  if (error) {
    return (
      <SectionCard title="Carreras con comunidad más activa" icon="school" bodyClassName="p-gutter">
        <div className="rounded-lg bg-error-container/30 border border-error/50 p-4 text-error flex gap-3 items-center">
          <span className="material-symbols-outlined text-2xl">error</span>
          <p className="text-body-sm">{error}</p>
        </div>
      </SectionCard>
    );
  }

  if (careers.length === 0) {
    return (
      <SectionCard title="Carreras con comunidad más activa" icon="school" bodyClassName="p-gutter">
        <EmptyState>No hay datos suficientes para calcular actividad por carrera.</EmptyState>
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Carreras con comunidad más activa" icon="school" bodyClassName="p-gutter">
      <div className="space-y-4">
        {/* Date range filter */}
        <div className="flex flex-wrap items-center gap-3 pb-2 border-b border-outline-variant">
          <span className="text-body-sm text-on-surface-variant">Período:</span>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="text-body-sm bg-surface-container border border-outline-variant rounded-lg py-1.5 px-3 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
          />
          <span className="text-on-surface-variant">a</span>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="text-body-sm bg-surface-container border border-outline-variant rounded-lg py-1.5 px-3 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
          />
          {(startDate || endDate) && (
            <button onClick={handleClearDates} className="text-body-xs text-primary hover:underline">
              Limpiar
            </button>
          )}
        </div>

        {/* Career ranking */}
        {careers.map((c, i) => {
          const isExpanded = expandedId === c.id;
          const bb = c.monthly_breakdown || [];

          return (
            <div key={c.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-6 h-6 rounded-full bg-primary text-on-primary text-body-xs font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="font-title-sm text-title-sm text-on-surface font-semibold truncate">{c.career_name}</p>
                    <p className="text-body-xs text-on-surface-variant">
                      {c.total_students} estudiante{c.total_students !== 1 ? "s" : ""} · Score {c.score}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="hidden sm:block w-24 h-2 rounded-full bg-surface-variant overflow-hidden">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${c.score_pct}%` }} />
                  </div>
                  {bb.length > 0 && (
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : c.id)}
                      className="p-1 hover:bg-surface-container rounded-full text-on-surface-variant transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">{isExpanded ? "expand_less" : "expand_more"}</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pl-9">
                {METRICS.map((m) => {
                  const val = c[m.key as keyof ActiveCareer] as number;
                  const pct = maxStudents > 0 ? (val / c.total_students) : 0;
                  return (
                    <div key={m.key} className="rounded-lg border border-outline-variant bg-surface-container-lowest p-2.5">
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className={`w-2 h-2 rounded-full ${m.color}`} />
                        <span className="text-body-xs text-on-surface-variant">{m.label}</span>
                      </div>
                      <p className="font-title-sm text-title-sm text-on-surface font-bold tabular-nums">{val}</p>
                      <p className="text-body-xs text-on-surface-variant">{pct.toFixed(1)}/est</p>
                    </div>
                  );
                })}
              </div>

              {/* Monthly breakdown chart */}
              {isExpanded && bb.length > 0 && (
                <div className="pl-9 pt-2">
                  <SectionCard bodyClassName="p-4">
                    <p className="font-title-sm text-title-sm text-on-surface font-semibold mb-3">Evolución mensual</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {METRICS.map((m, mi) => {
                        const chartData = bb.map(b => ({ month: b.month, value: b[m.key as keyof typeof bb[0]] as number }));
                        return (
                          <div key={m.key}>
                            <div className="flex items-center gap-1.5 mb-2">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: MONTH_COLORS[mi] }} />
                              <span className="text-body-xs text-on-surface-variant">{m.label}</span>
                            </div>
                            <MiniSparkBar data={chartData} color={MONTH_COLORS[mi]} />
                            <div className="flex justify-between text-body-xs text-on-surface-variant mt-1">
                              <span>{bb[0]?.month}</span>
                              <span>{bb[bb.length - 1]?.month}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </SectionCard>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}
