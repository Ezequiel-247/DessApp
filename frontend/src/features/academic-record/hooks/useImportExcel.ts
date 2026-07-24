import { useState, useMemo, useEffect } from "react";
import * as XLSX from "xlsx";
import { getAllSubjects } from "@/entities/Subject";
import {
  EXPECTED_COLUMNS,
  ALLOWED_TIPOS,
  ALLOWED_RESULTADOS,
  RESULTADO_TO_STATUS,
  SPECIAL_GRADES,
  GRADE_RANGES,
  TIPO_PRIORITY,
  CPU_SUBJECT_PREFIX,
} from "@/features/academic-record/import-rules";
import {
  derivePeriodKey,
  deriveAcademicYear,
  deriveSemesterFromPeriod,
} from "@/features/academic-record/utils/academic-periods";
import { createAcademicRecord, updateAcademicRecord, getAcademicRecords } from "@/entities/AcademicRecord";
import type { AcademicStatus } from "@/entities/AcademicRecord";
import { createFinalExam } from "@/entities/FinalExam";
import { createNotification, NOTIFICATION_TYPE } from "@/entities/Notification";

export type ValidatedRow = {
  id: string;
  actividad: string;
  fecha: string;
  tipo: string;
  nota: string;
  resultado: string;
  subjectCode: string | null;
  errors: string[];
  rowStatus: "valid" | "error" | "ignored" | "duplicate" | "update_pending_to_approved" | "update_pending_to_failed" | "removed";
  existingRecordId?: string;
  // Editable fields
  editedTipo?: string;
  editedYear?: number;
  editedSemester?: 1 | 2;
  editedStatus?: string;
  editedGrade?: string;
  editErrors?: Record<string, string>;
};

export type ResolvedRow = ValidatedRow & {
  matchedSubject: { id: string; code: string; name: string; is_unahur?: boolean } | null;
  // true si la materia matcheada pertenece al plan activo del alumno o es UNAHUR —
  // si es false, el backend probablemente va a rechazar la fila (no está en su plan
  // ni es electiva/UNAHUR reconocida). Es solo un aviso previo, no bloquea el import:
  // el backend sigue siendo la autoridad final (ver academicRecordController.js).
  inPlan: boolean;
};

export type ImportResult = {
  rowId: string;
  actividad: string;
  status: "success" | "error";
  error?: string;
};

function extractCode(actividad: string): string | null {
  const match = actividad.match(/\(([^)]+)\)\s*$/);
  return match?.[1] ?? null;
}

// Traduce el `code` que devuelve academicRecordController.js a un mensaje que le sirva
// al alumno para entender por qué se rechazó la fila (en vez de un ❌ genérico).
const IMPORT_ERROR_MESSAGES: Record<string, string> = {
  NO_ACTIVE_ENROLLMENT: "No tenés una inscripción activa en ninguna carrera.",
  SUBJECT_NOT_FOUND: "La materia no existe en el sistema.",
  SUBJECT_NOT_IN_PLAN: "Esta materia no pertenece a tu plan de estudios (ni es electiva ni UNAHUR).",
  ELECTIVE_BLOCK_NOT_CONFIGURED: "Esta materia es electiva pero no está vinculada a ningún bloque electivo de tu plan.",
};

function translateImportError(err: any): string {
  const code = err?.code;
  if (code && IMPORT_ERROR_MESSAGES[code]) return IMPORT_ERROR_MESSAGES[code];
  return err?.message || "Error al importar";
}

export function cleanSubjectName(actividad: string): string {
  return actividad.replace(/\s*\([^)]+\)\s*$/, "");
}

function parseDate(fecha: string): Date | null {
  const parts = fecha.split("/");
  if (parts.length === 3) {
    const [day, month, year] = parts;
    const d = new Date(Number(year), Number(month) - 1, Number(day));
    return isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(fecha);
  return isNaN(d.getTime()) ? null : d;
}

function initializeEditedFields(row: ValidatedRow): ValidatedRow {
  const isExam = row.tipo === "Examen";
  const year = deriveAcademicYear(row.fecha);
  const semester = deriveSemesterFromPeriod(row.fecha, row.tipo);
  const status = row.tipo === "En curso" ? "enrolled" : row.tipo === "Equivalencia" ? "approved" : (RESULTADO_TO_STATUS[row.resultado] ?? "failed");
  
  return {
    ...row,
    editedTipo: isExam ? "examen" : "regularidad",
    editedYear: year,
    editedSemester: (semester as 1 | 2),
    editedStatus: status,
    editedGrade: row.nota || undefined,
    editErrors: {},
  };
}

function validateRows(rows: any[]): ValidatedRow[] {
  const all: ValidatedRow[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const errors: string[] = [];
    const actividad = String(row.Actividad ?? row.actividad ?? "").trim();
    const fecha = String(row.Fecha ?? row.fecha ?? "").trim();
    const tipo = String(row.Tipo ?? row.tipo ?? "").trim();
    const nota = String(row.Nota ?? row.nota ?? "").trim();
    const resultado = String(row.Resultado ?? row.resultado ?? "").trim();
    const subjectCode = extractCode(actividad);

    if (!actividad) errors.push("Actividad vacía");
    if (!fecha) errors.push("Fecha vacía");
    if (!parseDate(fecha)) errors.push("Fecha inválida");
    if (!ALLOWED_TIPOS.includes(tipo)) errors.push(`Tipo "${tipo}" no válido`);
    if (!ALLOWED_RESULTADOS.includes(resultado)) errors.push(`Resultado "${resultado}" no válido`);

    const isCpuSubject = !!subjectCode?.startsWith(CPU_SUBJECT_PREFIX);

    if (resultado && RESULTADO_TO_STATUS[resultado] && !isCpuSubject) {
      const status = RESULTADO_TO_STATUS[resultado];
      const range = GRADE_RANGES[status];
      if (nota && nota !== SPECIAL_GRADES.CONCEPTO && nota !== SPECIAL_GRADES.NO_CURSO) {
        const num = Number(nota);
        if (isNaN(num)) {
          errors.push(`Nota "${nota}" no válida`);
        } else if (num < range.min || num > range.max) {
          errors.push(`Nota ${num} fuera de rango (${range.min}-${range.max}) para "${resultado}"`);
        }
      }
    }

    let rowStatus: "valid" | "error" | "ignored" = "valid";

    if (tipo === "Examen" && (!nota || nota === "-")) {
      rowStatus = "ignored";
    }

    if (tipo === "Promocion") {
      rowStatus = "ignored";
    }

    if (errors.length > 0 && rowStatus !== "ignored") {
      rowStatus = "error";
    }

    const baseRow = {
      id: `row_${i}`,
      actividad,
      fecha,
      tipo,
      nota,
      resultado,
      subjectCode,
      errors,
      rowStatus,
    } as ValidatedRow;
    
    // Initialize editable fields for valid rows and updates
    const rowWithEdited = rowStatus === "valid" || rowStatus === "error" ? initializeEditedFields(baseRow) : baseRow;
    all.push(rowWithEdited);
  }

  return all;
}

function groupBySubject(rows: ValidatedRow[]): ValidatedRow[] {
  const ENROLLMENT_TIPOS = ["Regularidad", "Promocion", "En curso", "Equivalencia"];

  const groups: Record<string, ValidatedRow[]> = {};
  for (const row of rows) {
    const code = row.subjectCode ?? `__no_code_${row.actividad}`;
    if (!groups[code]) groups[code] = [];
    groups[code].push(row);
  }

  const result: ValidatedRow[] = [];

  for (const code of Object.keys(groups)) {
    const group = groups[code];
    group.sort((a, b) => (parseDate(a.fecha)?.getTime() ?? 0) - (parseDate(b.fecha)?.getTime() ?? 0));

    const cursadas: ValidatedRow[][] = [];
    let current: ValidatedRow[] = [];
    let currentPeriodKey: string | null = null;

    for (const row of group) {
      if (ENROLLMENT_TIPOS.includes(row.tipo)) {
        const periodKey = derivePeriodKey(row.fecha, row.tipo);
        if (currentPeriodKey !== null && periodKey !== currentPeriodKey) {
          if (current.length > 0) cursadas.push(current);
          current = [];
        }
        currentPeriodKey = periodKey;
      }
      current.push(row);
    }
    if (current.length > 0) cursadas.push(current);

    for (const cursada of cursadas) {
      const enrollment = cursada.filter((r) => ENROLLMENT_TIPOS.includes(r.tipo));
      const exams = cursada.filter((r) => r.tipo === "Examen");

      if (enrollment.length === 0) {
        for (const row of cursada) result.push({ ...row, rowStatus: row.rowStatus === "ignored" ? "ignored" : "valid" });
        continue;
      }

      enrollment.sort((a, b) => {
        const prioA = TIPO_PRIORITY[a.tipo] ?? 99;
        const prioB = TIPO_PRIORITY[b.tipo] ?? 99;
        if (prioA !== prioB) return prioA - prioB;
        const dateA = parseDate(a.fecha);
        const dateB = parseDate(b.fecha);
        return (dateB?.getTime() ?? 0) - (dateA?.getTime() ?? 0);
      });

      result.push({ ...enrollment[0], rowStatus: enrollment[0].rowStatus === "ignored" ? "ignored" : "valid" });

      for (let i = 1; i < enrollment.length; i++) {
        result.push({ ...enrollment[i], rowStatus: "ignored" });
      }

      for (const row of exams) {
        result.push({ ...row, rowStatus: row.rowStatus === "ignored" ? "ignored" : "valid" });
      }
    }
  }

  return result;
}

type ExistingRecordInfo = {
  id: string;
  year: number;
  subjectId: string;
  status: string;
};

function markDuplicates(
  rows: ValidatedRow[],
  existingRecords: ExistingRecordInfo[],
  subjects: Array<{ id: string; name: string }>
): Map<string, { type: "duplicate" | "update"; existingRecordId: string }> {
  const result = new Map<string, { type: "duplicate" | "update"; existingRecordId: string }>();

  for (const row of rows) {
    if (row.rowStatus !== "valid") continue;

    const year = deriveAcademicYear(row.fecha);
    const cleanName = cleanSubjectName(row.actividad).toLowerCase();

    const matched = existingRecords.find((er) => {
      if (er.year !== year) return false;
      const subject = subjects.find((s) => String(s.id) === String(er.subjectId));
      return subject?.name.toLowerCase() === cleanName;
    });

    if (!matched) continue;

    const newStatus = RESULTADO_TO_STATUS[row.resultado];
    const isUpdate = (matched.status === "pending" || matched.status === "enrolled") && (newStatus === "approved" || newStatus === "failed");

    result.set(row.id, {
      type: isUpdate ? "update" : "duplicate",
      existingRecordId: matched.id,
    });
  }

  return result;
}

export function useImportExcel(
  userId: string,
  initialExistingRecords: Array<{ id: string; year: number; subjectId: string; status: string }> = [],
  subjects: Array<{ id: string; code: string; name: string; is_unahur?: boolean }> = [],
  isOpen: boolean = false
) {
  const [step, setStep] = useState(1);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [validatedRows, setValidatedRows] = useState<ValidatedRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState<ImportResult[]>([]);
  const [currentExistingRecords, setCurrentExistingRecords] = useState(initialExistingRecords);
  // Fetch fresh subjects from API so newly-created subjects (e.g. via DebugImportButton) are always visible.
  const [freshSubjects, setFreshSubjects] = useState<Array<{ id: string; code: string; name: string; is_unahur?: boolean }>>(subjects);
  // Materias del plan activo del alumno (pasadas por el caller) — se usan solo para
  // marcar en el paso 2 si una fila matcheada probablemente sea aceptada por el backend
  // (ver ResolvedRow.inPlan). No reemplaza la validación real del backend.
  const planSubjectIds = useMemo(() => new Set(subjects.map((s) => s.id)), [subjects]);
  
  // Refetch existing records after import to catch newly-imported ones
  const refreshExistingRecords = async () => {
    try {
      const allRecords = await getAcademicRecords(userId);
      const mapped = allRecords.map((r: any) => ({
        id: r.id,
        year: r.year,
        subjectId: r.subjectId,
        status: r.status,
      }));
      setCurrentExistingRecords(mapped);
    } catch {
      // Fallback silently to existing records
    }
  };
  
  // Refetch subjects when modal opens or initial load
  useEffect(() => {
    const fetchFreshSubjects = async () => {
      try {
        const list = await getAllSubjects();
        if (list.length > 0) setFreshSubjects(list);
      } catch {
        // Fallback silently to existing subjects
      }
    };
    fetchFreshSubjects();
  }, [isOpen]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setParsedRows([]);
      setValidatedRows([]);
      setFileName("");
      setImportResults([]);
    }
  }, [isOpen]);
  
  // Also refetch subjects when file is selected to catch any newly-created ones
  const handleFileSelectWithRefresh = async (file: File) => {
    try {
      const list = await getAllSubjects();
      if (list.length > 0) setFreshSubjects(list);
    } catch {
      // Fallback silently
    }
    handleFileSelectInternal(file);
  };

  const handleFileSelectInternal = (file: File) => {
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      const headerIndex = rawRows.findIndex((r) =>
        EXPECTED_COLUMNS.every((col) =>
          r.some((cell: any) => String(cell ?? "").trim().toLowerCase() === col.toLowerCase())
        )
      );

      if (headerIndex === -1) {
        setParsedRows([]);
        return;
      }

      const headerRow = rawRows[headerIndex];
      const dataRows = rawRows.slice(headerIndex + 1).filter((r) => r.some((cell: any) => String(cell ?? "").trim() !== ""));
      const colMap: Record<string, number> = {};
      headerRow.forEach((cell: any, idx: number) => {
        const key = String(cell ?? "").trim().toLowerCase();
        if (key === "actividad") colMap.Actividad = idx;
        if (key === "fecha") colMap.Fecha = idx;
        if (key === "tipo") colMap.Tipo = idx;
        if (key === "nota") colMap.Nota = idx;
        if (key === "resultado") colMap.Resultado = idx;
      });

      const mapped = dataRows.map((r) => ({
        Actividad: String(r[colMap.Actividad] ?? "").trim(),
        Fecha: String(r[colMap.Fecha] ?? "").trim(),
        Tipo: String(r[colMap.Tipo] ?? "").trim(),
        Nota: String(r[colMap.Nota] ?? "").trim(),
        Resultado: String(r[colMap.Resultado] ?? "").trim(),
      }));

      setParsedRows(mapped);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Refetch subjects to catch any newly-created ones from DebugImportButton
    getAllSubjects()
      .then((list) => {
        if (list.length > 0) setFreshSubjects(list);
      })
      .catch(() => {});

    handleFileSelectInternal(file);
  };

  const processRows = () => {
    const validated = validateRows(parsedRows);
    const grouped = groupBySubject(validated);

    const duplicateInfo = markDuplicates(grouped, currentExistingRecords, freshSubjects);
    const withUpdates = grouped.map((row) => {
      const info = duplicateInfo.get(row.id);
      if (!info) return row;
      if (info.type === "update") {
        const newStatus = RESULTADO_TO_STATUS[row.resultado];
        const rowStatus = newStatus === "approved" ? "update_pending_to_approved" as const : "update_pending_to_failed" as const;
        return { ...row, rowStatus, existingRecordId: info.existingRecordId };
      }
      return { ...row, rowStatus: "duplicate" as const };
    });

    const sorted = [...withUpdates].sort((a, b) => {
      const dateA = parseDate(a.fecha);
      const dateB = parseDate(b.fecha);
      const dateCompare = (dateA?.getTime() ?? 0) - (dateB?.getTime() ?? 0);
      if (dateCompare !== 0) return dateCompare;
      return a.actividad.localeCompare(b.actividad);
    });
    setValidatedRows(sorted);
    setStep(2);
  };

  const resolvedRows = useMemo((): ResolvedRow[] => {
    return validatedRows.map((row) => {
      if (row.rowStatus !== "valid" && row.rowStatus !== "update_pending_to_approved" && row.rowStatus !== "update_pending_to_failed") {
        return { ...row, matchedSubject: null, inPlan: true };
      }
      const code = row.subjectCode;
      if (!code) {
        return { ...row, matchedSubject: null, inPlan: true };
      }
      const subject = freshSubjects.find((s) => String(s.code).toUpperCase() === code.toUpperCase());
      const inPlan = !subject || !!subject.is_unahur || planSubjectIds.has(subject.id);
      return {
        ...row,
        matchedSubject: subject
          ? { id: subject.id, code: subject.code, name: subject.name, is_unahur: subject.is_unahur }
          : null,
        inPlan,
      };
    });
  }, [validatedRows, freshSubjects]);

  const goToConfirm = () => {
    setStep(3);
  };

  const executeImport = async () => {
    setIsImporting(true);
    const results: ImportResult[] = [];

    // Filter out removed rows and only process valid/update rows
    const allValid = resolvedRows.filter(
      (r) => r.rowStatus === "valid" && r.matchedSubject
    );

    // Distinguish between regularidad and examen based on editedTipo
    const enrollmentRows = allValid.filter((r) => r.editedTipo !== "examen");
    const examRows = allValid.filter((r) => r.editedTipo === "examen");

    // Filter update rows (exclude removed)
    const rowsToUpdate = resolvedRows.filter(
      (r) => r.rowStatus !== "removed" && (r.rowStatus === "update_pending_to_approved" || r.rowStatus === "update_pending_to_failed") && r.matchedSubject && r.existingRecordId
    );

    const createdRecordMap = new Map<string, string>();

    for (const row of enrollmentRows) {
      try {
        let status = row.editedStatus ?? "enrolled";
        let grade = row.editedGrade || undefined;

        if (status === "approved" && grade) {
          const numGrade = Number(grade);
          if (numGrade >= 4 && numGrade <= 6) {
            status = "pending";
          }
        }

        // No calculamos acá el vencimiento de la regularidad (ni con la fecha de
        // hoy ni con ninguna otra fórmula propia): el backend lo recalcula siempre
        // a partir de year/semester con la fórmula oficial (ver
        // FIX_VENCIMIENTO_REGULARIDAD_FINALES.md — este cálculo local usaba "hoy + 2
        // años" en vez del cuatrimestre real de cursada, y quedaba mal).
        const payload = {
          studentId: userId,
          subjectId: row.matchedSubject!.id,
          year: row.editedYear ?? deriveAcademicYear(row.fecha),
          semester: row.editedSemester ?? deriveSemesterFromPeriod(row.fecha, row.tipo),
          grade: status === "enrolled" ? undefined : grade,
          status,
        };
        const created = await createAcademicRecord(payload as any);
        if (row.subjectCode) {
          createdRecordMap.set(row.subjectCode.toUpperCase(), created.id);
        }
        results.push({ rowId: row.id, actividad: row.actividad, status: "success" });
      } catch (err: any) {
        results.push({
          rowId: row.id,
          actividad: row.actividad,
          status: "error",
          error: translateImportError(err),
        });
      }
    }

    for (const row of examRows) {
      try {
        const code = row.subjectCode?.toUpperCase();
        let academicRecordId = code ? createdRecordMap.get(code) : undefined;

        if (!academicRecordId) {
          const allRecords = await getAcademicRecords(userId);
          const found = allRecords.find(
            (r) => String(r.subjectId) === row.matchedSubject!.id
          );
          academicRecordId = found?.id;
        }

        if (!academicRecordId) {
          results.push({
            rowId: row.id,
            actividad: row.actividad,
            status: "error",
            error: "No se encontró un registro académico para vincular este examen",
          });
          continue;
        }

        const status = row.editedStatus ?? (RESULTADO_TO_STATUS[row.resultado] ?? "failed");
        
        // Task 7.6: Prevent duplicate approved exams for the same subject
        if (status === "approved") {
          const allExams = await getAcademicRecords(userId);
          const existingApprovedExam = allExams.some(
            (r) =>
              String(r.id) === String(academicRecordId) &&
              r.status === "approved"
          );
          if (existingApprovedExam) {
            results.push({
              rowId: row.id,
              actividad: row.actividad,
              status: "error",
              error: "Ya existe un examen aprobado para esta materia",
            });
            continue;
          }
        }

        await createFinalExam({
          id_academic_record: Number(academicRecordId),
          grade: row.editedGrade || undefined,
          year: row.editedYear ?? deriveAcademicYear(row.fecha),
          semester: row.editedSemester ?? deriveSemesterFromPeriod(row.fecha, row.tipo),
          status,
        });
        results.push({ rowId: row.id, actividad: row.actividad, status: "success" });
      } catch (err: any) {
        results.push({
          rowId: row.id,
          actividad: row.actividad,
          status: "error",
          error: translateImportError(err),
        });
      }
    }

    for (const row of rowsToUpdate) {
      try {
        let status = (row.editedStatus ?? (row.tipo === "En curso" ? "enrolled" : row.tipo === "Equivalencia" ? "approved" : (RESULTADO_TO_STATUS[row.resultado] ?? "failed"))) as AcademicStatus;
        let grade = row.editedGrade || undefined;

        if (status === "approved" && grade) {
          const numGrade = Number(grade);
          if (numGrade >= 4 && numGrade <= 6) {
            status = "pending";
          }
        }

        // Igual que en el alta: el backend recalcula el vencimiento a partir de
        // year/semester (los del registro existente, ya que acá no se reenvían) con
        // la fórmula oficial — no lo calculamos acá.
        const payload = {
          status,
          grade: status === "enrolled" ? undefined : grade,
        };
        await updateAcademicRecord(row.existingRecordId!, payload);
        results.push({ rowId: row.id, actividad: row.actividad, status: "success" });
      } catch (err: any) {
        results.push({
          rowId: row.id,
          actividad: row.actividad,
          status: "error",
          error: translateImportError(err),
        });
      }
    }

    setImportResults(results);
    setIsImporting(false);
    setStep(4);

    // Una sola notificación resumen para todo el archivo — no una por fila, que sería spam.
    const successCount = results.filter((r) => r.status === "success").length;
    const errorCount = results.filter((r) => r.status === "error").length;
    if (successCount > 0) {
      createNotification({
        userId,
        type: errorCount > 0 ? NOTIFICATION_TYPE.WARNING : NOTIFICATION_TYPE.SUCCESS,
        title: "Excel importado",
        message: errorCount > 0
          ? `Se importaron ${successCount} registros, con ${errorCount} errores.`
          : `Se importaron ${successCount} registros desde tu Excel.`,
      }).catch(() => {});
    }

    // Refresh existing records to include newly-imported ones for next file
    await refreshExistingRecords();
  };

  const updateRow = (rowId: string, patch: Partial<ValidatedRow>) => {
    setValidatedRows((prev) =>
      prev.map((row) =>
        row.id === rowId
          ? {
              ...row,
              ...patch,
              editErrors: patch.editErrors !== undefined ? patch.editErrors : row.editErrors,
            }
          : row
      )
    );
  };

  const removeRow = (rowId: string) => {
    setValidatedRows((prev) =>
      prev.map((row) =>
        row.id === rowId ? { ...row, rowStatus: "removed" as const } : row
      )
    );
  };

  const handleReset = () => {
    setStep(1);
    setParsedRows([]);
    setValidatedRows([]);
    setFileName("");
    setImportResults([]);
    setIsImporting(false);
  };

  const validCount = validatedRows.filter((r) => r.rowStatus === "valid").length;
  const errorCount = validatedRows.filter((r) => r.rowStatus === "error").length;
  const ignoredCount = validatedRows.filter((r) => r.rowStatus === "ignored").length;
  const duplicateCount = validatedRows.filter((r) => r.rowStatus === "duplicate").length;
  const removedCount = validatedRows.filter((r) => r.rowStatus === "removed").length;
  const updateCount = validatedRows.filter(
    (r) => (r.rowStatus === "update_pending_to_approved" || r.rowStatus === "update_pending_to_failed")
  ).length;
  const importedCount = importResults.filter((r) => r.status === "success").length;
  const importErrorCount = importResults.filter((r) => r.status === "error").length;
  const totalValid = validCount + updateCount;
  const matchedCount = resolvedRows.filter(
    (r) => (r.rowStatus === "valid" || r.rowStatus === "update_pending_to_approved" || r.rowStatus === "update_pending_to_failed") && r.matchedSubject
  ).length;
  const unmatchedCount = resolvedRows.filter(
    (r) => (r.rowStatus === "valid" || r.rowStatus === "update_pending_to_approved" || r.rowStatus === "update_pending_to_failed") && !r.matchedSubject
  ).length;
  const notInPlanCount = resolvedRows.filter(
    (r) => (r.rowStatus === "valid" || r.rowStatus === "update_pending_to_approved" || r.rowStatus === "update_pending_to_failed") && r.matchedSubject && !r.inPlan
  ).length;

  return {
    step,
    setStep,
    parsedRows,
    validatedRows,
    resolvedRows,
    fileName,
    isImporting,
    importResults,
    totalValid,
    validCount,
    errorCount,
    ignoredCount,
    duplicateCount,
    updateCount,
    removedCount,
    importedCount,
    importErrorCount,
    matchedCount,
    unmatchedCount,
    notInPlanCount,
    handleFileSelect,
    processRows,
    goToConfirm,
    executeImport,
    handleReset,
    updateRow,
    removeRow,
  };
}
