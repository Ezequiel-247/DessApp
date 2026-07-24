import { useState } from "react";
import { Modal } from "@/widgets/ui/Modal";
import { Button } from "@/widgets/ui/Button";
import { Toggle } from "@/widgets/ui/Toggle";
import type { ElectiveBlock, ElectiveChoice } from "../services/electiveChoiceService";
import type { SubjectClassification } from "../model/planner";

interface Props {
  blocks: ElectiveBlock[];
  initialChoices: ElectiveChoice[];
  planSubjectInfoById: Map<number, { name: string; weekly_hours: number; credits: number }>;
  classification?: Map<number, SubjectClassification> | null;
  isSaving: boolean;
  onSave: (selections: { electiveBlockId: number; planSubjectId: number }[]) => void;
  onClose: () => void;
}

export function ElectiveModal({
  blocks,
  initialChoices,
  planSubjectInfoById,
  classification,
  isSaving,
  onSave,
  onClose,
}: Props) {
  // Una materia ya cursada (registro académico existente, ej: importado de Excel) no
  // puede "no elegirse": se pre-marca y queda bloqueada para que el estudiante no la
  // desmarque por error, ya que eso borraría un hecho ya ocurrido.
  function isLocked(planSubjectId: number): boolean {
    const status = classification?.get(planSubjectId);
    return Boolean(status && status !== "faltante");
  }

  const [selectedByBlock, setSelectedByBlock] = useState<Map<number, Set<number>>>(() => {
    const map = new Map<number, Set<number>>();
    for (const choice of initialChoices) {
      const set = map.get(choice.id_elective_block) ?? new Set();
      set.add(choice.plan_subject_id);
      map.set(choice.id_elective_block, set);
    }
    for (const block of blocks) {
      for (const link of block.PlanElectiveBlockSubjects ?? []) {
        if (isLocked(link.id_plan_subject)) {
          const set = map.get(block.id) ?? new Set();
          set.add(link.id_plan_subject);
          map.set(block.id, set);
        }
      }
    }
    return map;
  });

  function toggle(blockId: number, planSubjectId: number) {
    if (isLocked(planSubjectId)) return;

    const current = selectedByBlock.get(blockId) ?? new Set<number>();
    const alreadySelected = current.has(planSubjectId);
    const lockedCount = [...current].filter((id) => isLocked(id)).length;
    const block = blocks.find((b) => b.id === blockId);
    // Si las materias ya cursadas alcanzan (o superan) el mínimo del bloque, el bloque
    // ya está resuelto — no se puede sumar otra opción encima (quedaría pisando de
    // hecho el cupo de la ya cursada, aunque no se la borre a ella directamente).
    if (!alreadySelected && block && lockedCount >= block.min_required) return;

    setSelectedByBlock((prev) => {
      const next = new Map(prev);
      const current = new Set(next.get(blockId) ?? []);
      if (current.has(planSubjectId)) {
        current.delete(planSubjectId);
      } else {
        const block = blocks.find((b) => b.id === blockId);
        if (block && current.size >= block.min_required) {
          const first = [...current].find((id) => !isLocked(id));
          if (first != null) current.delete(first);
        }
        current.add(planSubjectId);
      }
      next.set(blockId, current);
      return next;
    });
  }

  async function handleSave() {
    const selections: { electiveBlockId: number; planSubjectId: number }[] = [];
    for (const [blockId, ids] of selectedByBlock) {
      for (const planSubjectId of ids) {
        selections.push({ electiveBlockId: blockId, planSubjectId });
      }
    }
    await onSave(selections);
    onClose();
  }

  function blockCount(blockId: number): number {
    return selectedByBlock.get(blockId)?.size ?? 0;
  }

  function isChosenInBlock(blockId: number, planSubjectId: number): boolean {
    return selectedByBlock.get(blockId)?.has(planSubjectId) ?? false;
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Elegir electivas"
      size="md"
      mobileFullScreen
      footer={
        <div className="flex gap-4">
          <Button variant="secondary" className="flex-1" onClick={onClose} disabled={isSaving}>
            <span className="material-symbols-outlined text-[24px]">close</span>
            Cancelar
          </Button>
          <Button variant="primary" className="flex-1" onClick={handleSave} disabled={isSaving}>
            <span className="material-symbols-outlined text-[24px]">check</span>
            {isSaving ? "Guardando..." : "Listo"}
          </Button>
        </div>
      }
    >
      <p className="text-sm text-on-surface-variant mb-6">
        Elegí las materias electivas que vas a cursar en cada bloque. El planificador solo
        proyecta las que elijas — el resto de las opciones no aparece en tu cronograma.
      </p>

      {blocks.length === 0 && (
        <p className="text-sm text-on-surface-variant italic mb-6">
          Tu plan de estudios no tiene bloques electivos configurados.
        </p>
      )}

      <div className="space-y-6">
        {blocks.map((block) => {
          const count = blockCount(block.id);
          const reachedLimit = count >= block.min_required;
          const lockedCount = [...(selectedByBlock.get(block.id) ?? [])].filter((id) => isLocked(id)).length;
          // El bloque ya está resuelto por materias ya cursadas (no por elecciones del
          // estudiante) — las demás opciones quedan sin sentido, se ven deshabilitadas.
          const resolvedByLocked = lockedCount >= block.min_required;

          return (
            <div key={block.id}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-on-surface">{block.name}</span>
                <span
                  className={`text-xs font-label-caps uppercase ${
                    reachedLimit ? "text-emerald-700" : "text-on-surface-variant"
                  }`}
                >
                  {count}/{block.min_required} elegidas
                </span>
              </div>
              <ul className="space-y-2">
                {(block.PlanElectiveBlockSubjects ?? []).map((link) => {
                  const info = planSubjectInfoById.get(link.id_plan_subject);
                  const chosen = isChosenInBlock(block.id, link.id_plan_subject);
                  const locked = isLocked(link.id_plan_subject);
                  const disabled = locked || (resolvedByLocked && !chosen);

                  return (
                    <li
                      key={link.id}
                      onClick={() => toggle(block.id, link.id_plan_subject)}
                      className={`flex items-center justify-between gap-3 rounded-xl border px-5 py-3 text-sm transition-colors ${
                        disabled ? "cursor-default opacity-60" : "cursor-pointer"
                      } ${
                        chosen
                          ? "border-outline-variant/40 bg-surface"
                          : "border-outline-variant/40 bg-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span onClick={(e) => e.stopPropagation()}>
                          <Toggle
                            checked={chosen}
                            disabled={disabled}
                            label=""
                            onChange={() => toggle(block.id, link.id_plan_subject)}
                          />
                        </span>
                        <span className="truncate text-on-surface">{info?.name ?? `Materia ${link.id_plan_subject}`}</span>
                        {locked && (
                          <span className="text-xs text-on-surface-variant flex-shrink-0">(ya cursada)</span>
                        )}
                      </div>
                      {info && <span onClick={(e) => e.stopPropagation()} className="text-xs text-on-surface-variant flex-shrink-0 whitespace-nowrap">{info.weekly_hours}hs</span>}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
