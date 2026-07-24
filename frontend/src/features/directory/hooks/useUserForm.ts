import { useEffect, useState } from "react";
import { createUser, updateUser } from "@/entities/User";
import { createStudent, updateStudent } from "@/entities/Student";
import { createAdmin } from "@/entities/Admin";
import { useConfirm } from "@/widgets/hooks/useConfirm";
import type { Career } from "@/entities/Career/model/career";

export interface PendingEnrollment {
  tempId: number;
  careerId: number;
  studyPlanId: number | null;
  enrolledAt: string;
}

export interface UnifiedDraft {
  name: string;
  lastname: string;
  email: string;
  password: string;
  role: "student" | "admin";
  isActive: boolean;
  legajo: string;
  cuil: string;
  enrollments: PendingEnrollment[];
}

let tempIdCounter = 0;

function createDraft(user?: any | null): UnifiedDraft {
  return {
    name: user?.name ?? "",
    lastname: user?.lastname ?? "",
    email: user?.email ?? "",
    password: "",
    role: user?.role ?? "student",
    isActive: user?.is_active ?? true,
    legajo: user?.legajo ?? "",
    cuil: user?.cuil ?? "",
    enrollments: (user?.enrollments ?? []).map((e: any) => ({
      tempId: ++tempIdCounter,
      careerId: Number(e.careerId ?? e.career?.id ?? 0),
      studyPlanId: e.studyPlanId ?? e.studyPlan?.id ?? null,
      enrolledAt: e.enrolledAt ?? new Date().toISOString().split("T")[0],
    })),
  };
}

interface UseUserFormParams {
  selectedUser: any | null;
  careersOptions: Career[];
  onSaved: () => void;
  onCreated: () => void;
}

export function useUserForm({ selectedUser, careersOptions, onSaved, onCreated }: UseUserFormParams) {
  const [draft, setDraft] = useState<UnifiedDraft>(createDraft(selectedUser));
  const [activeTab, setActiveTab] = useState("usuario");
  const [saving, setSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const { isOpen: confirmOpen, options: confirmOptions, open: openConfirm, close: closeConfirm, handleConfirm: execConfirm } = useConfirm();

  useEffect(() => {
    setDraft(createDraft(selectedUser));
    setActiveTab("usuario");
  }, [selectedUser]);

  const handleFieldChange = (field: keyof UnifiedDraft, value: any) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  const handleAddEnrollment = (careerId: number) => {
    setDraft((prev) => ({
      ...prev,
      enrollments: [
        ...prev.enrollments,
        { tempId: ++tempIdCounter, careerId, studyPlanId: null, enrolledAt: new Date().toISOString().split("T")[0] },
      ],
    }));
  };

  const handleRemoveEnrollment = (tempId: number) => {
    setDraft((prev) => ({
      ...prev,
      enrollments: prev.enrollments.filter((e) => e.tempId !== tempId),
    }));
  };

  const handleAddFullEnrollment = (careerId: number, studyPlanId: number | null, enrolledAt: string) => {
    setDraft((prev) => ({
      ...prev,
      enrollments: [
        ...prev.enrollments,
        { tempId: ++tempIdCounter, careerId, studyPlanId, enrolledAt },
      ],
    }));
  };

  const handleUpdateEnrollment = (tempId: number, field: string, value: any) => {
    setDraft((prev) => ({
      ...prev,
      enrollments: prev.enrollments.map((e) =>
        e.tempId === tempId ? { ...e, [field]: value } : e
      ),
    }));
  };

  const handleSave = async () => {
    const errors: Record<string, string> = {};
    if (!draft.name.trim()) errors.name = "El nombre es obligatorio.";
    if (!draft.lastname.trim()) errors.lastname = "El apellido es obligatorio.";
    if (!draft.email.trim()) errors.email = "El email es obligatorio.";
    if (!selectedUser && !draft.password.trim()) errors.password = "La contraseña es obligatoria.";
    if (draft.role === "student" && !draft.legajo.trim()) errors.legajo = "El legajo es obligatorio.";
    if (draft.role === "admin" && !draft.cuil.trim()) errors.cuil = "El CUIL es obligatorio.";

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setSaving(true);
    try {
      if (selectedUser) {
        const userPayload: any = {
          name: draft.name.trim(),
          lastname: draft.lastname.trim(),
          email: draft.email.trim(),
          is_active: draft.isActive,
        };
        if (draft.password.trim()) userPayload.password = draft.password;
        await updateUser(selectedUser.id, userPayload);
        if (draft.role === "student") {
          await updateStudent(selectedUser.id, { name: draft.name, lastname: draft.lastname, email: draft.email, legajo: draft.legajo });
        }
        onSaved();
      } else {
        const user = await createUser({
          name: draft.name.trim(),
          lastname: draft.lastname.trim(),
          email: draft.email.trim(),
          password: draft.password,
          role: draft.role,
          is_active: draft.isActive,
        });
        if (draft.role === "student") {
          await createStudent({
            userId: user.id,
            name: draft.name,
            lastname: draft.lastname,
            email: draft.email,
            legajo: draft.legajo,
          });
        }
        if (draft.role === "admin") {
          await createAdmin({
            userId: user.id,
            cuil: draft.cuil,
          });
        }
        onCreated();
      }
    } catch (err: any) {
      setValidationErrors({ api: err.message || "Error al guardar" });
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: "usuario", label: "Usuario", icon: "person" as const },
    ...(draft.role === "student"
      ? [{ id: "estudiante", label: "Estudiante", icon: "school" as const }]
      : []),
    ...(draft.role === "admin"
      ? [{ id: "administrador", label: "Administrador", icon: "badge" as const }]
      : []),
  ];

  const handleNext = () => {
    const tabIds = tabs.map((t) => t.id);
    const currentIdx = tabIds.indexOf(activeTab);
    if (currentIdx < tabIds.length - 1) setActiveTab(tabIds[currentIdx + 1]);
    else handleSave();
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  const resetForm = () => {
    setDraft(createDraft(null));
    setActiveTab("usuario");
    setValidationErrors({});
  };

  const handleResetWithConfirm = () => {
    openConfirm({
      title: "Limpiar formulario",
      description: "Se va a borrar el contenido de todas las secciones. ¿Estás seguro?",
      variant: "warning",
      onConfirm: resetForm,
    });
  };

  const currentTabIndex = tabs.findIndex((t) => t.id === activeTab);
  const isLastTab = currentTabIndex === tabs.length - 1;
  const isFirstTab = activeTab === "usuario";

  return {
    draft,
    activeTab,
    tabs,
    saving,
    validationErrors,
    currentTabIndex,
    isLastTab,
    isFirstTab,
    handleFieldChange,
    handleSave,
    handleNext,
    handleTabChange,
    handleAddEnrollment,
    handleAddFullEnrollment,
    handleRemoveEnrollment,
    handleUpdateEnrollment,
    resetForm,
    handleResetWithConfirm,
    confirmOpen,
    confirmOptions,
    closeConfirm,
    execConfirm,
  };
}
