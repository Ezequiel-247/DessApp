import { useState, useEffect, useCallback } from "react";
import { SegmentedControl } from "@/widgets/ui/SegmentedControl";
import { type PendingFinal } from "../model/progress";

interface Props {
  finals: PendingFinal[];
  className?: string;
}

type FinalsViewMode = "exact" | "countdown";

function formatCountdown(expiresAt: string): string {
  const diffMs = new Date(expiresAt).getTime() - new Date().getTime();
  if (diffMs <= 0) return "Vencida";
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 30) {
    return `Vence en ${diffDays} día${diffDays !== 1 ? "s" : ""}`;
  }
  if (diffDays <= 365) {
    const months = Math.round(diffDays / 30);
    return `Vence en ${months} mes${months !== 1 ? "es" : ""}`;
  }
  const years = Math.floor(diffDays / 365);
  const remainingMonths = Math.round((diffDays % 365) / 30);
  let result = `Vence en ${years} año${years !== 1 ? "s" : ""}`;
  if (remainingMonths > 0) {
    result += ` y ${remainingMonths} mes${remainingMonths !== 1 ? "es" : ""}`;
  }
  return result;
}

function FinalCard({ pf, viewMode }: { pf: PendingFinal; viewMode: FinalsViewMode }) {
  const dateClass = pf.isUrgent ? "text-error" : "";
  const dateLabel = viewMode === "countdown" && pf.expiresAt
    ? formatCountdown(pf.expiresAt)
    : `Vence en ${pf.expires}`;

  return (
    <div className="p-4 rounded-xl shadow-sm relative overflow-hidden bg-tertiary-fixed/10 border border-tertiary-fixed-dim/30">
      <div className="absolute right-0 top-0 w-1 h-full bg-tertiary-fixed-dim" />
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <h5 className="font-body-md font-bold text-on-surface">{pf.name}</h5>
          <div className="mt-2 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-on-surface-variant">
                <span className={`font-bold ${dateClass}`}>{dateLabel}</span>
              </span>
              <span className="text-on-surface-variant">
                {pf.attempts.current > 0
                  ? `${pf.attempts.current} intentos previos`
                  : "Sin intentos previos"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const STORAGE_KEY = "progress_finals_view_mode";

export function PendingFinalsSection({ finals, className = "" }: Props) {
  const [viewMode, setViewMode] = useState<FinalsViewMode>("exact");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "exact" || saved === "countdown") {
      setViewMode(saved);
    }
  }, []);

  const handleToggle = useCallback((mode: FinalsViewMode) => {
    setViewMode(mode);
    localStorage.setItem(STORAGE_KEY, mode);
  }, []);

  // Only show non-expired finals
  const vigentes = finals.filter((pf) => !pf.is_expired);
  const empty = vigentes.length === 0;

  return (
    <section className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-tertiary-container">warning</span>
          <h3 className="font-title-sm text-title-sm text-on-surface">Finales Pendientes</h3>
        </div>
        {!empty && (
          <SegmentedControl
            value={viewMode}
            onChange={handleToggle}
            options={[
              { value: "exact", label: "Fecha" },
              { value: "countdown", label: "Cuenta" },
            ]}
          />
        )}
      </div>
      {empty ? (
        <div className="bg-tertiary-fixed/10 border border-tertiary-fixed-dim/30 p-4 rounded-xl shadow-sm flex items-center gap-4">
          <span className="material-symbols-outlined text-2xl text-secondary">check_circle</span>
          <div>
            <p className="font-body-md font-bold text-on-surface">¡Enhorabuena, no tienes finales pendiente!</p>
            <p className="text-xs text-on-surface-variant">Todas tus regularidades están al día.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {vigentes.map((pf) => (
            <FinalCard key={pf.name} pf={pf} viewMode={viewMode} />
          ))}
        </div>
      )}
    </section>
  );
}
