import { useCallback, useEffect, useMemo, useState } from "react";
import { SectionCard } from "@/widgets/ui/SectionCard";
import { EmptyState } from "@/widgets/ui/EmptyState";
import { fetchCareers, getStudySessionsUsage } from "@/shared/api/adminReportApi";
import type {
  CareerOption,
  StudySessionsUsageCareer,
  StudySessionsUsageData,
  StudySessionsUsageSubject,
} from "@/shared/api/adminReportApi";

function KpiCard({ icon, label, value, color, sub }: { icon: string; label: string; value: string; color: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center shrink-0`}>
        <span className="material-symbols-outlined text-white text-[24px]">{icon}</span>
      </div>
      <div>
        <p className="text-2xl font-black text-on-surface tabular-nums">{value}</p>
        <p className="text-body-sm text-on-surface-variant">{label}</p>
        {sub && <p className="text-body-xs text-on-surface-variant/80">{sub}</p>}
      </div>
    </div>
  );
}

function MonthlyTrendChart({ data }: { data: StudySessionsUsageData["monthly_trend"] }) {
  const max = Math.max(...data.map((d) => Math.max(d.sessions, d.registrations)), 1);
  return (
    <div className="space-y-3">
      <p className="font-title-sm text-title-sm text-on-surface font-semibold">Tendencia mensual</p>
      <div className="space-y-2">
        {data.map((item) => (
          <div key={item.month} className="grid grid-cols-[80px_1fr_42px_42px] items-center gap-2">
            <span className="text-body-xs text-on-surface-variant truncate">{item.month}</span>
            <div className="h-5 rounded-full bg-surface-variant overflow-hidden flex">
              <div
                className="h-full bg-primary"
                style={{ width: `${(item.sessions / max) * 100}%` }}
                title={`Sesiones: ${item.sessions}`}
              />
              <div
                className="h-full bg-tertiary/70"
                style={{ width: `${(item.registrations / max) * 100}%` }}
                title={`Inscripciones: ${item.registrations}`}
              />
            </div>
            <span className="text-right text-body-xs text-on-surface tabular-nums">{item.sessions}</span>
            <span className="text-right text-body-xs text-on-surface-variant tabular-nums">{item.registrations}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-4 text-body-xs text-on-surface-variant">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-primary" /> Sesiones</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-tertiary/70" /> Inscripciones</span>
      </div>
    </div>
  );
}

function SubjectRow({ subject }: { subject: StudySessionsUsageSubject }) {
  return (
    <tr className="border-b border-outline-variant/30 hover:bg-surface-container/30">
      <td className="py-2 px-3">{subject.subject_name}</td>
      <td className="py-2 px-3 text-right tabular-nums">{subject.total_sessions}</td>
      <td className="py-2 px-3 text-right tabular-nums">{subject.participation.total_registrations}</td>
      <td className="py-2 px-3 text-right tabular-nums text-success">{subject.participation.approved}</td>
      <td className="py-2 px-3 text-right tabular-nums text-warning">{subject.participation.pending}</td>
      <td className="py-2 px-3 text-right tabular-nums text-error">{subject.participation.rejected}</td>
      <td className="py-2 px-3 text-right tabular-nums text-on-surface-variant">{subject.participation.occupancy_pct}%</td>
    </tr>
  );
}

export function StudySessionsUsageSection() {
  const [careers, setCareers] = useState<CareerOption[]>([]);
  const [data, setData] = useState<StudySessionsUsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [careerId, setCareerId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sessionType, setSessionType] = useState("");
  const [expandedCareerId, setExpandedCareerId] = useState<number | null>(null);

  useEffect(() => {
    fetchCareers().then((res) => setCareers(res)).catch(() => {});
  }, []);

  const fetchData = useCallback(async (cid: string, sd: string, ed: string, type: string) => {
    setLoading(true);
    setError(null);
    setExpandedCareerId(null);
    try {
      const result = await getStudySessionsUsage({
        career_id: cid ? Number(cid) : undefined,
        start_date: sd || undefined,
        end_date: ed || undefined,
        type: type || undefined,
      });
      setData(result);
    } catch (err: any) {
      setError(err.message || "Error al cargar reporte de sesiones");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(careerId, startDate, endDate, sessionType);
  }, [careerId, startDate, endDate, sessionType, fetchData]);

  const handleClearFilters = () => {
    setCareerId("");
    setStartDate("");
    setEndDate("");
    setSessionType("");
  };

  const rows = useMemo<StudySessionsUsageCareer[]>(() => data?.by_career ?? [], [data]);

  if (loading) {
    return (
      <SectionCard title="Utilización de sesiones" icon="groups" bodyClassName="p-gutter">
        <div className="flex items-center justify-center py-12 text-on-surface-variant">
          <span className="material-symbols-outlined animate-spin mr-2">refresh</span> Cargando...
        </div>
      </SectionCard>
    );
  }

  if (error) {
    return (
      <SectionCard title="Utilización de sesiones" icon="groups" bodyClassName="p-gutter">
        <div className="flex flex-col items-center justify-center py-8 gap-3">
          <span className="material-symbols-outlined text-[40px] text-error">error_outline</span>
          <p className="text-body-md text-on-surface-variant text-center">{error}</p>
          <button
            onClick={() => fetchData(careerId, startDate, endDate, sessionType)}
            className="bg-primary text-on-primary px-4 py-2 rounded-lg text-body-sm font-semibold flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span> Reintentar
          </button>
        </div>
      </SectionCard>
    );
  }

  const totals = data?.totals;

  return (
    <div className="space-y-gutter">
      <SectionCard title="Utilización de sesiones de estudio" icon="groups" bodyClassName="p-gutter space-y-4">
        <div className="flex flex-wrap items-end gap-4 pb-2 border-b border-outline-variant">
          <div className="flex flex-col gap-1">
            <label className="text-body-xs text-on-surface-variant font-semibold">Carrera</label>
            <select
              value={careerId}
              onChange={(e) => setCareerId(e.target.value)}
              className="text-body-sm bg-surface-container border border-outline-variant rounded-lg py-1.5 px-3 focus:border-primary focus:ring-1 focus:ring-primary outline-none min-w-[220px]"
            >
              <option value="">Todas las carreras</option>
              {careers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-body-xs text-on-surface-variant font-semibold">Desde</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="text-body-sm bg-surface-container border border-outline-variant rounded-lg py-1.5 px-3 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-body-xs text-on-surface-variant font-semibold">Hasta</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="text-body-sm bg-surface-container border border-outline-variant rounded-lg py-1.5 px-3 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-body-xs text-on-surface-variant font-semibold">Tipo</label>
            <select
              value={sessionType}
              onChange={(e) => setSessionType(e.target.value)}
              className="text-body-sm bg-surface-container border border-outline-variant rounded-lg py-1.5 px-3 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            >
              <option value="">Todos</option>
              <option value="virtual">Virtual</option>
              <option value="presencial">Presencial</option>
            </select>
          </div>

          {(careerId || startDate || endDate || sessionType) && (
            <button onClick={handleClearFilters} className="text-body-xs text-primary hover:underline mb-1">Limpiar filtros</button>
          )}
        </div>

        {totals && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard icon="calendar_month" label="Sesiones" value={totals.total_sessions.toLocaleString()} color="bg-primary" />
            <KpiCard icon="group" label="Inscripciones" value={totals.participation.total_registrations.toLocaleString()} color="bg-tertiary" />
            <KpiCard icon="check_circle" label="Aprobadas" value={totals.participation.approved.toLocaleString()} color="bg-success" />
            <KpiCard icon="donut_large" label="Ocupación Promedio" value={`${totals.participation.avg_occupancy}%`} color="bg-secondary" />
          </div>
        )}

        {data && data.monthly_trend.length > 0 ? (
          <MonthlyTrendChart data={data.monthly_trend} />
        ) : (
          <EmptyState>
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined">bar_chart</span>
              No hay tendencia mensual para el período seleccionado
            </span>
          </EmptyState>
        )}
      </SectionCard>

      {rows.length === 0 ? (
        <SectionCard bodyClassName="p-gutter">
          <EmptyState>
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined">groups</span>
              No hay sesiones de estudio para los filtros seleccionados
            </span>
          </EmptyState>
        </SectionCard>
      ) : (
        rows.map((career) => {
          const isExpanded = expandedCareerId === career.career_id;
          return (
            <SectionCard
              key={career.career_id}
              bodyClassName="p-0"
              header={
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-on-surface-variant">school</span>
                    <h3 className="text-title-sm font-semibold text-on-surface">{career.career_name}</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setExpandedCareerId(isExpanded ? null : career.career_id)}
                    className="px-3 py-1.5 text-body-xs rounded-full border border-outline-variant hover:bg-surface-container text-on-surface-variant transition-colors"
                  >
                    {isExpanded ? "Ocultar materias" : "Ver materias"}
                  </button>
                </div>
              }
            >
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-surface-container/30 border-b border-outline-variant/50">
                <div><span className="text-body-xs text-on-surface-variant">Sesiones</span><p className="font-bold text-on-surface tabular-nums">{career.total_sessions}</p></div>
                <div><span className="text-body-xs text-on-surface-variant">Inscripciones</span><p className="font-bold text-on-surface tabular-nums">{career.participation.total_registrations}</p></div>
                <div><span className="text-body-xs text-on-surface-variant">Aprobadas</span><p className="font-bold text-success tabular-nums">{career.participation.approved}</p></div>
                <div><span className="text-body-xs text-on-surface-variant">Ocupación</span><p className="font-bold text-on-surface tabular-nums">{career.participation.occupancy_pct}%</p></div>
              </div>

              {isExpanded && (
                <div className="overflow-x-auto">
                  {career.subjects.length === 0 ? (
                    <div className="p-4 text-body-sm text-on-surface-variant">Sin materias asociadas a sesiones en esta carrera.</div>
                  ) : (
                    <table className="w-full text-body-sm">
                      <thead>
                        <tr className="border-b border-outline-variant text-on-surface-variant bg-surface-container/50">
                          <th className="text-left py-2 px-3 font-semibold">Materia</th>
                          <th className="text-right py-2 px-3 font-semibold">Sesiones</th>
                          <th className="text-right py-2 px-3 font-semibold">Inscripciones</th>
                          <th className="text-right py-2 px-3 font-semibold text-success">Aprobadas</th>
                          <th className="text-right py-2 px-3 font-semibold text-warning">Pendientes</th>
                          <th className="text-right py-2 px-3 font-semibold text-error">Rechazadas</th>
                          <th className="text-right py-2 px-3 font-semibold">Ocupación</th>
                        </tr>
                      </thead>
                      <tbody>
                        {career.subjects.map((subject) => (
                          <SubjectRow key={`${career.career_id}-${subject.subject_id}`} subject={subject} />
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </SectionCard>
          );
        })
      )}
    </div>
  );
}
