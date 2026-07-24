import type { Activity } from "@/entities/Activity";

interface Props {
  activity: Activity;
  isActive: boolean;
  onSelect: (id: string) => void;
}

export function ActivityListItem({ activity, isActive, onSelect }: Props) {
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
        onClick={() => onSelect(activity.id)}
        className="w-full text-left space-y-1.5"
      >
        <h3 className="font-title-sm text-title-sm text-on-surface line-clamp-2">
          {activity.name}
          {activity.code && <span className="text-on-surface-variant font-label-caps text-label-caps"> ({activity.code})</span>}
        </h3>
        {activity.description && (
          <p className="text-body-sm text-on-surface-variant line-clamp-2 flex items-start gap-2">
            <span className="material-symbols-outlined text-[16px] text-outline shrink-0 mt-0.5">info</span>
            <span>{activity.description}</span>
          </p>
        )}
      </button>
    </article>
  );
}
