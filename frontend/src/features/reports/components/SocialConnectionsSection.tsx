import { useCallback, useEffect, useState } from "react";
import { SectionCard } from "@/widgets/ui/SectionCard";
import { EmptyState } from "@/widgets/ui/EmptyState";
import { getSocialConnections, getStudentsByConnectionsCount } from "@/shared/api/adminReportApi";
import type { SocialConnectionsData, StudentConnectionInfo } from "@/shared/api/adminReportApi";

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

function VerticalBarChart({ data, onBarClick, activeCount }: { data: SocialConnectionsData["distribution"]; onBarClick: (count: number) => void; activeCount: number | null }) {
  const max = Math.max(...data.map(d => d.student_count), 1);
  const barMaxH = 200;
  return (
    <div className="space-y-2">
      <p className="font-title-sm text-title-sm text-on-surface font-semibold">Distribución de conexiones por alumno</p>
      <div className="flex items-end gap-3 pt-4 pb-2" style={{ minHeight: barMaxH + 50 }}>
        {data.map((item) => {
          const h = Math.max((item.student_count / max) * barMaxH, item.student_count > 0 ? 8 : 0);
          const isSelected = activeCount === item.connections_count;
          const isZero = item.connections_count === 0;
          return (
            <div key={item.connections_count} className="flex-1 flex flex-col items-center gap-1 min-w-0">
              <span className="text-body-xs text-on-surface font-semibold tabular-nums">{item.student_count}</span>
              <button
                onClick={() => onBarClick(item.connections_count)}
                className={`w-full rounded-t-md transition-all outline-none ${isSelected ? "bg-primary-container border-2 border-primary" : isZero ? "bg-error/50 hover:bg-error/60" : "bg-primary/80 hover:bg-primary"}`}
                style={{ height: `${h}px`, minHeight: h > 0 ? "4px" : "0" }}
                title={`${item.connections_count} conexiones: ${item.student_count} estudiantes (Haz clic para ver listado)`}
              />
              <span className="text-body-xs text-on-surface-variant truncate w-full text-center">
                {item.connections_count} conex.
              </span>
            </div>
          );
        })}
      </div>
      <p className="text-body-xs text-on-surface-variant/60 text-center">Cantidad de conexiones aceptadas</p>
    </div>
  );
}

function StudentList({ students, loading, count }: { students: StudentConnectionInfo[]; loading: boolean; count: number }) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 py-6 px-4 text-body-sm text-on-surface-variant justify-center">
        <span className="material-symbols-outlined animate-spin text-[20px]">refresh</span> Cargando alumnos con {count} conexiones...
      </div>
    );
  }
  if (students.length === 0) {
    return <p className="text-body-sm text-on-surface-variant py-4 text-center">No se encontraron alumnos con {count} conexiones.</p>;
  }
  return (
    <div className="overflow-x-auto border border-outline-variant/50 rounded-xl bg-surface-container-low">
      <div className="py-2.5 px-4 bg-surface-container-high border-b border-outline-variant text-body-sm font-semibold text-on-surface flex justify-between">
        <span>Alumnos con {count} {count === 1 ? "conexión" : "conexiones"} aceptadas</span>
        <span className="text-on-surface-variant font-normal tabular-nums">{students.length} estudiantes</span>
      </div>
      <table className="w-full text-body-sm">
        <thead>
          <tr className="text-on-surface-variant border-b border-outline-variant/50 bg-surface-container-lowest/50">
            <th className="text-left py-2 px-4 font-semibold">Apellido</th>
            <th className="text-left py-2 px-4 font-semibold">Nombre</th>
            <th className="text-left py-2 px-4 font-semibold">Email</th>
            <th className="text-left py-2 px-4 font-semibold">Legajo</th>
          </tr>
        </thead>
        <tbody>
          {students.map((s) => (
            <tr key={s.id} className="border-b border-outline-variant/20 hover:bg-surface-container/40 transition-colors">
              <td className="py-2 px-4 font-medium">{s.lastname}</td>
              <td className="py-2 px-4">{s.name}</td>
              <td className="py-2 px-4 text-on-surface-variant">{s.email}</td>
              <td className="py-2 px-4 text-on-surface-variant">{s.legajo ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SocialConnectionsSection() {
  const [data, setData] = useState<SocialConnectionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [expandedCount, setExpandedCount] = useState<number | null>(null);
  const [drillDownStudents, setDrillDownStudents] = useState<StudentConnectionInfo[]>([]);
  const [drillDownLoading, setDrillDownLoading] = useState(false);

  const fetchData = useCallback(async (sd: string, ed: string) => {
    setLoading(true);
    setError(null);
    setExpandedCount(null);
    setDrillDownStudents([]);
    try {
      const result = await getSocialConnections({
        start_date: sd || undefined,
        end_date: ed || undefined,
      });
      setData(result);
    } catch (err: any) {
      setError(err.message || "Error al cargar reporte social");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(startDate, endDate);
  }, [startDate, endDate, fetchData]);

  const handleClearFilters = () => {
    setStartDate("");
    setEndDate("");
  };

  const handleDrillDown = async (connectionsCount: number) => {
    if (expandedCount === connectionsCount) {
      setExpandedCount(null);
      setDrillDownStudents([]);
      return;
    }
    setExpandedCount(connectionsCount);
    setDrillDownLoading(true);
    setDrillDownStudents([]);
    try {
      const students = await getStudentsByConnectionsCount({
        connections_count: connectionsCount,
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
      <SectionCard title="Red de Conexiones Sociales" icon="diversity_3" bodyClassName="p-gutter">
        <div className="flex items-center justify-center py-12 text-on-surface-variant">
          <span className="material-symbols-outlined animate-spin mr-2">refresh</span> Cargando...
        </div>
      </SectionCard>
    );
  }

  if (error) {
    return (
      <SectionCard title="Red de Conexiones Sociales" icon="diversity_3" bodyClassName="p-gutter">
        <div className="flex flex-col items-center justify-center py-8 gap-3">
          <span className="material-symbols-outlined text-[40px] text-error">error_outline</span>
          <p className="text-body-md text-on-surface-variant text-center">{error}</p>
          <button
            onClick={() => fetchData(startDate, endDate)}
            className="bg-primary text-on-primary px-4 py-2 rounded-lg text-body-sm font-semibold flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span> Reintentar
          </button>
        </div>
      </SectionCard>
    );
  }

  const pctConnected = data && data.total_students > 0
    ? +((data.students_with_connections / data.total_students) * 100).toFixed(1)
    : 0;

  return (
    <div className="space-y-gutter">
      <SectionCard title="Reporte Social e Integración de Comunidad" icon="diversity_3" bodyClassName="p-gutter space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 pb-2 border-b border-outline-variant">
          <span className="text-body-sm text-on-surface-variant font-semibold">Período de conexiones:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="text-body-sm bg-surface-container border border-outline-variant rounded-lg py-1.5 px-3 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
          />
          <span className="text-on-surface-variant text-body-sm">a</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="text-body-sm bg-surface-container border border-outline-variant rounded-lg py-1.5 px-3 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
          />
          {(startDate || endDate) && (
            <button onClick={handleClearFilters} className="text-body-xs text-primary hover:underline font-medium">
              Limpiar
            </button>
          )}
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard
            icon="group"
            label="Total Estudiantes"
            value={String(data?.total_students ?? 0)}
            color="bg-primary"
          />
          <KpiCard
            icon="hub"
            label="Estudiantes Conectados"
            value={String(data?.students_with_connections ?? 0)}
            sub={`${pctConnected}% de la comunidad`}
            color="bg-tertiary"
          />
          <KpiCard
            icon="network_node"
            label="Promedio de Conexiones"
            value={String(data?.average_connections ?? 0)}
            sub="Conexiones por alumno"
            color="bg-secondary"
          />
          <KpiCard
            icon="military_tech"
            label="Máximo de Conexiones"
            value={String(data?.max_connections ?? 0)}
            sub="Mayor red individual"
            color="bg-success"
          />
        </div>

        {/* Connection status breakdown banner */}
        <div className="bg-surface-container-low border border-outline-variant rounded-xl p-4 flex flex-wrap gap-x-12 gap-y-2 text-body-sm text-on-surface-variant">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-success" />
            <span>Aceptadas: <strong className="text-on-surface font-semibold tabular-nums">{data?.status_breakdown.accepted ?? 0}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-warning" />
            <span>Pendientes: <strong className="text-on-surface font-semibold tabular-nums">{data?.status_breakdown.pending ?? 0}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-error" />
            <span>Rechazadas: <strong className="text-on-surface font-semibold tabular-nums">{data?.status_breakdown.rejected ?? 0}</strong></span>
          </div>
        </div>

        {/* Distribution Chart */}
        {data && data.distribution.length > 0 ? (
          <div className="pt-4 border-t border-outline-variant/30">
            <VerticalBarChart
              data={data.distribution}
              onBarClick={handleDrillDown}
              activeCount={expandedCount}
            />
          </div>
        ) : (
          <EmptyState>No hay datos de distribución disponibles.</EmptyState>
        )}
      </SectionCard>

      {/* Drill-down student list detail */}
      {expandedCount !== null && (
        <StudentList
          students={drillDownStudents}
          loading={drillDownLoading}
          count={expandedCount}
        />
      )}
    </div>
  );
}
