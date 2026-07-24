import { useEffect, useMemo, useState } from "react";
import { Modal } from "@/widgets/ui/Modal";
import { Button } from "@/widgets/ui/Button";
import { Dropdown } from "@/widgets/ui/Dropdown";
import type { SabbaticalPeriod } from "../services/sabbaticalService";

interface Props {
  years: number[];
  currentPeriod?: { year: number; term: number } | null;
  sabbaticals: SabbaticalPeriod[];
  isSaving: boolean;
  onConfirm: (year: number, terms: number[]) => void;
  onCancelSabbatical: (year: number, term: number) => void;
  onClose: () => void;
}

const TERM_OPTIONS: { label: string; terms: number[] }[] = [
  { label: "1° Cuatrimestre", terms: [1] },
  { label: "2° Cuatrimestre", terms: [2] },
  { label: "Año completo", terms: [1, 2] },
];

function sameTerms(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((t) => b.includes(t));
}

function termLabel(term: number): string {
  return term === 1 ? "1° Cuatrimestre" : "2° Cuatrimestre";
}

export function SabbaticalModal({
  years,
  currentPeriod,
  sabbaticals,
  isSaving,
  onConfirm,
  onCancelSabbatical,
  onClose,
}: Props) {
  // `years` ahora puede incluir años ya cursados (aparecen en el cronograma en su
  // posición histórica) — no tiene sentido pedir un sabático en un período que ya pasó,
  // así que se ofrecen solo los años a partir del actual.
  const selectableYears = useMemo(
    () => (currentPeriod ? years.filter((y) => y >= currentPeriod.year) : years),
    [years, currentPeriod]
  );

  const [year, setYear] = useState(selectableYears[0] ?? years[0]);
  const [terms, setTerms] = useState<number[]>([1]);

  // Dentro del año actual, además hay que descartar los cuatrimestres que ya pasaron
  // (ej: si estamos en el 2do cuatrimestre, no se puede pedir sabático del 1ro ni del
  // año completo, que arrastraría el 1ro).
  const availableTermOptions = useMemo(
    () =>
      TERM_OPTIONS.filter((option) => {
        if (!currentPeriod || year > currentPeriod.year) return true;
        if (year < currentPeriod.year) return false;
        return option.terms.every((t) => t >= currentPeriod.term);
      }),
    [year, currentPeriod]
  );

  useEffect(() => {
    if (!availableTermOptions.some((option) => sameTerms(option.terms, terms))) {
      setTerms(availableTermOptions[0]?.terms ?? [1]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableTermOptions]);

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Periodo sabático"
      size="md"
      mobileFullScreen
      footer={
        <div className="flex gap-4">
          <Button variant="secondary" className="flex-1" onClick={onClose} disabled={isSaving}>
            <span className="material-symbols-outlined">close</span>
            Cerrar
          </Button>
          <Button variant="primary" className="flex-1" onClick={() => onConfirm(year, terms)} disabled={isSaving}>
            <span className="material-symbols-outlined">check</span>
            {isSaving ? "Guardando..." : "Tomar sabático"}
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        <p className="text-sm text-on-surface-variant">
          Marcá un período de descanso: el planificador vacía ese cuatrimestre (o el año completo) y corre
          el resto de las materias un lugar hacia abajo, sin reordenarlas entre sí.
        </p>

        <div className="flex flex-col gap-5 mt-5">
          <label className="flex-col flex gap-3">
            <span className="text-sm font-medium text-on-surface">Año</span>
          <Dropdown
            icon="calendar_month"
            value={year}
            onChange={(v) => setYear(Number(v))}
            options={selectableYears.map(y => ({ value: y, label: String(y) }))}
            hideAllOption
            className="mt-1"
          />
          </label>

          <label className="flex-col flex gap-3">
            <span className="text-sm font-medium text-on-surface">Periodo</span>
            <div className="mt-1 flex gap-2">
              {availableTermOptions.map((option) => (
                <Button
                  key={option.label}
                  variant={sameTerms(terms, option.terms) ? "primary" : "secondary"}
                  className="flex-1"
                  onClick={() => setTerms(option.terms)}
                  disabled={isSaving}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </label>
        </div>

        {sabbaticals.length > 0 && (
        <div>
          <span className="text-sm font-medium text-on-surface">Sabáticos activos</span>
          <ul className="mt-2 space-y-2">
            {sabbaticals.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between rounded-xl border border-outline-variant/40 bg-surface-container-low px-3 py-2 text-sm"
              >
                <span className="text-on-surface">
                  {s.year} · {termLabel(s.term)}
                </span>
                <button
                  type="button"
                  className="flex items-center gap-1 text-xs font-semibold text-error transition-colors hover:text-error/80 disabled:opacity-50"
                  onClick={() => onCancelSabbatical(s.year, s.term)}
                  disabled={isSaving}
                >
                  <span className="material-symbols-outlined text-[16px]">cancel</span>
                  Cancelar
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      </div>
    </Modal>
  );
}
