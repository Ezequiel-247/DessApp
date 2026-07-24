import { useDroppable } from "@dnd-kit/core";
import { DraggableSubject } from "../customPlan/services/DraggableSubject";
import type { Plan, PlannedSubject, SubjectGraph, SubjectClassification } from "../customPlan/model/planner";

interface DroppableSemesterProps {
  id: string;
  year: number;
  term: number;
  subjects: PlannedSubject[];
  totalHours: number;
  readOnly: boolean;
  graph: SubjectGraph | null;
  classification: Map<number, SubjectClassification> | null;
  plan: Plan;
  isAdjusted: (subjectName: string) => boolean;
}

export function DroppableSemester({
  id,
  year,
  term,
  subjects,
  totalHours,
  readOnly,
  graph,
  classification,
  plan,
  isAdjusted,
}: DroppableSemesterProps) {
  const { isOver, setNodeRef } = useDroppable({
    id,
    disabled: readOnly,
  });

  const exceedsLimit = plan.limit_hours > 0 && totalHours > plan.limit_hours;

  const containerStyle = isOver
    ? "bg-primary/5 ring-2 ring-primary"
    : exceedsLimit
    ? "bg-error/5 ring-1 ring-error"
    : "bg-surface-container";

  return (
    <div
      ref={setNodeRef}
      className={`p-4 rounded-2xl transition-all duration-150 ${containerStyle}`}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-on-surface">
          Cuatrimestre {term}
        </h3>
        <div
          className={`text-xs font-medium px-2 py-1 rounded-full ${
            exceedsLimit ? "bg-error-container text-on-error-container" : "bg-surface-bright text-on-surface-variant"
          }`}
        >
          {totalHours} / {plan.limit_hours} hs
        </div>
      </div>
      <div className="space-y-3 min-h-[6rem]">
        {subjects.length > 0 ? (
          subjects.map((subject) => (
            <DraggableSubject
              key={subject.plan_subject_id}
              id={String(subject.plan_subject_id)}
              name={subject.subject_name}
              hours={subject.weekly_hours}
              isAdjusted={isAdjusted(subject.subject_name)}
            />
          ))
        ) : (
          <div className="flex items-center justify-center h-full text-sm text-on-surface-variant/50 italic p-6 border-2 border-dashed border-outline-variant/30 rounded-lg">
            Arrastra materias aquí
          </div>
        )}
      </div>
    </div>
  );
}