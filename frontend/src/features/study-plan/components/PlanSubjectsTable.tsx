import { useState } from "react";
import { CollapsibleContent } from "./CollapsibleContent";

export interface TableSubject {
  name: string;
  credits: number;
  correlatives: { name: string; type: string }[];
  isBlock?: boolean;
  blockType?: "unahur" | "elective";
  subtitle?: string;
  poolSubjects?: TableSubject[];
}

interface Props {
  subjects: TableSubject[];
  theadLabel?: string;
  hideCorrelatives?: boolean;
}

export function PlanSubjectsTable({ subjects, theadLabel = "Materia", hideCorrelatives = false }: Props) {
  const [expandedBlock, setExpandedBlock] = useState<string | null>(null);

  return (
    <table className="w-full text-sm" style={{ tableLayout: "fixed" }}>
      <thead className="text-left text-on-surface-variant font-label-caps border-b border-slate-100">
        <tr>
          <th className={`py-3 font-normal ${hideCorrelatives ? "w-[60%]" : "w-[45%]"}`}>{theadLabel}</th>
          {!hideCorrelatives && <th className="py-3 font-normal w-[37.5%]">Correlativas</th>}
          <th className={`py-3 font-normal text-right ${hideCorrelatives ? "w-[15%]" : "w-[17.5%]"}`}>Cred</th>
          {hideCorrelatives && <th className="py-3 w-[25%]" />}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-50">
        {subjects.flatMap((s) => {
          if (s.isBlock) {
            const isOpen = expandedBlock === s.name;
            const pool = s.poolSubjects ?? [];
            return [
              <tr
                key={s.name}
                onClick={() => pool.length > 0 && setExpandedBlock(isOpen ? null : s.name)}
                className={pool.length > 0 ? "cursor-pointer hover:bg-slate-50 transition-colors" : ""}
              >
                <td colSpan={!hideCorrelatives ? 2 : 1} className="py-3 font-medium text-on-surface">
                  {s.name}
                  {s.subtitle && (
                    <span className="text-body-sm text-on-surface-variant font-normal ml-2">{s.subtitle}</span>
                  )}
                </td>
                {hideCorrelatives && <td />}
                <td className="py-3 text-right font-medium text-on-surface-variant pr-3">
                  {pool.length > 0 && (
                    <span className="material-symbols-outlined text-base text-on-surface-variant">
                      {isOpen ? "expand_less" : "expand_more"}
                    </span>
                  )}
                </td>
                {hideCorrelatives && <td />}
              </tr>,
              ...(pool.length > 0
                ? [
                    <tr key={`${s.name}-pool`}>
                      <td colSpan={hideCorrelatives ? 4 : 3} className="p-0">
                        <CollapsibleContent isOpen={isOpen}>
                          <div className="border-t border-slate-50 divide-y divide-slate-50">
                            {pool.map((ps) => (
                              <div key={ps.name} className="flex items-center px-5 py-3 bg-surface-container/30">
                                <span className={`${hideCorrelatives ? "w-[60%]" : "w-[45%]"} pl-10 font-medium truncate text-on-surface`}>
                                  {ps.name}
                                </span>
                                {!hideCorrelatives && (
                                  <span className="w-[37.5%] text-on-surface-variant">
                                    {ps.correlatives.length === 0 ? (
                                      <span>&mdash;</span>
                                    ) : (
                                      <div className="flex flex-col gap-0.5">
                                        {ps.correlatives.map((c, i) => (
                                          <span key={i}>
                                            {c.name} <span className="text-outline">({c.type})</span>
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </span>
                                )}
                                <span className="w-[17.5%] text-right font-medium text-on-surface-variant">
                                  {ps.credits} cr
                                </span>
                                {hideCorrelatives && <span className="w-[25%]" />}
                              </div>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </td>
                    </tr>,
                  ]
                : []),
            ];
          }

          return (
            <tr key={s.name}>
              <td className="py-3 font-medium text-on-surface">{s.name}</td>
              {!hideCorrelatives && (
                <td className="py-3 text-on-surface-variant">
                  {s.correlatives.length === 0 ? (
                    <span>&mdash;</span>
                  ) : (
                    <div className="flex flex-col gap-0.5">
                      {s.correlatives.map((c, i) => (
                        <span key={i}>
                          {c.name} <span className="text-outline">({c.type})</span>
                        </span>
                      ))}
                    </div>
                  )}
                </td>
              )}
              <td className="py-3 text-right font-medium text-on-surface-variant">{s.credits} cr</td>
              {hideCorrelatives && <td />}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
