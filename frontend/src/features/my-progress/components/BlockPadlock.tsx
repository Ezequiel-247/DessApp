import { type Subject } from "../model/progress";
import { Tooltip } from "@/widgets/ui/Tooltip";

interface Props {
  block: Subject;
}

export function BlockPadlock({ block }: Props) {
  const pool = block.pool_subjects ?? [];
  const availableCount = pool.filter((s) => s.available).length;
  const totalCount = pool.length;

  const isGreen = availableCount === totalCount;
  const isRed = availableCount === 0;
  const color = isGreen ? "text-secondary" : isRed ? "text-error" : "text-warning";
  const icon = isGreen || !isRed ? "lock_open" : "lock";

  const message = isGreen
    ? "Todas las materias del bloque están disponibles"
    : isRed
      ? "Todas las materias del bloque están bloqueadas"
      : `Actualmente puedes cursar ${availableCount} de ${totalCount} materias del bloque`;

  return (
    <Tooltip content={<p className="text-on-surface">{message}</p>}>
      <span className={`material-symbols-outlined text-base ${color} cursor-help`}>
        {icon}
      </span>
    </Tooltip>
  );
}
