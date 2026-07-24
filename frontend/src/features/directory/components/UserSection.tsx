import { useState, useEffect } from "react";
import { updateUser, type UserRole } from "@/entities/User";
import { FormField } from "@/widgets/ui/FormField";

interface UserSectionProps {
  mode?: "edit" | "create";
  user?: any;
  onSaved?: () => void;
  // controlled props (create mode)
  name?: string;
  lastname?: string;
  email?: string;
  password?: string;
  role?: UserRole;
  isActive?: boolean;
  onFieldChange?: (field: string, value: any) => void;
}

export function UserSection({ mode = "edit", user, onSaved, name: controlledName, lastname: controlledLastname, email: controlledEmail, password: controlledPassword, isActive: controlledIsActive, onFieldChange }: UserSectionProps) {
  const [localName, setLocalName] = useState("");
  const [localLastname, setLocalLastname] = useState("");
  const [localEmail, setLocalEmail] = useState("");
  const [localPassword, setLocalPassword] = useState("");
  const [localRole, setLocalRole] = useState<UserRole>("student");
  const [localIsActive, setLocalIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const isEdit = mode === "edit";

  useEffect(() => {
    if (isEdit && user) {
      setLocalName(user.name ?? "");
      setLocalLastname(user.lastname ?? "");
      setLocalEmail(user.email ?? "");
      setLocalPassword("");
      setLocalRole((user.role as UserRole) ?? "student");
      setLocalIsActive(user.is_active ?? true);
      setError("");
      setSuccess(false);
    }
  }, [isEdit, user]);

  const handleSave = async () => {
    const errs: string[] = [];
    if (!localName.trim()) errs.push("El nombre es obligatorio.");
    if (!localLastname.trim()) errs.push("El apellido es obligatorio.");
    if (!localEmail.trim()) errs.push("El email es obligatorio.");
    if (errs.length) { setError(errs.join(" ")); return; }

    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      await updateUser(user.id, { name: localName, lastname: localLastname, email: localEmail, is_active: localIsActive, role: localRole });
      setSuccess(true);
      onSaved?.();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const name = isEdit ? localName : (controlledName ?? "");
  const lastname = isEdit ? localLastname : (controlledLastname ?? "");
  const email = isEdit ? localEmail : (controlledEmail ?? "");
  const password = isEdit ? localPassword : (controlledPassword ?? "");
  const role = isEdit ? localRole : (user?.role ?? "student");
  const isActive = isEdit ? localIsActive : (controlledIsActive ?? true);

  const setName = (v: string) => isEdit ? setLocalName(v) : onFieldChange?.("name", v);
  const setLastname = (v: string) => isEdit ? setLocalLastname(v) : onFieldChange?.("lastname", v);
  const setEmail = (v: string) => isEdit ? setLocalEmail(v) : onFieldChange?.("email", v);
  const setPassword = (v: string) => isEdit ? setLocalPassword(v) : onFieldChange?.("password", v);
  const setRole = (v: string) => isEdit ? setLocalRole(v as UserRole) : onFieldChange?.("role", v as UserRole);
  const setIsActive = (v: boolean) => isEdit ? setLocalIsActive(v) : onFieldChange?.("isActive", v);

  return (
    <div className="space-y-gutter">
      {error && (
        <div className="rounded-lg bg-error-container/30 border border-error/50 p-md text-error flex gap-sm items-start">
          <span className="material-symbols-outlined shrink-0">error</span>
          <p className="font-body-sm text-body-sm">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Nombre">
          <input value={name} onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-outline-variant bg-surface-bright px-4 py-3 text-body-md text-on-surface outline-none"
          />
        </FormField>
        <FormField label="Apellido">
          <input value={lastname} onChange={(e) => setLastname(e.target.value)}
            className="w-full rounded-lg border border-outline-variant bg-surface-bright px-4 py-3 text-body-md text-on-surface outline-none"
          />
        </FormField>
        <FormField label="Email">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-outline-variant bg-surface-bright px-4 py-3 text-body-md text-on-surface outline-none"
          />
        </FormField>
        {!isEdit && (
          <FormField label="Contraseña">
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-outline-variant bg-surface-bright px-4 py-3 text-body-md text-on-surface outline-none"
              placeholder="Mínimo 6 caracteres"
            />
          </FormField>
        )}
        <FormField label="Rol">
          <select value={role} onChange={(e) => setRole(e.target.value)}
            className="w-full rounded-lg border border-outline-variant bg-surface-bright px-4 py-3 text-body-md text-on-surface outline-none"
          >
            <option value="student">Estudiante</option>
            <option value="admin">Administrador</option>
          </select>
        </FormField>
        <FormField label="Activo">
          <select value={isActive ? "true" : "false"}
            onChange={(e) => setIsActive(e.target.value === "true")}
            className="w-full rounded-lg border border-outline-variant bg-surface-bright px-4 py-3 text-body-md text-on-surface outline-none"
          >
            <option value="true">Sí</option>
            <option value="false">No</option>
          </select>
        </FormField>
      </div>

      {isEdit && (
        <div className="flex items-center justify-end gap-sm pt-sm border-t border-outline-variant">
          {success && (
            <span className="text-body-sm text-success flex items-center gap-1 mr-auto">
              <span className="material-symbols-outlined text-[16px]">check</span>
              Datos guardados
            </span>
          )}
          <button type="button" onClick={handleSave} disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 font-label-caps text-label-caps text-on-primary hover:bg-primary-container disabled:opacity-50"
          >
            {saving ? "GUARDANDO..." : "GUARDAR"}
          </button>
        </div>
      )}
    </div>
  );
}