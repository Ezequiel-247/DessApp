import { useState } from "react";
import { StatusBadge } from "@/widgets/ui/StatusBadge";
import { type Subject } from "../model/progress";
import { LockWithTooltip } from "./LockWithTooltip";
import { BlockPadlock } from "./BlockPadlock";
import { BlockStateIcon } from "./BlockStateIcon";
import { CollapsibleContent } from "./CollapsibleContent";
import { table as t } from "@/shared/styles/table";

function isBlockEmpty(block: Subject): boolean {
  if (block.badge.label === "FINALIZADA" || block.badge.label === "EQUIVALENCIA") return false;
  const pool = block.pool_subjects ?? [];
  const active = pool.filter((s) => !s.consumed);
  return active.length === 0 || active.every((s) => s.badge.label === "FALTANTE");
}

interface Props {
  subjects: Subject[];
  hasThead?: boolean;
  theadLabel?: string;
}

export function SubjectsTable({ subjects, hasThead = true, theadLabel = "Materia" }: Props) {
  const [expandedBlock, setExpandedBlock] = useState<string | null>(null);

  return (
    <table className={t.root} style={{ tableLayout: "fixed" }}>
      {hasThead && (
        <thead className={t.thead}>
          <tr>
            <th className="py-5 px-5 font-normal w-[45%]">{theadLabel}</th>
            <th className="py-5 px-5 font-normal w-[20%]">Estado</th>
            <th className="py-5 px-5 font-normal text-right w-[17.5%]">Nota</th>
            <th className="py-5 px-5 font-normal text-right w-[17.5%]">Cred</th>
          </tr>
        </thead>
      )}
      <tbody>
        {subjects.flatMap((s) => {
          if (s.is_block) {
            if (s.block_type === "credit") return [];
            const pool = s.pool_subjects ?? [];
            const rows = [];
            rows.push(
              <tr
                key={s.name}
                onClick={() => pool.length > 0 && setExpandedBlock(expandedBlock === s.name ? null : s.name)}
                className={`border-t border-slate-50 ${pool.length > 0 ? "cursor-pointer hover:bg-slate-50 transition-colors" : ""}`}
              >
                <td className="py-3 px-5 font-medium min-w-0">
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="min-w-0 truncate">{s.name}</span>
                    <span className="flex-shrink-0">
                      {isBlockEmpty(s) ? <BlockPadlock block={s} /> : <BlockStateIcon block={s} />}
                    </span>
                  </span>
                </td>
                <td className="py-3 px-5" />
                <td className="py-3 px-5 text-right font-medium text-on-surface-variant" />
                <td className="py-3 px-5 text-right font-medium text-on-surface-variant pr-3">
                  {pool.length > 0 && (
                    <span className="material-symbols-outlined text-base text-on-surface-variant">
                      {expandedBlock === s.name ? "expand_less" : "expand_more"}
                    </span>
                  )}
                </td>
              </tr>
            );
            rows.push(
              <tr key={`${s.name}-pool`}>
                <td colSpan={4} className="p-0">
                  <CollapsibleContent isOpen={expandedBlock === s.name}>
                    <div className="divide-y divide-slate-50">
                      {pool.map((ps) => (
                        <div key={ps.name} className="flex items-center px-5 py-3 bg-surface-container/30">
                          <span className="flex w-[50%] min-w-0 items-center gap-2 pl-10 font-medium">
                            <span className="min-w-0 truncate">{ps.name}</span>
                            {!ps.is_block && ps.lockIcon && (
                              <span className="flex-shrink-0">
                                <LockWithTooltip icon={ps.lockIcon.icon} color={ps.lockIcon.color} prerequisites={!ps.available ? (ps.prerequisites ?? []) : []} />
                              </span>
                            )}
                          </span>
                          <span className="w-[20%] flex-shrink-0">
                            <StatusBadge variant={ps.badge.variant} label={ps.badge.label} />
                          </span>
                          <span className="w-[17.5%] flex-shrink-0 text-right font-medium text-on-surface-variant">{ps.grade}</span>
                          <span className="w-[17.5%] flex-shrink-0 text-right font-medium text-on-surface-variant">{ps.credits}</span>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </td>
              </tr>
            );
            return rows;
          }
          return (
            <tr key={s.name} className="border-t border-slate-50">
              <td className="py-3 px-5 font-medium min-w-0">
                <span className="flex items-center gap-2 min-w-0">
                  <span className="truncate">{s.name}</span>
                  {s.lockIcon && (
                    <span className="flex-shrink-0">
                      <LockWithTooltip icon={s.lockIcon.icon} color={s.lockIcon.color} prerequisites={!s.available ? (s.prerequisites ?? []) : []} />
                    </span>
                  )}
                </span>
              </td>
              <td className="py-3 px-5">
                <StatusBadge variant={s.badge.variant} label={s.badge.label} />
              </td>
              <td className="py-3 px-5 text-right font-medium text-on-surface-variant">{s.grade}</td>
              <td className="py-3 px-5 text-right font-medium text-on-surface-variant">{s.credits}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
