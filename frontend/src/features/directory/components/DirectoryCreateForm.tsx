import { useState, useEffect } from "react";
import { SectionTabs, type SectionTab } from "@/widgets/ui/SectionTabs/SectionTabs";
import { UserSection } from "./UserSection";
import { AdminSection } from "./AdminSection";
import { ManageEnrollmentModal } from "@/features/profile";
import { createStudent } from "@/entities/Student";
import { createAdmin } from "@/entities/Admin";
import { getPlans } from "@/entities/Plan";
import { FormField } from "@/widgets/ui/FormField";
import type { Career } from "@/entities/Career";
import type { Plan } from "@/entities/Plan";
import type { StudentCareerEnrollment } from "@/entities/StudentCareerEnrollment";

interface DirectoryCreateFormProps {
  careersOptions: Career[];
  onCreated: (user: any) => void;
}

interface PendingEnrollment {
  tempId: number;
  careerId: number;
  studyPlanId: number | null;
  enrolledAt: string;
}

interface State {
  name: string;
  lastname: string;
  email: string;
  password: string;
  role: "student" | "admin";
  isActive: boolean;
  legajo: string;
  cuil: string;
}

const INITIAL_STUDENT: State = {
  name: "", lastname: "", email: "", password: "", role: "student", isActive: true,
  legajo: "", cuil: "",
};

const INITIAL_ADMIN: State = {
  name: "", lastname: "", email: "", password: "", role: "admin", isActive: true,
  legajo: "", cuil: "",
};

let tempIdCounter = 0;

export function DirectoryCreateForm({ careersOptions, onCreated }: DirectoryCreateFormProps) {
  const [state, setState] = useState<State>(INITIAL_STUDENT);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [pendingEnrollments, setPendingEnrollments] = useState<PendingEnrollment[]>([]);
  const [manageEnrollment, setManageEnrollment] = useState<{ open: boolean; enrollment: PendingEnrollment | null }>({ open: false, enrollment: null });
  const [activeTab, setActiveTab] = useState("user");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getPlans().then(setPlans).catch(() => {});
  }, []);

  const tabs: SectionTab[] = [
    { id: "user", label: "Usuario", icon: "person" },
    ...(state.role === "student"
      ? [{ id: "student", label: "Estudiante", icon: "school" }]
      : [{ id: "admin", label: "Administrador", icon: "badge" }]),
  ];

  const handleFieldChange = (field: string, value: any) => {
    if (field === "role") {
      setState(value === "admin"
        ? { ...INITIAL_ADMIN, name: state.name, lastname: state.lastname, email: state.email, password: state.password }
        : { ...INITIAL_STUDENT, name: state.name, lastname: state.lastname, email: state.email, password: state.password }
      );
      setPendingEnrollments([]);
      setActiveTab("user");
    } else {
      setState((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleEnrollmentData = (data: { career_id: number; study_plan_id?: number | null; enrolled_at: string; completed_at?: string | null }) => {
    const editing = manageEnrollment.enrollment;
    if (editing) {
      setPendingEnrollments((prev) => prev.map((e) =>
        e.tempId === editing.tempId
          ? { ...e, careerId: data.career_id, studyPlanId: data.study_plan_id ?? null, enrolledAt: data.enrolled_at }
          : e
      ));
    } else {
      setPendingEnrollments((prev) => [...prev, { tempId: ++tempIdCounter, careerId: data.career_id, studyPlanId: data.study_plan_id ?? null, enrolledAt: data.enrolled_at }]);
    }
  };

  function toPseudoEnrollment(pe: PendingEnrollment): StudentCareerEnrollment {
    const career = careersOptions.find((c) => Number(c.id) === pe.careerId);
    const plan = plans.find((p) => Number(p.id) === pe.studyPlanId);
    return {
      id: pe.tempId,
      careerId: pe.careerId,
      studyPlanId: pe.studyPlanId,
      enrolledAt: pe.enrolledAt,
      completedAt: null,
      isActive: true,
      status: "active",
      career: career ? { id: Number(career.id), name: career.name } : undefined,
      studyPlan: plan ? { id: Number(plan.id), name: plan.name, status: plan.status } : undefined,
    } as StudentCareerEnrollment;
  }

  const handleCreate = async () => {
    const errs: string[] = [];
    if (!state.name.trim()) errs.push("El nombre es obligatorio.");
    if (!state.lastname.trim()) errs.push("El apellido es obligatorio.");
    if (!state.email.trim()) errs.push("El email es obligatorio.");
    if (!state.password.trim()) errs.push("La contraseña es obligatoria.");
    if (state.password && state.password.length < 6) errs.push("La contraseña debe tener al menos 6 caracteres.");
    if (state.role === "admin" && !state.cuil.trim()) errs.push("El CUIL es obligatorio para administradores.");
    if (state.role === "student" && pendingEnrollments.length === 0) errs.push("Agregá al menos una carrera.");
    if (errs.length) { setError(errs.join(" ")); return; }

    setCreating(true);
    setError("");
    try {
      let created: any;
      if (state.role === "admin") {
        created = await createAdmin({
          email: state.email, password: state.password, name: state.name,
          lastname: state.lastname, cuil: state.cuil, role: "admin", is_active: true,
        });
      } else {
        created = await createStudent({
          email: state.email, password: state.password, name: state.name,
          lastname: state.lastname, role: "student", is_active: true,
          enrollments: pendingEnrollments.map((e) => ({
            career_id: e.careerId,
            study_plan_id: e.studyPlanId,
            enrolled_at: e.enrolledAt,
          })),
        });
      }
      onCreated(created);
    } catch (err: any) {
      setError(err.message || "No se pudo crear el usuario");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex flex-col gap-gutter">
      {error && (
        <div className="rounded-lg bg-error-container/30 border border-error/50 p-md text-error flex gap-sm items-start">
          <span className="material-symbols-outlined shrink-0">error</span>
          <p className="font-body-sm text-body-sm">{error}</p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h3 className="font-title-sm text-title-sm text-on-surface">Nuevo usuario</h3>
        <SectionTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {activeTab === "user" && (
        <UserSection
          mode="create"
          name={state.name}
          lastname={state.lastname}
          email={state.email}
          password={state.password}
          isActive={state.isActive}
          onFieldChange={handleFieldChange}
        />
      )}
      {activeTab === "student" && (
        <div className="space-y-gutter">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Matrícula / Legajo">
              <input value={state.legajo} onChange={(e) => handleFieldChange("legajo", e.target.value)}
                className="w-full rounded-lg border border-outline-variant bg-surface-bright px-4 py-3 text-body-md text-on-surface outline-none"
                placeholder="Ej. 12345"
              />
            </FormField>
          </div>

          <div className="border-t border-outline-variant pt-gutter">
            <h4 className="font-title-sm text-title-sm text-on-surface mb-md">Inscripciones a carreras</h4>

            {pendingEnrollments.length === 0 ? (
              <p className="font-body-md text-body-md text-on-surface-variant mb-md">Sin inscripciones.</p>
            ) : (
              <div className="flex flex-col gap-md mb-md">
                {pendingEnrollments.map((pe) => {
                  const career = careersOptions.find((c) => Number(c.id) === pe.careerId);
                  const plan = plans.find((p) => Number(p.id) === pe.studyPlanId);
                  return (
                    <div key={pe.tempId} className="flex flex-col gap-sm p-md rounded-DEFAULT border border-outline-variant bg-surface">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">school</span>
                        <span className="font-title-sm text-title-sm text-on-surface">{career?.name ?? "Carrera"}</span>
                        <button type="button" onClick={() => setManageEnrollment({ open: true, enrollment: pe })}
                          className="text-outline hover:text-primary transition-colors ml-2"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-sm text-body-sm">
                        {plan && (
                          <div>
                            <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">Plan</span>
                            <p className="text-on-surface">{plan.name} ({plan.status})</p>
                          </div>
                        )}
                        <div>
                          <span className="font-label-caps text-label-caps text-outline uppercase tracking-wider">Inicio</span>
                          <p className="text-on-surface">{new Date(pe.enrolledAt).toLocaleDateString('es-AR')}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <button type="button" onClick={() => setManageEnrollment({ open: true, enrollment: null })}
              className="w-full flex items-center justify-center gap-2 font-label-caps text-label-caps text-primary px-6 py-3 rounded-full border-2 border-dashed border-outline-variant hover:border-primary hover:bg-primary/5 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              AGREGAR CARRERA
            </button>
          </div>
        </div>
      )}
      {activeTab === "admin" && (
        <AdminSection
          mode="create"
          cuil={state.cuil}
          onFieldChange={handleFieldChange}
        />
      )}

      <div className="flex items-center justify-end gap-sm pt-sm border-t border-outline-variant">
        <button type="button" onClick={() => { setState(INITIAL_STUDENT); setPendingEnrollments([]); }}
          className="rounded-full border border-outline-variant px-4 py-2 font-label-caps text-label-caps text-on-surface-variant hover:border-primary-container hover:text-primary-container"
        >
          LIMPIAR
        </button>
        <button type="button" onClick={handleCreate} disabled={creating}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 font-label-caps text-label-caps text-on-primary hover:bg-primary-container disabled:opacity-50"
        >
          {creating ? "CREANDO..." : "CREAR USUARIO"}
        </button>
      </div>

      <ManageEnrollmentModal
        isOpen={manageEnrollment.open}
        onClose={() => setManageEnrollment({ open: false, enrollment: null })}
        onSaved={() => {}}
        enrollment={manageEnrollment.enrollment ? toPseudoEnrollment(manageEnrollment.enrollment) : null}
        excludedCareerIds={pendingEnrollments.map((e) => e.careerId)}
        onEnrollmentData={handleEnrollmentData}
        onLocalDelete={() => {
          if (manageEnrollment.enrollment) {
            setPendingEnrollments((prev) => prev.filter((e) => e.tempId !== manageEnrollment.enrollment!.tempId));
          }
        }}
      />
    </div>
  );
}