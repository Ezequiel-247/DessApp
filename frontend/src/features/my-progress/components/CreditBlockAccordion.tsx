import { useState } from "react";
import { Card } from "@/widgets/ui/Card";
import { CollapsibleContent } from "./CollapsibleContent";
import { SubjectsTable } from "./SubjectsTable";
import { BlockStateIcon } from "./BlockStateIcon";
import type { Subject } from "../model/progress";

interface Props {
  block: Subject;
  isOpen?: boolean;
  onToggle?: () => void;
}

export function CreditBlockAccordion({ block, isOpen: externalOpen, onToggle: externalToggle }: Props) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = externalOpen ?? internalOpen;
  const toggle = externalToggle ?? (() => setInternalOpen(!internalOpen));

  const poolActivities = block.pool_activities ?? [];
  const hasEnCurso = poolActivities.some(a => a.classification === "en_curso");

  return (
    <Card
      header={
        <button
          onClick={toggle}
          className="w-[calc(100%+40px)] flex items-center justify-between -m-5 p-5 hover:bg-slate-50 transition-colors rounded-t-xl"
        >
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <span className="flex-shrink-0">
              <BlockStateIcon
                type="credit"
                earnedCredits={block.earnedCredits ?? 0}
                minCreditsRequired={block.minCreditsRequired ?? null}
                hasEnCurso={hasEnCurso}
              />
            </span>
            <div className="min-w-0 text-left">
              <h4 className="min-w-0 truncate font-body-md font-bold text-on-surface">{block.name}</h4>
              <p className="text-body-sm text-on-surface-variant">
                {block.earnedCredits ?? 0}/{block.minCreditsRequired ?? 0} créditos
                {block.maxCreditsAllowed != null && block.maxCreditsAllowed !== block.minCreditsRequired && (
                  <span className="text-outline"> (máx. {block.maxCreditsAllowed})</span>
                )}
              </p>
            </div>
          </div>
          <span
            className="flex-shrink-0 material-symbols-outlined transition-transform duration-300"
            style={{
              transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            }}
          >
            expand_more
          </span>
        </button>
      }
      bodyClassName="px-0 py-0 overflow-visible"
    >
      <CollapsibleContent isOpen={isOpen}>
        {poolActivities.length === 0 ? (
          <p className="p-5 text-body-sm text-on-surface-variant">No hay actividades disponibles.</p>
        ) : (
          <SubjectsTable subjects={poolActivities} hasThead theadLabel="Actividad" />
        )}
      </CollapsibleContent>
    </Card>
  );
}
