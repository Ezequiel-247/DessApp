import { useState } from "react";
import { Modal } from "@/widgets/ui/Modal";
import { Button } from "@/widgets/ui/Button";

interface Props {
  years: number[];
  isOptimizing: boolean;
  onConfirm: (startYear: number, startTerm: number) => void;
  onCancel: () => void;
}

export function OptimizePlanModal({ years, isOptimizing, onConfirm, onCancel }: Props) {
  const [startYear, setStartYear] = useState(years[Math.min(1, years.length - 1)] ?? years[0]);
  const [startTerm, setStartTerm] = useState(1);

  return (
    <Modal isOpen onClose={onCancel} title="Optimizar resto del plan" size="sm">
      <p className="text-sm text-on-surface-variant mb-6">
        El plan se regenerará automáticamente desde el cuatrimestre que elijas. Las materias que ya ubicaste antes de ese punto se conservarán.
      </p>

      <label className="block mb-4">
        <span className="text-sm font-medium text-on-surface">Año de inicio</span>
        <select
          className="mt-1 block w-full rounded-xl border border-outline-variant/40 bg-surface px-3 py-2 text-sm"
          value={startYear}
          onChange={(e) => setStartYear(Number(e.target.value))}
          disabled={isOptimizing}
        >
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </label>

      <label className="block mb-6">
        <span className="text-sm font-medium text-on-surface">Cuatrimestre</span>
        <div className="mt-1 flex gap-2">
          <button
            type="button"
            className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${startTerm === 1 ? "bg-primary text-on-primary border-primary" : "bg-surface text-on-surface-variant border-outline-variant/40"}`}
            onClick={() => setStartTerm(1)}
            disabled={isOptimizing}
          >
            1° Cuatrimestre
          </button>
          <button
            type="button"
            className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${startTerm === 2 ? "bg-primary text-on-primary border-primary" : "bg-surface text-on-surface-variant border-outline-variant/40"}`}
            onClick={() => setStartTerm(2)}
            disabled={isOptimizing}
          >
            2° Cuatrimestre
          </button>
        </div>
      </label>

      <div className="flex gap-4">
        <Button variant="secondary" className="flex-1" onClick={onCancel} disabled={isOptimizing}>
          Cancelar
        </Button>
        <Button variant="primary" className="flex-1" onClick={() => onConfirm(startYear, startTerm)} disabled={isOptimizing}>
          Optimizar
        </Button>
      </div>
    </Modal>
  );
}
