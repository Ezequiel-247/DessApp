import { useCallback, useEffect, useState } from "react";
import { SectionCard } from "@/widgets/ui/SectionCard";
import { EmptyState } from "@/widgets/ui/EmptyState";
import { fetchCareers, getSubjectsByCareer } from "@/shared/api/adminReportApi";
import type { CareerWithSubjects, CareerOption } from "@/shared/api/adminReportApi";

function KpiCard({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center shrink-0`}>
        <span className="material-symbols-outlined text-white text-[24px]">{icon}</span>
      </div>
      <div>
        <p className="text-2xl font-black text-on-surface tabular-nums">{value}</p>
        <p className="text-body-sm text-on-surface-variant">{label}</p>
      </div>
    </div>
  );
}

function SubjectRow({ s }: { s: CareerWithSubjects["subjects"][0] }) {
  const total = s.total_records || 1;
  const approvedPct = ((s.approved / total) * 100).toFixed(0);
  return (
    <tr className="border-b border-outline-variant/30 hover:bg-surface-container/30">
      <td className="py-2 px-3">{s.subject_name}</td>
      <td className="py-2 px-3 text-right tabular-nums">{s.total_records}</td>
      <td className="py-2 px-3 text-right tabular-nums text-success">{s.approved}</td>
      <td className="py-2 px-3 text-right tabular-nums text-error">{s.desaprobado}</td>
      <td className="py-2 px-3 text-right tabular-nums text-warning">{s.pendiente}</td>
      <td className="py-2 px-3 text-right tabular-nums text-on-surface-variant">{s.enrolled}</td>
      <td className="py-2 px-3">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 rounded-full bg-surface-variant overflow-hidden">
            <div className="h-full rounded-full bg-success" style={{ width: `${approvedPct}%` }} />
          </div>
          <span className="text-body-xs text-on-surface-variant w-8 text-right tabular-nums">{approvedPct}%</span>
        </div>
      </td>
    </tr>
  );
}

export function SubjectsByCareerSection() {
  const [careers, setCareers] = useState<CareerOption[]>([]);
  const [data, setData] = useState<CareerWithSubjects[]>([]);
  const [totals, setTotals] = useState({ total_careers: 0, total_students: 0, total_records: 0, total_approved: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [careerId, setCareerId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    fetchCareers().then(res => setCareers(res)).catch(() => {});
  }, []);

  const fetchData = useCallback(async (cid: string, sd: string, ed: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getSubjectsByCareer({
        career_id: cid ? Number(cid) : undefined,
        start_date: sd || undefined,
        end_date: ed || undefined,
      });
      setData(res.data);
      setTotals(res.totals);
    } catch (err: any) {
      setError(err.message || "Error al cargar datos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(careerId, startDate, endDate);
  }, [careerId, startDate, endDate, fetchData]);

  const handleClearFilters = () => {
    setCareerId("");
    setStartDate("");
    setEndDate("");
  };

  if (loading) {
    return (
      <div className="space-y-gutter">
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4 shadow-sm flex items-center justify-center py-12 text-on-surface-variant">
          <span className="material-symbols-outlined animate-spin mr-2">refresh</span> Cargando...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-gutter">
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4 shadow-sm flex flex-col items-center justify-center py-8 gap-3">
          <span className="material-symbols-outlined text-[40px] text-error">error_outline</span>
          <p className="text-body-md text-on-surface-variant text-center">{error}</p>
          <button onClick={() => fetchData(careerId, startDate, endDate)}
            className="bg-primary text-on-primary px-4 py-2 rounded-lg text-body-sm font-semibold flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span> Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-gutter">
      {/* Filter bar */}
      <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-body-xs text-on-surface-variant font-semibold">Carrera</label>
            <select value={careerId} onChange={e => setCareerId(e.target.value)}
              className="text-body-sm bg-surface-container border border-outline-variant rounded-lg py-1.5 px-3 focus:border-primary focus:ring-1 focus:ring-primary outline-none min-w-[200px]"
            >
              <option value="">Todas las carreras</option>
              {careers.map(c => (
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
          {(careerId || startDate || endDate) && (
            <button onClick={handleClearFilters} className="text-body-xs text-primary hover:underline mb-1">Limpiar filtros</button>
          )}
        </div>
      </div>

      {/* KPIs */}
      {data.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <KpiCard icon="school" label="Carreras" value={String(totals.total_careers)} color="bg-primary" />
          <KpiCard icon="people" label="Estudiantes" value={String(totals.total_students)} color="bg-tertiary" />
          <KpiCard icon="menu_book" label="Cursadas" value={String(totals.total_records)} color="bg-secondary" />
          <KpiCard icon="check_circle" label="Aprobadas" value={String(totals.total_approved)} color="bg-success" />
        </div>
      )}

      {/* Career cards */}
      {data.length === 0 ? (
        <SectionCard bodyClassName="p-gutter">
          <EmptyState><span className="flex items-center gap-2"><span className="material-symbols-outlined">bar_chart</span> No hay datos disponibles</span></EmptyState>
        </SectionCard>
      ) : (
        data.map(career => (
          <SectionCard key={career.career_id} bodyClassName="p-0" title={career.career_name} icon="school">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-surface-container/30 border-b border-outline-variant/50">
              <div><span className="text-body-xs text-on-surface-variant">Estudiantes</span><p className="font-bold text-on-surface tabular-nums">{career.total_students}</p></div>
              <div><span className="text-body-xs text-on-surface-variant">Cursadas totales</span><p className="font-bold text-on-surface tabular-nums">{career.total_records}</p></div>
              <div><span className="text-body-xs text-on-surface-variant">Aprobadas</span><p className="font-bold text-success tabular-nums">{career.total_approved}</p></div>
              <div><span className="text-body-xs text-on-surface-variant">Materias distintas</span><p className="font-bold text-on-surface tabular-nums">{career.total_subjects}</p></div>
            </div>

            {career.subjects.length === 0 ? (
              <div className="p-4 text-body-sm text-on-surface-variant">Sin registros académicos para esta carrera.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-body-sm">
                  <thead>
                    <tr className="border-b border-outline-variant text-on-surface-variant bg-surface-container/50">
                      <th className="text-left py-2 px-3 font-semibold">Materia</th>
                      <th className="text-right py-2 px-3 font-semibold">Total</th>
                      <th className="text-right py-2 px-3 font-semibold text-success">Aprobadas</th>
                      <th className="text-right py-2 px-3 font-semibold text-error">Desaprobadas</th>
                      <th className="text-right py-2 px-3 font-semibold text-warning">Pendientes</th>
                      <th className="text-right py-2 px-3 font-semibold">Cursando</th>
                      <th className="py-2 px-3 font-semibold w-40">Aprobación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {career.subjects.map(s => (
                      <SubjectRow key={s.subject_id} s={s} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        ))
      )}
    </div>
  );
}
