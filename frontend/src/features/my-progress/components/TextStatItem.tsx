interface Props {
  title: string;
  subtitle: string;
  secondarySubtitle?: string;
  icon?: string;
  subtext?: string;
}

export function TextStatItem({ title, subtitle, secondarySubtitle, icon, subtext }: Props) {
  return (
    <div className="flex flex-col gap-4 h-full">
      {icon ? (
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-full bg-primary-container/10 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
              {icon}
            </span>
          </div>
          <p className="font-body-md font-bold text-on-surface">{title}</p>
        </div>
      ) : (
        <p className="font-body-md font-bold text-on-surface">{title}</p>
      )}
      <div>
        <p className="font-title-sm text-title-xs text-on-surface">{subtitle}</p>
        {secondarySubtitle && (
          <p className="font-title-sm text-title-xs text-on-surface mt-0.5">{secondarySubtitle}</p>
        )}
        {subtext && <p className="text-xs text-slate-400 mt-0.5">{subtext}</p>}
      </div>
    </div>
  );
}
