import { useEffect, useState } from "react";
import { usePlanBreakdown } from "../hooks/usePlanBreakdown";
import { PlanSubjectsTable } from "./PlanSubjectsTable";
import { CollapsibleContent } from "./CollapsibleContent";

interface Props {
  planId: string | null;
}

export function PlanBreakdownView({ planId }: Props) {
  const { data, isLoading, isEmpty } = usePlanBreakdown(planId);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"years" | "activities">("years");

  useEffect(() => {
    setOpenKey(null);
    setViewMode("years");
  }, [planId]);

  if (!planId) return null;

  if (isLoading) {
    return (
      <div className="space-y-3 mt-6">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5">
          <p className="text-body-sm text-on-surface-variant">Cargando estructura del plan...</p>
        </div>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="space-y-3 mt-6">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5">
          <p className="text-body-sm text-on-surface-variant">
            El plan no tiene materias cargadas.
          </p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const toggle = (key: string) => {
    setOpenKey((prev) => (prev === key ? null : key));
  };

  const yearSections = data.years.map((y) => ({
    key: `year-${y.year}`,
    name: `${y.year}° Año`,
    subjects: y.subjects,
    theadLabel: "Materia" as const,
    hideCorrelatives: false as const,
  }));

  const activitySections = data.creditBlocks.map((b) => ({
    key: b.id,
    name: b.name,
    description: b.minCreditsRequired != null
      ? `Se requieren ${b.minCreditsRequired} créditos`
      : undefined,
    subjects: b.subjects,
    theadLabel: "Actividad" as const,
    hideCorrelatives: true as const,
  }));

  const sections = viewMode === "years" ? yearSections : activitySections;

  return (
    <div className="space-y-3 mt-6">
      <div className="flex bg-slate-100 rounded-lg p-0.5 w-fit">
        <button
          type="button"
          onClick={() => setViewMode("years")}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            viewMode === "years"
              ? "bg-white text-on-surface shadow-sm"
              : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          Ver años
        </button>
        <button
          type="button"
          onClick={() => setViewMode("activities")}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            viewMode === "activities"
              ? "bg-white text-on-surface shadow-sm"
              : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          Ver actividades
        </button>
      </div>

      {sections.length === 0 ? (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5">
          <p className="text-body-sm text-on-surface-variant">
            {viewMode === "years"
              ? "No hay años cargados en el plan."
              : "No hay actividades cargadas."}
          </p>
        </div>
      ) : (
        sections.map((section) => {
          const isOpen = openKey === section.key;
          return (
            <div
              key={section.key}
              className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-visible shadow-sm"
            >
              <button
                type="button"
                onClick={() => toggle(section.key)}
                className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors"
              >
                <h4 className="font-body-md font-bold text-on-surface text-left">
                {section.name}
                {(section as any).description && (
                  <span className="text-body-sm text-on-surface-variant font-normal mx-2">· {(section as any).description}</span>
                )}
              </h4>
                <span
                  className="material-symbols-outlined transition-transform duration-300"
                  style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                >
                  expand_more
                </span>
              </button>
              <CollapsibleContent isOpen={isOpen}>
                <div className="border-t border-slate-100">
                  <div className="p-5">
                    {section.subjects.length === 0 ? (
                      <p className="text-body-sm text-on-surface-variant">
                        No hay registros.
                      </p>
                    ) : (
                      <PlanSubjectsTable
                        subjects={section.subjects}
                        theadLabel={section.theadLabel}
                        hideCorrelatives={section.hideCorrelatives}
                      />
                    )}
                  </div>
                </div>
              </CollapsibleContent>
            </div>
          );
        })
      )}
    </div>
  );
}
