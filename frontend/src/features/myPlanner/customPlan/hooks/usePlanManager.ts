import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/app/AuthContext";
import { fetchPlans, savePlanFromCanvas, updatePlanFromCanvas, renamePlan, clonePlan, deletePlan } from "../services/planManagerService";
import { planToSavePayload } from "../services/plannerService";
import { createNotification, NOTIFICATION_TYPE } from "@/entities/Notification";
import type { SavedPlan, Plan, SavePlanItem } from "../model/planner";

// Best-effort: si la notificación falla, no debe romper el flujo de guardado del plan.
function notifyPlanSaved(userId: string, name: string, isNew: boolean) {
  createNotification({
    userId,
    type: NOTIFICATION_TYPE.SUCCESS,
    title: isNew ? "Plan creado" : "Plan actualizado",
    message: isNew
      ? `Guardaste tu plan "${name}".`
      : `Actualizaste tu plan "${name}".`,
  }).catch(() => {});
}

export function usePlanManager(
  getPlanSnapshot: () => SavePlanItem[],
  weeklyHours: number,
  enrollmentId?: string | number | null
) {
  const { user } = useAuth();
  const [plans, setPlans] = useState<SavedPlan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const list = await fetchPlans(user.id, enrollmentId);
      setPlans(list);
    } catch (err: any) {
      console.error("Fetch plans error:", err);
      setError(err.message || "Error al cargar planes");
    } finally {
      setIsLoading(false);
    }
  }, [user, enrollmentId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const save = useCallback(async (name: string): Promise<SavedPlan | null> => {
    if (!user) return null;
    setIsSaving(true);
    setError(null);
    try {
      const plan = getPlanSnapshot();
      const saved = await savePlanFromCanvas(user.id, name, weeklyHours, plan, enrollmentId);
      notifyPlanSaved(user.id, name, true);
      await refresh();
      return saved;
    } catch (err: any) {
      console.error("Save plan error:", err);
      setError(err.message || "Error al guardar el plan");
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [user, getPlanSnapshot, weeklyHours, enrollmentId, refresh]);

  const update = useCallback(async (planId: number, name: string): Promise<boolean> => {
    if (!user) return false;
    setIsSaving(true);
    setError(null);
    try {
      const plan = getPlanSnapshot();
      await updatePlanFromCanvas(planId, name, weeklyHours, plan);
      notifyPlanSaved(user.id, name, false);
      await refresh();
      return true;
    } catch (err: any) {
      console.error("Update plan error:", err);
      setError(err.message || "Error al actualizar el plan");
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [user, getPlanSnapshot, weeklyHours, refresh]);

  const createFromPlannerData = useCallback(async (plan: Plan, name: string, hours: number): Promise<SavedPlan | null> => {
    if (!user) return null;
    setIsSaving(true);
    setError(null);
    try {
      const payload = planToSavePayload(plan, name);
      const saved = await savePlanFromCanvas(user.id, name, hours, payload.items, enrollmentId);
      notifyPlanSaved(user.id, name, true);
      await refresh();
      return saved;
    } catch (err: any) {
      console.error("Create plan error:", err);
      setError(err.message || "Error al crear el plan");
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [user, enrollmentId, refresh]);

  // Rename puro (sin tocar items) — para renombrar un plan desde una lista sin
  // necesidad de cargarlo antes al canvas (ver comentario en renamePlan, servicio).
  const rename = useCallback(async (planId: number, name: string): Promise<boolean> => {
    if (!user) return false;
    setIsSaving(true);
    setError(null);
    try {
      await renamePlan(planId, name);
      await refresh();
      return true;
    } catch (err: any) {
      console.error("Rename plan error:", err);
      setError(err.message || "Error al renombrar el plan");
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [user, refresh]);

  const loadPlan = useCallback(async (planId: number): Promise<SavedPlan | null> => {
    if (!user) return null;
    setIsLoading(true);
    setError(null);
    try {
      const { fetchPlan } = await import("../services/planManagerService");
      const saved = await fetchPlan(planId);
      return saved;
    } catch (err: any) {
      console.error("Load plan error:", err);
      setError(err.message || "Error al cargar el plan");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const duplicate = useCallback(async (planId: number) => {
    if (!user) return;
    setError(null);
    try {
      const currentPlan = plans.find(p => p.id === planId);
      const currentName = currentPlan?.name ?? "";

      const baseName = currentName.replace(/\s*\(\d+\)\s*$/, '').trim();

      const siblings = plans.filter(p => {
        const clean = p.name.replace(/\s*\(\d+\)\s*$/, '').trim();
        return clean === baseName && p.id !== planId;
      });

      let maxNum = 0;
      siblings.forEach(p => {
        const match = p.name.match(/\((\d+)\)\s*$/);
        if (match) maxNum = Math.max(maxNum, parseInt(match[1]));
      });

      const newName = `${baseName} (${maxNum + 1})`;

      await clonePlan(planId, newName, user.id, enrollmentId);
      await refresh();
    } catch (err: any) {
      console.error("Clone plan error:", err);
      setError(err.message || "Error al clonar el plan");
    }
  }, [user, refresh, plans, enrollmentId]);

  const remove = useCallback(async (planId: number) => {
    if (!user) return;
    setError(null);
    try {
      await deletePlan(planId);
      await refresh();
    } catch (err: any) {
      console.error("Delete plan error:", err);
      setError(err.message || "Error al eliminar el plan");
    }
  }, [user, refresh]);

  return { plans, isLoading: isLoading || isSaving, isSaving, error, refresh, save, update, rename, createFromPlannerData, loadPlan, duplicate, remove };
}
