import { Card } from "@/widgets/ui/Card";
import { Button } from "@/widgets/ui/Button";
import { PageHeader } from "@/widgets/ui/PageHeader";
import { Toggle } from "@/widgets/ui/Toggle";
import { useSimulator } from "../hooks/useSimulator";
import type { SubjectGraph, SubjectClassification } from "../../customPlan/model/planner";

function periodLabel(year: number, term: number): string {
  const ordinals = ["", "Primer", "Segundo"];
  return `${year}° Año – ${ordinals[term] || term}° Cuatrimestre`;
}

interface Props {
  onBack?: () => void;
  graph?: SubjectGraph | null;
  classification?: Map<number, SubjectClassification> | null;
}

export function SimulatorView({ onBack, graph, classification }: Props) {
  console.log("🖥️ [SimulatorView] Renderizando con graph:", !!graph, "y classification:", !!classification);

  const { enrolledSubjects, results, groupedResults, nameMap, checked, anyChecked, isLoading, error, toggle, retry } = useSimulator(
    graph,
    classification
  );

  if (isLoading && enrolledSubjects.length === 0) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
        <Card>
          <div className="animate-pulse space-y-4">
            <div className="h-6 w-48 bg-slate-200 rounded" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-slate-100 rounded-xl" />
              ))}
            </div>
          </div>
        </Card>
        <Card bodyClassName="bg-surface-container-low p-6 min-h-[400px]" className="animate-pulse">
          <div className="h-6 w-48 bg-slate-200 rounded mb-6" />
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 bg-slate-100 rounded-xl" />
            ))}
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-error-container/10 border border-error/30 rounded-2xl p-8 text-center">
          <span className="material-symbols-outlined text-error text-5xl mb-4">error_outline</span>
          <p className="text-error font-semibold mb-2">Error al cargar el simulador</p>
          <p className="text-on-surface-variant text-sm mb-6">{error}</p>
          <button
            onClick={retry}
            className="px-6 py-2 bg-primary text-on-primary rounded-lg font-semibold text-sm hover:bg-primary/90 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (enrolledSubjects.length === 0) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-surface-container-low border border-dashed border-outline-variant rounded-2xl p-12 text-center">
          <span className="material-symbols-outlined text-slate-300 text-6xl mb-4">school</span>
          <h3 className="font-title-md text-on-surface mb-2">No tenés materias en curso</h3>
          <p className="text-on-surface-variant max-w-md mx-auto">
            El simulador necesita materias en curso para proyectar qué correlativas podrías desbloquear.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl
    ">
      <PageHeader
        eyebrow="Herramientas académicas"
        title="Simulador de Correlativas"
        actions={onBack && (
          <Button variant="secondary" onClick={onBack}>
            <span className="material-symbols-outlined">arrow_back</span>
            Volver al Menú
          </Button>
        )}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative mt-8">
        <Card header={<h3 className="font-title-sm text-primary">Materias en Progreso</h3>}>
          <div className="space-y-4">
            {enrolledSubjects.map((s) => (
              <div onClick={() => toggle(s.plan_subject_id)}
                key={s.plan_subject_id}
                className="cursor-pointer flex items-center gap-4 p-5 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors"
              >
                <Toggle checked={!!checked[s.plan_subject_id]} onChange={() => toggle(s.plan_subject_id)} />
                <span className="flex-1 font-semibold text-slate-700" >
                  {s.subject_name}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card
          header={<h3 className="font-title-sm text-primary">Resultados de Simulación</h3>}
          bodyClassName="bg-surface-container-low p-6 flex flex-col flex-1"
          className="min-h-[400px]"
        >
          {!anyChecked ? (
            <div className="flex-1 flex flex-col justify-center items-center text-center space-y-4">
              <span className="material-symbols-outlined text-slate-300 text-6xl">lock</span>
              <p className="text-slate-500 max-w-xs">
                Selecciona las materias que planeas aprobar para ver qué opciones se habilitan en el próximo cuatrimestre.
              </p>
            </div>
          ) : isLoading ? (
            <div className="flex-1 flex flex-col justify-center items-center">
              <span className="material-symbols-outlined text-primary text-4xl animate-spin">progress_activity</span>
              <p className="text-slate-500 mt-4">Simulando...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="flex-1 flex flex-col justify-center items-center text-center space-y-4">
              <span className="material-symbols-outlined text-slate-300 text-6xl">lock</span>
              <p className="text-slate-500 max-w-xs">
                No se desbloquean nuevas materias con las seleccionadas.
              </p>
            </div>
          ) : (
            <div className="space-y-6 overflow-y-auto">
            {Object.entries(groupedResults.singleGroups).map(([unlockedBy, items]) => (
              <div key={unlockedBy}>
                <h4 className="font-title-sm text-primary mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary/40"></span>
                  {nameMap[Number(unlockedBy)] ?? `Materia #${unlockedBy}`}
                </h4>
                <div className="space-y-3">
                  {items.map((r) => (
                    <div
                      key={r.plan_subject_id}
                      className="p-4 bg-secondary-container/20 border border-secondary-container/50 rounded-xl flex items-center gap-4"
                    >
                      <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-secondary">lock_open</span>
                      </div>
                      <div>
                        <p className="font-bold text-on-secondary-container">{r.subject_name}</p>
                        <p className="text-xs text-secondary/70">
                          Habilitada para {periodLabel(r.suggested_year, r.suggested_term)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {groupedResults.multiSubjects.length > 0 && (
              <div>
                <h4 className="font-title-sm text-tertiary-container mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">warning</span>
                  Requieren aprobar varias materias
                </h4>
                <div className="space-y-3">
                  {groupedResults.multiSubjects.map((r) => (
                    <div
                      key={r.plan_subject_id}
                      className="p-4 bg-tertiary-fixed/10 border border-tertiary-fixed-dim/30 rounded-xl"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-tertiary-container/10 rounded-full flex items-center justify-center">
                          <span className="material-symbols-outlined text-tertiary-container">lock_open</span>
                        </div>
                        <div>
                          <p className="font-bold text-on-surface">{r.subject_name}</p>
                          <p className="text-xs text-on-surface-variant">
                            Habilitada para {periodLabel(r.suggested_year, r.suggested_term)}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 ml-[52px]">
                        {r.unlocked_by.map((id) => (
                          <span
                            key={id}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-surface text-xs text-on-surface-variant border border-outline-variant/50"
                          >
                            <span className="material-symbols-outlined text-[14px]">check_circle</span>
                            {nameMap[id] ?? `Materia #${id}`}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
      </div>
    </div>
  );
}
