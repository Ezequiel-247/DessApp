import { useState } from "react";
import { SectionTabs, type SectionTab } from "@/widgets/ui/SectionTabs/SectionTabs";
import { UserSection } from "./UserSection";
import { StudentSection } from "./StudentSection";
import { AdminSection } from "./AdminSection";

interface DirectoryEditFormProps {
  user: any;
  onSaved: () => void;
}

export function DirectoryEditForm({ user, onSaved }: DirectoryEditFormProps) {
  const tabs: SectionTab[] = [
    { id: "user", label: "Usuario", icon: "person" },
    ...(user?.role === "student" ? [{ id: "student", label: "Estudiante", icon: "school" }] : []),
    ...(user?.role === "admin" ? [{ id: "admin", label: "Administrador", icon: "badge" }] : []),
  ];

  const [activeTab, setActiveTab] = useState(tabs[0]?.id ?? "user");

  return (
    <div className="flex flex-col gap-gutter">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-title-sm text-title-sm text-on-surface">Editar usuario</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            {user.name} {user.lastname}
          </p>
        </div>
        <SectionTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {activeTab === "user" && <UserSection user={user} onSaved={onSaved} />}
      {activeTab === "student" && <StudentSection user={user} onSaved={onSaved} />}
      {activeTab === "admin" && <AdminSection user={user} onSaved={onSaved} />}
    </div>
  );
}