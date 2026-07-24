import { useState, useEffect, useCallback } from "react";
import { updateStudent } from "@/entities/Student";
import { createEnrollment, updateEnrollment, deleteEnrollment, getEnrollments } from "@/entities/StudentCareerEnrollment";
import { ManageEnrollmentModal } from "@/features/profile";
import { FormField } from "@/widgets/ui/FormField";
import type { StudentCareerEnrollment } from "@/entities/StudentCareerEnrollment";

interface StudentSectionProps {
  user: any;
  onSaved: () => void;
}

interface LocalEnrollment {
  tempId: number;
  apiId?: number;
  careerId: number;
  studyPlanId: number | null;
  enrolledAt: string;
  completedAt: string | null;
  isActive: boolean;
  status: string;
  career?: { id: number; name: string };
  studyPlan?: { id: number; name: string; status: string };
}

let tempIdCounter = 0;

export function StudentSection({ user, onSaved }: StudentSectionProps) {
  const [legajo, setLegajo] = useState("");
  const [originalLegajo, setOriginalLegajo] = useState("");
  const [localEnrollments, setLocalEnrollments] = useState<LocalEnrollment[]>([]);
  const [originalEnrollments, setOriginalEnrollments] = useState<StudentCareerEnrollment[]>([]);
  const [deletedIds, setDeletedIds] = useState<number[]>([]);
  const [manageEnrollment, setManageEnrollment] = useState<{ open: boolean; enrollment: LocalEnrollment | null }>({ open: false, enrollment: null });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const fetchEnrollments = useCallback(async () => {
    try {
      const data = await getEnrollments(user.id);
      setOriginalEnrollments(data);
      setLocalEnrollments(data.map((e) => ({
        tempId: ++tempIdCounter,
        apiId: e.id,
        careerId: e.careerId,
        studyPlanId: e.studyPlanId,
        enrolledAt: e.enrolledAt,
        completedAt: e.completedAt,
        isActive: e.isActive,
        status: e.status,
        career: e.career,
        studyPlan: e.studyPlan,
      })));
      setDeletedIds([]);
    } catch {
      // silent
    }
  }, [user.id]);

  useEffect(() => {
    if (user) {
      const initialLegajo = user.student?.legajo ?? "";
      setLegajo(initialLegajo);
      setOriginalLegajo(initialLegajo);
      setError("");
      setSuccess(false);
      fetchEnrollments();
    }
  }, [user, fetchEnrollments]);

  const hasLegajoChanged = legajo !== originalLegajo;
  const hasEnrollmentChanges = deletedIds.length > 0 || localEnrollments.some((e) => !e.apiId);
  const hasChanges = hasLegajoChanged || hasEnrollmentChanges;

  const handleEnrollmentData = (data: { career_id: number; study_plan_id?: number | null; enrolled_at: string; completed_at?: string | null }) => {
    const editing = manageEnrollment.enrollment;
    if (editing) {
      setLocalEnrollments((prev) =>
        prev.map((e) =>
          e.tempId === editing.tempId
            ? { ...e, careerId: data.career_id, studyPlanId: data.study_plan_id ?? null, enrolledAt: data.enrolled_at, completedAt: data.completed_at ?? null }
            : e
        )
      );
    } else {
      setLocalEnrollments((prev) => [
        ...prev,
        { tempId: ++tempIdCounter, careerId: data.career_id, studyPlanId: data.study_plan_id ?? null, enrolledAt: data.enrolled_at, completedAt: null, isActive: true, status: "active" },
      ]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      if (hasLegajoChanged) {
        await updateStudent(user.id, { legajo });
        setOriginalLegajo(legajo);
      }

      const currentApiIds = new Set(localEnrollments.filter((e) => e.apiId).map((e) => e.apiId));
      for (const id of deletedIds) {
        if (originalEnrollments.find((o) => o.id === id)) {
          await deleteEnrollment(user.id, id);
        }
      }

      for (const le of localEnrollments) {
        if (le.apiId) {
          await updateEnrollment(user.id, le.apiId, {
            study_plan_id: le.studyPlanId,
            enrolled_at: le.enrolledAt,
            completed_at: le.completedAt,
          });
        } else {
          await createEnrollment(user.id, {
            career_id: le.careerId,
            study_plan_id: le.studyPlanId ?? undefined,
            enrolled_at: le.enrolledAt,
          });
        }
      }

      setSuccess(true);
      setDeletedIds([]);
      await fetchEnrollments();
      onSaved();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-gutter">
      {error && (
        <div className="rounded-lg bg-error-container/30 border border-error/50 p-md text-error flex gap-sm items-center">
          <span className="material-symbols-outlined shrink-0">error</span>
          <p className="font-body-sm text-body-sm">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Matrícula / Legajo">
          <input value={legajo} onChange={(e) => setLegajo(e.target.value)}
            className="w-full rounded-lg border border-outline-variant bg-surface-bright px-4 py-3 text-body-md text-on-surface outline-none"
            placeholder="Ej. 12345"
          />
        </FormField>
      </div>

      <div className="border-t border-outline-variant pt-gutter">
        <h4 className="font-title-sm text-title-sm text-on-surface mb-md">Inscripciones a carreras</h4>

        {localEnrollments.length === 0 ? (
          <p className="font-body-md text-body-md text-on-surface-variant mb-md">Sin inscripciones.</p>
        ) : (
          <div className="flex flex-col gap-md mb-md">
            {localEnrollments.map((le) => {
              const isNew = !le.apiId;
              return (
                <div key={le.tempId} className={`flex flex-col gap-sm p-md rounded-DEFAULT border ${isNew ? "border-primary/40 bg-primary/5" : "border-outline-variant bg-surface"}`}>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">school</span>
                    <span className="font-title-sm text-title-sm text-on-surface">{le.career?.name ?? "Nueva carrera"}</span>
                    <button
                      type="button"
                      onClick={() => setManageEnrollment({ open: true, enrollment: le })}
                      className="text-outline hover:text-primary transition-colors ml-2"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    {isNew && (
                      <span className="text-xs text-primary font-semibold uppercase tracking-wider ml-auto">Nueva</span>
                    )}
                    {le.isActive && !isNew && (
                      <span className="text-xs text-success font-semibold uppercase tracking-wider ml-auto">Activo</span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-sm text-body-sm">
                    {le.studyPlan && (
                      <div>
                        <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">Plan</span>
                        <p className="text-on-surface">{le.studyPlan.name} ({le.studyPlan.status})</p>
                      </div>
                    )}
                    <div>
                      <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">Inicio</span>
                      <p className="text-on-surface">{new Date(le.enrolledAt).toLocaleDateString('es-AR')}</p>
                    </div>
                    <div>
                      <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">Finalización</span>
                      <p className="text-on-surface">{le.completedAt ? new Date(le.completedAt).toLocaleDateString('es-AR') : "-"}</p>
                    </div>
                    <div>
                      <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">Estado</span>
                      <p className="text-on-surface capitalize">{le.status}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <button
          type="button"
          onClick={() => setManageEnrollment({ open: true, enrollment: null })}
          className="w-full flex items-center justify-center gap-2 font-label-caps text-label-caps text-primary px-6 py-3 rounded-full border-2 border-dashed border-outline-variant hover:border-primary hover:bg-primary/5 transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          AGREGAR CARRERA
        </button>
      </div>

      <div className="flex items-center justify-end gap-sm pt-sm border-t border-outline-variant">
        {success && (
          <span className="text-body-sm text-success flex items-center gap-1 mr-auto">
            <span className="material-symbols-outlined text-[16px]">check</span>
            Cambios guardados
          </span>
        )}
        <button type="button" onClick={handleSave} disabled={saving || !hasChanges}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 font-label-caps text-label-caps text-on-primary hover:bg-primary-container disabled:opacity-50"
        >
          {saving ? "GUARDANDO..." : "GUARDAR CAMBIOS"}
        </button>
      </div>

      <ManageEnrollmentModal
        isOpen={manageEnrollment.open}
        onClose={() => setManageEnrollment({ open: false, enrollment: null })}
        onSaved={() => {}}
        studentId={user.id}
        enrollment={manageEnrollment.enrollment ? {
          id: manageEnrollment.enrollment.apiId ?? manageEnrollment.enrollment.tempId,
          careerId: manageEnrollment.enrollment.careerId,
          studyPlanId: manageEnrollment.enrollment.studyPlanId,
          enrolledAt: manageEnrollment.enrollment.enrolledAt,
          completedAt: manageEnrollment.enrollment.completedAt,
          isActive: manageEnrollment.enrollment.isActive,
          status: manageEnrollment.enrollment.status,
          career: manageEnrollment.enrollment.career,
          studyPlan: manageEnrollment.enrollment.studyPlan,
        } as StudentCareerEnrollment : null}
        excludedCareerIds={localEnrollments.filter((e) => !deletedIds.includes(e.apiId ?? -1)).map((e) => e.careerId)}
        onEnrollmentData={handleEnrollmentData}
        onLocalDelete={() => {
          const e = manageEnrollment.enrollment;
          if (!e) return;
          if (e.apiId) {
            setDeletedIds((prev) => [...prev, e.apiId!]);
          }
          setLocalEnrollments((prev) => prev.filter((x) => x.tempId !== e.tempId));
        }}
      />
    </div>
  );
}