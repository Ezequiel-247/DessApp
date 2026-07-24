import { useCallback, useEffect, useState } from "react";
import { SectionCard } from "@/widgets/ui/SectionCard";
import { EmptyState } from "@/widgets/ui/EmptyState";
import { fetchCareers, getSubjectsApprovedByStudent, getStudentsByApprovedCount } from "@/shared/api/adminReportApi";
import type { SubjectsApprovedData, CareerOption, StudentApprovedInfo } from "@/shared/api/adminReportApi";

function KpiCard({ icon, label, value, sub, color }: { icon: string; label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center shrink-0`}>
          <span className="material-symbols-outlined text-white text-[24px]">{icon}</span>
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-black text-on-surface tabular-nums leading-tight">{value}</p>
          <p className="text-body-sm text-on-surface-variant leading-tight mt-0.5">{label}</p>
          {sub && <p className="text-body-xs text-on-surface-variant/70 mt-0.5">{sub}</p>}
        </div>
      </div>
    </div>
  );
}

function VerticalBarChart({ data }: { data: SubjectsApprovedData["distribution"] }) {
  const max = Math.max(...data.map(d => d.student_count), 1);
  const barMaxH = 200;
  return (
    <div className="space-y-2">
      <p className="font-title-sm text-title-sm text-on-surface font-semibold">Distribución de materias aprobadas</p>
      <div className="flex items-end gap-3 pt-4 pb-2" style={{ minHeight: barMaxH + 50 }}>
        {data.map((item) => {
          const h = Math.max((item.student_count / max) * barMaxH, item.student_count > 0 ? 8 : 0);
          const isZero = item.approved_count === 0;
          return (
            <div key={item.approved_count} className="flex-1 flex flex-col items-center gap-1 min-w-0">
              <span className="text-body-xs text-on-surface font-semibold tabular-nums">{item.student_count}</span>
              <div
                className={`w-full rounded-t-md transition-all ${isZero ? "bg-error/60" : "bg-primary"}`}
                style={{ height: `${h}px`, minHeight: h > 0 ? "4px" : "0" }}
                title={`${item.approved_count} materias: ${item.student_count} estudiantes`}
              />
              <span className="text-body-xs text-on-surface-variant truncate w-full text-center">
                {item.approved_count}
              </span>
            </div>
          );
        })}
      </div>
      <p className="text-body-xs text-on-surface-variant/60 text-center">Materias aprobadas</p>
    </div>
  );
}

function StudentList({ students, loading }: { students: StudentApprovedInfo[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 py-3 px-4 text-body-sm text-on-surface-variant">
        <span className="material-symbols-outlined animate-spin text-[16px]">refresh</span> Cargando alumnos...
      </div>
    );
  }
  if (students.length === 0) {
    return <p className="text-body-sm text-on-surface-variant py-2 px-4">No se encontraron alumnos.</p>;
  }
  return (
    <div className="overflow-x-auto pb-2">
      <table className="w-full text-body-sm">
        <thead>
          <tr className="text-on-surface-variant border-b border-outline-variant/50">
            <th className="text-left py-1.5 px-4 font-semibold">Apellido</th>
            <th className="text-left py-1.5 px-4 font-semibold">Nombre</th>
            <th className="text-left py-1.5 px-4 font-semibold">Email</th>
            <th className="text-left py-1.5 px-4 font-semibold">Legajo</th>
          </tr>
        </thead>
        <tbody>
          {students.map((s) => (
            <tr key={s.id} className="border-b border-outline-variant/30 hover:bg-surface-container/30">
              <td className="py-1.5 px-4">{s.lastname}</td>
              <td className="py-1.5 px-4">{s.name}</td>
              <td className="py-1.5 px-4 text-on-surface-variant">{s.email}</td>
              <td className="py-1.5 px-4 text-on-surface-variant">{s.legajo ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SubjectsApprovedByStudentSection() {
  const [data, setData] = useState<SubjectsApprovedData | null>(null);
  const [careers, setCareers] = useState<CareerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [careerId, setCareerId] = useState("");
  const [expandedCount, setExpandedCount] = useState<number | null>(null);
  const [drillDownStudents, setDrillDownStudents] = useState<StudentApprovedInfo[]>([]);
  const [drillDownLoading, setDrillDownLoading] = useState(false);
  useEffect(() => {
    fetchCareers().then(res => setCareers(res)).catch(() => {});
  }, []);

  const fetchData = useCallback(async (cid: string) => {
    setLoading(true);
    setError(null);
    setExpandedCount(null);
    setDrillDownStudents([]);
    try {
      const result = await getSubjectsApprovedByStudent({
        career_id: cid ? Number(cid) : undefined,
      });
      setData(result);
    } catch (err: any) {
      setError(err.message || "Error al cargar datos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(careerId);
  }, [careerId, fetchData]);

  const handleDrillDown = async (approvedCount: number) => {
    if (expandedCount === approvedCount) {
      setExpandedCount(null);
      setDrillDownStudents([]);
      return;
    }
    setExpandedCount(approvedCount);
    setDrillDownLoading(true);
    setDrillDownStudents([]);
    try {
      const students = await getStudentsByApprovedCount({
        approved_count: approvedCount,
        career_id: careerId ? Number(careerId) : undefined,
      });
      setDrillDownStudents(students);
    } catch {
      setDrillDownStudents([]);
    } finally {
      setDrillDownLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-gutter">
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4 shadow-sm">
          <div className="flex items-center justify-center py-12 text-on-surface-variant">
            <span className="material-symbols-outlined animate-spin mr-2">refresh</span> Cargando...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-gutter">
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4 shadow-sm">
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <span className="material-symbols-outlined text-[40px] text-error">error_outline</span>
            <p className="text-body-md text-on-surface-variant text-center">{error}</p>
            <button onClick={() => fetchData(careerId)}
              className="bg-primary text-on-primary px-4 py-2 rounded-lg text-body-sm font-semibold flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">refresh</span> Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  const hasData = data && data.distribution.length > 0;

  return (
    <div className="space-y-gutter">
      {/* 1. Filter bar */}
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
          {careerId && (
            <button onClick={() => setCareerId("")} className="text-body-xs text-primary hover:underline mb-1">Limpiar filtro</button>
          )}
        </div>
      </div>

      {/* 2. KPI cards */}
      {hasData && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KpiCard
            icon="people"
            label="Total Alumnos Analizados"
            value={data.total_students.toLocaleString()}
            color="bg-primary"
          />
          <KpiCard
            icon="trending_up"
            label="Promedio Aprobadas por Alumno"
            value={`${data.average_approved} materias`}
            color="bg-tertiary"
          />
          <KpiCard
            icon="warning"
            label="Alumnos sin Materias Aprobadas"
            value={data.students_without_approvals.toLocaleString()}
            sub={`${data.pct_without_approvals}% del total`}
            color="bg-error"
          />
        </div>
      )}

      {/* 3. Vertical bar chart */}
      {hasData ? (
        <SectionCard bodyClassName="p-gutter">
          <VerticalBarChart data={data.distribution} />
        </SectionCard>
      ) : (
        <SectionCard bodyClassName="p-gutter">
          <EmptyState><span className="flex items-center gap-2"><span className="material-symbols-outlined">bar_chart</span> No hay datos disponibles</span></EmptyState>
        </SectionCard>
      )}

      {/* 4. Detail table */}
      {hasData && (
        <SectionCard bodyClassName="p-0" title="Detalle por cantidad de materias" icon="table">
          <div className="overflow-x-auto">
            <table className="w-full text-body-sm">
              <thead>
                <tr className="border-b border-outline-variant text-on-surface-variant bg-surface-container/50">
                  <th className="text-left py-3 px-4 font-semibold">Materias aprobadas</th>
                  <th className="text-right py-3 px-4 font-semibold">Cant. Alumnos</th>
                  <th className="text-right py-3 px-4 font-semibold">Porcentaje</th>
                  <th className="text-center py-3 px-4 font-semibold w-28">Acción</th>
                </tr>
              </thead>
              <tbody>
                {data.distribution.map((item) => {
                  const isExpanded = expandedCount === item.approved_count;
                  const pct = data.total_students > 0
                    ? ((item.student_count / data.total_students) * 100).toFixed(1) + "%"
                    : "—";
                  return (
                    <tr key={item.approved_count}
                      className="border-b border-outline-variant/50 hover:bg-surface-container/30 cursor-pointer transition-colors"
                      onClick={() => handleDrillDown(item.approved_count)}
                    >
                      <td className="py-3 px-4 font-medium">
                        <span className="flex items-center gap-2">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-body-xs font-bold text-white ${item.approved_count === 0 ? "bg-error/70" : "bg-primary/80"}`}>
                            {item.approved_count}
                          </span>
                          {item.approved_count === 0
                            ? "Sin materias aprobadas"
                            : `${item.approved_count} materia${item.approved_count !== 1 ? "s" : ""}`}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums">{item.student_count.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right tabular-nums text-on-surface-variant">{pct}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 text-body-xs font-semibold transition-colors ${isExpanded ? "text-primary" : "text-on-surface-variant hover:text-primary"}`}>
                          <span className="material-symbols-outlined text-[16px]">{isExpanded ? "expand_less" : "expand_content"}</span>
                          {isExpanded ? "Cerrar" : "Ver Alumnos"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Drill-down student list */}
          {expandedCount !== null && (
            <div className="border-t border-outline-variant/50 bg-surface-container/20">
              <div className="px-2 py-2">
                <p className="text-body-xs text-on-surface-variant px-2 pb-1">
                  Alumnos con {expandedCount === 0 ? "ninguna materia aprobada" :
                    `${expandedCount} materia${expandedCount !== 1 ? "s" : ""} aprobada${expandedCount !== 1 ? "s" : ""}`}
                </p>
                <StudentList students={drillDownStudents} loading={drillDownLoading} />
              </div>
            </div>
          )}
        </SectionCard>
      )}
    </div>
  );
}
