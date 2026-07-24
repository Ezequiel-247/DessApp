import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useAuth } from "@/app/AuthContext";
import {
  generatePlan,
  buildSubjectGraph,
  classifySubjects,
  computePendingFinalEvents,
  computeCompletedSubjectPlacements,
} from "../services/planningAlgorithm";
import { processMoveWithFeedback, addElectiveSubject, removeElectiveSubject } from "../services/editEngine";
import { insertSabbaticalGap, removeSabbaticalGap } from "../services/sabbaticalEngine";
import type { SabbaticalPeriodRef, SabbaticalShiftResult } from "../services/sabbaticalEngine";
import { createFinalExam, updateFinalExam } from "@/entities/FinalExam";
import type {
  Plan,
  PlannerDataResponse,
  SubjectGraph,
  SubjectClassification,
  SavePlanItem,
  PlannedEvent,
} from "../model/planner";

export function usePlanner(
  plannerData?: PlannerDataResponse | null,
  weeklyHoursLimit?: number | null,
  refreshKey?: number | string | null,
  electivePoolIds?: Set<number>,
  chosenElectiveIds?: Set<number>,
  unahurPoolIds?: Set<number>,
  chosenUnahurIds?: Set<number>,
  hasActivePlan?: boolean
) {
  const { user } = useAuth();
  const [data, setData] = useState<Plan | null>(null);
  const [activeYear, setActiveYear] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Memoized graph and classification for performance
  const graph = useMemo(() => {
    if (!plannerData) return null;
    return buildSubjectGraph(
      plannerData.planSubjects,
      plannerData.correlativities
    );
  }, [plannerData]);

  const classification = useMemo(() => {
    if (!plannerData) return null;
    return classifySubjects(
      plannerData.academicRecords,
      plannerData.planSubjects
    );
  }, [plannerData]);

  // electivePoolIds/chosenElectiveIds solo deben influir en la generación INICIAL de
  // un plan nuevo. Si entraran en las dependencias de `generate`/el efecto de abajo,
  // elegir una electiva en un plan YA existente dispararía una regeneración completa
  // desde cero, descartando cualquier edición manual (drags, sabáticos) ya aplicada.
  // Por eso se leen desde un ref: `generate()` siempre usa el valor más reciente,
  // pero cambiarlos no fuerza una nueva ejecución del efecto de auto-generación.
  const electivePoolIdsRef = useRef(electivePoolIds);
  const chosenElectiveIdsRef = useRef(chosenElectiveIds);
  const unahurPoolIdsRef = useRef(unahurPoolIds);
  const chosenUnahurIdsRef = useRef(chosenUnahurIds);
  electivePoolIdsRef.current = electivePoolIds;
  chosenElectiveIdsRef.current = chosenElectiveIds;
  unahurPoolIdsRef.current = unahurPoolIds;
  chosenUnahurIdsRef.current = chosenUnahurIds;

  // Igual truco que los refs de arriba: hasActivePlan se lee por ref (no como
  // dependencia reactiva) para no forzar un re-render del efecto de auto-generación
  // por sí solo — solo importa el valor vigente cuando plannerData/refreshKey cambian.
  const hasActivePlanRef = useRef(hasActivePlan);
  hasActivePlanRef.current = hasActivePlan;

  // Generate plan from scratch
  const generate = useCallback((): Plan | null => {
    if (!plannerData || weeklyHoursLimit == null) {
      setError("Datos insuficientes para generar el plan");
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const plan = generatePlan(
        plannerData.planSubjects,
        plannerData.academicRecords,
        plannerData.correlativities,
        weeklyHoursLimit,
        undefined,
        undefined,
        electivePoolIdsRef.current,
        chosenElectiveIdsRef.current,
        unahurPoolIdsRef.current,
        chosenUnahurIdsRef.current
      );

      setData(plan);
      // Ver comentario equivalente en loadFromSaved: con materias ya cursadas en el
      // cronograma, plan.years[0] puede ser un año histórico.
      setActiveYear(plannerData?.currentPeriod?.year ?? plan.years[0]?.year ?? new Date().getFullYear());
      return plan;
    } catch (err: any) {
      console.error("Generate plan error:", err);
      const errorMsg = err.message || "Error al generar el plan";
      setError(errorMsg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [plannerData, weeklyHoursLimit]);

  // Re-generate plan when plannerData, hours, or a refresh signal changes.
  // Si ya hay un plan GUARDADO activo, este efecto no debe regenerar desde cero: eso
  // tira el acomodo manual del alumno (drags, sabáticos) y lo reemplaza por la
  // asignación greedy del algoritmo. La reconciliación de ese caso (nuevo registro
  // académico con un plan guardado ya cargado) la maneja useMyPlannerPage llamando
  // de nuevo a loadFromSaved. Este generate() es solo para el flujo de "vista previa
  // antes de guardar el primer plan" (todavía no hay activePlanId).
  useEffect(() => {
    if (!plannerData || weeklyHoursLimit == null) {
      setData(null);
      setActiveYear(0);
      return;
    }

    if (hasActivePlanRef.current) return;

    generate();
  }, [plannerData, weeklyHoursLimit, refreshKey, generate]);

  // Move subject with full validation and cascading
  const moveSubject = useCallback(
    (
      subjectId: string,
      sourceYear: number,
      sourceSem: number,
      targetYear: number,
      targetSem: number,
      onError?: (error: string) => void
    ) => {
      setData(prev => {
        if (!prev || !plannerData || !graph || !classification) {
          return prev;
        }

        try {
          const planSubjectId = Number(subjectId);

          const currentPeriodYear = plannerData?.currentPeriod?.year;
          const minYear =
            typeof currentPeriodYear === "number" && currentPeriodYear >= 1900
              ? currentPeriodYear
              : new Date().getFullYear();

          const { plan: newPlan } = processMoveWithFeedback(
            prev,
            planSubjectId,
            { year: targetYear, term: targetSem },
            graph,
            prev.limit_hours,
            minYear
          );

          setError(null);
          return newPlan;
        } catch (err: any) {
          const msg = err?.message || "Error al mover la materia";
          console.warn("Move subject error:", msg);
          onError?.(msg);
          return prev;
        }
      });
    },
    [plannerData, graph, classification]
  );

  // Reprograma un "Final pendiente": lo mueve en memoria al cuatrimestre elegido y
  // persiste de inmediato contra /api/final-exams (no espera al "Guardar" del plan,
  // porque el final pertenece al alumno, no a este plan puntual).
  const moveFinalEvent = useCallback(
    (
      academicRecordId: number,
      finalExamId: number | undefined,
      targetYear: number,
      targetTerm: number,
      onError?: (error: string) => void
    ) => {
      let moved: PlannedEvent | undefined;

      setData(prev => {
        if (!prev) return prev;

        const years = prev.years.map(y => ({
          ...y,
          semesters: y.semesters.map(s => ({ ...s, events: s.events ? [...s.events] : s.events })),
        }));

        for (const y of years) {
          for (const s of y.semesters) {
            if (!s.events) continue;
            const idx = s.events.findIndex(e => e.academic_record_id === academicRecordId);
            if (idx !== -1) {
              moved = s.events[idx];
              s.events.splice(idx, 1);
            }
          }
        }

        if (!moved) return prev;

        const updatedEvent: PlannedEvent = { ...moved, year: targetYear, semester: targetTerm };

        let targetYearPlan = years.find(y => y.year === targetYear);
        if (!targetYearPlan) {
          targetYearPlan = {
            year: targetYear,
            semesters: [
              { term: 1, subjects: [], total_hours: 0, events: [] },
              { term: 2, subjects: [], total_hours: 0, events: [] },
            ],
          };
          years.push(targetYearPlan);
          years.sort((a, b) => a.year - b.year);
        }

        const semIndex = targetTerm === 1 ? 0 : 1;
        const targetSemester = targetYearPlan.semesters[semIndex];
        if (!targetSemester.events) targetSemester.events = [];
        targetSemester.events.push(updatedEvent);

        return { ...prev, years };
      });

      if (!moved) return;

      const applyPersistedId = (id: number) => {
        setData(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            years: prev.years.map(y => ({
              ...y,
              semesters: y.semesters.map(s => ({
                ...s,
                events: s.events?.map(e =>
                  e.academic_record_id === academicRecordId ? { ...e, final_exam_id: id } : e
                ),
              })),
            })),
          };
        });
      };

      const request = finalExamId
        ? updateFinalExam(String(finalExamId), { year: targetYear, semester: targetTerm, status: "pendiente" })
        : createFinalExam({
            id_academic_record: academicRecordId,
            year: targetYear,
            semester: targetTerm,
            status: "pendiente",
          });

      request
        .then(result => {
          if (!finalExamId) applyPersistedId(Number(result.id));
        })
        .catch((err: any) => {
          onError?.(err?.message || "No se pudo guardar el nuevo cuatrimestre del final");
        });
    },
    []
  );

  // Marca un período (o año completo) como sabático: vacía ese cuatrimestre y corre
  // todo lo posterior un lugar, sin reordenar nada. Opera sobre el plan en memoria;
  // hay que guardar el plan después para persistir el corrimiento.
  const applySabbatical = useCallback(
    (
      year: number,
      terms: number[],
      existingPeriods: SabbaticalPeriodRef[],
      onMoved?: (moved: SabbaticalShiftResult["movedPeriods"]) => void
    ) => {
      setData(prev => {
        if (!prev) return prev;
        const count = terms.length >= 2 ? 2 : 1;
        const targetTerm = terms.includes(1) ? 1 : 2;
        const { plan, movedPeriods } = insertSabbaticalGap(
          prev,
          { year, term: targetTerm },
          count as 1 | 2,
          existingPeriods
        );
        if (movedPeriods.length > 0) onMoved?.(movedPeriods);
        return plan;
      });
    },
    []
  );

  // Cancela un sabático previamente aplicado: remueve el hueco y corre todo un lugar hacia atrás.
  const undoSabbatical = useCallback(
    (
      year: number,
      term: number | undefined,
      existingPeriods: SabbaticalPeriodRef[],
      onMoved?: (moved: SabbaticalShiftResult["movedPeriods"]) => void
    ) => {
      setData(prev => {
        if (!prev) return prev;
        const count = term == null ? 2 : 1;
        const targetTerm = term ?? 1;
        const { plan, movedPeriods } = removeSabbaticalGap(
          prev,
          { year, term: targetTerm },
          count as 1 | 2,
          existingPeriods
        );
        if (movedPeriods.length > 0) onMoved?.(movedPeriods);
        return plan;
      });
    },
    []
  );

  // Agrega al plan en memoria una electiva/UNAHUR recién elegida por el estudiante.
  const addElective = useCallback(
    (planSubjectId: number, onError?: (error: string) => void) => {
      setData(prev => {
        if (!prev || !graph) return prev;
        try {
          const currentPeriodYear = plannerData?.currentPeriod?.year;
          const minYear =
            typeof currentPeriodYear === "number" && currentPeriodYear >= 1900
              ? currentPeriodYear
              : new Date().getFullYear();
          return addElectiveSubject(prev, graph, planSubjectId, prev.limit_hours, minYear);
        } catch (err: any) {
          onError?.(err?.message || "Error al agregar la electiva");
          return prev;
        }
      });
    },
    [graph, plannerData]
  );

  // Quita del plan en memoria una electiva/UNAHUR que el estudiante deseleccionó.
  const removeElective = useCallback((planSubjectId: number) => {
    setData(prev => {
      if (!prev) return prev;
      return removeElectiveSubject(prev, planSubjectId);
    });
  }, []);

  // Load from saved plan
  const loadFromSaved = useCallback((saved: any) => {
    try {
      // Convert SavedPlan items to Plan structure
      const items: any[] = saved.items ?? [];

      const yearMap = new Map<number, Plan["years"][0]>();

      for (const item of items) {
        const year = item.target_year;
        const term = item.target_term;

        if (!yearMap.has(year)) {
          yearMap.set(year, {
            year,
            semesters: [
              { term: 1, subjects: [], total_hours: 0 },
              { term: 2, subjects: [], total_hours: 0 },
            ],
          });
        }

        const yearPlan = yearMap.get(year)!;
        const semesterIndex = term === 1 ? 0 : 1;
        const semester = yearPlan.semesters[semesterIndex];

        const ps = item.plan_subject;
        if (ps && ps.subject) {
          // Si el alumno ya regularizó/aprobó esta materia por otra vía desde que se
          // guardó el plan (ej. una carga de Excel posterior), ya no tiene sentido
          // seguir mostrándola como pendiente de cursar — generatePlan() nunca la
          // hubiera proyectado en primer lugar (ver pendingSubjectIds), así que un
          // plan guardado tampoco debería arrastrarla. Se la excluye del plan cargado
          // en vez de mutar lo guardado, para no perder la posición si en algún
          // momento se corrige/revierte el registro académico.
          const currentStatus = classification?.get(item.plan_subject_id);
          const alreadyResolved = currentStatus != null && currentStatus !== 'faltante';
          if (alreadyResolved) continue;

          // weekly_hours vive en el modelo Subject, no en PlanSubject: el backend
          // no lo copia al nivel de plan_subject al traer un plan guardado.
          const weeklyHours = ps.subject.weekly_hours ?? ps.weekly_hours ?? 0;
          const blockType = ps.is_elective ? "elective" : ps.subject.is_unahur ? "unahur" : undefined;
          semester.subjects.push({
            plan_subject_id: item.plan_subject_id,
            subject_name: ps.subject.name,
            weekly_hours: weeklyHours,
            credits: ps.credits,
            weight: 0,
            block_type: blockType,
          });
          semester.total_hours += weeklyHours;
        }
      }

      // Los finales pendientes son un dato derivado de los registros académicos actuales
      // (no de lo que se guardó del plan) — hay que recalcularlos igual que hace
      // generatePlan(), o el badge "Final Pendiente" desaparece al recargar un plan guardado.
      if (plannerData && classification) {
        const pendingFinalEvents = computePendingFinalEvents(
          plannerData.planSubjects,
          plannerData.academicRecords,
          classification
        );

        for (const event of pendingFinalEvents) {
          if (!yearMap.has(event.year)) {
            yearMap.set(event.year, {
              year: event.year,
              semesters: [
                { term: 1, subjects: [], total_hours: 0 },
                { term: 2, subjects: [], total_hours: 0 },
              ],
            });
          }

          const yearPlan = yearMap.get(event.year)!;
          const semester = yearPlan.semesters[event.semester === 1 ? 0 : 1];
          if (!semester.events) semester.events = [];
          semester.events.push(event);
        }

        // Igual que los finales pendientes: las materias ya cursadas son un dato derivado
        // de los registros académicos actuales, no de lo que se guardó del plan — hay que
        // recalcularlas siempre, o desaparecen del cronograma al recargar un plan guardado.
        const completedPlacements = computeCompletedSubjectPlacements(
          plannerData.planSubjects,
          plannerData.academicRecords,
          classification
        );

        for (const { year, semester: term, subject } of completedPlacements) {
          if (!yearMap.has(year)) {
            yearMap.set(year, {
              year,
              semesters: [
                { term: 1, subjects: [], total_hours: 0 },
                { term: 2, subjects: [], total_hours: 0 },
              ],
            });
          }

          const yearPlan = yearMap.get(year)!;
          const semester = yearPlan.semesters[term === 1 ? 0 : 1];
          if (!semester.completed_subjects) semester.completed_subjects = [];
          semester.completed_subjects.push(subject);
        }
      }

      const years = Array.from(yearMap.values());
      years.sort((a, b) => a.year - b.year);

      const totalCredits = years.reduce((sum, y) =>
        sum +
        y.semesters.reduce((s, sem) =>
          s + sem.subjects.reduce((ss, subj) => ss + subj.credits, 0),
          0
        ),
        0
      );

      const plan: Plan = {
        years,
        total_credits: totalCredits,
        limit_hours: saved.weekly_hours || 20,
      };

      setData(plan);
      // Con materias ya cursadas en el cronograma, plan.years[0] puede ser un año
      // histórico (ej: cuando el alumno arrancó la carrera) — se prioriza el año
      // actual para que el plan siempre abra en el período vigente, no en el pasado.
      setActiveYear(plannerData?.currentPeriod?.year ?? plan.years[0]?.year ?? new Date().getFullYear());
      setIsLoading(false);
      setError(null);
    } catch (err: any) {
      console.error("Load from saved error:", err);
      setError("Error al cargar el plan guardado");
    }
  }, [plannerData, classification]);

  // Get plan snapshot for saving
  const getPlanSnapshot = useCallback((): SavePlanItem[] => {
    if (!data) return [];

    const items: SavePlanItem[] = [];

    for (const year of data.years) {
      for (const semester of year.semesters) {
        for (const subject of semester.subjects) {
          items.push({
            plan_subject_id: subject.plan_subject_id,
            target_year: year.year,
            target_term: semester.term,
            status: 'planificado',
          });
        }
      }
    }

    return items;
  }, [data]);

  return {
    data,
    activeYear,
    setActiveYear,
    moveSubject,
    moveFinalEvent,
    applySabbatical,
    undoSabbatical,
    addElective,
    removeElective,
    isLoading,
    error,
    loadFromSaved,
    getPlanSnapshot,
    generate,
    graph,
    classification,
  };
}
