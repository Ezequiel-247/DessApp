import { Card } from "@/widgets/ui/Card";
import { EmptyState } from "@/widgets/ui/EmptyState";
import { UserListItem } from "./UserListItem";

const ROLE_LABELS: Record<string, string> = {
  student: "Estudiante",
  admin: "Administrador",
};

const ROLE_VARIANTS: Record<string, string> = {
  student: "positive",
  admin: "danger",
};

interface Props {
  filteredUsers: any[];
  selectedUserId: string | null;
  onSelect: (id: string) => void;
  usersError: string | null;
  hideHeader?: boolean;
}

export function UserListPanel({ filteredUsers, selectedUserId, onSelect, usersError, hideHeader }: Props) {
  return (
    <Card
      className={`xl:col-span-5 flex flex-col h-full ${hideHeader ? '!rounded-none !border-t-0' : ''}`}
      header={hideHeader ? null : <h2 className="font-title-sm text-title-sm text-on-surface">Listado de usuarios</h2>}
      bodyClassName="flex-1 overflow-y-auto space-y-3"
    >
      {usersError ? (
        <div className="rounded-lg border border-error/50 bg-error-container/30 p-4 text-error flex gap-3 items-start">
          <span className="material-symbols-outlined shrink-0">error</span>
          <div>
            <p className="font-title-sm text-title-sm">Error al cargar usuarios</p>
            <p className="font-body-sm text-body-sm mt-1">{usersError}</p>
          </div>
        </div>
      ) : filteredUsers.length === 0 ? (
        <EmptyState>No hay usuarios que coincidan con los filtros.</EmptyState>
      ) : (
        filteredUsers.map((user) => (
          <UserListItem
            key={user.id}
            user={user}
            isActive={String(user.id) === String(selectedUserId)}
            onSelect={onSelect}
            roleLabel={ROLE_LABELS[user.role as string] ?? user.role}
            roleVariant={ROLE_VARIANTS[user.role as string] ?? "neutral"}
          />
        ))
      )}
    </Card>
  );
}
