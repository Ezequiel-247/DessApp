function formatPercent(p: number): string {
  const fixed = p.toFixed(1);
  return fixed.endsWith("0") ? String(Math.round(p)) : fixed;
}

interface Props {
  percent: number;
}

export function ProgressRing({ percent }: Props) {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center">
      <svg className="w-40 h-40" viewBox="0 0 160 160">
        <circle
          className="text-slate-100"
          cx="80" cy="80" fill="transparent" r={radius}
          stroke="currentColor" strokeWidth="12"
        />
        <circle
          className="text-primary"
          cx="80" cy="80" fill="transparent" r={radius}
          stroke="currentColor"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          strokeWidth="12"
          style={{
            transform: "rotate(-90deg)",
            transformOrigin: "50% 50%",
            transition: "stroke-dashoffset 0.35s",
          }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-display-lg text-display-lg text-primary">
          {formatPercent(percent)}%
        </span>
        <span className="text-[10px] font-bold uppercase tracking-tighter text-slate-400">
          Completado
        </span>
      </div>
    </div>
  );
}
