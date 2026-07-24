import { useEffect, useMemo, useState } from "react";
import { getInstitutes } from "@/entities/Institute";
import { getCareers } from "@/entities/Career";
import { getPlans, deletePlan } from "@/entities/Plan";
import type { Institute } from "@/entities/Institute/model/institute";
import type { Career } from "@/entities/Career/model/career";

export interface PlanItem {
  id: string;
  careerId: string;
  name: string;
  status: string;
  duration: number;
  minTotalCredits: number | null;
}

const INSTITUTE_STORAGE_KEY = "plans_selected_institute_id";
const CAREER_STORAGE_KEY = "plans_selected_career_id";

const STATUS_VARIANTS: Record<string, string> = {
  vigente: "positive",
  en_transicion: "warning",
  discontinuado: "neutral",
};

const STATUS_LABELS: Record<string, string> = {
  vigente: "Vigente",
  en_transicion: "En transición",
  discontinuado: "Discontinuado",
};

export function usePlansData() {
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [careers, setCareers] = useState<Career[]>([]);
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedInstitute, setSelectedInstitute] = useState("");
  const [selectedCareer, setSelectedCareer] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCareers = useMemo(
    () => careers.filter((c) => String(c.instituteId) === selectedInstitute),
    [careers, selectedInstitute]
  );

  const filteredPlans = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return plans.filter((p) => {
      const matchCareer = String(p.careerId) === selectedCareer;
      const matchSearch = !q || p.name.toLowerCase().includes(q);
      return matchCareer && matchSearch;
    });
  }, [plans, selectedCareer, searchTerm]);

  const selectedPlan = useMemo(
    () => plans.find((p) => p.id === selectedPlanId) ?? null,
    [plans, selectedPlanId]
  );

  const formatCareerName = (careerId: string) =>
    careers.find((c) => String(c.id) === String(careerId))?.name ?? "Carrera no definida";

  const formatInstituteNameFromCareer = (careerId: string) => {
    const career = careers.find((c) => String(c.id) === String(careerId));
    if (!career) return "Instituto no definido";
    const institute = institutes.find((i) => String(i.id) === String(career.instituteId));
    return institute?.name ?? "Instituto no definido";
  };

  const statusLabel = (s: string) => STATUS_LABELS[s] ?? s;

  const statusVariant = (s: string) => STATUS_VARIANTS[s] ?? "neutral";

  const resetFilters = () => {
    setSearchTerm("");
    const firstInst = String(institutes[0]?.id ?? "");
    setSelectedInstitute(firstInst);
    const firstCareer = String(careers.find((c) => String(c.instituteId) === firstInst)?.id ?? "");
    setSelectedCareer(firstCareer);
    setSelectedPlanId(null);
  };

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      setIsLoading(true);
      setError(null);
      try {
        const [institutesData, careersData, plansData] = await Promise.all([
          getInstitutes(),
          getCareers(),
          getPlans(),
        ]);

        if (!mounted) return;

        const mappedPlans: PlanItem[] = plansData.map((plan: any) => ({
          id: String(plan.id),
          careerId: String(plan.careerId ?? careersData[0]?.id ?? ""),
          name: plan.name,
          status: plan.status ?? "vigente",
          duration: Number(plan.yearsDuration ?? 1),
          minTotalCredits: plan.minTotalCredits ?? null,
        }));

        setInstitutes(institutesData);
        setCareers(careersData);
        setPlans(mappedPlans);

        const savedInstituteId = localStorage.getItem(INSTITUTE_STORAGE_KEY);
        const savedCareerId = localStorage.getItem(CAREER_STORAGE_KEY);

        const validInstitute = savedInstituteId && institutesData.some((i) => String(i.id) === savedInstituteId);
        const instituteId = validInstitute ? savedInstituteId! : String(institutesData[0]?.id ?? "");

        setSelectedInstitute(instituteId);

        const careersOfInstitute = careersData.filter((c) => String(c.instituteId) === instituteId);
        const validCareer = savedCareerId && careersOfInstitute.some((c) => String(c.id) === savedCareerId);
        const careerId = validCareer ? savedCareerId! : String(careersOfInstitute[0]?.id ?? "");

        setSelectedCareer(careerId);

        const careerPlans = mappedPlans.filter((p) => String(p.careerId) === careerId);
        setSelectedPlanId(careerPlans[0]?.id ?? null);

        if (!validInstitute) localStorage.setItem(INSTITUTE_STORAGE_KEY, instituteId);
        if (!validCareer) localStorage.setItem(CAREER_STORAGE_KEY, careerId);
      } catch (err: any) {
        if (!mounted) return;
        setError(err.message || "Error cargando planes");
        setInstitutes([]);
        setCareers([]);
        setPlans([]);
        setSelectedInstitute("");
        setSelectedCareer("");
        setSelectedPlanId(null);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    loadData();
    return () => { mounted = false; };
  }, []);

  const handleSelectInstitute = (id: string) => {
    setSelectedInstitute(id);
    localStorage.setItem(INSTITUTE_STORAGE_KEY, id);
    const firstCareerOfInstitute = careers.find((c) => String(c.instituteId) === id);
    if (firstCareerOfInstitute) {
      const careerId = String(firstCareerOfInstitute.id);
      setSelectedCareer(careerId);
      localStorage.setItem(CAREER_STORAGE_KEY, careerId);
      const careerPlans = plans.filter((p) => String(p.careerId) === careerId);
      setSelectedPlanId(careerPlans[0]?.id ?? null);
    } else {
      setSelectedCareer("");
      localStorage.removeItem(CAREER_STORAGE_KEY);
      setSelectedPlanId(null);
    }
    setSearchTerm("");
  };

  const handleSelectCareer = (id: string) => {
    setSelectedCareer(id);
    localStorage.setItem(CAREER_STORAGE_KEY, id);
    const careerPlans = plans.filter((p) => String(p.careerId) === id);
    setSelectedPlanId(careerPlans[0]?.id ?? null);
    setSearchTerm("");
  };

  const handleSelectPlan = (planId: string) => {
    setSelectedPlanId((prev) => (prev === planId ? null : planId));
  };

  const handleNewPlan = () => {
    setShowWizard(true);
  };

  const confirmDelete = () => {
    if (!selectedPlan) return;
    (async () => {
      try {
        await deletePlan(selectedPlan.id);
        const remainingPlans = plans.filter((plan) => plan.id !== selectedPlan.id);
        setPlans(remainingPlans);
        setSelectedPlanId(null);
        setDeleteOpen(false);
      } catch (err: any) {
        console.error("Error eliminando plan", err);
        setDeleteOpen(false);
      }
    })();
  };

  return {
    institutes,
    careers,
    plans,
    filteredCareers,
    filteredPlans,
    isLoading,
    error,
    selectedInstitute,
    selectedCareer,
    selectedPlan,
    selectedPlanId,
    deleteOpen,
    showWizard,
    searchTerm,
    setSearchTerm,
    setSelectedInstitute,
    setSelectedCareer,
    setSelectedPlanId,
    setDeleteOpen,
    setShowWizard,
    formatCareerName,
    formatInstituteNameFromCareer,
    statusLabel,
    statusVariant,
    resetFilters,
    handleSelectInstitute,
    handleSelectCareer,
    handleSelectPlan,
    handleNewPlan,
    confirmDelete,
  };
}
