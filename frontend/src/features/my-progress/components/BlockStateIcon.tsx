import { type Subject } from "../model/progress";

type Props =
  | {
      type: "year";
      subjects: Subject[];
    }
  | {
      type: "credit";
      earnedCredits: number;
      minCreditsRequired: number | null;
      hasEnCurso: boolean;
    }
  | {
      block: Subject;
    };

function iconForState(state: "completed" | "in_progress" | "pending") {
  if (state === "completed") {
    return {
      icon: "check_circle" as const,
      bg: "bg-secondary-container/20",
      color: "text-secondary",
    };
  }
  if (state === "in_progress") {
    return {
      icon: "trending_up" as const,
      bg: "bg-primary-container/20",
      color: "text-primary",
    };
  }
  return {
    icon: "horizontal_rule" as const,
    bg: "bg-slate-100",
    color: "text-slate-400",
  };
}

export function BlockStateIcon(props: Props) {
  if ("type" in props) {
    let state: "completed" | "in_progress" | "pending";

    if (props.type === "year") {
      const { subjects } = props;
      const allCompleted = subjects.every(
        s => s.classification === "finalizada" || s.classification === "equivalencia"
      );
      const hasActive = subjects.some(
        s => s.classification === "regularizada" || s.classification === "en_curso"
      );

      if (allCompleted) {
        state = "completed";
      } else if (hasActive) {
        state = "in_progress";
      } else {
        state = "pending";
      }
    } else {
      const { earnedCredits, minCreditsRequired, hasEnCurso } = props;
      const minRequired = minCreditsRequired ?? 0;
      if (minRequired > 0 ? earnedCredits >= minRequired : earnedCredits > 0) {
        state = "completed";
      } else if (earnedCredits > 0 || hasEnCurso) {
        state = "in_progress";
      } else {
        state = "pending";
      }
    }

    const { icon, bg, color } = iconForState(state);

    return (
      <div className={`w-8 h-8 rounded-full ${bg} flex items-center justify-center ${color}`}>
        <span
          className="material-symbols-outlined text-sm"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          {icon}
        </span>
      </div>
    );
  }

  // Legacy: used inside SubjectsTable for UNAHUR/elective block rows
  const block = (props as { block: Subject }).block;
  const pool = block.pool_subjects ?? [];
  const active = pool.filter((s) => !s.consumed);

  const isCompleted =
    block.badge.label === "FINALIZADA" ||
    block.badge.label === "EQUIVALENCIA" ||
    active.some((s) => s.badge.label === "FINALIZADA" || s.badge.label === "EQUIVALENCIA");

  const isRegularizada = active.some((s) => s.badge.label === "REGULARIZADA");

  if (isCompleted) {
    return (
      <span className="material-symbols-outlined text-base text-secondary">
        check_circle
      </span>
    );
  }

  if (isRegularizada) {
    return (
      <span className="material-symbols-outlined text-base text-amber-500">
        hourglass_empty
      </span>
    );
  }

  return (
    <span className="material-symbols-outlined text-base text-primary">
      hourglass_empty
    </span>
  );
}
