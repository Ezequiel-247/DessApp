import { useEffect, useState } from "react";
import { createCareer, updateCareer, deleteCareer } from "@/entities/Career";
import { useConfirm } from "@/widgets/hooks/useConfirm";
import type { CareerDraft, Institute } from "./useCareersData";

function createDraft(career?: CareerDraft | null, defaultInstituteId = ""): CareerDraft {
  return career ?? {
    id: "",
    name: "",
    degreeTitle: "",
    instituteId: defaultInstituteId,
    duration: 4,
    code: "",
    description: "",
    plans: [],
  };
}

interface UseCareerFormParams {
  careers: CareerDraft[];
  setCareers: React.Dispatch<React.SetStateAction<CareerDraft[]>>;
  institutes: Institute[];
  selectedCareerId: string | null;
  setSelectedCareerId: React.Dispatch<React.SetStateAction<string | null>>;
}

export function useCareerForm({
  careers,
  setCareers,
  institutes,
  selectedCareerId,
  setSelectedCareerId,
}: UseCareerFormParams) {
  const [draft, setDraft] = useState<CareerDraft>(createDraft(null, ""));
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const { isOpen, options, open, close, handleConfirm } = useConfirm();

  const selectedCareer = careers.find((c) => c.id === selectedCareerId) ?? null;

  useEffect(() => {
    setDraft(createDraft(selectedCareer ?? null, String(institutes[0]?.id ?? "")));
  }, [careers, selectedCareerId, institutes]);

  const handleSelect = (careerId: string) => {
    setSelectedCareerId((prev) => (prev === careerId ? null : careerId));
    setValidationErrors({});
  };

  const handleNew = () => {
    setSelectedCareerId(null);
    setDraft(createDraft(null, String(institutes[0]?.id ?? "")));
    setValidationErrors({});
  };

  const handleFieldChange = (field: keyof CareerDraft, value: string | number) => {
    setDraft((current) => ({
      ...current,
      [field]: field === "duration" ? Number(value) : value,
    }));
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  const handleSave = async () => {
    const errors: Record<string, string> = {};

    if (!draft.name?.trim()) {
      errors.name = "El nombre de la carrera es obligatorio.";
    } else if (draft.name.trim().length < 2) {
      errors.name = "El nombre de la carrera debe tener al menos 2 caracteres.";
    }

    if (!draft.degreeTitle?.trim()) {
      errors.degreeTitle = "El título que otorga es obligatorio.";
    } else if (draft.degreeTitle.trim().length < 2) {
      errors.degreeTitle = "El título debe tener al menos 2 caracteres.";
    }

    if (!draft.instituteId) {
      errors.instituteId = "Seleccioná un instituto antes de guardar.";
    }

    if (
      draft.duration === undefined ||
      draft.duration === null ||
      draft.duration < 1 ||
      draft.duration > 8 ||
      !Number.isInteger(Number(draft.duration))
    ) {
      errors.duration = "La duración estimada debe ser un número entero entre 1 y 8 años.";
    }

    draft.plans.forEach((plan, index) => {
      if (!plan.name?.trim()) {
        errors[`plan_${plan.id}_name`] = `El nombre del plan ${index + 1} es obligatorio.`;
      } else if (plan.name.trim().length < 2) {
        errors[`plan_${plan.id}_name`] = `El nombre del Plan ${index + 1} debe tener al menos 2 caracteres.`;
      }
    });

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      if (selectedCareerId) {
        const updated = await updateCareer(selectedCareerId, draft);
        setCareers((current) =>
          current.map((c) =>
            String(c.id) === String(selectedCareerId)
              ? { ...c, ...draft, ...updated, instituteId: updated.instituteId || draft.instituteId }
              : c
          )
        );
      } else {
        const created = await createCareer(draft);
        setCareers((current) => [
          { ...draft, ...created, instituteId: created.instituteId || draft.instituteId, plans: draft.plans ?? [] },
          ...current
        ]);
        setSelectedCareerId(String(created.id));
      }
      setValidationErrors({});
    } catch (err: any) {
      setValidationErrors({ api: err.message || "No se pudo guardar la carrera" });
    }
  };

  const handleDelete = (careerId: string) => {
    const career = careers.find((c) => c.id === careerId);
    open({
      title: "Eliminar carrera",
      description: `¿Confirmás eliminar ${career?.name ?? "la carrera"}?`,
      variant: "danger",
      onConfirm: async () => {
        try {
          await deleteCareer(careerId);
          const remaining = careers.filter((c) => c.id !== careerId);
          setCareers(remaining);
          if (selectedCareerId === careerId) {
            setSelectedCareerId(remaining[0]?.id ?? null);
          }
          setValidationErrors({});
        } catch (err: any) {
          setValidationErrors({ api: err.message || "No se pudo eliminar la carrera" });
        }
      },
    });
  };

  return {
    draft,
    validationErrors,
    selectedCareer,
    handleSelect,
    handleNew,
    handleFieldChange,
    handleSave,
    handleDelete,
    isOpen,
    options,
    close,
    handleConfirm,
  };
}
