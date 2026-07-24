import { useState, useCallback, useEffect } from "react";
import {
  fetchUnahurBlocks,
  fetchUnahurChoices,
  createUnahurChoice,
  deleteUnahurChoice,
} from "../services/unahurChoiceService";
import type { UnahurBlock, UnahurChoice } from "../services/unahurChoiceService";

export function useUnahurChoices(studyPlanId: number | null, planId: number | null) {
  const [blocks, setBlocks] = useState<UnahurBlock[]>([]);
  const [choices, setChoices] = useState<UnahurChoice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [blocksResult, choicesResult] = await Promise.all([
        studyPlanId != null ? fetchUnahurBlocks(studyPlanId) : Promise.resolve([]),
        planId != null ? fetchUnahurChoices(planId) : Promise.resolve([]),
      ]);
      setBlocks(blocksResult);
      setChoices(choicesResult);
    } catch (err: any) {
      setError(err.message || "Error al cargar las materias UNAHUR");
    } finally {
      setIsLoading(false);
    }
  }, [studyPlanId, planId]);

  // Se carga automáticamente (no solo cuando se abre el modal): generatePlan()
  // necesita el pool de UNAHUR YA disponible para poder excluir del plan las que
  // todavía no se eligieron, incluso antes de que el estudiante abra el modal.
  useEffect(() => {
    refresh();
  }, [refresh]);

  const addChoice = useCallback(
    async (unahurBlockId: number, planSubjectId: number): Promise<boolean> => {
      if (planId == null) return false;
      setIsSaving(true);
      setError(null);
      try {
        await createUnahurChoice(planId, unahurBlockId, planSubjectId);
        await refresh();
        return true;
      } catch (err: any) {
        setError(err.message || "Error al elegir la materia UNAHUR");
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
        await deleteUnahurChoice(planId, planSubjectId);
        await refresh();
        return true;
      } catch (err: any) {
        setError(err.message || "Error al quitar la materia UNAHUR");
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [planId, refresh]
  );

  return { blocks, choices, isLoading, isSaving, error, refresh, addChoice, removeChoice };
}
