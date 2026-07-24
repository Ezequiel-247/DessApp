import { useState, useEffect, useCallback, useMemo } from "react";
import { simulateWhatIfLocal } from "../services/simulatorService";
import type {
  SubjectGraph,
  SubjectClassification,
} from "@/features/myPlanner/customPlan/model/planner";
import type { SimEnrolledSubject, SimUnlockedSubject } from "../model/simulator";

export function useSimulator(
  graph?: SubjectGraph | null,
  classification?: Map<number, SubjectClassification> | null
) {
  const [enrolledSubjects, setEnrolledSubjects] = useState<SimEnrolledSubject[]>([]);
  const [simulatedSubjects, setSimulatedSubjects] = useState<SimEnrolledSubject[]>([]);
  const [results, setResults] = useState<SimUnlockedSubject[]>([]);
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const simulate = useCallback(
    (ids: number[]) => {
      console.log("🚀 [useSimulator] Ejecutando simulación para IDs:", ids);

      if (!graph || !classification) {
        setResults([]);
        setSimulatedSubjects([]);
        return;
      }

      if (ids.length === 0) {
        setResults([]);
        setSimulatedSubjects([]);
        return;
      }

      setError(null);
      try {
        const res = simulateWhatIfLocal(graph, classification, ids);
        setSimulatedSubjects(res.simulated_subjects);
        setResults(res.newly_unlocked);
      } catch (err: any) {
        console.error("Simulator error:", err);
        setError(err.message || "Error al simular");
        setResults([]);
      }
    },
    [graph, classification]
  );

  const fetchEnrolled = useCallback(() => {
    console.log("🔍 [useSimulator] fetchEnrolled disparado");
    console.log("📊 [useSimulator] Graph disponible:", !!graph);
    console.log("📋 [useSimulator] Classification disponible:", !!classification);

    if (!graph || !classification) {
      console.warn("⚠️ [useSimulator] No hay datos para filtrar materias en curso.");
      setEnrolledSubjects([]);
      setSimulatedSubjects([]);
      setChecked({});
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const res = simulateWhatIfLocal(graph, classification, []);
      const subjects = res.currently_in_course;
      console.log("✅ [useSimulator] Materias detectadas 'en curso':", subjects);

      setEnrolledSubjects(subjects);
      setSimulatedSubjects(res.simulated_subjects);

      const allChecked: Record<number, boolean> = {};
      for (const s of subjects) {
        allChecked[s.plan_subject_id] = true;
      }
      setChecked(allChecked);

      if (subjects.length > 0) {
        simulate(subjects.map(s => s.plan_subject_id));
      }
    } catch (err: any) {
      console.error("Simulator fetch enrolled error:", err);
      setError(err.message || "Error al cargar materias en curso");
    } finally {
      setIsLoading(false);
    }
  }, [graph, classification, simulate]);

  useEffect(() => {
    fetchEnrolled();
  }, [fetchEnrolled]);

  const anyChecked = Object.values(checked).some(Boolean);
  const checkedIds = Object.entries(checked)
    .filter(([, v]) => v)
    .map(([k]) => Number(k));

  const nameMap = useMemo(() => {
    const map: Record<number, string> = {};
    for (const s of enrolledSubjects) {
      map[s.plan_subject_id] = s.subject_name;
    }
    for (const s of simulatedSubjects) {
      map[s.plan_subject_id] = s.subject_name;
    }
    return map;
  }, [enrolledSubjects, simulatedSubjects]);

  const groupedResults = useMemo(() => {
    const singleGroups: Record<number, SimUnlockedSubject[]> = {};
    const multiSubjects: SimUnlockedSubject[] = [];
    for (const r of results) {
      if (r.unlocked_by.length === 1) {
        const key = r.unlocked_by[0];
        if (!singleGroups[key]) singleGroups[key] = [];
        singleGroups[key].push(r);
      } else {
        multiSubjects.push(r);
      }
    }
    return { singleGroups, multiSubjects };
  }, [results]);

  const toggle = (planSubjectId: number) => {
    const next = { ...checked, [planSubjectId]: !checked[planSubjectId] };
    setChecked(next);

    const selectedIds = Object.entries(next)
      .filter(([, v]) => v)
      .map(([k]) => Number(k));

    simulate(selectedIds);
  };

  return {
    enrolledSubjects,
    results,
    groupedResults,
    nameMap,
    checked,
    anyChecked,
    isLoading,
    error,
    toggle,
    retry: fetchEnrolled,
  };
}
