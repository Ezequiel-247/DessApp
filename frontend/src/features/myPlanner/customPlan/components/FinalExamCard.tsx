import { useDraggable } from "@dnd-kit/core";
import type { PlannedEvent } from "../model/planner";

interface Props {
  event: PlannedEvent;
  year: number;
  sem: string;
}

export const FINAL_DRAG_ID_PREFIX = "final-";

export function finalDragId(event: PlannedEvent): string {
  return `${FINAL_DRAG_ID_PREFIX}${event.academic_record_id}`;
}

export function isFinalDragId(id: string | number): boolean {
  return typeof id === "string" && id.startsWith(FINAL_DRAG_ID_PREFIX);
}

const baseCardClasses =
  "flex-1 min-w-[180px] max-w-[280px] border border-amber-300/60 bg-amber-50 p-2 rounded-xl shadow-sm flex items-center gap-2 select-none";

export function FinalExamCard({ event, year, sem }: Props) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: finalDragId(event),
    data: {
      year,
      sem,
      dueDate: event.due_date,
      academicRecordId: event.academic_record_id,
      finalExamId: event.final_exam_id,
      regularizedYear: event.regularized_year,
      regularizedSemester: event.regularized_semester,
      subjectName: event.subject_name,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={`${baseCardClasses} ${isDragging ? "opacity-20" : ""} group relative`}
    >
      <div
        className="flex-shrink-0 p-2 -m-2 touch-none cursor-grab active:cursor-grabbing text-amber-700/50 group-hover:text-amber-700 transition-colors"
        {...listeners}
        {...attributes}
      >
        <span className="material-symbols-outlined text-[16px]">drag_indicator</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-title-sm text-amber-900 truncate">Final de {event.subject_name}</div>
        <div className="text-body-sm text-amber-700">Pendiente</div>
      </div>
    </div>
  );
}

export function FinalExamCardReadOnly({ event }: { event: PlannedEvent }) {
  return (
    <div className={baseCardClasses}>
      <div className="flex-shrink-0 text-amber-700/50">
        <span className="material-symbols-outlined text-[16px]">event_note</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-title-sm text-amber-900 truncate">Final de {event.subject_name}</div>
        <div className="text-body-sm text-amber-700">Pendiente</div>
      </div>
    </div>
  );
}
