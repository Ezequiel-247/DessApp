import type { Subject } from "@/entities/Subject";

interface Props {
  subject: Subject;
  isActive: boolean;
  onSelect: (id: string) => void;
}

export function SubjectListItem({ subject, isActive, onSelect }: Props) {
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
        onClick={() => onSelect(subject.id)}
        className="w-full text-left space-y-1.5"
      >
        <h3 className="font-title-sm text-title-sm text-on-surface line-clamp-2">
          {subject.name}
          <span className="text-on-surface-variant font-label-caps text-label-caps"> ({subject.code})</span>
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 text-body-sm text-on-surface-variant">
            <span className="material-symbols-outlined text-[16px] text-outline">schedule</span>
            <span>{subject.weeklyHours} hs/sem</span>
          </div>
          {subject.is_unahur && (
            <>
              <span className="text-on-surface-variant text-body-sm">•</span>
              <span className="rounded-full bg-primary-fixed/30 text-primary px-3 py-1 font-label-caps text-[10px]">
                UNAHUR
              </span>
            </>
          )}
        </div>
      </button>
    </article>
  );
}
