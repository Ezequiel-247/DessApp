import { useState, useCallback } from "react";
import { fetchSabbaticals, createSabbatical, deleteSabbatical } from "../services/sabbaticalService";
import type { SabbaticalPeriod } from "../services/sabbaticalService";

export function useSabbatical(planId: number | null) {
  const [sabbaticals, setSabbaticals] = useState<SabbaticalPeriod[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (planId == null) {
      setSabbaticals([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchSabbaticals(planId);
      setSabbaticals(data);
    } catch (err: any) {
      setError(err.message || "Error al cargar los períodos sabáticos");
    } finally {
      setIsLoading(false);
    }
  }, [planId]);

  const addSabbatical = useCallback(
    async (year: number, terms: number[]): Promise<boolean> => {
      if (planId == null) return false;
      setIsSaving(true);
      setError(null);
      try {
        await createSabbatical(planId, year, terms);
        await refresh();
        return true;
      } catch (err: any) {
        setError(err.message || "Error al crear el período sabático");
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [planId, refresh]
  );

  const cancelSabbatical = useCallback(
    async (year: number, term?: number): Promise<boolean> => {
      if (planId == null) return false;
      setIsSaving(true);
      setError(null);
      try {
        await deleteSabbatical(planId, year, term);
        await refresh();
        return true;
      } catch (err: any) {
        setError(err.message || "Error al cancelar el período sabático");
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [planId, refresh]
  );

  return { sabbaticals, isLoading, isSaving, error, refresh, addSabbatical, cancelSabbatical };
}
