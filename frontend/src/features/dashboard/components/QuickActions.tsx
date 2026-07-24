import { Button } from "@/widgets/ui/Button/Button";
import { Card } from "@/widgets/ui/Card/Card";

interface QuickAction {
  id: string;
  label: string;
  icon: string;
  variant?: 'primary' | 'secondary' | 'ghost';
}

interface QuickActionsProps {
  actions: QuickAction[];
  onAction?: (id: string) => void;
}

export function QuickActions({ actions, onAction }: QuickActionsProps) {
  return (
    <Card title="Acciones rápidas" subtitle="Accede rápidamente">
      <div className="flex flex-wrap gap-sm">
        {actions.map((action) => (
          <Button
            key={action.id}
            variant={action.variant || 'secondary'}
            onClick={() => onAction?.(action.id)}
          >
            <span className="material-symbols-outlined mr-xs text-lg">
              {action.icon}
            </span>
            {action.label}
          </Button>
        ))}
      </div>
    </Card>
  );
}
