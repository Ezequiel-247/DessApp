import { useEffect, useState } from "react";
import { getCareers, normalizeCareer } from "@/entities/Career";
import { getPlans } from "@/entities/Plan";
import { getInstitutes } from "@/entities/Institute";
import type { Career, CareerPlan, CareerPlanStatus } from "@/entities/Career/model/career";

export type CareerDraft = Career & { plans: CareerPlan[] };

export interface Institute {
  id: string;
  name: string;
}

export function useCareersData() {
  const [careers, setCareers] = useState<CareerDraft[]>([]);
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [selectedCareerId, setSelectedCareerId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const [careersResp, plansResp, institutesResp] = await Promise.all([
          getCareers(),
          getPlans(),
          getInstitutes(),
        ]);

        const mapped = careersResp.map((c) => ({
          ...normalizeCareer(c),
          plans: plansResp
            .filter((p) => String(p.careerId) === String(c.id))
            .map((p) => ({
              id: p.id,
              careerId: p.careerId,
              name: p.name,
              status: (p.status || "vigente") as CareerPlanStatus,
              duration: p.yearsDuration ?? 1,
            })),
        }));

        if (!mounted) return;
        setCareers(mapped);
        setInstitutes(institutesResp);
        setSelectedCareerId(null);
      } catch (err) {
        console.error("Failed to load careers data:", err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return { careers, setCareers, institutes, selectedCareerId, setSelectedCareerId, isLoading };
}
