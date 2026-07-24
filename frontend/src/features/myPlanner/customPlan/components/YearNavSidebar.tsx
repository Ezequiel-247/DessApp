import { scrollToYear } from "../utils/dom";

interface Props {
  years: number[];
  activeYear: number;
  onSelectYear: (year: number) => void;
}

export function YearNavSidebar({ years, activeYear, onSelectYear }: Props) {
  return (
    <aside className="w-20 border-r border-outline-variant/30 bg-surface flex flex-col py-6 items-center gap-6">
      <div className="flex flex-col items-center gap-4 w-full">
        {years.map((yr) => {
          const lastTwo = yr % 100;
          const isActive = yr === activeYear;
          const isLocked = yr > Math.max(...years);

          return (
            <button
              key={yr}
              onClick={() => {
                onSelectYear(yr);
                scrollToYear(yr);
              }}
              className={`w-12 h-12 flex flex-col items-center justify-center rounded-xl transition-all ${
                isActive
                  ? "bg-primary text-on-primary shadow-md"
                  : isLocked
                  ? "text-on-surface opacity-40"
                  : "text-on-surface hover:bg-surface-container"
              }`}
            >
              <span className="text-[10px] font-label-caps leading-none mb-0.5">AÑO</span>
              <span className="font-bold text-sm">{lastTwo < 10 ? `0${lastTwo}` : lastTwo}</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
