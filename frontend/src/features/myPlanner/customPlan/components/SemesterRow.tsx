import { useDroppable } from "@dnd-kit/core";
import { Button } from "@/widgets/ui/Button";
import type { PlannedSemester } from "../model/planner";
import { SubjectCard, SubjectCardReadOnly, CompletedSubjectCard } from "./SubjectCard";
import { FinalExamCard, FinalExamCardReadOnly } from "./FinalExamCard";
import { getGenericBlockHours } from "../services/planningAlgorithm";

function semName(term: number): string {
  return term === 1 ? "C1" : "C2";
}

interface Props {
  semester: PlannedSemester;
  year: number;
  isError?: boolean;
  errorMessage?: string;
  readOnly?: boolean;
  hoursLimit?: number;
  isSabbatical?: boolean;
  onCancelSabbatical?: () => void;
}

export function SemesterRow({
  semester,
  year,
  isError,
  errorMessage,
  readOnly,
  hoursLimit,
  isSabbatical,
  onCancelSabbatical,
}: Props) {
  const isEmpty =
    semester.subjects.length === 0 &&
    (semester.events?.length ?? 0) === 0 &&
    (semester.generic_blocks?.length ?? 0) === 0 &&
    (semester.completed_subjects?.length ?? 0) === 0;
  const name = semName(semester.term);
  const droppableId = `${year}-${name}`;
  const { isOver, setNodeRef } = useDroppable({
    id: droppableId,
    disabled: readOnly || isSabbatical,
  });

  // Verificar si se excede el límite de horas (materias + bloques genéricos UNAHUR/electivas)
  const totalHours = semester.total_hours + getGenericBlockHours(semester);
  const exceedsLimit = hoursLimit != null && totalHours > hoursLimit;
  const limitExceededClass = exceedsLimit ? "ring-2 ring-error bg-error/5" : "";

  const ringClass =
    isError || exceedsLimit
      ? "ring-2 ring-error bg-error/5"
      : isOver
        ? "bg-primary/5 rounded-2xl ring-2 ring-primary"
        : "";

  return (
    <div className="flex gap-margin">
      <div
        className={`w-16 flex-shrink-0 flex flex-col items-center justify-center border-r-2 transition-colors ${
          exceedsLimit ? "border-error" : "border-primary/10"
        }`}
      >
        <h3 className="font-title-sm text-primary">{name}</h3>
        <span
          className={`text-[10px] font-label-caps uppercase text-center ${
            exceedsLimit ? "text-error font-semibold" : "text-on-surface-variant"
          }`}
        >
          {totalHours}hs
        </span>
        {hoursLimit != null && (
          <span className="text-[9px] text-on-surface-variant/60">/ {hoursLimit}hs</span>
        )}
      </div>
      <div
        ref={setNodeRef}
        className={`flex-1 flex gap-4 flex-wrap transition-all relative ${readOnly ? "" : ringClass}`}
      >
        {isEmpty && isSabbatical ? (
          <div className="flex-1 border-2 border-dashed border-sky-300/60 bg-sky-50 rounded-2xl flex flex-col items-center justify-center gap-2 py-6 min-h-[120px]">
            <div className="flex items-center gap-2 text-sky-700">
              <span className="material-symbols-outlined text-xl">beach_access</span>
              <span className="font-title-sm">Sabático</span>
            </div>
            {!readOnly && onCancelSabbatical && (
              <button
                type="button"
                onClick={onCancelSabbatical}
                className="text-xs font-semibold text-sky-700 hover:text-sky-900 transition-colors underline"
              >
                Cancelar sabático
              </button>
            )}
          </div>
        ) : isEmpty ? (
          readOnly ? (
            <div className="flex-1 flex items-center justify-center py-6 min-h-[90px]">
              <span className="text-sm text-on-surface-variant/50 italic">Sin materias</span>
            </div>
          ) : (
            <div
              className={`flex-1 border-2 border-dashed rounded-2xl flex items-center justify-center bg-surface-container-low/30 py-6 min-h-[120px] transition-colors ${
                isError
                  ? "border-error"
                  : isOver
                    ? "border-primary border-solid"
                    : "border-outline-variant/20"
              }`}
            >
              <Button variant="ghost" className="flex items-center gap-2">
                <span className="material-symbols-outlined text-xl">add_circle</span>
                Agregar Materia
              </Button>
            </div>
          )
        ) : (
          <>
            {(semester.completed_subjects ?? []).map(subject => (
              <CompletedSubjectCard key={subject.plan_subject_id} subject={subject} />
            ))}
            {semester.subjects.map(subject =>
              readOnly ? (
                <SubjectCardReadOnly key={subject.plan_subject_id} subject={subject} />
              ) : (
                <SubjectCard key={subject.plan_subject_id} subject={subject} year={year} sem={name} />
              )
            )}
            {(semester.events ?? []).map(event =>
              readOnly ? (
                <FinalExamCardReadOnly key={`${event.event_type}-${event.academic_record_id}`} event={event} />
              ) : (
                <FinalExamCard key={`${event.event_type}-${event.academic_record_id}`} event={event} year={year} sem={name} />
              )
            )}
          </>
        )}
        {!readOnly && isError && errorMessage && (
          <div className="absolute bottom-0 left-0 right-0 bg-error text-on-error text-xs px-3 py-1.5 rounded-b-xl flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">error</span>
            {errorMessage}
          </div>
        )}
        {!readOnly && exceedsLimit && !isError && (
          <div className="absolute bottom-0 left-0 right-0 bg-error text-on-error text-xs px-3 py-1.5 rounded-b-xl flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">warning</span>
            Superás el límite de horas semanales
          </div>
        )}
      </div>
    </div>
  );
}
