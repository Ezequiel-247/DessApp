import { useState, useCallback, useEffect } from "react";
import {
  fetchElectiveBlocks,
  fetchElectiveChoices,
  createElectiveChoice,
  deleteElectiveChoice,
} from "../services/electiveChoiceService";
import type { ElectiveBlock, ElectiveChoice } from "../services/electiveChoiceService";

export function useElectiveChoices(studyPlanId: number | null, planId: number | null) {
  const [blocks, setBlocks] = useState<ElectiveBlock[]>([]);
  const [choices, setChoices] = useState<ElectiveChoice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [blocksResult, choicesResult] = await Promise.all([
        studyPlanId != null ? fetchElectiveBlocks(studyPlanId) : Promise.resolve([]),
        planId != null ? fetchElectiveChoices(planId) : Promise.resolve([]),
      ]);
      setBlocks(blocksResult);
      setChoices(choicesResult);
    } catch (err: any) {
      setError(err.message || "Error al cargar las electivas");
    } finally {
      setIsLoading(false);
    }
  }, [studyPlanId, planId]);

  // Se carga automáticamente (no solo cuando se abre el modal): generatePlan()
  // necesita el pool de electivas YA disponible para poder excluir del plan las que
  // todavía no se eligieron, incluso antes de que el estudiante abra el modal.
  useEffect(() => {
    refresh();
  }, [refresh]);

  const addChoice = useCallback(
    async (electiveBlockId: number, planSubjectId: number): Promise<boolean> => {
      if (planId == null) return false;
      setIsSaving(true);
      setError(null);
      try {
        await createElectiveChoice(planId, electiveBlockId, planSubjectId);
        await refresh();
        return true;
      } catch (err: any) {
        setError(err.message || "Error al elegir la electiva");
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [planId, refresh]
  );

  const removeChoice = useCallback(
    async (planSubjectId: number): Promise<boolean> => {
      if (planId == null) return false;
      setIsSaving(true);
      setError(null);
      try {
        await deleteElectiveChoice(planId, planSubjectId);
        await refresh();
        return true;
      } catch (err: any) {
        setError(err.message || "Error al quitar la electiva");
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [planId, refresh]
  );

  return { blocks, choices, isLoading, isSaving, error, refresh, addChoice, removeChoice };
}
