import { useEffect, useState, useMemo } from "react";
import { getSubjects, createSubject, updateSubject, deleteSubject } from "@/entities/Subject";
import { useConfirm } from "@/widgets/hooks/useConfirm";
import { getInstitutes } from "@/entities/Institute";
import { getCareers } from "@/entities/Career";
import { getPlans } from "@/entities/Plan";
import { getPlanSubjects } from "@/entities/PlanSubject";
import type { Subject } from "@/entities/Subject";
import type { Career } from "@/entities/Career";
import type { Plan } from "@/entities/Plan";
import type { PlanSubject } from "@/entities/PlanSubject";

export interface SubjectDraft {
  code: string;
  name: string;
  is_unahur: boolean;
  weeklyHours: number;
}

export interface Institute {
  id: string;
  name: string;
}

function createDraft(s?: Subject | null): SubjectDraft {
  return {
    code: s?.code ?? "",
    name: s?.name ?? "",
    is_unahur: s?.is_unahur ?? false,
    weeklyHours: s?.weeklyHours ?? 4,
  };
}

const INSTITUTE_STORAGE_KEY = "subjects_filter_institute";
const CAREER_STORAGE_KEY = "subjects_filter_career";

export function useSubjectsData() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [careers, setCareers] = useState<Career[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [planSubjects, setPlanSubjects] = useState<PlanSubject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<SubjectDraft>(createDraft(null));
  const [saving, setSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const { isOpen, options, open, close, handleConfirm } = useConfirm();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterUnahur, setFilterUnahur] = useState(false);
  const [filterUnassigned, setFilterUnassigned] = useState(false);
  const [filterInstituteId, setFilterInstituteId] = useState("");
  const [filterCareerId, setFilterCareerId] = useState("");

  const selectedSubject = subjects.find((s) => s.id === selectedId) ?? null;

  // Compute which subjects belong to which institutes via PlanSubject → Plan → Career → Institute
  const subjectInstituteMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const ps of planSubjects) {
      const plan = plans.find((p) => String(p.id) === String(ps.idStudyPlan));
      if (!plan) continue;
      const career = careers.find((c) => String(c.id) === String(plan.careerId));
      if (!career) continue;
      const key = String(ps.idSubject);
      if (!map.has(key)) map.set(key, new Set());
      map.get(key)!.add(String(career.instituteId));
    }
    return map;
  }, [planSubjects, plans, careers]);

  // Compute which subjects belong to which careers via PlanSubject → Plan
  const subjectCareerMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const ps of planSubjects) {
      const plan = plans.find((p) => String(p.id) === String(ps.idStudyPlan));
      if (!plan) continue;
      const key = String(ps.idSubject);
      if (!map.has(key)) map.set(key, new Set());
      map.get(key)!.add(String(plan.careerId));
    }
    return map;
  }, [planSubjects, plans]);

  // Careers filtered by selected institute
  const careersByInstitute = useMemo(
    () => careers.filter((c) => String(c.instituteId) === filterInstituteId),
    [careers, filterInstituteId]
  );

  // Auto-select first career when institute changes
  useEffect(() => {
    if (filterInstituteId && careersByInstitute.length > 0) {
      const stillValid = careersByInstitute.some((c) => String(c.id) === filterCareerId);
      if (!stillValid) {
        setFilterCareerId(String(careersByInstitute[0].id));
      }
    } else if (!filterInstituteId) {
      setFilterCareerId("");
    }
  }, [filterInstituteId, careersByInstitute]);

  const filteredSubjects = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return subjects.filter((s) => {
      const sid = String(s.id);

      if (filterUnahur) {
        return s.is_unahur === true;
      }

      if (q && ![s.name, s.code].join(" ").toLowerCase().includes(q)) return false;

      // Institute filter
      let matchInstitute = true;
      if (filterUnassigned) {
        if (s.is_unahur) return false;
        matchInstitute = !subjectInstituteMap.has(sid);
      } else if (filterInstituteId) {
        matchInstitute = subjectInstituteMap.get(sid)?.has(filterInstituteId) ?? false;
      }
      if (!matchInstitute) return false;

      // Career filter
      if (filterCareerId) {
        const match = subjectCareerMap.get(sid)?.has(filterCareerId) ?? false;
        if (!match) return false;
      }

      return true;
    });
  }, [subjects, searchTerm, filterUnahur, filterUnassigned, filterInstituteId, filterCareerId, subjectInstituteMap, subjectCareerMap]);

  const loadSubjects = () => {
    setIsLoading(true);
    setError(null);
    getSubjects()
      .then((data) => {
        setSubjects(data);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Error cargando materias");
        setIsLoading(false);
      });
  };

  useEffect(() => {
    Promise.all([getInstitutes(), getCareers(), getPlans(), getPlanSubjects()])
      .then(([instData, careerData, planData, psData]) => {
        setInstitutes(instData);
        setCareers(careerData);
        setPlans(planData);
        setPlanSubjects(psData);

        const savedInst = localStorage.getItem(INSTITUTE_STORAGE_KEY);
        if (savedInst && instData.some((i: any) => String(i.id) === savedInst)) {
          setFilterInstituteId(savedInst);
          const savedCareer = localStorage.getItem(CAREER_STORAGE_KEY);
          setFilterCareerId(savedCareer ?? "");
        } else if (instData.length > 0) {
          setFilterInstituteId(String(instData[0].id));
        }
      })
      .catch(() => {});
    loadSubjects();
  }, []);

  useEffect(() => {
    setDraft(createDraft(selectedSubject));
  }, [selectedSubject]);

  const handleSelect = (id: string) => {
    setSelectedId((prev) => (prev === id ? null : id));
    setValidationErrors({});
  };

  const handleNew = () => {
    setSelectedId(null);
    setDraft(createDraft(null));
    setValidationErrors({});
  };

  const handleFieldChange = (field: keyof SubjectDraft, value: string | number | boolean) => {
    setDraft((current) => ({ ...current, [field]: value }));
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

    if (!draft.code.trim()) {
      errors.code = "El código es obligatorio.";
    }

    if (!draft.name.trim()) {
      errors.name = "El nombre es obligatorio.";
    }

    if (
      draft.weeklyHours === undefined ||
      draft.weeklyHours === null ||
      draft.weeklyHours < 1 ||
      draft.weeklyHours > 12 ||
      !Number.isInteger(Number(draft.weeklyHours))
    ) {
      errors.weeklyHours = "Las horas semanales deben ser un número entero entre 1 y 12.";
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors({});
    setSaving(true);

    try {
      const payload = {
        code: draft.code.trim(),
        name: draft.name.trim(),
        is_unahur: draft.is_unahur,
        weeklyHours: draft.weeklyHours,
      };

      if (selectedId) {
        await updateSubject(selectedId, payload);
      } else {
        await createSubject(payload);
      }
      loadSubjects();
      handleNew();
    } catch (err: any) {
      setValidationErrors({ api: err.message || "Error al guardar" });
    } finally {
      setSaving(false);
    }
  };

  const clearSelection = () => {
    setSelectedId(null);
    setValidationErrors({});
  };

  const handleFilterInstituteChange = (value: string) => {
    setFilterInstituteId(value);
    localStorage.setItem(INSTITUTE_STORAGE_KEY, value);
    clearSelection();
  };

  const handleFilterCareerChange = (value: string) => {
    setFilterCareerId(value);
    localStorage.setItem(CAREER_STORAGE_KEY, value);
  };

  const resetFilters = () => {
    setSearchTerm("");
    setFilterUnahur(false);
    setFilterUnassigned(false);
    setFilterInstituteId("");
    setFilterCareerId("");
    localStorage.removeItem(INSTITUTE_STORAGE_KEY);
    localStorage.removeItem(CAREER_STORAGE_KEY);
  };

  const handleDelete = (id: string) => {
    const subject = subjects.find((s) => s.id === id);
    open({
      title: "Eliminar materia",
      description: `¿Confirmás eliminar ${subject?.name ?? "la materia"}?`,
      variant: "danger",
      onConfirm: async () => {
        try {
          await deleteSubject(id);
          if (selectedId === id) handleNew();
          loadSubjects();
        } catch (err: any) {
          setValidationErrors({ api: err.message || "Error al eliminar" });
        }
      },
    });
  };

  const instituteFilterOptions = useMemo(() => {
    return institutes.map((i: any) => ({ value: String(i.id), label: i.name }));
  }, [institutes]);

  return {
    subjects,
    filteredSubjects,
    institutes,
    careers,
    careersByInstitute,
    instituteFilterOptions,
    isLoading,
    error,
    selectedId,
    selectedSubject,
    draft,
    saving,
    validationErrors,
    searchTerm,
    setSearchTerm,
    filterUnahur,
    setFilterUnahur,
    filterUnassigned,
    setFilterUnassigned,
    filterInstituteId,
    setFilterInstituteId,
    filterCareerId,
    setFilterCareerId,
    clearSelection,
    handleFilterInstituteChange,
    handleFilterCareerChange,
    resetFilters,
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
