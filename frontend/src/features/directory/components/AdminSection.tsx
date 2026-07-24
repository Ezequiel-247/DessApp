import { useState, useEffect } from "react";
import { updateAdmin } from "@/entities/Admin";
import { FormField } from "@/widgets/ui/FormField";

interface AdminSectionProps {
  mode?: "edit" | "create";
  user?: any;
  onSaved?: () => void;
  // controlled (create mode)
  cuil?: string;
  onFieldChange?: (field: string, value: any) => void;
}

export function AdminSection({ mode = "edit", user, onSaved, cuil: controlledCuil, onFieldChange }: AdminSectionProps) {
  const [localCuil, setLocalCuil] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const isEdit = mode === "edit";

  useEffect(() => {
    if (isEdit && user) {
      setLocalCuil(user.admin?.cuil ?? "");
      setError("");
      setSuccess(false);
    }
  }, [isEdit, user]);

  const handleSave = async () => {
    if (!localCuil.trim()) { setError("El CUIL es obligatorio."); return; }

    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      await updateAdmin(user.id, { cuil: localCuil });
      setSuccess(true);
      onSaved?.();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const cuil = isEdit ? localCuil : (controlledCuil ?? "");
  const setCuil = (v: string) => isEdit ? setLocalCuil(v) : onFieldChange?.("cuil", v);

  return (
    <div className="space-y-gutter">
      {error && (
        <div className="rounded-lg bg-error-container/30 border border-error/50 p-md text-error flex gap-sm items-start">
          <span className="material-symbols-outlined shrink-0">error</span>
          <p className="font-body-sm text-body-sm">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="CUIL">
          <input value={cuil} onChange={(e) => setCuil(e.target.value)}
            className="w-full rounded-lg border border-outline-variant bg-surface-bright px-4 py-3 text-body-md text-on-surface outline-none"
            placeholder="Ej. 20-12345678-9"
          />
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