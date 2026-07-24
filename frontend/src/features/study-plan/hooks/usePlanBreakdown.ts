import { useEffect, useState, useMemo } from "react";
import { getPlanSubjects } from "@/entities/PlanSubject";
import { getSubjects } from "@/entities/Subject";
import { getCorrelativities } from "@/entities/Correlativity";
import { getUnahurBlocks } from "@/entities/UnahurBlock";
import { getElectiveBlocks } from "@/entities/ElectiveBlock";
import { getCreditBlocks } from "@/entities/CreditBlock";
import type { TableSubject } from "../components/PlanSubjectsTable";

export interface BreakdownYear {
  year: number;
  subjects: TableSubject[];
}

export interface CreditBlockInfo {
  id: string;
  name: string;
  minCreditsRequired: number | null;
  subjects: TableSubject[];
}

export interface PlanBreakdownData {
  years: BreakdownYear[];
  creditBlocks: CreditBlockInfo[];
}

const TYPE_LABELS: Record<string, string> = {
  regularidad: "Regularidad",
  aprobacion: "Finalizada",
  finalizada: "Finalizada",
};

export function usePlanBreakdown(planId: string | null) {
  const [data, setData] = useState<PlanBreakdownData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!planId) {
      setData(null);
      return;
    }

    let mounted = true;

    async function load() {
      setIsLoading(true);
      try {
        const [planSubjects, subjects, correlativities, unahurBlocks, electiveBlocks, creditBlocks] =
          await Promise.all([
            getPlanSubjects(planId),
            getSubjects(),
            getCorrelativities(),
            getUnahurBlocks(planId),
            getElectiveBlocks(planId),
            getCreditBlocks(planId),
          ]);

        if (!mounted) return;

        const subjectMap = new Map(subjects.map((s: any) => [String(s.id), s]));
        const psById = new Map(planSubjects.map((ps: any) => [String(ps.id), ps]));

        // Build correlativity map: targetPsId -> [{ name, type }]
        const corrMap = new Map<string, { name: string; type: string }[]>();
        for (const c of correlativities) {
          const targetId = String(c.idPlanSubjectTarget);
          if (!corrMap.has(targetId)) corrMap.set(targetId, []);
          const reqPs = psById.get(String(c.idRequiredPlanSubject));
          if (reqPs) {
            const reqSub = subjectMap.get(String(reqPs.idSubject));
            if (reqSub) {
              corrMap.get(targetId)!.push({
                name: reqSub.name,
                type: TYPE_LABELS[c.type ?? ""] ?? c.type ?? "—",
              });
            }
          }
        }

        function toTableSubject(ps: any): TableSubject {
          const sub = subjectMap.get(String(ps.idSubject));
          return {
            name: sub?.name ?? "Materia no definida",
            credits: ps.credits ?? 0,
            correlatives: corrMap.get(String(ps.id)) ?? [],
          };
        }

        // Collect elective planSubject ids
        const electivePsIds = new Set<string>();
        for (const block of electiveBlocks) {
          for (const es of block.subjects ?? []) {
            electivePsIds.add(String(es.idPlanSubject));
          }
        }

        // Group planSubjects by year
        const yearMap = new Map<number, TableSubject[]>();

        for (const ps of planSubjects) {
          const psId = String(ps.id);
          if (ps.is_elective) continue;
          if (electivePsIds.has(psId)) continue;
          const sub = subjectMap.get(String(ps.idSubject));
          if (sub?.is_unahur) continue;
          const yr = ps.suggestedYear;
          if (yr <= 0) continue;
          if (!yearMap.has(yr)) yearMap.set(yr, []);
          yearMap.get(yr)!.push(toTableSubject(ps));
        }

        // Add UNAHUR blocks into their years
        for (const block of unahurBlocks) {
          const blockPs = planSubjects.filter((ps: any) => {
            const sub = subjectMap.get(String(ps.idSubject));
            return sub?.is_unahur && ps.suggestedYear === block.suggestedYear;
          });
          const yr = block.suggestedYear;
          if (!yearMap.has(yr)) yearMap.set(yr, []);
          yearMap.get(yr)!.push({
            name: `Materia UNAHUR ${toRoman(block.sortOrder ?? 1)}`,
            credits: 0,
            correlatives: [],
            isBlock: true,
            blockType: "unahur",
            subtitle: "Se requiere una materia",
            poolSubjects: blockPs.map(toTableSubject),
          });
        }

        // Add elective blocks into their suggestedYear
        for (const block of electiveBlocks) {
          const yr = block.suggestedYear ?? 1;
          const blockSubjects: TableSubject[] = [];
          for (const es of block.subjects ?? []) {
            const ps = psById.get(String(es.idPlanSubject));
            if (ps) blockSubjects.push(toTableSubject(ps));
          }
          if (!yearMap.has(yr)) yearMap.set(yr, []);
          yearMap.get(yr)!.push({
            name: block.name,
            credits: 0,
            correlatives: [],
            isBlock: true,
            blockType: "elective",
            subtitle: "Se requiere una materia",
            poolSubjects: blockSubjects,
          });
        }

        const years: BreakdownYear[] = Array.from(yearMap.entries())
          .map(([year, subjects]) => ({ year, subjects }))
          .sort((a, b) => a.year - b.year);

        const creditBlocksInfo: CreditBlockInfo[] = creditBlocks.map((b: any) => ({
          id: String(b.id),
          name: b.name,
          minCreditsRequired: b.minCreditsRequired ?? null,
          subjects: (b.items ?? []).map((item: any) => ({
            name: item.activityName ?? "Actividad",
            credits: item.credits ?? 0,
            correlatives: [],
          })),
        }));

        setData({ years, creditBlocks: creditBlocksInfo });
      } catch {
        if (mounted) setData(null);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    load();
    return () => { mounted = false; };
  }, [planId]);

  const isEmpty = useMemo(
    () => data && data.years.length === 0 && data.creditBlocks.length === 0,
    [data]
  );

  return { data, isLoading, isEmpty };
}

function toRoman(n: number): string {
  const map: [number, string][] = [
    [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
  ];
  let result = "";
  let remaining = n;
  for (const [value, numeral] of map) {
    while (remaining >= value) {
      result += numeral;
      remaining -= value;
    }
  }
  return result;
}
