import { ProgressRing } from "./ProgressRing";

interface Props {
  percent: number;
  completedUnits: number;
  totalUnits: number;
  accumulatedCredits: number;
  totalCredits: number;
}

export function SimplifiedProgressItem({
  percent,
  completedUnits,
  totalUnits,
  accumulatedCredits,
  totalCredits,
}: Props) {
  const unitPct = totalUnits > 0 ? Math.round((completedUnits / totalUnits) * 100) : 0;
  const creditPct = totalCredits > 0 ? Math.round((accumulatedCredits / totalCredits) * 100) : 0;

  return (
    <div className="space-y-3">
      <h3 className="font-body-md font-bold text-on-surface text-center">Avance General</h3>
      <div className="flex items-center gap-6">
        <ProgressRing percent={percent} />
        <div className="flex-1 space-y-3 min-w-0">
          <div>
            <p className="text-xs text-slate-500 font-medium mb-1">
              {completedUnits} de {totalUnits} unidades completadas
            </p>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-primary h-full rounded-full transition-all duration-500"
                style={{ width: `${unitPct}%` }}
              />
            </div>
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium mb-1">
              Créditos Obtenidos
            </p>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-amber-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${creditPct}%` }}
              />
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {accumulatedCredits} / {totalCredits} cr
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
