import { useState, Fragment } from "react";
import { CollapsibleContent } from "../CollapsibleContent";
import type { AddedSubject } from "./StepAddSubjects";
import type { UnahurBlockDraft, ElectiveBlockDraft } from "./StepCreateBlocks";
import type { CreditBlockDraft } from "./StepCreditBlocks";

interface Props {
  planDuration: number;
  addedSubjects: AddedSubject[];
  unahurBlocks: UnahurBlockDraft[];
  electiveBlocks: ElectiveBlockDraft[];
  creditBlocks: CreditBlockDraft[];
  electiveSubjects: { idx: number; name: string }[];
  currentStep: number;
  expandedYear: number | null;
  toggleYear: (year: number) => void;
  handleRemoveSubject: (idx: number) => void;
  showYears: boolean;
  showElectives: boolean;
  showActivities: boolean;
  showRemoveButtons: boolean;
  allActivities: { id: string; name: string }[];
  viewMode: string;
  setViewMode: (mode: string) => void;
  onSelectSubject?: (idx: number) => void;
  selectedSubjectIdx?: number | null;
  onSelectBlock?: (blockType: "unahur" | "elective" | "credit", blockIndex: number, yearNum?: number) => void;
  selectedBlockKey?: string | null;
  collapsible?: boolean;
  staticMode?: boolean;
  cardClassName?: string;
}

export function PlanBreakdownSection({
  planDuration,
  addedSubjects,
  unahurBlocks,
  electiveBlocks,
  creditBlocks,
  electiveSubjects,
  currentStep,
  expandedYear,
  toggleYear,
  handleRemoveSubject,
  showYears,
  showElectives,
  showActivities,
  showRemoveButtons,
  allActivities,
  viewMode,
  setViewMode,
  onSelectSubject,
  selectedSubjectIdx,
  onSelectBlock,
  selectedBlockKey,
  collapsible = true,
  staticMode = false,
  cardClassName = '',
}: Props) {
  const [expandedBlockKey, setExpandedBlockKey] = useState<string | null>(null);
  const toggleBlock = (key: string) => {
    setExpandedBlockKey((prev) => (prev === key ? null : key));
  };

  return (
    <div className="space-y-3">
      {(showYears || showElectives || showActivities) && (
        <div className="flex bg-slate-100 rounded-lg p-0.5 w-fit ml-5">
          {showYears && (
            <button
              type="button"
              onClick={() => setViewMode("years")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === "years"
                  ? "bg-white text-on-surface shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              Ver años
            </button>
          )}
          {showElectives && (
            <button
              type="button"
              disabled={electiveSubjects.length === 0}
              onClick={() => setViewMode("electives")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                electiveSubjects.length === 0
                  ? "opacity-50 cursor-not-allowed text-on-surface-variant"
                  : viewMode === "electives"
                    ? "bg-white text-on-surface shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              Ver electivas
            </button>
          )}
          {showActivities && (
            <button
              type="button"
              disabled={creditBlocks.length === 0}
              onClick={() => setViewMode("activities")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                creditBlocks.length === 0
                  ? "opacity-50 cursor-not-allowed text-on-surface-variant"
                  : viewMode === "activities"
                    ? "bg-white text-on-surface shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              Ver actividades
            </button>
          )}
        </div>
      )}

      {viewMode === "years" && planDuration > 0 && (
        <div className="space-y-3">
          {Array.from({ length: planDuration }, (_, i) => {
            const yearNum = i + 1;
            const yearSubjects = addedSubjects
              .map((s, idx) => ({ ...s, idx }))
              .filter((s) => s.year === yearNum && !s.isElective);
            const isOpen = expandedYear === yearNum;

            const hasUnahur = unahurBlocks.some((b) => b.suggestedYear === yearNum);
            const hasElective = electiveBlocks.some((b) => b.suggestedYear === yearNum);
            const hasBlocks = hasUnahur || hasElective;
            const hasContent = currentStep === 1
              ? yearSubjects.length > 0
              : currentStep === 2
                ? hasBlocks
                : currentStep === 4
                  ? yearSubjects.length > 0 || hasBlocks
                  : false;

            const blockCount = (hasUnahur ? 1 : 0) + (hasElective ? 1 : 0);

            return (
                <div
                  key={i}
                  className={`bg-surface-container-lowest border rounded-xl overflow-visible shadow-sm ${cardClassName ?? ''} transition-colors ${
                    staticMode ? "border-outline-variant" :
                    hasContent
                      ? isOpen
                        ? "border-primary-container"
                        : "border-primary-container hover:border-primary"
                      : "border-outline-variant opacity-60"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => collapsible && hasContent && toggleYear(yearNum)}
                    disabled={!collapsible || !hasContent}
                    className={`w-full flex items-center justify-between p-5 text-left ${collapsible && hasContent ? 'hover:bg-slate-50 transition-colors' : 'cursor-default'}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-body-md font-bold text-on-surface">{yearNum}° Año</span>
                      {!staticMode && collapsible && hasContent && (
                        <span className="text-xs text-on-surface-variant">
                          {currentStep === 1 && yearSubjects.length > 0 && `${yearSubjects.length} materia${yearSubjects.length !== 1 ? "s" : ""}`}
                          {currentStep === 2 && hasBlocks && `${blockCount} bloque${blockCount !== 1 ? "s" : ""}`}
                          {currentStep === 4 && yearSubjects.length > 0 && `${yearSubjects.length} materia${yearSubjects.length !== 1 ? "s" : ""}`}
                          {currentStep === 4 && yearSubjects.length > 0 && hasBlocks && " · "}
                          {currentStep === 4 && hasBlocks && `${blockCount} bloque${blockCount !== 1 ? "s" : ""}`}
                        </span>
                      )}
                    </div>
                    {collapsible && hasContent && (
                      <span
                        className="material-symbols-outlined transition-transform duration-300 text-on-surface-variant"
                        style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                      >
                        expand_more
                      </span>
                    )}
                  </button>

                 {(collapsible || staticMode) && currentStep !== 2 && yearSubjects.length > 0 && (
                  <CollapsibleContent isOpen={isOpen}>
                    <div className="border-t border-slate-100">
                      <div className="overflow-x-auto"><table className="min-w-full text-sm">
                        <thead className="text-left text-on-surface-variant font-label-caps border-b border-slate-100">
                          <tr>
                            <th className="py-3 px-5 font-normal w-[50%]">Materia</th>
                            <th className="py-3 font-normal w-[35%]">Correlativas</th>
                            <th className="py-3 px-5 font-normal text-right w-[15%]">Cred</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {staticMode && electiveBlocks.filter((b) => b.suggestedYear === yearNum).map((b, bi) => {
                            const blockKey = `se-${yearNum}-${bi}`;
                            const isBlockOpen = expandedBlockKey === blockKey;
                            const poolSubjects = b.poolSubjectIndices
                              .map((idx) => addedSubjects.find((s, si) => si === idx))
                              .filter(Boolean);
                            return (
                              <Fragment key={blockKey}>
                                <tr className="border-t border-slate-50">
                                  <td colSpan={3} className="py-3 px-5">
                                    <button
                                      type="button"
                                      onClick={() => toggleBlock(blockKey)}
                                          className="w-full flex items-center justify-between font-medium text-on-surface"
                                    >
                                      <span className="text-body-sm font-medium text-on-surface">{b.name}</span>
                                      {poolSubjects.length > 0 && (
                                        <span className="material-symbols-outlined transition-transform text-on-surface-variant text-[16px]"
                                          style={{ transform: isBlockOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
                                          expand_more
                                        </span>
                                      )}
                                    </button>
                                  </td>
                                </tr>
                                {isBlockOpen && poolSubjects.map((ps, pi) => (
                                  <tr key={`${blockKey}-${pi}`}>
                                    <td className="py-3 px-5 pl-10 font-medium text-on-surface">{ps.name}</td>
                                    <td className="py-3 text-on-surface-variant">
                                      {ps.correlatives.length === 0 ? <span>&mdash;</span> : (
                                        <div className="flex flex-col gap-0.5">
                                          {ps.correlatives.map((c, ci) => (
                                            <span key={ci}>{c.name} <span className="text-outline">({c.type})</span></span>
                                          ))}
                                        </div>
                                      )}
                                    </td>
                                    <td className="py-3 px-5 text-right font-medium text-on-surface-variant">{ps.credits} cr</td>
                                  </tr>
                                ))}
                              </Fragment>
                            );
                          })}
                          {yearSubjects.map((s) => (
                            <tr
                              key={s.idx}
                              onClick={() => !staticMode && onSelectSubject?.(s.idx)}
                              className={`transition-colors ${
                                staticMode
                                  ? ""
                                  : selectedSubjectIdx === s.idx
                                    ? "cursor-pointer bg-primary-container/10"
                                    : "cursor-pointer hover:bg-slate-50"
                              }`}
                            >
                              <td className="py-3 px-5 font-medium text-on-surface">
                                <div className="flex items-center gap-2">
                                  <span>{s.name}</span>
                                </div>
                              </td>
                              <td className="py-3 text-on-surface-variant">
                                {s.correlatives.length === 0 ? (
                                  <span>&mdash;</span>
                                ) : (
                                  <div className="flex flex-col gap-0.5">
                                    {s.correlatives.map((c, ci) => (
                                      <span key={ci}>
                                        {c.name} <span className="text-outline">({c.type})</span>
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </td>
                              <td className="py-3 px-5 text-right font-medium text-on-surface-variant">{s.credits} cr</td>
                            </tr>
                          ))}
                        </tbody>
                      </table></div>
                    </div>
                  </CollapsibleContent>
                )}

                {currentStep === 2 && !staticMode && collapsible && hasBlocks && (
                  <CollapsibleContent isOpen={isOpen}>
                    <div className="border-t border-slate-100 divide-y divide-slate-50">
                      {unahurBlocks.filter((b) => b.suggestedYear === yearNum).map((b, bi) => {
                        const blockKey = `u-${yearNum}-${bi}`;
                        return (
                          <button
                            key={blockKey}
                            type="button"
                            onClick={() => onSelectBlock?.("unahur", bi, yearNum)}
                            className={`w-full flex items-center justify-between py-3 px-5 text-left transition-colors ${
                              selectedBlockKey === blockKey
                                ? "bg-primary-container/10"
                                : "hover:bg-slate-50"
                            }`}
                          >
                            <span className="text-body-sm font-medium text-on-surface">Bloque UNAHUR</span>
                          </button>
                        );
                      })}
                      {electiveBlocks.filter((b) => b.suggestedYear === yearNum).map((b, bi) => {
                        const blockKey = `e-${yearNum}-${bi}`;
                        const isBlockOpen = expandedBlockKey === blockKey;
                        const poolSubjects = b.poolSubjectIndices
                          .map((idx) => addedSubjects.find((s, si) => si === idx))
                          .filter(Boolean);
                        return (
                          <div key={blockKey}>
                            <button
                              type="button"
                              onClick={() => { onSelectBlock?.("elective", bi, yearNum); toggleBlock(blockKey); }}
                              className={`w-full flex items-center justify-between py-3 px-5 text-left transition-colors ${
                                selectedBlockKey === blockKey
                                  ? "bg-primary-container/10"
                                  : "hover:bg-slate-50"
                              }`}
                            >
                              <span className="text-body-sm font-medium text-on-surface">{b.name}</span>
                              {poolSubjects.length > 0 && (
                                <span className="material-symbols-outlined transition-transform text-on-surface-variant text-[16px]"
                                  style={{ transform: isBlockOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
                                  expand_more
                                </span>
                              )}
                            </button>
                            {isBlockOpen && poolSubjects.length > 0 && (
                              <div className="border-t border-slate-100">
                                <div className="overflow-x-auto"><table className="min-w-full text-sm">
                                  <thead className="text-left text-on-surface-variant font-label-caps border-b border-slate-100">
                                    <tr>
                                      <th className="py-3 px-5 font-normal w-[50%]">Materia</th>
                                      <th className="py-3 font-normal w-[35%]">Correlativas</th>
                                      <th className="py-3 px-5 font-normal text-right w-[15%]">Cred</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-50">
                                    {poolSubjects.map((ps, pi) => (
                                      <tr key={pi}>
                                        <td className="py-3 px-5 font-medium text-on-surface">{ps.name}</td>
                                        <td className="py-3 text-on-surface-variant">
                                          {ps.correlatives.length === 0 ? <span>&mdash;</span> : (
                                            <div className="flex flex-col gap-0.5">
                                              {ps.correlatives.map((c, ci) => (
                                                <span key={ci}>{c.name} <span className="text-outline">({c.type})</span></span>
                                              ))}
                                            </div>
                                          )}
                                        </td>
                                        <td className="py-3 px-5 text-right font-medium text-on-surface-variant">{ps.credits} cr</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table></div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CollapsibleContent>
                )}
              </div>
            );
          })}
        </div>
      )}

      {viewMode === "electives" && electiveSubjects.length > 0 && (
        <div className={`bg-surface-container-lowest border border-outline-variant rounded-xl overflow-visible shadow-sm ${cardClassName ?? ''}`}>
          <div className="border-b border-slate-100 px-5 py-4">
            <h3 className="font-body-md font-bold text-on-surface">Materias electivas</h3>
          </div>
          <div className="">
            <div className="overflow-x-auto"><table className="min-w-full text-sm">
              <thead className="text-left text-on-surface-variant font-label-caps border-b border-slate-100">
                <tr>
                  <th className="py-3 px-5 font-normal w-[50%]">Materia</th>
                  <th className="py-3 font-normal w-[35%]">Correlativas</th>
                  <th className="py-3 px-5 font-normal text-right w-[15%]">Cred</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {electiveSubjects.map((s) => (
                  <tr
                    key={s.idx}
                    onClick={() => onSelectSubject?.(s.idx)}
                    className={`cursor-pointer transition-colors ${
                      selectedSubjectIdx === s.idx
                        ? "bg-primary-container/10"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <td className="py-3 px-5 font-medium text-on-surface">
                      <div className="flex items-center gap-2">
                        <span>{s.name}</span>
                      </div>
                    </td>
                    <td className="py-3 text-on-surface-variant">
                      {s.correlatives.length === 0 ? <span>&mdash;</span> : (
                        <div className="flex flex-col gap-0.5">
                          {s.correlatives.map((c, ci) => (
                            <span key={ci}>{c.name} <span className="text-outline">({c.type})</span></span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-5 text-right font-medium text-on-surface-variant">{s.credits} cr</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          </div>
        </div>
      )}

      {viewMode === "activities" && (
        <div className="space-y-3">
          {creditBlocks.length === 0 ? (
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5">
              <p className="text-body-sm text-on-surface-variant">No hay bloques de créditos en este plan.</p>
            </div>
          ) : staticMode ? (
            creditBlocks.map((b, i) => {
              const blockKey = `scb-${i}`;
              const isOpen = expandedBlockKey === blockKey;
              const activities = b.activityIds
                .map((id) => allActivities.find((a) => String(a.id) === id))
                .filter(Boolean);
              return (
                <div key={blockKey} className={`bg-surface-container-lowest border border-outline-variant rounded-xl overflow-visible shadow-sm ${cardClassName ?? ''}`}>
                  <button
                    type="button"
                    onClick={() => toggleBlock(blockKey)}
                    className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50 transition-colors"
                  >
                    <div>
                      <span className="font-body-md font-bold text-on-surface">{b.name}</span>
                      <span className="text-body-sm text-on-surface-variant font-normal ml-2">
                        · Se requieren {b.minCreditsRequired} créditos ({b.maxCreditsAllowed} máx)
                      </span>
                    </div>
                    {activities.length > 0 && (
                      <span className="material-symbols-outlined transition-transform text-on-surface-variant"
                        style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
                        expand_more
                      </span>
                    )}
                  </button>
                  {isOpen && activities.length > 0 && (
                    <div className="border-t border-slate-100">
                      <div className="overflow-x-auto"><table className="min-w-full text-sm">
                        <thead className="text-left text-on-surface-variant font-label-caps border-b border-slate-100">
                          <tr>
                            <th className="py-3 px-5 font-normal w-[70%]">Actividad</th>
                            <th className="py-3 px-5 font-normal text-right w-[30%]">Cred</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {activities.map((act) => (
                            <tr key={act.id}>
                              <td className="py-3 px-5 font-medium text-on-surface">{act.name}</td>
                              <td className="py-3 px-5 text-right font-medium text-on-surface-variant">
                                {b.activityCredits?.[String(act.id)] ? `${b.activityCredits[String(act.id)]} cr` : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table></div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            creditBlocks.map((b, i) => {
              const blockKey = `cb-${i}`;
              const isOpen = expandedBlockKey === blockKey;
              const activities = b.activityIds
                .map((id) => allActivities.find((a) => String(a.id) === id))
                .filter(Boolean);
              return (
                <div key={blockKey}
                  className={`bg-surface-container-lowest border rounded-xl overflow-visible shadow-sm ${cardClassName ?? ''} transition-colors ${
                    selectedBlockKey === blockKey ? "border-primary-container bg-primary-container/5" : "border-primary-container hover:border-primary"
                  }`}
                >
                  <div className={`flex items-center transition-colors ${
                    selectedBlockKey === blockKey ? "bg-primary-container/10" : ""
                  }`}>
                    <button
                      type="button"
                      onClick={() => onSelectBlock?.("credit", i)}
                      className={`flex-1 text-left py-5 ps-5 transition-colors ${
                        selectedBlockKey === blockKey ? "" : "hover:bg-slate-50"
                      }`}
                    >
                      <span className="font-body-md font-bold text-on-surface">{b.name}</span>
                      <span className="text-body-sm text-on-surface-variant font-normal ml-2">
                        · Se requieren {b.minCreditsRequired} créditos ({b.maxCreditsAllowed} máx)
                      </span>
                    </button>
                    {activities.length > 0 && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); toggleBlock(blockKey); }}
                        className={`p-5 transition-colors flex items-center justify-center ${
                          selectedBlockKey === blockKey ? "" : "hover:bg-slate-100"
                        }`}
                      >
                        <span className="material-symbols-outlined transition-transform"
                          style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
                          expand_more
                        </span>
                      </button>
                    )}
                  </div>
                  {isOpen && activities.length > 0 && (
                    <div className="border-t border-slate-100">
                      <div className="overflow-x-auto"><table className="min-w-full text-sm">
                        <thead className="text-left text-on-surface-variant font-label-caps border-b border-slate-100">
                          <tr>
                            <th className="py-3 px-5 font-normal w-[85%]">Actividad</th>
                            <th className="py-3 px-5 font-normal text-right w-[15%]">Cred</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {activities.map((act) => (
                            <tr key={act.id}>
                              <td className="py-3 px-5 font-medium text-on-surface">{act.name}</td>
                              <td className="py-3 px-5 text-right font-medium text-on-surface-variant">
                                {b.activityCredits?.[String(act.id)] ? `${b.activityCredits[String(act.id)]} cr` : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table></div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
