import { useCallback, useEffect, useState } from "react";
import { SectionCard } from "@/widgets/ui/SectionCard";
import { EmptyState } from "@/widgets/ui/EmptyState";
import { getActiveUsers } from "@/shared/api/adminReportApi";
import type { ActiveUsersData } from "@/shared/api/adminReportApi";

function SummaryCard({ icon, label, value, color }: { icon: string; label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4 shadow-sm flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center`}>
        <span className="material-symbols-outlined text-white text-[24px]">{icon}</span>
      </div>
      <div>
        <p className="text-2xl font-black text-on-surface">{value}</p>
        <p className="text-body-sm text-on-surface-variant">{label}</p>
      </div>
    </div>
  );
}

function TrendChart({ data }: { data: ActiveUsersData["monthly_trend"] }) {
  const max = Math.max(...data.map(d => d.total), 1);
  return (
    <div className="space-y-3">
      <p className="font-title-sm text-title-sm text-on-surface font-semibold">Usuarios registrados por mes</p>
      <div className="space-y-2">
        {data.map((item) => (
          <div key={item.month} className="flex items-center gap-3">
            <span className="w-20 text-body-sm text-on-surface-variant truncate shrink-0">{item.month}</span>
            <div className="flex-1 h-6 rounded-lg bg-surface-variant overflow-hidden flex">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${(item.active / max) * 100}%` }}
                title={`Activos: ${item.active}`}
              />
              <div
                className="h-full bg-surface-border transition-all"
                style={{ width: `${(item.inactive / max) * 100}%` }}
                title={`Inactivos: ${item.inactive}`}
              />
            </div>
            <span className="w-10 text-right text-body-sm text-on-surface font-semibold tabular-nums">{item.total}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-4 text-body-xs text-on-surface-variant">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-primary" /> Activos</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-surface-border" /> Inactivos</span>
      </div>
    </div>
  );
}

export function ActiveUsersSection() {
  const [data, setData] = useState<ActiveUsersData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  const fetchData = useCallback(async (sd: string, ed: string, role: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getActiveUsers({
        start_date: sd || undefined,
        end_date: ed || undefined,
        role: role || undefined,
      });
      setData(result);
    } catch (err: any) {
      setError(err.message || "Error al cargar datos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(startDate, endDate, roleFilter);
  }, [startDate, endDate, roleFilter, fetchData]);

  const handleClear = () => {
    setStartDate("");
    setEndDate("");
    setRoleFilter("");
  };

  if (loading) {
    return (
      <SectionCard title="Usuarios del sistema" icon="people" bodyClassName="p-gutter">
        <div className="flex items-center justify-center py-12 text-on-surface-variant">
          <span className="material-symbols-outlined animate-spin mr-2">refresh</span> Cargando...
        </div>
      </SectionCard>
    );
  }

  if (error) {
    return (
      <SectionCard title="Usuarios del sistema" icon="people" bodyClassName="p-gutter">
        <div className="flex flex-col items-center justify-center py-8 gap-3">
          <span className="material-symbols-outlined text-[40px] text-error">error_outline</span>
          <p className="text-body-md text-on-surface-variant text-center">{error}</p>
          <button onClick={() => fetchData(startDate, endDate, roleFilter)}
            className="bg-primary text-on-primary px-4 py-2 rounded-lg text-body-sm font-semibold flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span> Reintentar
          </button>
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Usuarios del sistema" icon="people" bodyClassName="p-gutter">
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 pb-2 border-b border-outline-variant">
          <span className="text-body-sm text-on-surface-variant">Período:</span>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
            className="text-body-sm bg-surface-container border border-outline-variant rounded-lg py-1.5 px-3 focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
          <span className="text-on-surface-variant">a</span>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
            className="text-body-sm bg-surface-container border border-outline-variant rounded-lg py-1.5 px-3 focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
          <span className="text-body-sm text-on-surface-variant ml-2">Rol:</span>
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
            className="text-body-sm bg-surface-container border border-outline-variant rounded-lg py-1.5 px-3 focus:border-primary focus:ring-1 focus:ring-primary outline-none">
            <option value="">Todos</option>
            <option value="student">Estudiantes</option>
            <option value="admin">Administradores</option>
          </select>
          {(startDate || endDate || roleFilter) && (
            <button onClick={handleClear} className="text-body-xs text-primary hover:underline">Limpiar</button>
          )}
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SummaryCard icon="check_circle" label="Usuarios activos" value={data?.active ?? 0} color="bg-primary" />
          <SummaryCard icon="cancel" label="Usuarios inactivos" value={data?.inactive ?? 0} color="bg-surface-border" />
          <SummaryCard icon="people" label="Total" value={data?.total ?? 0} color="bg-tertiary" />
        </div>

        {/* Monthly trend */}
        {data && data.monthly_trend.length > 0 ? (
          <TrendChart data={data.monthly_trend} />
        ) : (
          <div className="py-4">
            <EmptyState><span className="flex items-center gap-2"><span className="material-symbols-outlined">bar_chart</span> No hay datos de usuarios para el período seleccionado</span></EmptyState>
          </div>
        )}
      </div>
    </SectionCard>
  );
}
