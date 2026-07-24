import { ProgressRing } from "./ProgressRing";

interface BlockDef {
  label: string;
  total: number;
  approved: number;
  color: string;
}

function ThinBar({ label, total, approved, color }: BlockDef) {
  const pct = total > 0 ? Math.round((approved / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-slate-500 w-28 flex-shrink-0 truncate">
        {label}
      </span>
      <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs font-semibold text-slate-600 w-9 text-right">
        {pct}%
      </span>
    </div>
  );
}

interface Props {
  percent: number;
  mandatory: { total: number; approved: number };
  unahur?: { total: number; approved: number };
  elective?: { total: number; approved: number };
  credit?: { total: number; approved: number };
}

export function DetailedProgressItem({ percent, mandatory, unahur, elective, credit }: Props) {
  const blocks: BlockDef[] = [
    { label: "Materias", ...mandatory, color: "#1e88e5" },
    ...(unahur && unahur.total > 0 ? [{ label: "Materias UNAHUR", ...unahur, color: "#43a047" }] : []),
    ...(elective && elective.total > 0 ? [{ label: "Electivas", ...elective, color: "#fb8c00" }] : []),
    ...(credit && credit.total > 0 ? [{ label: "Bloques de Créditos", ...credit, color: "#8e24aa" }] : []),
  ];

  return (
    <div className="space-y-3">
      <h3 className="font-body-md font-bold text-on-surface text-center">Avance General</h3>
      <div className="flex items-center gap-6">
        <ProgressRing percent={percent} />
        <div className="flex-1 space-y-2.5 min-w-0">
          {blocks.map((b) => (
            <ThinBar key={b.label} {...b} />
          ))}
        </div>
      </div>
    </div>
  );
}
