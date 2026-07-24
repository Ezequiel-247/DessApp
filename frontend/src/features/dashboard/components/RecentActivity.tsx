import { Card } from "@/widgets/ui/Card/Card";

interface Activity {
  id: string;
  title: string;
  description: string;
  time: string;
  type: 'grade' | 'material' | 'notification';
}

interface RecentActivityProps {
  activities: Activity[];
}

export function RecentActivity({ activities }: RecentActivityProps) {
  const icons = {
    grade: 'grade',
    material: 'library_books',
    notification: 'notifications',
  };

  return (
    <Card title="Actividad reciente" subtitle="Últimas actualizaciones">
      <div className="flex flex-col gap-sm">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-start gap-sm py-sm border-b border-outline-variant last:border-0 last:pb-0"
          >
            <span className="material-symbols-outlined text-on-surface-variant mt-0.5">
              {icons[activity.type]}
            </span>
            <div className="flex flex-col gap-xs flex-1">
              <p className="text-body-sm font-medium text-on-surface">
                {activity.title}
              </p>
              <p className="text-body-sm text-on-surface-variant">
                {activity.description}
              </p>
            </div>
            <span className="text-xs text-outline whitespace-nowrap">
              {activity.time}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
