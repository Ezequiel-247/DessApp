import { StatusBadge } from "@/widgets/ui/StatusBadge";
import { Tooltip } from "@/widgets/ui/Tooltip";
import type { InstituteDraft } from "../hooks/useInstitutesData";

interface Props {
  record: InstituteDraft;
  isActive: boolean;
  onSelect: (id: string) => void;
  statusVariant: string;
  statusLabel: string;
}

function abbreviateName(name: string): string {
  return name.replace(/^Instituto\s+/i, "Ins. ");
}

export function InstituteListItem({ record, isActive, onSelect, statusVariant, statusLabel }: Props) {
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
        onClick={() => onSelect(record.id)}
        className="w-full text-left space-y-1.5"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="font-title-sm text-title-sm text-on-surface flex items-center gap-1 min-w-0">
              <span className="truncate">{abbreviateName(record.name)}</span>
              <span className="text-on-surface-variant font-label-caps text-label-caps shrink-0">({record.shortName})</span>
            </h3>
            {record.notes && (
              <Tooltip content={<p className="text-body-sm">{record.notes}</p>}>
                <span className="material-symbols-outlined text-[16px] text-outline cursor-help shrink-0">info</span>
              </Tooltip>
            )}
          </div>
          <StatusBadge variant={statusVariant} label={statusLabel} className="shrink-0" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-body-sm text-on-surface-variant">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-outline">person</span>
            <span>{record.responsible}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-outline">pin_drop</span>
            <span>{record.address}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-outline">mail</span>
            <span>{record.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-outline">call</span>
            <span>{record.tel}</span>
          </div>
        </div>
      </button>
    </article>
  );
}
