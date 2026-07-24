import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/app/AuthContext";
import { fetchAcademicSummary, fetchAcademicYearBreakdown, fetchPendingFinals } from "../services/progressService";
import type { MyProgressData } from "../model/progress";

export function useMyProgress(enrollmentId?: string) {
  const { user } = useAuth();
  const [data, setData] = useState<MyProgressData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);

    try {
      const [{ progressPercent, completedUnits, totalUnits, conditions, accumulatedCredits, totalCredits, averageWithFailures, totalAttempted, efficiencyPercentage, streakCount, average, currentAcademicYear, mandatory, unahur, elective, credit, enrollmentYear }, years, pendingFinals] = await Promise.all([
        fetchAcademicSummary(Number(user.id)),
        fetchAcademicYearBreakdown(Number(user.id), enrollmentId),
        fetchPendingFinals(Number(user.id), enrollmentId),
      ]);

      setData({
        years,
        pendingFinals,
        completedUnits,
        totalUnits,
        progressPercent,
        conditions: conditions ?? [],
        accumulatedCredits,
        totalCredits,
        averageWithFailures,
        totalAttempted,
        efficiencyPercentage,
        streakCount,
        average,
        currentAcademicYear,
        mandatory,
        unahur,
        elective,
        credit,
        enrollmentYear,
      });
    } catch (err: any) {
      console.error("MyProgress error:", err);
      setError(err.message || "Error al cargar el progreso");
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [user, enrollmentId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}
