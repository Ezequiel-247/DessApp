import { Avatar } from "@/widgets/ui/Avatar/Avatar";
import { Badge } from "@/widgets/ui/Badge/Badge";
import { Card } from "@/widgets/ui/Card/Card";

export function ProfileCard() {
  return (
    <Card className="flex flex-col items-center text-center gap-md">
      <Avatar
        src="https://api.dicebear.com/7.x/avataaars/svg?seed=maria"
        name="María García"
        size="lg"
      />
      <div className="flex flex-col gap-xs">
        <h3 className="text-title-sm font-semibold text-on-surface">
          María García
        </h3>
        <p className="text-body-sm text-on-surface-variant">
          maria.garcia@unahur.edu.ar
        </p>
        <Badge variant="info">3er año - Ingeniería en Sistemas</Badge>
      </div>
      <div className="flex gap-md text-body-sm">
        <div className="flex flex-col items-center">
          <span className="text-headline-md font-semibold text-primary">12</span>
          <span className="text-on-surface-variant">Aprobadas</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-headline-md font-semibold text-primary">96</span>
          <span className="text-on-surface-variant">Créditos</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-headline-md font-semibold text-primary">7.5</span>
          <span className="text-on-surface-variant">Promedio</span>
        </div>
      </div>
    </Card>
  );
}
