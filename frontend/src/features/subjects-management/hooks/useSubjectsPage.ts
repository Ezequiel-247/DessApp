import { useEffect, useMemo, useState, useRef } from "react";
import type { Subject } from "@/entities/Subject";
import type { Career } from "@/entities/Career/model/career";
import type { Correlativity } from "@/entities/Correlativity";
import { getCareers } from "@/entities/Career";
import { getPlans } from "@/entities/Plan";
import { getSubjects, createSubject, updateSubject } from "@/entities/Subject";
import {
  getPlanSubjects,
  createPlanSubject,
  updatePlanSubject,
  deletePlanSubject,
  denormalizePlanSubject,
} from "@/entities/PlanSubject";
import {
  getCorrelativities,
  createCorrelativity,
  updateCorrelativity,
  deleteCorrelativity,
} from "@/entities/Correlativity";
import { useSubjectLookup } from "./useSubjectLookup";

export type SubjectRecord = {
  id: string;
  subjectEntityId: string;
  careerId: string;
  careerName: string;
  planId: string;
  planName: string;
  name: string;
  code: string;
  is_unahur: boolean;
  credits: number;
  year: number;
  semester: number;
};

export type SubjectDraft = {
  name: string;
  code: string;
  is_unahur: boolean;
  credits: number;
  year: number;
  semester: number;
};

function createDraft(record?: SubjectRecord | null): SubjectDraft {
  return {
    name: record?.name ?? "",
    code: record?.code ?? "",
    is_unahur: record?.is_unahur ?? false,
    credits: record?.credits ?? 0,
    year: record?.year ?? 1,
    semester: record?.semester ?? 1,
  };
}

/**
 * Detecta si agregar una correlativa crearía un ciclo en el grafo.
 * Usa BFS: si desde `newRequiredId` se puede llegar a `targetPlanSubjectId`,
 * entonces hay ciclo (porque targetPlanSubjectId → newRequiredId → ... → targetPlanSubjectId).
 */
function hasCyclicDependency(
  targetPlanSubjectId: string,
  newRequiredId: string,
  correlativities: Correlativity[]
): boolean {
  // Build adjacency list from correlativities
  const graph = new Map<string, Set<string>>();

  for (const corr of correlativities) {
    const target = String(corr.idPlanSubjectTarget ?? "");
    const required = String(corr.idRequiredPlanSubject ?? "");
    if (!target || !required) continue;

    if (!graph.has(target)) graph.set(target, new Set());
    graph.get(target)!.add(required);
  }

  // Add the new edge: targetPlanSubjectId → newRequiredId
  if (!graph.has(targetPlanSubjectId)) graph.set(targetPlanSubjectId, new Set());
  graph.get(targetPlanSubjectId)!.add(newRequiredId);

  // BFS from newRequiredId to see if it can reach targetPlanSubjectId
  const queue: string[] = [newRequiredId];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const current = queue.shift()!;

    if (current === targetPlanSubjectId) {
      // Found a path from newRequiredId back to targetPlanSubjectId → cycle!
      return true;
    }

    if (visited.has(current)) continue;
    visited.add(current);

    const neighbors = graph.get(current);
    if (neighbors) {
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          queue.push(neighbor);
        }
      }
    }
  }

  return false;
}

export function useSubjectsPage() {
  const [careers, setCareers] = useState<Career[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [records, setRecords] = useState<SubjectRecord[]>([]);
  const [selectedCareerId, setSelectedCareerId] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [draft, setDraft] = useState<SubjectDraft>(createDraft(null));
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [correlativities, setCorrelativities] = useState<Correlativity[]>([]);
  const [loadingCorrs, setLoadingCorrs] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const corrSnapshotRef = useRef<Correlativity[]>([]);

  const isEditing = !!selectedRecordId;

  const { existingSubject, lookupState } = useSubjectLookup(
    allSubjects,
    draft.code,
    !isEditing
  );

  useEffect(() => {
    if (existingSubject && !isEditing) {
      setDraft((prev) => ({
        ...prev,
        name: existingSubject.name,
        is_unahur: existingSubject.is_unahur,
      }));
    }
  }, [existingSubject, isEditing]);

  const availablePlans = useMemo(
    () => plans.filter((p) => String(p.careerId) === String(selectedCareerId)),
    [plans, selectedCareerId]
  );

  const visibleRecords = useMemo(
    () =>
      records.filter(
        (r) =>
          String(r.careerId) === String(selectedCareerId) &&
          String(r.planId) === String(selectedPlanId)
      ),
    [records, selectedCareerId, selectedPlanId]
  );

  const selectedRecord = records.find((r) => r.id === selectedRecordId) ?? null;

  const candidateSubjects = useMemo(() => {
    const excludeId = selectedRecord ? String(selectedRecord.id) : null;
    const corrIds = new Set(correlativities.map((c) => c.idRequiredPlanSubject));
    return visibleRecords.filter((r) => {
      if (excludeId && String(r.id) === excludeId) return false;
      if (corrIds.has(String(r.id))) return false;
      return true;
    });
  }, [visibleRecords, selectedRecord, correlativities]);

  const visibleRecordsMap = useMemo(() => {
    const map = new Map<string, SubjectRecord>();
    for (const r of records) map.set(String(r.id), r);
    return map;
  }, [records]);

  const isSubjectAlreadyInPlan = useMemo(() => {
    if (!isEditing && existingSubject) {
      return records.some(
        (r) =>
          String(r.subjectEntityId) === String(existingSubject.id) &&
          String(r.planId) === String(selectedPlanId)
      );
    }
    return false;
  }, [isEditing, existingSubject, records, selectedPlanId]);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      setIsLoading(true);
      setError(null);
      try {
        const [careersData, plansData, subjectsData, planSubjectsData] =
          await Promise.all([
            getCareers(),
            getPlans(),
            getSubjects(),
            getPlanSubjects(),
          ]);

        const careersArr = careersData;
        const plansArr = plansData;
        const subjectsArr: Subject[] = subjectsData;
        const planSubjectsArr = planSubjectsData;

        const mapped: SubjectRecord[] = planSubjectsArr
          .map((ps: any) => {
            const subject = subjectsArr.find(
              (s: any) => String(s.id) === String(ps.idSubject ?? ps.subjectId)
            );
            const plan = plansArr.find(
              (p: any) => String(p.id) === String(ps.idStudyPlan ?? ps.planId)
            );
            if (!subject || !plan) return null;

            const careerId = String(plan.careerId ?? "");
            return {
              id: String(ps.id),
              subjectEntityId: String(subject.id),
              careerId,
              careerName:
                careersArr.find((c: any) => String(c.id) === careerId)?.name ??
                "Carrera no definida",
              planId: String(plan.id),
              planName: plan.name ?? "Plan",
              name: subject.name ?? "Materia",
              code: subject.code ?? "",
              is_unahur: subject.is_unahur ?? false,
              credits: Number(ps.credits ?? 0),
              year: Number(ps.suggestedYear ?? 1),
              semester: Number(ps.suggestedTerm ?? 1),
            };
          })
          .filter(
            (item: SubjectRecord | null): item is SubjectRecord => item !== null
          );

        if (!mounted) return;

        setCareers(careersArr);
        setPlans(plansArr);
        setAllSubjects(subjectsArr);
        setRecords(mapped);

        const firstCareerId = String(careersArr[0]?.id ?? "");
        const firstCareerPlans = plansArr.filter(
          (p: any) => String(p.careerId) === firstCareerId
        );
        const firstPlanId = String(firstCareerPlans[0]?.id ?? "");

        setSelectedCareerId(firstCareerId);
        setSelectedPlanId(firstPlanId);
        setSelectedRecordId(null);
        setDraft(createDraft(null));
      } catch (err: any) {
        if (!mounted) return;
        setError(err.message || "Error cargando materias");
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    loadData();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const currentPlanExists = availablePlans.some(
      (p: any) => String(p.id) === String(selectedPlanId)
    );
    if (!currentPlanExists && availablePlans.length > 0) {
      setSelectedPlanId(String(availablePlans[0]?.id ?? ""));
    }
  }, [availablePlans, selectedPlanId]);

  useEffect(() => {
    if (selectedRecordId) {
      setLoadingCorrs(true);
      getCorrelativities(selectedRecordId)
        .then((data) => {
          setCorrelativities(data);
          corrSnapshotRef.current = data;
        })
        .catch(() => {
          setCorrelativities([]);
          corrSnapshotRef.current = [];
        })
        .finally(() => setLoadingCorrs(false));
    } else {
      setCorrelativities([]);
      corrSnapshotRef.current = [];
    }
  }, [selectedRecordId]);

  function handleSelectRecord(record: SubjectRecord) {
    setSelectedRecordId(record.id);
    setDraft(createDraft(record));
  }

  function handleAddCorrelativity(requiredPlanSubjectId: string, type: string) {
    // Check for cycles
    if (selectedRecord && hasCyclicDependency(selectedRecord.id, requiredPlanSubjectId, correlativities)) {
      setValidationErrors({
        ...validationErrors,
        correlative: `Agregar esta correlativa crearía una dependencia cíclica. Verificá las correlativas existentes.`,
      });
      return;
    }

    // Clear previous correlative error if it exists
    if (validationErrors.correlative) {
      const newErrors = { ...validationErrors };
      delete newErrors.correlative;
      setValidationErrors(newErrors);
    }

    const rec = visibleRecordsMap.get(requiredPlanSubjectId);
    const tempId = `new_${Date.now()}`;
    const newCorr: Correlativity = {
      id: tempId,
      idPlanSubjectTarget: selectedRecord?.id ?? "",
      idRequiredPlanSubject: requiredPlanSubjectId,
      type: type || undefined,
      requiredPlanSubject: rec
        ? {
            id: requiredPlanSubjectId,
            idSubject: rec.subjectEntityId,
            Subject: { id: rec.subjectEntityId, name: rec.name, code: rec.code },
          }
        : undefined,
    };
    setCorrelativities((prev) => [...prev, newCorr]);
  }

  function handleUpdateCorrelativity(corrId: string, type: string) {
    setCorrelativities((prev) =>
      prev.map((c) => (String(c.id) === String(corrId) ? { ...c, type: type || undefined } : c))
    );
  }

  function handleRemoveCorrelativity(corrId: string) {
    setCorrelativities((prev) => prev.filter((c) => String(c.id) !== String(corrId)));
  }

  async function handleSave() {
    const errors: Record<string, string> = {};

    if (!draft.name.trim()) {
      errors.name = "El nombre de la materia es obligatorio.";
    }
    if (!selectedPlanId) {
      errors.plan = "Seleccioná un plan de estudio.";
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors({});
    setSaving(true);
    let newPlanSubjectId: string | null = null;
    try {
      if (selectedRecord) {
        await updateSubject(selectedRecord.subjectEntityId, {
          name: draft.name,
          code: draft.code,
          is_unahur: draft.is_unahur,
        });
        const updatedPlanSubject = await updatePlanSubject(
          selectedRecord.id,
          denormalizePlanSubject({
            idStudyPlan: selectedPlanId,
            idSubject: selectedRecord.subjectEntityId,
            suggestedYear: draft.year,
            suggestedTerm: draft.semester,
            credits: draft.credits,
          })
        );

        if (!updatedPlanSubject) throw new Error("No se pudo actualizar la materia en el plan");

        setRecords((current) =>
          current.map((r) =>
            r.id === selectedRecord.id
              ? {
                  ...r,
                  id: String(updatedPlanSubject.id ?? r.id),
                  name: draft.name,
                  code: draft.code,
                  is_unahur: draft.is_unahur,
                  credits: draft.credits,
                  year: draft.year,
                  semester: draft.semester,
                  planId: selectedPlanId,
                  planName:
                    plans.find((p) => String(p.id) === String(selectedPlanId))
                      ?.name ?? r.planName,
                }
              : r
          )
        );

        // persist correlativity changes for existing subject
        const snapshot = corrSnapshotRef.current;
        const snapshotMap = new Map(snapshot.map((c) => [String(c.id), c]));
        const currentMap = new Map(correlativities.map((c) => [String(c.id), c]));

        const toDelete = snapshot.filter((c) => !currentMap.has(String(c.id)));
        const toCreate = correlativities.filter((c) => !snapshotMap.has(String(c.id)));
        const toUpdate = correlativities.filter((c) => {
          const orig = snapshotMap.get(String(c.id));
          return orig && orig.type !== c.type;
        });

        await Promise.all(toDelete.map((c) => deleteCorrelativity(c.id)));
        await Promise.all(
          toCreate.map((c) =>
            createCorrelativity({
              id_plan_subject_target: Number(selectedRecord.id),
              id_required_plan_subject: Number(c.idRequiredPlanSubject),
              type: c.type,
            })
          )
        );
        await Promise.all(
          toUpdate.map((c) =>
            updateCorrelativity(c.id, { type: c.type })
          )
        );

        // refresh correlativities state
        const refreshed = await getCorrelativities(selectedRecord.id);
        setCorrelativities(refreshed);
        corrSnapshotRef.current = refreshed;
      } else if (existingSubject) {
        const createdPlanSubject = await createPlanSubject(
          denormalizePlanSubject({
            idStudyPlan: selectedPlanId,
            idSubject: existingSubject.id,
            suggestedYear: draft.year,
            suggestedTerm: draft.semester,
            credits: draft.credits,
          })
        );

        if (!createdPlanSubject) throw new Error("No se pudo crear la materia en el plan");
        newPlanSubjectId = String(createdPlanSubject.id);

        // create pending correlativities
        await Promise.all(
          correlativities.map((c) =>
            createCorrelativity({
              id_plan_subject_target: Number(newPlanSubjectId),
              id_required_plan_subject: Number(c.idRequiredPlanSubject),
              type: c.type,
            })
          )
        );

        const career = careers.find(
          (c) => String(c.id) === String(selectedCareerId)
        );
        const plan = plans.find(
          (p) => String(p.id) === String(selectedPlanId)
        );

        const newRecord: SubjectRecord = {
          id: newPlanSubjectId,
          subjectEntityId: existingSubject.id,
          careerId: String(selectedCareerId),
          careerName: career?.name ?? "Carrera no definida",
          planId: String(selectedPlanId),
          planName: plan?.name ?? "Plan",
          name: existingSubject.name,
          code: existingSubject.code,
          is_unahur: existingSubject.is_unahur,
          credits: draft.credits,
          year: draft.year,
          semester: draft.semester,
        };

        setRecords((current) => [newRecord, ...current]);
        setSelectedRecordId(newRecord.id);
        setDraft(createDraft(newRecord));
      } else {
        // Doble check por si el lookup no detectó el código existente (race condition)
        const codeExists = allSubjects.some(
          (s) => s.code.toLowerCase() === draft.code.trim().toLowerCase()
        );
        if (codeExists) {
          throw new Error(
            `El código "${draft.code}" ya pertenece a una materia. Usalo para vincularla al plan en lugar de crear una nueva.`
          );
        }
        const createdSubject = await createSubject({
          name: draft.name,
          code: draft.code,
          is_unahur: draft.is_unahur,
        });
        const createdPlanSubject = await createPlanSubject(
          denormalizePlanSubject({
            idStudyPlan: selectedPlanId,
            idSubject: String(createdSubject.id),
            suggestedYear: draft.year,
            suggestedTerm: draft.semester,
            credits: draft.credits,
          })
        );

        if (!createdPlanSubject) throw new Error("No se pudo crear la materia en el plan");
        newPlanSubjectId = String(createdPlanSubject.id);

        // create pending correlativities
        await Promise.all(
          correlativities.map((c) =>
            createCorrelativity({
              id_plan_subject_target: Number(newPlanSubjectId),
              id_required_plan_subject: Number(c.idRequiredPlanSubject),
              type: c.type,
            })
          )
        );

        const career = careers.find(
          (c) => String(c.id) === String(selectedCareerId)
        );
        const plan = plans.find(
          (p) => String(p.id) === String(selectedPlanId)
        );

        const newRecord: SubjectRecord = {
          id: newPlanSubjectId,
          subjectEntityId: String(createdSubject.id),
          careerId: String(selectedCareerId),
          careerName: career?.name ?? "Carrera no definida",
          planId: String(selectedPlanId),
          planName: plan?.name ?? "Plan",
          name: createdSubject.name ?? draft.name,
          code: createdSubject.code ?? draft.code,
          is_unahur: createdSubject.is_unahur ?? draft.is_unahur,
          credits: draft.credits,
          year: draft.year,
          semester: draft.semester,
        };

        setRecords((current) => [newRecord, ...current]);
        setSelectedRecordId(newRecord.id);
        setDraft(createDraft(newRecord));
      }
    } catch (err: any) {
      alert(err.message || "No se pudo guardar la materia");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(recordId: string) {
    if (!confirm("¿Confirmás eliminar la materia seleccionada del plan?"))
      return;
    try {
      await deletePlanSubject(recordId);
      setRecords((current) => current.filter((r) => r.id !== recordId));
      if (selectedRecordId === recordId) {
        setSelectedRecordId(null);
        setDraft(createDraft(null));
      }
    } catch (err: any) {
      alert(err.message || "No se pudo eliminar la materia");
    }
  }

  function resetForm() {
    setSelectedRecordId(null);
    setDraft(createDraft(null));
  }

  return {
    careers,
    plans,
    allSubjects,
    records,
    selectedCareerId,
    setSelectedCareerId,
    selectedPlanId,
    setSelectedPlanId,
    selectedRecordId,
    setSelectedRecordId,
    draft,
    setDraft,
    isLoading,
    error,
    saving,
    existingSubject,
    lookupState,
    availablePlans,
    visibleRecords,
    selectedRecord,
    handleSelectRecord,
    handleSave,
    handleDelete,
    resetForm,
    correlativities,
    loadingCorrs,
    candidateSubjects,
    handleAddCorrelativity,
    handleUpdateCorrelativity,
    handleRemoveCorrelativity,
    isSubjectAlreadyInPlan,
    validationErrors,
  };
}
