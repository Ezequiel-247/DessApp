import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import type { AcademicRecord, AcademicStatus, Semester } from "@/entities/AcademicRecord";
import type { FinalExam } from "@/entities/FinalExam";
import type { Activity } from "@/entities/Activity";
import { useAuth } from "@/app/AuthContext";
import { useAcademicRecordCrud } from "./useAcademicRecordCrud";
import { createFinalExam } from "@/entities/FinalExam";
import { getActivityRecords, createActivityRecord, updateActivityRecord, deleteActivityRecord, getActivityEligibility } from "@/entities/ActivityRecord";
import type { ActivityEligibilityItem } from "@/entities/ActivityRecord";
import { getActivities } from "@/entities/Activity";
import { getExamEligibility, getSubjectEligibility } from "@/entities/Student";
import { useConfirm } from "@/widgets/hooks/useConfirm";
import { useSoftWarning } from "./useSoftWarning";
import { getGradeMinMax, getActivityGradeDisplay } from "../utils/academicRecordForm";
import { createNotification, NOTIFICATION_TYPE } from "@/entities/Notification";

const CURRENT_YEAR = new Date().getFullYear();

type RecordType = "regularidad" | "examen" | "actividad";

type RecordDraft = {
  _type: RecordType;
  subjectId: string;
  year: number;
  semester: Semester;
  grade?: string;
  status: string;
  regularityExpiresAt?: string;
  minYear?: number;
};

const INITIAL_DRAFT: RecordDraft = {
  _type: "regularidad",
  subjectId: "",
  year: CURRENT_YEAR,
  semester: 1,
  grade: undefined,
  status: "enrolled",
  regularityExpiresAt: "",
};

export function useAcademicRecord() {
  const { user } = useAuth();
  const {
    records,
    finalExams,
    isLoading,
    subjects,
    enrollments,
    availableSubjectIds,
    availableSubjectsList,
    loadRecords,
    loadFinalExams,
    loadSubjects,
    createRecord,
    updateRecord,
    removeRecord,
    createExam,
    updateExam,
    removeExam,
    loadPlanSubjects,
  } = useAcademicRecordCrud();

  // Task 7.2: Initialize useConfirm hook for delete confirmations
  const { isOpen: isConfirmOpen, options: confirmOptions, isLoading: isConfirmLoading, open: openConfirm, close: closeConfirm, handleConfirm } = useConfirm();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<AcademicStatus | "">("");
  const [yearFilter, setYearFilter] = useState<number | "">("");
  const [semesterFilter, setSemesterFilter] = useState<Semester | "">("");
  const [typeFilter, setTypeFilter] = useState<"all" | "subject" | "exam" | "actividad">("all");
  const [selectedRecord, setSelectedRecord] = useState<AcademicRecord | null>(null);
  const [selectedExam, setSelectedExam] = useState<FinalExam | null>(null);
  const [selectedActivityRecord, setSelectedActivityRecord] = useState<any>(null);
  const [draft, setDraft] = useState<RecordDraft>(INITIAL_DRAFT);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [examEligibleData, setExamEligibleData] = useState<any[]>([]);
  const [subjectEligibilityData, setSubjectEligibilityData] = useState<any[]>([]);
  const [activityRecords, setActivityRecords] = useState<any[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activityEligibility, setActivityEligibility] = useState<ActivityEligibilityItem[]>([]);
  const [activityRecordsLoaded, setActivityRecordsLoaded] = useState(false);

  const enrollmentOptions = enrollments.filter((e) => e.studyPlanId != null);

  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState<string>(
    () => localStorage.getItem("selected_enrollment_id") ?? ""
  );

  const pendingChangeRef = useRef<{ field: string; value: any } | null>(null);

  const {
    warning: softWarning,
    isWarningOpen,
    showWarning,
    confirmWarning,
    cancelWarning,
  } = useSoftWarning();

  useEffect(() => {
    if (!selectedEnrollmentId && enrollmentOptions.length > 0) {
      setSelectedEnrollmentId(String(enrollmentOptions[0].id));
    }
  }, [enrollmentOptions, selectedEnrollmentId]);

  useEffect(() => {
    if (selectedEnrollmentId) {
      loadPlanSubjects(selectedEnrollmentId);
    }
  }, [selectedEnrollmentId, loadPlanSubjects]);

  useEffect(() => {
    if (selectedEnrollmentId) {
      localStorage.setItem("selected_enrollment_id", selectedEnrollmentId);
    }
  }, [selectedEnrollmentId]);

  const activityNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of activities) {
      map.set(String(a.id), a.name);
    }
    return map;
  }, [activities]);

  const loadActivityRecords = async () => {
    if (!user) return;
    try {
      const data = await getActivityRecords(user.id);
      setActivityRecords(data);
    } catch {
      setActivityRecords([]);
    }
  };

  const loadActivities = async () => {
    try {
      const data = await getActivities();
      setActivities(data);
    } catch {
      setActivities([]);
    }
  };

  const loadActivityEligibility = async () => {
    if (!user) return;
    try {
      const data = await getActivityEligibility(user.id);
      setActivityEligibility(data);
    } catch {
      setActivityEligibility([]);
    }
  };

  const refreshEligibility = useCallback(() => {
    if (!user) return;
    getExamEligibility(user.id).then(setExamEligibleData).catch(() => setExamEligibleData([]));
    getSubjectEligibility(user.id, selectedEnrollmentId).then(setSubjectEligibilityData).catch(() => setSubjectEligibilityData([]));
  }, [user, selectedEnrollmentId]);

  useEffect(() => {
    refreshEligibility();
  }, [refreshEligibility]);

  useEffect(() => {
    if (user && !activityRecordsLoaded) {
      loadActivityRecords();
      loadActivities();
      loadActivityEligibility();
      setActivityRecordsLoaded(true);
    }
  }, [user, activityRecordsLoaded]);

  const uniqueYears = Array.from(new Set(records.map((r) => r.year))).sort((a, b) => b - a);

  const availableSubjects = useMemo(
    () =>
      availableSubjectIds.size > 0 && availableSubjectsList.length > 0
        ? subjects.filter((s) =>
            availableSubjectsList.some(
              (ps) => String(ps.name) === String(s.name) && String(ps.code) === String(s.code)
            )
          )
        : [],
    [subjects, availableSubjectIds, availableSubjectsList]
  );

  const recordsBySubjectId = useMemo(() => {
    const map = new Map<string, AcademicRecord[]>();
    for (const r of records) {
      const existing = map.get(r.subjectId) ?? [];
      existing.push(r);
      map.set(r.subjectId, existing);
    }
    return map;
  }, [records]);

  /** Subjects that already have a "final" record (enrolled/approved/equivalencia) — excludes failed so they can retry */
  const takenSubjectIds = useMemo(() => {
    const set = new Set<string>();
    for (const r of records) {
      if (r.status !== "failed") {
        set.add(String(r.subjectId));
      }
    }
    return set;
  }, [records]);

  const subjectEligibilityMap = useMemo(() => {
    const map = new Map<string, "regularidad" | "examen">();
    for (const entry of subjectEligibilityData) {
      if (entry.eligibility === "regularidad" || entry.eligibility === "examen") {
        map.set(String(entry.subject_id), entry.eligibility);
      }
    }
    return map;
  }, [subjectEligibilityData]);

  const subjectsForPlanSelector = useMemo(
    () => availableSubjects.filter((s) => subjectEligibilityMap.has(String(s.id))),
    [availableSubjects, subjectEligibilityMap]
  );

  const subjectsForUnahurSelector = useMemo(() => {
    return subjects.filter((s) => {
      if (!s.is_unahur) return false;
      return !takenSubjectIds.has(String(s.id));
    });
  }, [subjects, takenSubjectIds]);

  /** ALL subjects with exam-eligible records (from backend GET /exam-eligibility) */
  const subjectsWithRegularidad = useMemo(() => {
    const eligibleIds = new Set(examEligibleData.map((e: any) => String(e.subject_id)));
    return subjects.filter((s) => eligibleIds.has(String(s.id)));
  }, [subjects, examEligibleData]);

  /** Whether there are subjects eligible for examen (approved 4-6 with valid regularity) */
  const hasExamEligibleSubjects = subjectsWithRegularidad.length > 0;

  /** Set of academic record IDs that have at least one approved final exam */
  const approvedExamRecordIds = useMemo(() => {
    const ids = new Set<string>();
    for (const fe of finalExams) {
      if (fe.status === "aprobado") {
        ids.add(fe.academicRecordId);
      }
    }
    return ids;
  }, [finalExams]);

  /** Subjects eligible for regularidad (not yet enrolled/approved/pending/equivalencia) */
  const subjectsForRegularidadSelector = useMemo(
    () => subjectsForPlanSelector.filter((s) => subjectEligibilityMap.get(String(s.id)) === "regularidad"),
    [subjectsForPlanSelector, subjectEligibilityMap]
  );

  /** Activities available for the student's plan (from backend eligibility endpoint) */
  const availableActivities = useMemo(() => {
    return activityEligibility.map(e => ({
      id: e.activityId,
      name: e.activityName,
      credits: e.credits,
      planCreditBlockItemId: e.planCreditBlockItemId,
    }));
  }, [activityEligibility]);

  const filteredRecords = records.filter((record) => {
    const subject = subjects.find((s) => String(s.id) === String(record.subjectId));
    const matchesSearch = subject?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "" || record.status === statusFilter;
    const matchesYear = yearFilter === "" || record.year === yearFilter;
    const matchesSemester = semesterFilter === "" || record.semester === semesterFilter;
    const matchesCareer = !record.planSubjectId || availableSubjectIds.size === 0 || availableSubjectIds.has(String(record.subjectId));
    return matchesSearch && matchesStatus && matchesYear && matchesSemester && matchesCareer;
  });

  type DisplayRow = {
    id: string;
    subjectName: string;
    year: number;
    semester: number;
    grade: string | undefined;
    status: string;
    _type: "subject" | "exam" | "actividad";
    sourceId: string;
    micro_estado_calculado?: string | null;
  };

  const academicRows: DisplayRow[] = useMemo(() => {
    if (typeFilter === "exam" || typeFilter === "actividad") return [];
    return filteredRecords.map((r) => {
      const subject = subjects.find((s) => String(s.id) === String(r.subjectId));
      return {
        id: r.id,
        subjectName: subject?.name ?? "",
        year: r.year,
        semester: r.semester,
        grade: r.grade,
        status: r.status,
        _type: "subject" as const,
        sourceId: r.id,
        micro_estado_calculado: r.micro_estado_calculado,
      };
    });
  }, [filteredRecords, subjects, typeFilter]);

  const examRows: DisplayRow[] = useMemo(() => {
    if (typeFilter === "subject" || typeFilter === "actividad") return [];
    return finalExams
      .filter((e) => {
        const subjectName = e.academicRecord?.Subject?.name ?? "";
        const matchesSearch = subjectName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesYear = yearFilter === "" || e.year === yearFilter;
        const matchesSemester = semesterFilter === "" || e.semester === semesterFilter;
        const matchesStatus = statusFilter === "" || e.status === statusFilter;
        return matchesSearch && matchesYear && matchesSemester && matchesStatus;
      })
      .map((e) => ({
        id: e.id,
        subjectName: e.academicRecord?.Subject?.name ?? "",
        year: e.year,
        semester: e.semester,
        grade: e.grade || undefined,
        status: e.status,
        _type: "exam" as const,
        sourceId: e.academicRecordId,
      }));
  }, [finalExams, searchTerm, yearFilter, semesterFilter, statusFilter, typeFilter]);

  const activityRows: DisplayRow[] = useMemo(() => {
    if (typeFilter === "subject" || typeFilter === "exam") return [];
    return activityRecords
      .filter((a: any) => {
        const activityName = activityNameMap.get(String(a.activityId)) ?? "";
        const matchesSearch = activityName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesYear = yearFilter === "" || a.year === yearFilter;
        const matchesSemester = semesterFilter === "" || a.semester === semesterFilter;
        const matchesStatus = statusFilter === "" || a.status === statusFilter;
        return matchesSearch && matchesYear && matchesSemester && matchesStatus;
      })
      .map((a: any) => ({
        id: a.id,
        subjectName: activityNameMap.get(String(a.activityId)) ?? "Actividad",
        year: a.year,
        semester: a.semester,
        grade: getActivityGradeDisplay(a.status),
        status: a.status,
        _type: "actividad" as const,
        sourceId: a.id,
      }));
  }, [activityRecords, activityNameMap, searchTerm, yearFilter, semesterFilter, statusFilter, typeFilter]);

  const displayRows = useMemo(() => {
    const merged = [...academicRows, ...examRows, ...activityRows];
    merged.sort((a, b) => b.year - a.year || b.semester - a.semester);
    return merged;
  }, [academicRows, examRows, activityRows]);

  const applyFieldChange = (field: string, value: any) => {
    setDraft((prev) => {
      const updated = { ...prev, [field]: value };

      if (field === "subjectId") {
        if (value === "") {
          updated.year = CURRENT_YEAR;
          updated.semester = 1;
          updated.status = "enrolled";
          updated.grade = undefined;
          updated.regularityExpiresAt = undefined;
        } else if (prev._type === "examen") {
          updated.status = "aprobado";
          updated.grade = "4";
          updated.regularityExpiresAt = undefined;
          const eligibleRecords = records.filter(
            (r) => String(r.subjectId) === value && (r.status === "approved" || r.status === "pending")
          );
          const latestRecord = eligibleRecords.sort((a, b) => (b.year - a.year) || (b.semester - a.semester))[0];
          if (latestRecord) {
            updated.minYear = Math.min(latestRecord.year, CURRENT_YEAR);
            const subjectExams = finalExams.filter(
              (e) => String(e.academicRecord?.id_subject) === value
            );
            const latestExam = subjectExams.sort((a, b) => (b.year - a.year) || (b.semester - a.semester))[0];
            if (latestExam) {
              updated.year = Math.min(latestExam.year, CURRENT_YEAR);
              updated.semester = latestExam.semester as Semester;
            } else {
              updated.year = Math.min(latestRecord.year, CURRENT_YEAR);
              updated.semester = latestRecord.semester as Semester;
            }
          }
        } else if (prev._type === "actividad") {
          updated.status = "enrolled";
          updated.grade = undefined;
          updated.regularityExpiresAt = undefined;
        } else {
          const eligibleType = subjectEligibilityMap.get(value);
          if (eligibleType) {
            updated._type = eligibleType;
            if (eligibleType === "examen") {
              updated.status = "aprobado";
              updated.regularityExpiresAt = undefined;
              updated.grade = "4";
              const eligibleRecords = records.filter(
                (r) => String(r.subjectId) === value && (r.status === "approved" || r.status === "pending")
              );
              const latestRecord = eligibleRecords.sort((a, b) => (b.year - a.year) || (b.semester - a.semester))[0];
              if (latestRecord) {
                updated.minYear = Math.min(latestRecord.year, CURRENT_YEAR);
                const subjectExams = finalExams.filter(
                  (e) => String(e.academicRecord?.id_subject) === value
                );
                const latestExam = subjectExams.sort((a, b) => (b.year - a.year) || (b.semester - a.semester))[0];
                if (latestExam) {
                  updated.year = Math.min(latestExam.year, CURRENT_YEAR);
                  updated.semester = latestExam.semester as Semester;
                } else {
                  updated.year = Math.min(latestRecord.year, CURRENT_YEAR);
                  updated.semester = latestRecord.semester as Semester;
                }
              }
            } else {
              updated.status = "enrolled";
              updated.grade = undefined;
              updated.regularityExpiresAt = undefined;
            }
          }
        }
      }

      if (field === "_type") {
        if (value === "examen") {
          updated.status = "aprobado";
          updated.regularityExpiresAt = undefined;
          updated.grade = "4";
        } else if (value === "actividad") {
          updated.subjectId = "";
          updated.regularityExpiresAt = undefined;
          updated.grade = undefined;
          updated.status = "aprobado";
        } else {
          updated.status = "enrolled";
          updated.grade = undefined;
          updated.regularityExpiresAt = undefined;
        }
      }

      if (field === "status") {
        if (prev._type === "regularidad") {
          if (value === "enrolled") {
            updated.year = CURRENT_YEAR;
            updated.grade = undefined;
            updated.regularityExpiresAt = undefined;
          } else {
            updated.grade = value === "approved" ? "4" : value === "equivalencia" ? undefined : "1";
          }
        } else if (prev._type === "actividad") {
          if (value === "enrolled") {
            updated.grade = undefined;
            updated.year = CURRENT_YEAR;
          } else if (value === "approved" || value === "equivalencia") {
            updated.grade = "C";
          } else if (value === "failed") {
            updated.grade = "NC";
          }
        } else if (prev._type === "examen") {
          updated.grade = value === "aprobado" ? "4" : "1";
        }
      }

      return updated;
    });
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  const applyPendingChange = () => {
    if (pendingChangeRef.current) {
      applyFieldChange(pendingChangeRef.current.field, pendingChangeRef.current.value);
      pendingChangeRef.current = null;
    }
  };

  const clearPendingChange = () => {
    pendingChangeRef.current = null;
  };

  const handleFieldChange = (field: string, value: any) => {
    if (field === "subjectId" && value !== "" && value !== draft.subjectId && draft._type !== "examen") {
      const eligibleType = subjectEligibilityMap.get(value);
      if (eligibleType === "regularidad") {
        const subjectElig = subjectEligibilityData.find(
          (e: any) => String(e.subject_id) === value
        );
        if (subjectElig?.latest_academic_record?.regularity_expires_at) {
          const hoyString = new Date().toISOString().split("T")[0];
          if (subjectElig.latest_academic_record.regularity_expires_at < hoyString) {
            pendingChangeRef.current = { field, value };
            showWarning({
              title: "Regularidad vencida",
              message:
                "Atención: Estás por registrar una nueva cursada para una materia en condición Regular. Al hacerlo, el sistema asume que no rendiste el final anterior. Esa cursada previa se quitará del pool de finales. ¿Deseas continuar?",
              storageKey: "hide_warning_expired_regularity",
              onConfirm: applyPendingChange,
              onCancel: clearPendingChange,
            });
            return;
          }
        }
      }
    }

    if (field === "year" && draft._type === "examen" && draft.subjectId && value) {
      const matchedRecord = records.find(
        (r) =>
          String(r.subjectId) === draft.subjectId &&
          (r.status === "approved" || r.status === "pending")
      );
      if (matchedRecord && value > matchedRecord.year + 2) {
        pendingChangeRef.current = { field, value };
        showWarning({
          title: "Fecha fuera de rango",
          message:
            "La fecha del examen supera los 2 años de regularidad permitidos. ¿Estás seguro de que la fecha es correcta?",
          storageKey: "hide_warning_exam_date",
          onConfirm: applyPendingChange,
          onCancel: clearPendingChange,
        });
        return;
      }
    }

    applyFieldChange(field, value);
  };

  const handleSelectRecord = (record: AcademicRecord) => {
    setSelectedRecord(record);
    setSelectedExam(null);
    setDraft({
      _type: "regularidad",
      subjectId: record.subjectId,
      year: record.year,
      semester: record.semester as Semester,
      grade: record.grade,
      status: record.status === "pending" ? "approved" : record.status,
      regularityExpiresAt: record.regularityExpiresAt ? record.regularityExpiresAt.split("T")[0] : "",
    });
    setValidationErrors({});
  };

  const handleSelectExam = (exam: FinalExam) => {
    setSelectedExam(exam);
    setSelectedRecord(null);
    setDraft({
      _type: "examen",
      subjectId: exam.academicRecord?.id_subject ?? "",
      year: exam.year,
      semester: exam.semester as Semester,
      grade: exam.grade,
      status: exam.status,
    });
    setValidationErrors({});
  };

  const handleSelectActivityRecord = (record: any) => {
    setSelectedActivityRecord(record);
    setSelectedRecord(null);
    setSelectedExam(null);
    setDraft({
      _type: "actividad",
      subjectId: String(record.activityId ?? ""),
      year: record.year,
      semester: record.semester as Semester,
      grade: record.grade,
      status: record.status,
      regularityExpiresAt: undefined,
    });
    setValidationErrors({});
  };

  const executeSave = async (onSuccess?: () => void) => {
    try {
      if (!user) throw new Error("No user authenticated");

      if (draft._type === "actividad") {
        if (selectedActivityRecord?.id) {
          await updateActivityRecord(selectedActivityRecord.id, {
            status: draft.status,
          });
          setSelectedActivityRecord(null);
        } else {
          const eligibilityItem = activityEligibility.find(e => e.activityId === draft.subjectId);
          await createActivityRecord({
            studentId: user.id,
            activityId: draft.subjectId!,
            plan_credit_block_item_id: eligibilityItem?.planCreditBlockItemId,
            year: draft.year || 1,
            semester: draft.semester || 1,
            grade: draft.grade,
            status: draft.status,
          });
        }
      } else if (draft._type === "examen") {
        if (selectedExam) {
          await updateExam(selectedExam.id, {
            grade: String(draft.grade),
            year: draft.year,
            semester: draft.semester,
            status: draft.status,
          });
          setSelectedExam(null);
        } else {
          const eligibleRecords = records.filter(
            (r) => String(r.subjectId) === String(draft.subjectId) && (r.status === "approved" || r.status === "pending")
          );
          const matchedRecord = eligibleRecords.sort((a, b) => (b.year - a.year) || (b.semester - a.semester))[0];
          if (!matchedRecord) {
            setValidationErrors({
              subjectId: "Primero debe aprobar la cursada (nota 4 o superior) para rendir examen final.",
            });
            return;
          }

          const newExam = await createFinalExam({
            id_academic_record: Number(matchedRecord.id),
            grade: String(draft.grade),
            year: draft.year,
            semester: draft.semester,
            status: draft.status,
          });
          createExam(newExam);
          const examSubjectName = subjects.find((s) => String(s.id) === String(draft.subjectId))?.name ?? "la materia";
          createNotification({
            userId: user.id,
            type: NOTIFICATION_TYPE.SUCCESS,
            title: "Final cargado",
            message: `Se cargó el final de ${examSubjectName}.`,
          }).catch(() => {});
        }
      } else {
        if (selectedRecord?.id) {
          const originalDisplayStatus = selectedRecord.status === "pending" ? "approved" : selectedRecord.status;
          const statusChanged = draft.status !== originalDisplayStatus;
          const payload: any = {
            subjectId: draft.subjectId,
            year: draft.year,
            semester: draft.semester,
            grade: draft.status === "enrolled" ? undefined : (draft.grade != null ? String(draft.grade) : undefined),
          };
          if (statusChanged) payload.status = draft.status;
          await updateRecord(selectedRecord.id, payload as any);
          setSelectedRecord(null);
        } else {
          const payload = {
            studentId: user.id,
            subjectId: draft.subjectId!,
            year: draft.year || 1,
            semester: draft.semester || 1,
            grade: draft.status === "enrolled" ? undefined : (draft.grade != null ? String(draft.grade) : undefined),
            status: draft.status,
          };
          await createRecord(payload as any);
          const recordSubjectName = subjects.find((s) => String(s.id) === String(draft.subjectId))?.name ?? "la materia";
          createNotification({
            userId: user.id,
            type: NOTIFICATION_TYPE.SUCCESS,
            title: "Registro agregado",
            message: `Se cargó el registro de ${recordSubjectName}.`,
          }).catch(() => {});
        }
      }
      setDraft(INITIAL_DRAFT);
      setValidationErrors({});
      loadRecords();
      loadFinalExams();
      loadActivityRecords();
      loadActivityEligibility();
      refreshEligibility();
      onSuccess?.();
    } catch (err: any) {
      setValidationErrors({ api: err.message || "Error al guardar el registro académico" });
    }
  };

  const handleSaveRecord = (onSuccess?: () => void) => {
    const errors: Record<string, string> = {};

    if (!draft.subjectId) {
      errors.subjectId = draft._type === "actividad" ? "La actividad es obligatoria." : "La materia es obligatoria.";
    }

    const currentYear = new Date().getFullYear();
    if (!draft.year || draft.year < currentYear - 20 || draft.year > currentYear) {
      errors.year = `El año de cursada debe estar entre ${currentYear - 20} y ${currentYear}.`;
    }

    if (draft._type === "regularidad") {
      if (draft.status === "enrolled" || draft.status === "equivalencia") {
        // No se requiere nota
      } else if (draft.status === "approved") {
        if (draft.grade === undefined || draft.grade === null || isNaN(Number(draft.grade))) {
          errors.grade = "La calificación es obligatoria para materias aprobadas.";
        } else {
          const numGrade = Number(draft.grade);
          const { min, max } = getGradeMinMax("regularidad", "approved");
          if (numGrade < min || numGrade > max) {
            errors.grade = `Para materias aprobadas, la calificación debe ser entre ${min} y ${max}.`;
          }
        }
      } else if (draft.status === "failed") {
        if (draft.grade === undefined || draft.grade === null || isNaN(Number(draft.grade))) {
          errors.grade = "La calificación es obligatoria para materias desaprobadas.";
        } else {
          const numGrade = Number(draft.grade);
          const { min, max } = getGradeMinMax("regularidad", "failed");
          if (numGrade < min || numGrade > max) {
            errors.grade = `Para materias desaprobadas, la calificación debe ser entre ${min} y ${max}.`;
          }
        }
      }
    } else if (draft._type === "actividad") {
      // Actividad: grade is auto-set to "C"/"NC" based on status, no manual input needed
    } else {
      // examen
      if (draft.grade === undefined || draft.grade === null || isNaN(Number(draft.grade))) {
        errors.grade = "La calificación es obligatoria.";
      } else {
        const numGrade = Number(draft.grade);
        const { min, max } = getGradeMinMax("examen", draft.status);
        if (numGrade < min || numGrade > max) {
          errors.grade = `Para exámenes ${draft.status === "aprobado" ? "aprobados" : "desaprobados"}, la calificación debe ser entre ${min} y ${max}.`;
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    if (draft._type === "examen" && draft.status === "aprobado") {
      showWarning({
        title: "Aprobación de examen final",
        message:
          "Aviso: Al registrar este examen como Aprobado, la materia se considerará Finalizada. Ya no podrás agregarle intentos desaprobados previos. Asegurate de cargar todos tus registros antes de confirmar.",
        storageKey: "hide_warning_final_approval",
        onConfirm: () => executeSave(onSuccess),
      });
      return;
    }

    executeSave(onSuccess);
  };

  const handleDeleteRecord = (id: string, type: "subject" | "exam" | "actividad" = "subject", onSuccess?: () => void) => {
    // Task 7.2: Replace window.confirm with ConfirmDialog via useConfirm hook
    openConfirm({
      title: type === "exam" ? "Eliminar examen" : type === "actividad" ? "Eliminar actividad" : "Eliminar calificación",
      description: type === "exam" 
        ? "¿Estás seguro de que quieres eliminar este examen?" 
        : type === "actividad"
          ? "¿Estás seguro de que quieres eliminar esta actividad?"
          : "¿Estás seguro de que quieres eliminar esta calificación?",
      confirmLabel: "Eliminar",
      cancelLabel: "Cancelar",
      variant: "danger",
      onConfirm: async () => {
        try {
          if (type === "exam") {
            await removeExam(id);
          } else if (type === "actividad") {
            await deleteActivityRecord(id);
          } else {
            await removeRecord(id);
          }
          if (selectedRecord?.id === id || selectedExam?.id === id || selectedActivityRecord?.id === id) {
            setSelectedRecord(null);
            setSelectedExam(null);
            setSelectedActivityRecord(null);
            setDraft(INITIAL_DRAFT);
            setValidationErrors({});
          }
          // Task 7.1: Auto-refresh records after deletion
          loadRecords();
          loadFinalExams();
          loadActivityRecords();
          loadActivityEligibility();
          refreshEligibility();
          onSuccess?.();
        } catch (err: any) {
          setValidationErrors({ api: err.message || "Error al eliminar el registro académico" });
        }
      },
    });
  };

  const handleCancelEdit = () => {
    setSelectedRecord(null);
    setSelectedExam(null);
    setSelectedActivityRecord(null);
    setDraft(INITIAL_DRAFT);
    setValidationErrors({});
  };

  return {
    records,
    finalExams,
    isLoading,
    subjects,
    enrollments,
    enrollmentOptions,
    selectedEnrollmentId,
    setSelectedEnrollmentId,
    availableSubjects,
    availableSubjectIds,
    subjectsForPlanSelector,
    subjectsForUnahurSelector,
    subjectsWithRegularidad,
    subjectsForRegularidadSelector,
    hasExamEligibleSubjects,
    examEligibleData,
    approvedExamRecordIds,
    availableActivities,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    yearFilter,
    setYearFilter,
    semesterFilter,
    setSemesterFilter,
    typeFilter,
    setTypeFilter,
    selectedRecord,
    selectedExam,
    selectedActivityRecord,
    activityRecords,
    activities,
    draft,
    validationErrors,
    displayRows,
    uniqueYears,
    handleFieldChange,
    handleSelectRecord,
    handleSelectExam,
    handleSelectActivityRecord,
    handleSaveRecord,
    handleDeleteRecord,
    handleCancelEdit,
    loadRecords,
    loadSubjects,
    loadFinalExams,
    loadPlanSubjects,
    loadActivityRecords,
    loadActivities,
    loadActivityEligibility,
    activityEligibility,
    // Task 7.2: Export confirm dialog state
    isConfirmOpen,
    confirmOptions,
    isConfirmLoading,
    handleConfirm,
    closeConfirm,
    // Phase 3: Soft warnings
    softWarning,
    isWarningOpen,
    confirmWarning,
    cancelWarning,
  };
}
