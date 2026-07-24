import { useState } from "react";

export type CorrelativityCandidate = {
  id: string;
  name: string;
  code?: string;
};

type CorrelativityModalMode = "add" | "edit";

type Props = {
  mode: CorrelativityModalMode;
  candidates: CorrelativityCandidate[];
  initialType?: string;
  initialRequiredId?: string;
  onConfirm: (requiredPlanSubjectId: string, type: string) => void;
  onClose: () => void;
};

const CORR_TYPES = [
  { value: "", label: "Sin especificar" },
  { value: "regularidad", label: "Regularidad" },
  { value: "finalizada", label: "Finalizada" },
];

export function CorrelativityModal({
  mode,
  candidates,
  initialType = "",
  initialRequiredId = "",
  onConfirm,
  onClose,
}: Props) {
  const [requiredId, setRequiredId] = useState(initialRequiredId);
  const [type, setType] = useState(initialType);

  const isValid = mode === "add" ? requiredId !== "" : true;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    onConfirm(requiredId, type);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-2xl bg-surface-container-lowest p-6 shadow-xl">
        <h3 className="font-title-sm text-title-sm text-on-surface mb-4">
          {mode === "add" ? "Agregar correlativa" : "Editar correlativa"}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] uppercase tracking-wider text-on-surface-variant font-label-caps">
              Materia requerida
            </span>
            {mode === "edit" ? (
              <div className="w-full rounded-lg border border-outline-variant bg-surface-container px-4 py-3 text-body-md text-on-surface/60">
                {candidates.find((c) => String(c.id) === requiredId)?.name ?? "—"}
              </div>
            ) : (
              <select
                value={requiredId}
                onChange={(e) => setRequiredId(e.target.value)}
                className="w-full rounded-lg border border-outline-variant bg-surface-bright px-4 py-3 text-body-md text-on-surface outline-none"
              >
                <option value="">Seleccionar materia…</option>
                {candidates.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.code ? `(${c.code})` : ""}
                  </option>
                ))}
              </select>
            )}
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] uppercase tracking-wider text-on-surface-variant font-label-caps">
              Tipo
            </span>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-lg border border-outline-variant bg-surface-bright px-4 py-3 text-body-md text-on-surface outline-none"
            >
              {CORR_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-outline-variant px-4 py-2 font-label-caps text-label-caps text-on-surface-variant"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!isValid}
              className="rounded-full bg-primary px-5 py-2 font-label-caps text-label-caps text-on-primary disabled:opacity-50"
            >
              {mode === "add" ? "Agregar" : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
