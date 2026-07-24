import { useEffect, useState, useCallback } from "react";
import { getMaterialsBySubject, getSummary, getTopRatedMaterials, getModerationStats, type MaterialsBySubjectRow, type TopRatedMaterial, type DashboardSummary, type ModerationStats } from "@/shared/api/adminReportApi";

const EMPTY_MODERATION: ModerationStats = { total_reports: 0, by_status: { pending: 0, verified: 0, rejected: 0 }, resolution_rate: 0, by_reason: [], by_content_type: [] };

export interface ReportsData {
  rows: MaterialsBySubjectRow[];
  topRated: TopRatedMaterial[];
  summary: DashboardSummary;
  moderation: ModerationStats;
}

export function useReports() {
  const [data, setData] = useState<ReportsData>({
    rows: [],
    topRated: [],
    summary: { active_users: 0, total_materials: 0, subjects_with_materials: 0 },
    moderation: EMPTY_MODERATION,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      getMaterialsBySubject(),
      getSummary(),
      getTopRatedMaterials(),
      getModerationStats(),
    ]).then(([rowsRes, summary, topRated, moderation]) => {
      setData({ rows: rowsRes.data, topRated, summary, moderation });
    }).catch((err) => {
      setError(err?.message || "Error al cargar los datos del dashboard");
    }).finally(() => setLoading(false));
  }, []);

  useEffect(fetchData, [fetchData]);

  return { ...data, loading, error, retry: fetchData };
}
