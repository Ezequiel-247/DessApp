import { type PrerequisiteItem } from "../model/progress";
import { Tooltip } from "@/widgets/ui/Tooltip";

interface Props {
  icon: string;
  color: string;
  prerequisites: PrerequisiteItem[];
}

export function LockWithTooltip({ icon, color, prerequisites }: Props) {
  const hasTooltip = prerequisites.length > 0 || icon === "lock";

  return (
    <Tooltip
      content={hasTooltip ? (
        prerequisites.length > 0 ? (
          <>
            <p className="font-semibold text-on-surface mb-2">Prerrequisitos:</p>
            <ul className="space-y-1.5">
              {prerequisites.map((p, i) => {
                const met = p.current_status === p.required_status;
                return (
                  <li key={i} className={met ? "text-secondary" : "text-error"}>
                    {met ? "✅ " : "❌ "}
                    {p.subject_name} ({p.required_status})
                  </li>
                );
              })}
            </ul>
          </>
        ) : (
          <p className="text-on-surface">Materia bloqueada — revisar correlativas</p>
        )
      ) : null}
    >
      <span className={`material-symbols-outlined text-base ${color} ${hasTooltip ? "cursor-help" : ""}`}>
        {icon}
      </span>
    </Tooltip>
  );
}
