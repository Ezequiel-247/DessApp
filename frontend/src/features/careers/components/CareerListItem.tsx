import { Tooltip } from "@/widgets/ui/Tooltip";
import type { CareerDraft } from "../hooks/useCareersData";

interface Props {
  career: CareerDraft;
  isActive: boolean;
  onSelect: (id: string) => void;
  formatInstituteName: (id: string) => string;
}

export function CareerListItem({ career, isActive, onSelect, formatInstituteName }: Props) {
  return (
    <article
      className={`rounded-xl border px-5 py-3 transition-colors ${
        isActive
          ? "border-primary-container bg-primary-container/5"
          : "border-outline-variant bg-surface-container-lowest hover:border-primary-container/40"
      }`}
    >
      <button
        type="button"
        onClick={() => onSelect(career.id)}
        className="w-full text-left space-y-1.5"
      >
        <h3 className="font-title-sm text-title-sm text-on-surface line-clamp-2">
          {career.name}
          {career.code ? <span className="text-on-surface-variant font-label-caps text-label-caps"> ({career.code})</span> : null}
        </h3>

        <div className="flex items-center gap-2 text-body-sm text-on-surface-variant">
          <span className="material-symbols-outlined text-[16px] text-outline">school</span>
          <span>{career.degreeTitle}</span>
        </div>

        <div className="flex items-center gap-2 text-body-sm text-on-surface-variant">
          <span className="material-symbols-outlined text-[16px] text-outline">apartment</span>
          <span>{formatInstituteName(career.instituteId)}</span>
        </div>

        <div className="flex items-center text-body-sm text-on-surface-variant">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-outline">schedule</span>
            <span>{career.duration} años</span>
          </div>
          <span className="mx-2">•</span>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-outline">assignment</span>
            <span>{career.plans.length} planes</span>
          </div>
          {career.description && (
            <>
              <span className="mx-2 hidden sm:inline">•</span>
              <span className="hidden sm:inline">
                <Tooltip content={<p className="text-body-sm">{career.description}</p>}>
                  <span className="material-symbols-outlined text-[16px] text-outline cursor-help">info</span>
                </Tooltip>
              </span>
            </>
          )}
        </div>
      </button>
    </article>
  );
}
