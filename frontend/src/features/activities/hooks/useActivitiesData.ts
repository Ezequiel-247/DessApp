import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { getActivities, createActivity, updateActivity, deleteActivity } from "@/entities/Activity";
import { getPlanCreditBlockItems } from "@/entities/PlanCreditBlockItem";
import { getPlans } from "@/entities/Plan";
import { getCareers } from "@/entities/Career";
import { getInstitutes } from "@/entities/Institute";
import { useConfirm } from "@/widgets/hooks/useConfirm";
import type { Activity } from "@/entities/Activity";
import type { PlanCreditBlockItem } from "@/entities/PlanCreditBlockItem";
import type { Plan } from "@/entities/Plan";
import type { Career } from "@/entities/Career";

export interface ActivityDraft {
  code: string;
  name: string;
  description: string;
}

export interface Institute {
  id: string;
  name: string;
}

function createDraft(s?: Activity | null): ActivityDraft {
  return {
    code: s?.code ?? "",
    name: s?.name ?? "",
    description: s?.description ?? "",
  };
}

export function useActivitiesData() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [items, setItems] = useState<PlanCreditBlockItem[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [careers, setCareers] = useState<Career[]>([]);
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ActivityDraft>(createDraft(null));
  const [saving, setSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const { isOpen, options, open, close, handleConfirm } = useConfirm();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterUnassigned, setFilterUnassigned] = useState(false);
  const [filterInstituteId, setFilterInstituteId] = useState("");
  const [filterCareerId, setFilterCareerId] = useState("");

  const selectedActivity = activities.find((a) => a.id === selectedId) ?? null;

  // Build mapping: activityId -> Set<instituteId> via items -> plan -> career -> institute
  const activityInstituteMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const item of items) {
      if (!item.studyPlanId) continue;
      const plan = plans.find((p) => String(p.id) === item.studyPlanId);
      if (!plan) continue;
      const career = careers.find((c) => String(c.id) === String(plan.careerId));
      if (!career) continue;
      const key = String(item.activityId);
      if (!map.has(key)) map.set(key, new Set());
      map.get(key)!.add(String(career.instituteId));
    }
    return map;
  }, [items, plans, careers]);

  // Build mapping: activityId -> Set<careerId>
  const activityCareerMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const item of items) {
      if (!item.studyPlanId) continue;
      const plan = plans.find((p) => String(p.id) === item.studyPlanId);
      if (!plan) continue;
      const key = String(item.activityId);
      if (!map.has(key)) map.set(key, new Set());
      map.get(key)!.add(String(plan.careerId));
    }
    return map;
  }, [items, plans]);

  // Auto-select first institute on initial load
  useEffect(() => {
    if (initialLoadDone.current && !filterInstituteId && institutes.length > 0) {
      setFilterInstituteId(String(institutes[0].id));
    }
  }, [institutes]);

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

  const filteredActivities = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return activities.filter((a) => {
      const aid = String(a.id);
      const code = a.code ?? "";

      if (q && !a.name.toLowerCase().includes(q) && !code.toLowerCase().includes(q)) return false;

      // Institute filter
      let matchInstitute = true;
      if (filterUnassigned) {
        matchInstitute = !activityInstituteMap.has(aid);
      } else if (filterInstituteId) {
        matchInstitute = activityInstituteMap.get(aid)?.has(filterInstituteId) ?? false;
      }
      if (!matchInstitute) return false;

      // Career filter
      if (filterCareerId) {
        const match = activityCareerMap.get(aid)?.has(filterCareerId) ?? false;
        if (!match) return false;
      }

      return true;
    });
  }, [activities, searchTerm, filterUnassigned, filterInstituteId, filterCareerId, activityInstituteMap, activityCareerMap]);

  const initialLoadDone = useRef(false);

  const loadAllData = useCallback(() => {
    setIsLoading(true);
    setError(null);
    Promise.all([
      getInstitutes(),
      getCareers(),
      getPlans(),
      getPlanCreditBlockItems(),
      getActivities(),
    ])
      .then(([instData, careerData, planData, itemData, actData]) => {
        setInstitutes(instData);
        setCareers(careerData);
        setPlans(planData);
        setItems(itemData);
        setActivities(actData);
        initialLoadDone.current = true;
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Error cargando datos");
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    setDraft(createDraft(selectedActivity));
  }, [selectedActivity]);

  const handleSelect = (id: string) => {
    setSelectedId((prev) => (prev === id ? null : id));
    setValidationErrors({});
  };

  const handleNew = () => {
    setSelectedId(null);
    setDraft(createDraft(null));
    setValidationErrors({});
  };

  const handleFieldChange = (field: keyof ActivityDraft, value: string) => {
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
        description: draft.description.trim() || undefined,
      };

      if (selectedId) {
        await updateActivity(selectedId, payload);
      } else {
        await createActivity(payload);
      }
      loadAllData();
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

  const resetFilters = () => {
    setSearchTerm("");
    setFilterUnassigned(false);
    setFilterInstituteId("");
    setFilterCareerId("");
  };

  const handleFilterInstituteChange = (value: string) => {
    setFilterInstituteId(value);
    clearSelection();
  };

  const handleFilterCareerChange = (value: string) => {
    setFilterCareerId(value);
  };

  const handleDelete = (id: string) => {
    const activity = activities.find((a) => a.id === id);
    open({
      title: "Eliminar actividad",
      description: `¿Confirmás eliminar ${activity?.name ?? "la actividad"}?`,
      variant: "danger",
      onConfirm: async () => {
        try {
          await deleteActivity(id);
          if (selectedId === id) handleNew();
          loadAllData();
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
    activities,
    filteredActivities,
    institutes,
    careers,
    careersByInstitute,
    instituteFilterOptions,
    isLoading,
    error,
    selectedId,
    selectedActivity,
    draft,
    saving,
    validationErrors,
    searchTerm,
    setSearchTerm,
    filterUnassigned,
    setFilterUnassigned,
    filterInstituteId,
    setFilterInstituteId,
    filterCareerId,
    setFilterCareerId,
    handleFilterInstituteChange,
    handleFilterCareerChange,
    clearSelection,
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
