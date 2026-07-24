import { useDraggable } from "@dnd-kit/core";
import { useState } from "react";
import type { PlannedSubject } from "../model/planner";

interface Props {
  subject: PlannedSubject;
  year: number;
  sem: string;
}

const baseCardClasses =
  "flex-1 min-w-[180px] max-w-[280px] bg-surface border border-outline-variant/50 p-2 rounded-xl shadow-sm hover:border-primary/30 transition-all group relative flex items-center gap-2 select-none";

function blockAccentClasses(blockType?: 'unahur' | 'elective'): string {
  if (blockType === 'elective') return "border-l-4 border-l-emerald-500";
  if (blockType === 'unahur') return "border-l-4 border-l-slate-400";
  return "border-l-4 border-l-primary-container";
}

function BlockTag({ blockType }: { blockType?: 'unahur' | 'elective' }) {
  if (!blockType) return null;
  const isElective = blockType === 'elective';
  return (
    <div className={`text-[10px] font-label-caps uppercase ${isElective ? "text-emerald-700" : "text-slate-600"}`}>
      {isElective ? "Electiva" : "UNAHUR"}
    </div>
  );
}

export function SubjectCardContent({ subject, className = "" }: { subject: PlannedSubject; className?: string }) {
  return (
    <div className={`${baseCardClasses} ${blockAccentClasses(subject.block_type)} ${className}`}>
      <div className="flex-shrink-0 text-outline-variant/60">
        <span className="material-symbols-outlined text-[16px]">drag_indicator</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-title-sm text-primary truncate">{subject.subject_name}</div>
        <div className="text-body-sm text-on-surface-variant">{subject.weekly_hours}hs</div>
        <BlockTag blockType={subject.block_type} />
      </div>
    </div>
  );
}

export function SubjectCard({
  subject,
  year,
  sem,
}: Props) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: subject.plan_subject_id,
    data: { year, sem },
  });

  const [showWeightTooltip, setShowWeightTooltip] = useState(false);

  return (
    <div
      ref={setNodeRef}
      className={`${baseCardClasses} ${blockAccentClasses(subject.block_type)} ${isDragging ? "opacity-20" : ""} group relative`}
    >
      <div
        className="flex-shrink-0 p-2 -m-2 touch-none cursor-grab active:cursor-grabbing text-outline-variant/60 group-hover:text-primary/40 transition-colors"
        {...listeners}
        {...attributes}
      >
        <span className="material-symbols-outlined text-[16px]">drag_indicator</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-title-sm text-primary truncate">{subject.subject_name}</div>
        <div className="text-body-sm text-on-surface-variant">{subject.weekly_hours}hs</div>
        <BlockTag blockType={subject.block_type} />
      </div>

      {/* Weight indicator tooltip */}
      {subject.weight != null && (
        <div
          className="flex-shrink-0 relative"
          onMouseEnter={() => setShowWeightTooltip(true)}
          onMouseLeave={() => setShowWeightTooltip(false)}
        >
          <span
            className="text-xs font-semibold text-primary/60 cursor-help"
            title={`${subject.weight} materias dependen de esta`}
          >
            W{subject.weight}
          </span>
          {showWeightTooltip && (
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-surface-container-highest text-on-surface text-xs px-2 py-1 rounded whitespace-nowrap shadow-lg z-10">
              {subject.weight} materias dependen de esta
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const readOnlyCardClasses =
  "flex-1 min-w-[180px] max-w-[280px] bg-surface border border-outline-variant/50 p-2 rounded-xl shadow-sm group relative flex items-center gap-2 select-none";

export function SubjectCardReadOnly({ subject }: { subject: PlannedSubject }) {
  return (
    <div className={`${readOnlyCardClasses} ${blockAccentClasses(subject.block_type)}`}>
      <div className="flex-shrink-0 text-outline-variant/60 invisible">
        <span className="material-symbols-outlined text-[16px]">drag_indicator</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-title-sm text-primary truncate">{subject.subject_name}</div>
        <div className="text-body-sm text-on-surface-variant">{subject.weekly_hours}hs</div>
        <BlockTag blockType={subject.block_type} />
      </div>
    </div>
  );
}

const completedCardClasses =
  "flex-1 min-w-[180px] max-w-[280px] bg-surface-container-low/70 border border-outline-variant/30 p-2 rounded-xl relative flex items-center gap-2 select-none cursor-default";

const completedStatusLabel: Record<string, string> = {
  finalizada: "Finalizada",
  regularizada: "Regularizada",
  enrolled: "Cursando",
};

/** Materia ya cursada (registro académico real), ubicada en su período histórico —
 *  sin drag, en gris, con el estado real como etiqueta (no solo color, por accesibilidad). */
export function CompletedSubjectCard({ subject }: { subject: PlannedSubject }) {
  const label = subject.completed_status ? completedStatusLabel[subject.completed_status] : null;

  return (
    <div className={`${completedCardClasses} ${blockAccentClasses(subject.block_type)} opacity-70`}>
      <div className="flex-shrink-0 text-outline-variant/50">
        <span className="material-symbols-outlined text-[16px]">lock</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-title-sm text-on-surface-variant truncate">{subject.subject_name}</div>
        <div className="text-body-sm text-on-surface-variant/70">{subject.weekly_hours}hs</div>
        <BlockTag blockType={subject.block_type} />
      </div>
      {label && (
        <span className="text-[10px] font-label-caps uppercase text-on-surface-variant/80 flex-shrink-0 whitespace-nowrap">
          {label}
        </span>
      )}
    </div>
  );
}
