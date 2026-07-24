import { useState } from "react";
import { Modal } from "@/widgets/ui/Modal";
import { Button } from "@/widgets/ui/Button";
import { Toggle } from "@/widgets/ui/Toggle";
import type { UnahurBlock, UnahurChoice } from "../services/unahurChoiceService";
import type { SubjectClassification } from "../model/planner";

interface Props {
  blocks: UnahurBlock[];
  initialChoices: UnahurChoice[];
  unahurPoolPlanSubjects: { id: number; name: string; weekly_hours: number }[];
  classification?: Map<number, SubjectClassification> | null;
  isSaving: boolean;
  onSave: (selections: { unahurBlockId: number; planSubjectId: number }[]) => void;
  onClose: () => void;
}

function blockLabel(block: UnahurBlock): string {
  return block.suggested_term
    ? `Año ${block.suggested_year} - Cuatrimestre ${block.suggested_term}`
    : `Año ${block.suggested_year}`;
}

export function UnahurModal({
  blocks,
  initialChoices,
  unahurPoolPlanSubjects,
  classification,
  isSaving,
  onSave,
  onClose,
}: Props) {
  // Una materia ya cursada (registro académico existente, ej: importado de Excel) no
  // puede "no elegirse": queda bloqueada para que el estudiante no la desmarque por
  // error, ya que eso borraría un hecho ya ocurrido.
  function isLocked(planSubjectId: number): boolean {
    const status = classification?.get(planSubjectId);
    return Boolean(status && status !== "faltante");
  }

  const [selectedByBlock, setSelectedByBlock] = useState<Map<number, number | null>>(() => {
    const map = new Map<number, number | null>();
    for (const choice of initialChoices) {
      map.set(choice.id_unahur_block, choice.plan_subject_id);
    }
    return map;
  });

  const allChosenIds = new Set(selectedByBlock.values());

  function toggle(blockId: number, planSubjectId: number) {
    const current = selectedByBlock.get(blockId);
    // Si el bloque YA tiene una materia bloqueada (ya cursada), no se puede tocar ese
    // bloque en absoluto — ni desmarcarla haciendo click en ella misma, ni reemplazarla
    // haciendo click en otra opción del mismo bloque. Antes solo se chequeaba el primer
    // caso, así que elegir OTRA opción pisaba silenciosamente la ya cursada.
    if (current != null && isLocked(current)) return;

    setSelectedByBlock((prev) => {
      const next = new Map(prev);
      const current = next.get(blockId);
      if (current === planSubjectId) {
        next.set(blockId, null);
      } else {
        next.set(blockId, planSubjectId);
      }
      return next;
    });
  }

  async function handleSave() {
    const selections: { unahurBlockId: number; planSubjectId: number }[] = [];
    for (const [blockId, planSubjectId] of selectedByBlock) {
      if (planSubjectId != null) {
        selections.push({ unahurBlockId: blockId, planSubjectId });
      }
    }
    await onSave(selections);
    onClose();
  }

  function blockChosenId(blockId: number): number | null {
    return selectedByBlock.get(blockId) ?? null;
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Elegir materias UNAHUR"
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
        Elegí una materia UNAHUR para cada período. El planificador solo proyecta las que
        elijas — el resto de las opciones no aparece en tu cronograma. Una materia elegida
        en un período no puede volver a elegirse en otro.
      </p>

      {blocks.length === 0 && (
        <p className="text-sm text-on-surface-variant italic mb-6">
          Tu plan de estudios no tiene bloques UNAHUR configurados.
        </p>
      )}

      <div className="space-y-6">
        {blocks.map((block) => {
          const chosenId = blockChosenId(block.id);
          const count = chosenId != null ? 1 : 0;

          return (
            <div key={block.id}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-on-surface">{blockLabel(block)}</span>
                <span
                  className={`text-xs font-label-caps uppercase ${
                    count >= 1 ? "text-emerald-700" : "text-on-surface-variant"
                  }`}
                >
                  {count}/1 elegida
                </span>
              </div>
              <ul className="space-y-2">
                {unahurPoolPlanSubjects.map((option) => {
                  const isChosen = chosenId === option.id;
                  const isChosenElsewhere = !isChosen && allChosenIds.has(option.id);
                  const locked = isChosen && isLocked(option.id);

                  return (
                    <li
                      key={option.id}
                      onClick={() => toggle(block.id, option.id)}
                      className={`flex items-center justify-between gap-3 rounded-xl border px-5 py-3 text-sm transition-colors ${
                        locked ? "cursor-default" : "cursor-pointer"
                      } ${
                        isChosen
                          ? "border-outline-variant/40 bg-surface"
                          : "border-outline-variant/40 bg-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span onClick={(e) => e.stopPropagation()}>
                          <Toggle
                            checked={isChosen}
                            disabled={locked}
                            label=""
                            onChange={() => toggle(block.id, option.id)}
                          />
                        </span>
                        <span className="truncate text-on-surface">{option.name}</span>
                        {locked && (
                          <span className="text-xs text-on-surface-variant flex-shrink-0">(ya cursada)</span>
                        )}
                        {isChosenElsewhere && (
                          <span className="text-xs text-on-surface-variant flex-shrink-0">
                            (ya elegida en otro período)
                          </span>
                        )}
                      </div>
                      <span onClick={(e) => e.stopPropagation()} className="text-xs text-on-surface-variant flex-shrink-0 whitespace-nowrap">{option.weekly_hours}hs</span>
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
