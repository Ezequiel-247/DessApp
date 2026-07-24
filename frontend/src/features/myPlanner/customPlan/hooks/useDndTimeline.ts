import { useState, useEffect, useRef, useCallback } from "react";
import {
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragStartEvent, DragEndEvent } from "@dnd-kit/core";
import type { PlannedYear, PlannedSubject, Plan, SubjectGraph, SubjectClassification } from "../model/planner";
import type { SabbaticalPeriod } from "../services/sabbaticalService";
import { validatePlacementLocal } from "../services/validationService";
import { calculateTermHours } from "../services/planningAlgorithm";
import { isFinalDragId } from "../components/FinalExamCard";

export interface MoveConfirmation {
  subjectId: string;
  sourceYear: number;
  sourceTerm: number;
  targetYear: number;
  targetTerm: number;
  targetLabel: string;
  type: 'prerequisites' | 'hours' | 'dependents';
  subjectName: string;
  message: string;
  details: string[];
}

function findDependentsAtOrBefore(
  plan: Plan,
  graph: SubjectGraph,
  subjectId: number,
  targetYear: number,
  targetTerm: number
): number[] {
  const node = graph.nodes.get(subjectId);
  if (!node) return [];
  const affected: number[] = [];
  for (const depId of node.required_by) {
    for (const y of plan.years) {
      for (const s of y.semesters) {
        if (s.subjects.some(sub => sub.plan_subject_id === depId)) {
          if (y.year < targetYear || (y.year === targetYear && s.term <= targetTerm)) {
            affected.push(depId);
          }
        }
      }
    }
  }
  return affected;
}

function yearSemLabel(year: number, sem: string): string {
  const termName = sem === "C2" ? "2° Cuatrimestre" : "1° Cuatrimestre";
  return `${year} · ${termName}`;
}

type OnMoveSubjectFn = (
  subjectId: string,
  sourceYear: number,
  sourceSem: number,
  targetYear: number,
  targetSem: number,
  onError?: (error: string) => void,
) => void;

type OnMoveFinalFn = (
  academicRecordId: number,
  finalExamId: number | undefined,
  targetYear: number,
  targetTerm: number,
  onError?: (error: string) => void,
) => void;

export function useDndTimeline(
  plan: Plan | null,
  onMoveSubject: OnMoveSubjectFn,
  studentId?: number | string,
  hoursLimit?: number,
  graph?: SubjectGraph | null,
  classification?: Map<number, SubjectClassification> | null,
  sabbaticals?: SabbaticalPeriod[],
  onMoveFinal?: OnMoveFinalFn,
) {
  const years: PlannedYear[] = plan?.years ?? [];
  const [activeDrag, setActiveDrag] = useState<PlannedSubject | null>(null);
  const [activeDragFinalName, setActiveDragFinalName] = useState<string | null>(null);
  const [errorDroppableId, setErrorDroppableId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [moveConfirmation, setMoveConfirmation] = useState<MoveConfirmation | null>(null);
  const errorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (errorTimer.current) clearTimeout(errorTimer.current);
    };
  }, []);

  const showError = useCallback((droppableId: string, message: string) => {
    setErrorDroppableId(droppableId);
    setErrorMessage(message);
    if (errorTimer.current) clearTimeout(errorTimer.current);
    errorTimer.current = setTimeout(() => {
      setErrorDroppableId(null);
      setErrorMessage(null);
    }, 4000);
  }, []);

  // Mouse y touch necesitan una activación distinta: con mouse, cualquier gesto es
  // "arrastrar" (alcanza con moverse un poco). Con el dedo, ese mismo umbral de
  // distancia confunde el gesto de arrastre con el de scrollear la página — por eso
  // touch usa un pequeño delay (mantener presionado) en vez de distancia, para que
  // un swipe rápido siga scrolleando normal y solo una pulsación sostenida arranque
  // el drag. PointerSensor no sirve acá porque aplica UNA sola constraint a los dos
  // tipos de puntero; MouseSensor + TouchSensor permiten una por cada uno.
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: DragStartEvent) => {
    document.body.classList.add("cursor-grabbing");
    setErrorDroppableId(null);
    setErrorMessage(null);
    const { active } = event;

    if (isFinalDragId(active.id)) {
      setActiveDragFinalName((active.data.current?.subjectName as string) ?? "Materia");
      return;
    }

    const year = active.data.current?.year as number;
    const sem = active.data.current?.sem as string;
    for (const y of years) {
      if (y.year !== year) continue;
      for (const s of y.semesters) {
        const semName = s.term === 1 ? "C1" : "C2";
        if (semName !== sem) continue;
        const dragId = Number(active.id);
        const subject = s.subjects.find((sub) => sub.plan_subject_id === dragId);
        if (subject) {
          setActiveDrag(subject);
          return;
        }
      }
    }
  };

  function findSubjectName(): string {
    const subj = years
      .flatMap(y => y.semesters)
      .flatMap(s => s.subjects)
      .find(s => s.plan_subject_id === Number(activeDrag?.plan_subject_id ?? 0));
    return subj?.subject_name ?? 'Materia';
  }

  const executeMove = useCallback(
    (subjectId: string, sourceYear: number, sourceTerm: number, targetYear: number, targetTerm: number) => {
      const droppableId = `${targetYear}-${targetTerm === 1 ? "C1" : "C2"}`;
      onMoveSubject(
        subjectId, sourceYear, sourceTerm, targetYear, targetTerm,
        (error: string) => { showError(droppableId, error); }
      );
    },
    [onMoveSubject, showError]
  );

  const handleDragEnd = (event: DragEndEvent) => {
    document.body.classList.remove("cursor-grabbing");
    setActiveDrag(null);
    setActiveDragFinalName(null);

    const { active, over } = event;
    if (!over || active.id === over.id) return;

    if (isFinalDragId(active.id)) {
      const [targetYearStr, targetSemStr] = (over.id as string).split("-");
      const targetYear = parseInt(targetYearStr, 10);
      if (isNaN(targetYear) || !targetSemStr) return;
      const targetTerm = targetSemStr === "C2" ? 2 : 1;

      const data = active.data.current as
        | {
            year: number;
            sem: string;
            dueDate?: string | null;
            academicRecordId: number;
            finalExamId?: number;
            regularizedYear: number;
            regularizedSemester: number;
          }
        | undefined;
      if (!data) return;

      const sourceTerm = data.sem === "C2" ? 2 : 1;
      if (data.year === targetYear && sourceTerm === targetTerm) return;

      const droppableId = `${targetYear}-${targetSemStr}`;

      if (sabbaticals?.some(s => s.year === targetYear && s.term === targetTerm)) {
        showError(droppableId, "Este cuatrimestre está marcado como sabático. Cancelalo primero si querés usarlo.");
        return;
      }

      // No se puede rendir un final antes de haber regularizado la materia.
      const isBeforeRegularization =
        targetYear < data.regularizedYear ||
        (targetYear === data.regularizedYear && targetTerm < data.regularizedSemester);
      if (isBeforeRegularization) {
        showError(droppableId, "No podés programar el final antes del cuatrimestre en que regularizaste la materia.");
        return;
      }

      // No se puede pasar del vencimiento de la regularidad.
      // El backend calcula el vencimiento como 31/7 (regularizada en C1) o 31/12
      // (regularizada en C2) dos años después (ver calcularRegularidadExpiresAt en
      // academicRecordService.js), así que hay que comparar año Y cuatrimestre real,
      // no solo el año: una regularizada en C1 vence a mitad de año, antes de que
      // empiece el C2 de ese mismo año.
      // Si el registro no tiene vencimiento cargado, se aplica igual el límite de 2 años
      // que usa el sistema por política (ver expiryDate.setFullYear(+2) en useImportExcel.ts).
      const dueDateObj = data.dueDate ? new Date(data.dueDate) : null;
      const dueYear = dueDateObj ? dueDateObj.getFullYear() : data.regularizedYear + 2;
      const dueSemester = dueDateObj ? (dueDateObj.getMonth() <= 6 ? 1 : 2) : 2;

      const isAfterExpiry =
        targetYear > dueYear ||
        (targetYear === dueYear && targetTerm > dueSemester);
      if (isAfterExpiry) {
        showError(droppableId, "La regularidad de esta materia vence antes de ese cuatrimestre.");
        return;
      }

      onMoveFinal?.(data.academicRecordId, data.finalExamId, targetYear, targetTerm, (error) => showError(droppableId, error));
      return;
    }

    const subjectId = active.id as string;
    const sourceYear = active.data.current?.year as number | undefined;
    const sourceSem = active.data.current?.sem as string | undefined;
    if (sourceYear == null || !sourceSem) return;

    const [targetYearStr, targetSem] = (over.id as string).split("-");
    const targetYear = parseInt(targetYearStr, 10);
    if (isNaN(targetYear) || !targetSem) return;

    const targetTerm = targetSem === "C2" ? 2 : 1;
    const planSubjectId = parseInt(subjectId, 10);
    const sourceTerm = sourceSem === "C2" ? 2 : 1;

    // Rechazar si el destino es un período marcado como sabático.
    // El droppable ya viene deshabilitado desde SemesterRow, esto es una segunda
    // barrera por si el drop llega por otra vía (ej. KeyboardSensor).
    if (sabbaticals?.some(s => s.year === targetYear && s.term === targetTerm)) {
      showError(
        `${targetYear}-${targetSem}`,
        "Este cuatrimestre está marcado como sabático. Cancelalo primero si querés usarlo."
      );
      return;
    }

    // Silently reject if dropped in the same semester
    if (sourceYear === targetYear && sourceTerm === targetTerm) return;

    const targetLabel = yearSemLabel(targetYear, targetSem);

    // Find dragged subject name
    const draggedSubject = years
      .flatMap(y => y.semesters)
      .flatMap(s => s.subjects)
      .find(s => s.plan_subject_id === planSubjectId);
    const subjectName = draggedSubject?.subject_name ?? subjectId;

    // Si no tenemos grafo/plan, simplemente permitir el movimiento
    if (!graph || !classification || !plan) {
      executeMove(subjectId, sourceYear, sourceTerm, targetYear, targetTerm);
      return;
    }

    // 1. Check correlatives
    const validation = validatePlacementLocal(
      graph, classification, plan, planSubjectId, targetYear, targetTerm
    );

    if (!validation.valid) {
      const details = validation.unmet_requirements?.map(r => r.subject_name) ?? [];
      setMoveConfirmation({
        subjectId, sourceYear, sourceTerm, targetYear, targetTerm, targetLabel,
        type: 'prerequisites',
        subjectName,
        message: 'Las siguientes correlativas están en cuatrimestres posteriores y serán reacomodadas automáticamente:',
        details,
      });
      return;
    }

    // 2. Check hours
    const termHours = calculateTermHours(plan, targetYear, targetTerm);
    const subjectNode = graph.nodes.get(planSubjectId);
    let needsHoursConfirm = false;
    let hoursMessage = '';

    if (subjectNode && hoursLimit != null) {
      let currentTermHours = termHours;
      const currentPeriod = plan.years
        .flatMap(y => ({ year: y.year, semesters: y.semesters }))
        .find(ys =>
          ys.semesters.some(sem =>
            sem.subjects.some(s => s.plan_subject_id === planSubjectId)
          )
        );

      if (currentPeriod) {
        const isOtherPeriod =
          currentPeriod.year !== targetYear ||
          currentPeriod.semesters.some(
            sem =>
              sem.subjects.some(s => s.plan_subject_id === planSubjectId) &&
              sem.term !== targetTerm
          );
        if (isOtherPeriod) {
          currentTermHours += subjectNode.weekly_hours;
        }
      } else {
        currentTermHours += subjectNode.weekly_hours;
      }

      if (currentTermHours > hoursLimit) {
        needsHoursConfirm = true;
        hoursMessage = `Este cuatrimestre superaría el límite de ${hoursLimit} hs semanales (${currentTermHours}hs). Las materias de menor peso serán reubicadas automáticamente.`;
      }
    }

    if (needsHoursConfirm) {
      setMoveConfirmation({
        subjectId, sourceYear, sourceTerm, targetYear, targetTerm, targetLabel,
        type: 'hours',
        subjectName,
        message: hoursMessage,
        details: [],
      });
      return;
    }

    // 3. Check dependents (CASO 3)
    const dependents = findDependentsAtOrBefore(plan, graph, planSubjectId, targetYear, targetTerm);
    if (dependents.length > 0) {
      const depNames = dependents.map(id => graph.nodes.get(id)?.subject_name ?? `ID ${id}`);
      setMoveConfirmation({
        subjectId, sourceYear, sourceTerm, targetYear, targetTerm, targetLabel,
        type: 'dependents',
        subjectName,
        message: `Al retrasar ${subjectName}, las siguientes materias que dependen de ella quedarían en el pasado y serán reacomodadas:`,
        details: depNames,
      });
      return;
    }

    // 4. No warnings — apply directly
    executeMove(subjectId, sourceYear, sourceTerm, targetYear, targetTerm);
  };

  const confirmMove = useCallback(() => {
    if (!moveConfirmation) return;
    const { subjectId, sourceYear, sourceTerm, targetYear, targetTerm } = moveConfirmation;
    setMoveConfirmation(null);
    executeMove(subjectId, sourceYear, sourceTerm, targetYear, targetTerm);
  }, [moveConfirmation, executeMove]);

  const cancelMove = useCallback(() => {
    setMoveConfirmation(null);
  }, []);

  const handleDragCancel = () => {
    document.body.classList.remove("cursor-grabbing");
    setActiveDrag(null);
    setActiveDragFinalName(null);
  };

  return {
    activeDrag,
    activeDragFinalName,
    sensors,
    handleDragStart,
    handleDragEnd,
    handleDragCancel,
    errorDroppableId,
    errorMessage,
    moveConfirmation,
    confirmMove,
    cancelMove,
  };
}
