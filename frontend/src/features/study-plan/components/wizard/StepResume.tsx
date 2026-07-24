import { useState } from "react";
import { Card } from "@/widgets/ui/Card";
import { Button } from "@/widgets/ui/Button";
import { Form } from "@/widgets/ui/Form";
import { Modal } from "@/widgets/ui/Modal";
import type { PlanDraft } from "../PlanCreationWizard";
import type { AddedSubject } from "./StepAddSubjects";
import type { UnahurBlockDraft, ElectiveBlockDraft } from "./StepCreateBlocks";
import type { CreditBlockDraft } from "./StepCreditBlocks";

interface Props {
  planDraft: PlanDraft;
  careerName?: string;
  instituteName?: string;
  addedSubjects: AddedSubject[];
  unahurBlocks: UnahurBlockDraft[];
  electiveBlocks: ElectiveBlockDraft[];
  creditBlocks: CreditBlockDraft[];
  electiveSubjects: { idx: number; name: string }[];
  allActivities: { id: string; name: string }[];
}

export function StepResume({
  addedSubjects,
  unahurBlocks,
  electiveBlocks,
  creditBlocks,
  electiveSubjects,
  allActivities,
}: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalItems, setModalItems] = useState<{ name: string }[]>([]);

  const mandatory = addedSubjects.filter((s) => !s.isElective);

  const yearsMap = new Map<number, number>();
  for (const s of mandatory) {
    yearsMap.set(s.year, (yearsMap.get(s.year) || 0) + 1);
  }

  const showModal = (title: string, items: { name: string }[]) => {
    setModalTitle(title);
    setModalItems(items);
    setModalOpen(true);
  };

  return (
    <>
      <Card
        header={
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[24px] text-on-surface">assignment</span>
            <h3 className="font-title-sm text-title-sm text-on-surface">Resumen del plan</h3>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Subjects */}
          {mandatory.length > 0 && (
            <div>
              <h3 className="font-title-sm text-title-sm text-on-surface mb-3">Materias</h3>
              <p className="text-body-sm text-on-surface-variant mb-3">
                El plan tiene un total de {mandatory.length} materia{mandatory.length !== 1 ? "s" : ""} obligatoria{mandatory.length !== 1 ? "s" : ""}.
              </p>
              <ul className="space-y-3">
                {Array.from(yearsMap.entries())
                  .sort(([a], [b]) => a - b)
                  .map(([year, count]) => {
                    const yearWithoutCorr = mandatory.filter((s) => s.year === year && s.correlatives.length === 0);
                    return (
                      <li key={year} className="text-body-sm">
                        <p className="font-medium text-on-surface">{year}° Año</p>
                        <ul className="list-disc list-inside text-on-surface-variant mt-1 space-y-1">
                          <li>Este periodo tiene un total de {count} materia{count !== 1 ? "s" : ""}.</li>
                          {yearWithoutCorr.length > 0 && (
                            <li>
                              Existen {yearWithoutCorr.length} materia{yearWithoutCorr.length !== 1 ? "s" : ""} sin correlativas en este periodo.{' '}
                              <button
                                type="button"
                                onClick={() => showModal("Materias sin correlativas", yearWithoutCorr.map((s) => ({ name: s.name })))}
                                className="text-primary hover:underline font-medium"
                              >
                                Ver materias sin correlativas
                              </button>
                            </li>
                          )}
                        </ul>
                      </li>
                    );
                  })}
              </ul>
            </div>
          )}

          {/* Blocks */}
          {(unahurBlocks.length > 0 || electiveBlocks.length > 0) && <hr className="border-outline-variant" />}

          {(unahurBlocks.length > 0 || electiveBlocks.length > 0) && (
            <div>
              <h3 className="font-title-sm text-title-sm text-on-surface mb-3">Bloques</h3>
              <p className="text-body-sm text-on-surface-variant mb-3">
                Un estudiante debe completar {unahurBlocks.length + electiveBlocks.length} bloque{unahurBlocks.length + electiveBlocks.length !== 1 ? "s" : ""} a lo largo del plan de estudio.
              </p>

              {unahurBlocks.length > 0 && (
                <div className="mb-3">
                  <p className="text-body-sm font-medium text-on-surface mb-2">Bloques UNAHUR (Un total de {unahurBlocks.length})</p>
                  <ul className="list-disc list-inside text-body-sm text-on-surface-variant space-y-1">
                    {unahurBlocks.map((b, i) => (
                      <li key={i}>Año {b.suggestedYear}, {b.suggestedTerm === 1 ? "primer cuatrimestre" : "segundo cuatrimestre"}.</li>
                    ))}
                  </ul>
                </div>
              )}

              {electiveBlocks.length > 0 && (
                <div>
                  <p className="text-body-sm font-medium text-on-surface mb-2">Bloque de electivas (Un total de {electiveBlocks.length})</p>
                  <ul className="space-y-2">
                    {electiveBlocks.map((b, i) => (
                      <li key={i}>
                        <p className="text-body-sm font-medium text-on-surface">Bloque de electivas {i + 1}:</p>
                        <ul className="list-disc list-inside text-body-sm text-on-surface-variant ml-4 mt-1 space-y-1">
                          <li>Año {b.suggestedYear}, {b.suggestedTerm === 1 ? "primer cuatrimestre" : "segundo cuatrimestre"}.</li>
                          <li>
                            Este bloque tiene un total de {b.poolSubjectIndices.length} materia{b.poolSubjectIndices.length !== 1 ? "s" : ""}.{' '}
                            {b.poolSubjectIndices.length > 0 && (
                              <button
                                type="button"
                                onClick={() =>
                                  showModal(
                                    `Materias de ${b.name}`,
                                    b.poolSubjectIndices
                                      .map((idx) => electiveSubjects.find((es) => es.idx === idx))
                                      .filter(Boolean)
                                      .map((s) => ({ name: s!.name }))
                                  )
                                }
                                className="text-primary hover:underline font-medium"
                              >
                                Ver materias del bloque
                              </button>
                            )}
                          </li>
                        </ul>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Credit blocks */}
          {creditBlocks.length > 0 && <hr className="border-outline-variant" />}

          {creditBlocks.length > 0 && (
            <div>
              <h3 className="font-title-sm text-title-sm text-on-surface mb-3">Bloque de créditos</h3>
              <p className="text-body-sm text-on-surface-variant mb-3">
                El estudiante debe completar {creditBlocks.length} bloque{creditBlocks.length !== 1 ? "s" : ""} de actividades con créditos.
              </p>
              <ul className="space-y-3">
                {creditBlocks.map((b, i) => (
                  <li key={i} className="text-body-sm">
                    <p className="font-medium text-on-surface">{b.name}</p>
                    <ul className="list-disc list-inside text-on-surface-variant mt-1 space-y-1">
                      <li>
                        El bloque contiene {b.activityIds.length} actividad{b.activityIds.length !== 1 ? "es" : ""} con créditos.{' '}
                        {b.activityIds.length > 0 && (
                          <button
                            type="button"
                            onClick={() =>
                              showModal(
                                `Actividades de ${b.name}`,
                                b.activityIds
                                  .map((id) => allActivities.find((a) => String(a.id) === id))
                                  .filter(Boolean)
                                  .map((a) => ({ name: a!.name }))
                              )
                            }
                            className="text-primary hover:underline font-medium"
                          >
                            Ver actividades
                          </button>
                        )}
                      </li>
                      <li>Se requieren {b.minCreditsRequired} créditos para su finalización.</li>
                      <li>Se permiten obtener un límite de {b.maxCreditsAllowed} créditos en este bloque.</li>
                    </ul>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Card>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalTitle}
        size="sm"
        footer={
          <div className="flex gap-3">
            <div className="flex-1 flex flex-col">
              <Button variant="secondary" onClick={() => setModalOpen(false)}>
                <span className="material-symbols-outlined text-[24px]">close</span>
                Cerrar
              </Button>
            </div>
          </div>
        }
      >
        <div className="max-h-80 overflow-y-auto">
          {modalItems.length === 0 ? (
            <p className="text-body-sm text-on-surface-variant">Sin elementos.</p>
          ) : (
            <table className="w-full text-sm">
              <tbody className="divide-y divide-slate-50">
                {modalItems.map((item, i) => (
                  <tr key={i}>
                    <td className="py-2 font-medium text-on-surface">{item.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Modal>
    </>
  );
}
