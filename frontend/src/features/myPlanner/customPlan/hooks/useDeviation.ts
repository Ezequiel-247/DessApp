import { useState, useCallback } from "react";
import { fetchDeviation } from "../services/deviationService";
import type { DeviationData } from "../model/deviation";

export function useDeviation(studentId: number | string | undefined) {
  const [deviationData, setDeviationData] = useState<DeviationData | null>(null);
  const [isLoadingDeviation, setIsLoadingDeviation] = useState(false);
  const [deviationError, setDeviationError] = useState<string | null>(null);

  const loadDeviation = useCallback(async (planId: number) => {
    if (!studentId) return;
    setIsLoadingDeviation(true);
    setDeviationError(null);
    try {
      const res = await fetchDeviation(studentId, planId);
      setDeviationData(res.data);
    } catch (err: any) {
      setDeviationError(err.message || "Error al cargar desvío");
    } finally {
      setIsLoadingDeviation(false);
    }
  }, [studentId]);

  const clearDeviation = useCallback(() => {
    setDeviationData(null);
    setDeviationError(null);
  }, []);

  return { deviationData, isLoadingDeviation, deviationError, loadDeviation, clearDeviation };
}
