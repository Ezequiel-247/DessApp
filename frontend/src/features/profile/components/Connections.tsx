import { Card } from "@/widgets/ui/Card/Card";

export function Connections() {
  return (
    <Card title="Conexiones" subtitle="Profesores y compañeros">
      <div className="flex flex-col gap-sm">
        <div className="flex items-center gap-sm text-body-sm text-on-surface-variant">
          <span className="material-symbols-outlined text-primary">person</span>
          <span>3 profesores conectados</span>
        </div>
        <div className="flex items-center gap-sm text-body-sm text-on-surface-variant">
          <span className="material-symbols-outlined text-secondary">group</span>
          <span>12 compañeros activos</span>
        </div>
      </div>
    </Card>
  );
}
