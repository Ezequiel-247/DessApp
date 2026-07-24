import { useCallback, useEffect, useState } from "react";
import { SectionCard } from "@/widgets/ui/SectionCard";
import { EmptyState } from "@/widgets/ui/EmptyState";
import { fetchCareers, getSubjectsApprovedByCareer } from "@/shared/api/adminReportApi";
import type { CareerApprovedData, CareerOption } from "@/shared/api/adminReportApi";

export function SubjectsApprovedByCareerSection() {
  const [careers, setCareers] = useState<CareerOption[]>([]);
  const [selectedCareerId, setSelectedCareerId] = useState<number | undefined>(undefined);
  const [data, setData] = useState<CareerApprovedData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchCareers().then(setCareers).catch(() => {});
  }, []);

  const load = useCallback(async (careerId?: number) => {
    setIsLoading(true);
    try {
      const result = await getSubjectsApprovedByCareer({ career_id: careerId });
      setData(result);
    } catch {
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load(selectedCareerId);
  }, [load, selectedCareerId]);

  return (
    <SectionCard
      title="Materias aprobadas por carrera"
      subtitle="Cantidad de alumnos que aprobaron materias, agrupado por carrera"
      headerRight={
        <select
          value={selectedCareerId ?? ""}
          onChange={(e) => setSelectedCareerId(e.target.value ? Number(e.target.value) : undefined)}
          className="bg-surface-bright border border-outline-variant rounded px-3 py-1.5 text-sm"
        >
          <option value="">Todas las carreras</option>
          {careers.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      }
    >
      {isLoading ? (
        <p className="text-body-sm text-on-surface-variant py-4">Cargando...</p>
      ) : data.length === 0 ? (
        <EmptyState>No hay datos disponibles.</EmptyState>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-outline-variant text-left text-on-surface-variant">
                <th className="py-2 pr-4 font-medium">Carrera</th>
                <th className="py-2 pr-4 font-medium text-right">Alumnos</th>
                <th className="py-2 pr-4 font-medium text-right">Aprobaron</th>
                <th className="py-2 pr-4 font-medium text-right">% Aprobación</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.career_id} className="border-b border-outline-variant/50">
                  <td className="py-2 pr-4 text-on-surface">{row.career_name}</td>
                  <td className="py-2 pr-4 text-right text-on-surface">{row.total_students}</td>
                  <td className="py-2 pr-4 text-right text-on-surface">{row.approved_students}</td>
                  <td className="py-2 pr-4 text-right font-semibold text-on-surface">
                    {(row.pct_approved * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  );
}
