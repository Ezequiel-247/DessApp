export interface SectionTab {
  id: string;
  label: string;
  icon: string;
}

interface SectionTabsProps {
  tabs: SectionTab[];
  activeTab: string;
  onChange: (id: string) => void;
}

export function SectionTabs({ tabs, activeTab, onChange }: SectionTabsProps) {
  return (
    <div className="flex items-center gap-1 bg-surface-container-low rounded-full p-1 max-w-full overflow-x-auto">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-label-caps text-label-caps transition-colors whitespace-nowrap shrink-0 ${
              isActive
                ? "bg-primary-container text-on-primary-container shadow-sm"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}