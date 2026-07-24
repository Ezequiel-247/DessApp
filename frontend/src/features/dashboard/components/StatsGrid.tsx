import { Card } from "@/widgets/ui/Card/Card";

interface Stat {
  label: string;
  value: string | number;
  icon: string;
  trend?: string;
}

interface StatsGridProps {
  stats: Stat[];
}

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-md">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <div className="flex flex-col gap-xs">
            <div className="flex items-center justify-between">
              <span className="material-symbols-outlined text-primary text-2xl">
                {stat.icon}
              </span>
              {stat.trend && (
                <span className="text-xs text-secondary">{stat.trend}</span>
              )}
            </div>
            <div className="text-headline-md font-semibold text-on-surface">
              {stat.value}
            </div>
            <div className="text-body-sm text-on-surface-variant">
              {stat.label}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
