import { Modal } from "@/widgets/ui/Modal";
import { Button } from "@/widgets/ui/Button";
import { useImportExcel, cleanSubjectName } from "@/features/academic-record/hooks/useImportExcel";
import { RESULTADO_TO_BACKEND_STATUS } from "@/features/academic-record/import-rules";
import type { ValidatedRow, ResolvedRow, ImportResult } from "@/features/academic-record/hooks/useImportExcel";

type ImportExcelModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
  userId: string;
  existingRecords?: Array<{ id: string; year: number; subjectId: string; status: string }>;
  subjects?: Array<{ id: string; code: string; name: string }>;
};

export function ImportExcelModal({
  isOpen,
  onClose,
  onImportComplete,
  userId,
  existingRecords,
  subjects,
}: ImportExcelModalProps) {
  const {
    step,
    setStep,
    parsedRows,
    validatedRows,
    resolvedRows,
    fileName,
    isImporting,
    importResults,
    validCount,
    errorCount,
    ignoredCount,
    duplicateCount,
    updateCount,
    removedCount,
    importedCount,
    importErrorCount,
    totalValid,
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
  } = useImportExcel(userId, existingRecords, subjects, isOpen);

  const handleClose = () => {
    if (validatedRows.length > 0 && step !== 4) {
      const confirm = window.confirm("Hay cambios sin guardar. ¿Estás seguro de que querés salir?");
      if (!confirm) return;
    }
    handleReset();
    onClose();
  };

  const getStatusIcon = (row: ValidatedRow) => {
    if (row.rowStatus === "valid") return <span className="text-secondary text-body-sm">✅</span>;
    if (row.rowStatus === "error") return <span className="text-error text-body-sm cursor-help" title={row.errors.join(" | ")}>❌</span>;
    if (row.rowStatus === "duplicate") return <span className="text-outline text-body-sm">🟡</span>;
    if (row.rowStatus === "update_pending_to_approved" || row.rowStatus === "update_pending_to_failed") return <span className="text-primary text-body-sm">🔄</span>;
    return <span className="text-outline text-body-sm">⚠️</span>;
  };

  const getImportIcon = (result: ImportResult) => {
    if (result.status === "success") return <span className="text-secondary text-body-sm">✅</span>;
    return <span className="text-error text-body-sm cursor-help" title={result.error}>❌</span>;
  };

  const isRowDimmed = (row: ValidatedRow) =>
    row.rowStatus === "ignored" || row.rowStatus === "duplicate" || row.rowStatus === "error";

  const size = step === 1 ? "md" : "xl";

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Importar Excel" size={size}>
      {step === 1 && (
        <div className="space-y-md">
          <p className="text-body-md text-on-surface-variant">
            Seleccioná un archivo Excel (.xlsx o .xls) con las calificaciones a importar.
          </p>

          {parsedRows.length === 0 && fileName && (
            <div className="rounded-lg bg-error-container/30 border border-error/50 p-md text-error flex gap-sm items-start">
              <span className="material-symbols-outlined shrink-0">error</span>
              <p className="font-body-sm text-body-sm">El archivo no tiene el formato esperado. Asegúrate de que contenga las columnas: Actividad, Fecha, Tipo, Nota, Resultado.</p>
            </div>
          )}

          <div className="flex gap-sm items-center text-body-sm">
            <span className="material-symbols-outlined text-primary">info</span>
            <p className="text-on-surface-variant">
              Necesitás un archivo con las columnas: <strong>Actividad, Fecha, Tipo, Nota, Resultado</strong>
            </p>
          </div>

          <label className="flex flex-col items-center justify-center gap-sm border-2 border-dashed border-outline-variant rounded-xl p-xl cursor-pointer hover:bg-surface-container-low transition-colors">
            <span className="material-symbols-outlined text-[40px] text-primary">upload_file</span>
            <span className="font-title-sm text-title-sm text-on-surface">
              {fileName || "Hacé clic para seleccionar un archivo"}
            </span>
            {fileName && (
              <div className="flex gap-md items-center w-full justify-center">
                <span className="text-body-sm text-on-surface-variant">{fileName}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReset();
                  }}
                  className="rounded-full p-1 hover:bg-error-container/30 text-error transition-colors"
                  title="Remover archivo"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
            )}
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>

          <Button variant="ghost" className="w-full" onClick={() => {
              const sampleData = [
                { Actividad: "PROG-101", Fecha: "15/03/2024", Tipo: "Regularidad", Nota: "8", Resultado: "Aprobado" },
                { Actividad: "PROG-101", Fecha: "20/06/2024", Tipo: "Examen", Nota: "9", Resultado: "Aprobado" },
              ];
              const csvContent = [
                ["Actividad", "Fecha", "Tipo", "Nota", "Resultado"],
                ...sampleData.map(row => [row.Actividad, row.Fecha, row.Tipo, row.Nota, row.Resultado])
              ].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");
              
              const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
              const link = document.createElement("a");
              const url = URL.createObjectURL(blob);
              link.setAttribute("href", url);
              link.setAttribute("download", "plantilla-historia-academica.csv");
              link.click();
              URL.revokeObjectURL(url);
            }}>
            <span className="material-symbols-outlined">download</span>
            Descargar plantilla
          </Button>

          <div className="flex gap-4 pt-4 border-t border-outline-variant">
            <Button variant="secondary" className="flex-1" onClick={handleClose}>
              Cancelar
            </Button>
            <Button variant="primary" className="flex-1" onClick={processRows} disabled={parsedRows.length === 0}>
              Siguiente
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-md">
          <p className="text-body-sm text-on-surface-variant">
            Se verificaron las materias contra el sistema. Las filas sin materia no se importarán.
          </p>

          <div className="flex items-center gap-sm flex-wrap">
            <span className="inline-flex items-center gap-1 rounded-full bg-secondary-container/60 text-on-secondary-container px-3 py-1 font-label-caps text-label-caps">
              {matchedCount} con materia
            </span>
            {unmatchedCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-error-container/40 text-error px-3 py-1 font-label-caps text-label-caps">
                {unmatchedCount} sin materia
              </span>
            )}
            {notInPlanCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-tertiary/10 text-tertiary px-3 py-1 font-label-caps text-label-caps">
                {notInPlanCount} no está en tu plan
              </span>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto overflow-x-auto rounded-lg border border-outline-variant">
            <table className="w-full min-w-[480px] text-sm">
              <thead className="bg-surface-bright border-b border-outline-variant sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left font-label-caps text-label-caps text-on-surface-variant uppercase">Materia</th>
                  <th className="px-3 py-2 text-center font-label-caps text-label-caps text-on-surface-variant uppercase">Encontrada</th>
                  <th className="px-3 py-2 text-center font-label-caps text-label-caps text-on-surface-variant uppercase">En tu plan</th>
                </tr>
              </thead>
              <tbody>
                {resolvedRows.filter((r) => r.rowStatus === "valid" || r.rowStatus === "update_pending_to_approved" || r.rowStatus === "update_pending_to_failed").map((row) => (
                  <tr
                    key={row.id}
                    className={`border-b border-outline-variant/50 hover:bg-surface-container-low ${!row.matchedSubject ? "bg-error-container/10" : ""}`}
                  >
                    <td className="px-3 py-2 text-body-sm text-on-surface max-w-[400px] truncate" title={row.actividad}>
                      {cleanSubjectName(row.actividad)}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {row.matchedSubject ? (
                        <span className="text-secondary text-body-sm" title={row.matchedSubject.name}>✅</span>
                      ) : (
                        <span className="text-error text-body-sm cursor-help" title="No se encontró una materia con ese código en el sistema">❌</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {!row.matchedSubject ? (
                        <span className="text-outline text-body-sm">—</span>
                      ) : row.inPlan ? (
                        <span className="text-secondary text-body-sm">✅</span>
                      ) : (
                        <span className="text-tertiary text-body-sm cursor-help" title="Esta materia no pertenece al plan de estudios activo del alumno (ni es UNAHUR). El sistema probablemente la va a rechazar al importar.">⚠️</span>
                      )}
                    </td>
                  </tr>
                ))}
                {resolvedRows.filter((r) => r.rowStatus === "valid" || r.rowStatus === "update_pending_to_approved" || r.rowStatus === "update_pending_to_failed").length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-3 py-8 text-center text-body-sm text-on-surface-variant">
                      No hay filas válidas para importar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex gap-4 pt-4 border-t border-outline-variant">
            <Button variant="secondary" className="flex-1" onClick={() => setStep(1)}>
              Volver
            </Button>
            <Button variant="primary" className="flex-1" onClick={goToConfirm} disabled={matchedCount === 0}>
              {unmatchedCount > 0
                ? `Continuar (${matchedCount} materias)`
                : "Continuar"}
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-md">
          <p className="text-body-sm text-on-surface-variant">
            Editá los campos antes de confirmar la importación. Hacé clic en la ✕ para eliminar una fila.
          </p>

          <div className="flex items-center gap-sm flex-wrap">
            <span className="inline-flex items-center gap-1 rounded-full bg-secondary-container/60 text-on-secondary-container px-3 py-1 font-label-caps text-label-caps">
              {validCount} a importar
            </span>
            {updateCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary-container/50 text-primary px-3 py-1 font-label-caps text-label-caps">
                {updateCount} actualizar
              </span>
            )}
            {removedCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-error-container/40 text-error px-3 py-1 font-label-caps text-label-caps">
                {removedCount} eliminadas
              </span>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto overflow-x-auto rounded-lg border border-outline-variant">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-surface-bright border-b border-outline-variant sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left font-label-caps text-label-caps text-on-surface-variant uppercase">Materia</th>
                  <th className="px-3 py-2 text-left font-label-caps text-label-caps text-on-surface-variant uppercase">Tipo</th>
                  <th className="px-3 py-2 text-left font-label-caps text-label-caps text-on-surface-variant uppercase">Año</th>
                  <th className="px-3 py-2 text-left font-label-caps text-label-caps text-on-surface-variant uppercase">Cuatri.</th>
                  <th className="px-3 py-2 text-left font-label-caps text-label-caps text-on-surface-variant uppercase">Estado</th>
                  <th className="px-3 py-2 text-left font-label-caps text-label-caps text-on-surface-variant uppercase">Nota</th>
                  <th className="px-3 py-2 text-center font-label-caps text-label-caps text-on-surface-variant uppercase">Acción</th>
                </tr>
              </thead>
              <tbody>
                {resolvedRows
                  .filter((r) => r.rowStatus === "valid" || r.rowStatus === "update_pending_to_approved" || r.rowStatus === "update_pending_to_failed")
                  .map((row) => {
                    const isRemoved = row.rowStatus === "removed";
                    const hasError = (row.editErrors && Object.keys(row.editErrors).length > 0) || false;
                    
                    return (
                      <tr key={row.id} className={`border-b border-outline-variant/50 ${isRemoved ? "opacity-30 line-through" : "hover:bg-surface-container-low"}`}>
                        <td className="px-3 py-2 text-body-sm text-on-surface max-w-[180px] truncate" title={row.actividad}>
                          {cleanSubjectName(row.actividad)}
                        </td>
                        <td className="px-3 py-2">
                          <select
                            disabled={isRemoved}
                            value={row.editedTipo || "regularidad"}
                            onChange={(e) => {
                              const newTipo = e.target.value;
                              const updates: any = { editedTipo: newTipo };
                              // Auto-set status based on tipo
                              if (newTipo === "examen") {
                                updates.editedStatus = "approved";
                                updates.editedGrade = undefined;
                              } else if (row.editedStatus === "approved" && !row.editedGrade) {
                                updates.editedGrade = "7";
                              }
                              updateRow(row.id, updates);
                            }}
                            className="w-full rounded bg-surface-bright border border-outline-variant px-2 py-1 text-body-sm text-on-surface outline-none focus:border-primary-container focus:ring-1 focus:ring-primary/30"
                          >
                            <option value="regularidad">Regularidad</option>
                            <option value="examen">Examen</option>
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            disabled={isRemoved}
                            type="number"
                            min="2000"
                            max={new Date().getFullYear()}
                            value={row.editedYear || ""}
                            onChange={(e) => {
                              const year = parseInt(e.target.value) || new Date().getFullYear();
                              const errors = row.editErrors || {};
                              if (year < 2000 || year > new Date().getFullYear()) {
                                errors.year = "Año inválido";
                              } else {
                                delete errors.year;
                              }
                              updateRow(row.id, { editedYear: year, editErrors: errors });
                            }}
                            className="w-full rounded bg-surface-bright border border-outline-variant px-2 py-1 text-body-sm text-on-surface outline-none focus:border-primary-container focus:ring-1 focus:ring-primary/30"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <select
                            disabled={isRemoved}
                            value={row.editedSemester || 1}
                            onChange={(e) => updateRow(row.id, { editedSemester: parseInt(e.target.value) as 1 | 2 })}
                            className="w-full rounded bg-surface-bright border border-outline-variant px-2 py-1 text-body-sm text-on-surface outline-none focus:border-primary-container focus:ring-1 focus:ring-primary/30"
                          >
                            <option value="1">1°</option>
                            <option value="2">2°</option>
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <select
                            disabled={isRemoved}
                            value={row.editedStatus || "enrolled"}
                            onChange={(e) => {
                              const status = e.target.value;
                              const updates: any = { editedStatus: status };
                              if (status === "enrolled") {
                                updates.editedGrade = undefined;
                              } else if (!row.editedGrade) {
                                updates.editedGrade = status === "approved" ? "7" : "2";
                              }
                              updateRow(row.id, updates);
                            }}
                            className="w-full rounded bg-surface-bright border border-outline-variant px-2 py-1 text-body-sm text-on-surface outline-none focus:border-primary-container focus:ring-1 focus:ring-primary/30"
                          >
                            <option value="enrolled">En curso</option>
                            <option value="approved">Aprobada</option>
                            <option value="failed">Desaprobada</option>
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            disabled={isRemoved || (row.editedTipo === "regularidad" && row.editedStatus === "enrolled")}
                            type="number"
                            min="0"
                            max="10"
                            step="0.5"
                            value={row.editedGrade ?? ""}
                            onChange={(e) => {
                              const grade = e.target.value;
                              const errors = row.editErrors || {};
                              if (grade && (isNaN(Number(grade)) || Number(grade) < 0 || Number(grade) > 10)) {
                                errors.grade = "Nota 0-10";
                              } else {
                                delete errors.grade;
                              }
                              updateRow(row.id, { editedGrade: grade, editErrors: errors });
                            }}
                            className="w-full rounded bg-surface-bright border border-outline-variant px-2 py-1 text-body-sm text-on-surface outline-none focus:border-primary-container focus:ring-1 focus:ring-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                        </td>
                        <td className="px-3 py-2 text-center">
                          <button
                            onClick={() => removeRow(row.id)}
                            className="inline-flex items-center justify-center rounded-full w-8 h-8 bg-error-container/20 text-error hover:bg-error-container/40 transition-colors"
                            title="Eliminar fila"
                          >
                            <span className="material-symbols-outlined text-[18px]">close</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          <div className="flex gap-4 pt-4 border-t border-outline-variant">
            <Button variant="secondary" className="flex-1" onClick={() => setStep(2)}>
              Volver
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={async () => {
                await executeImport();
                window.dispatchEvent(new CustomEvent("academic-records:updated"));
              }}
              disabled={(validCount + updateCount) === 0 || isImporting}
            >
              {isImporting ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                  Importando...
                </>
              ) : (
                `Importar (${validCount} nuevas${updateCount > 0 ? `, ${updateCount} actualizar` : ""})`
              )}
            </Button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-md">
          <div className="rounded-lg bg-secondary-container/30 border border-secondary/20 p-md">
            <p className="font-title-sm text-title-sm text-on-surface mb-1">Importación completada</p>
            <p className="text-body-sm text-on-surface-variant">
              Se importaron <strong className="text-on-surface">{importedCount}</strong> registros de {totalValid} disponibles
              {importErrorCount > 0 && (
                <> con <strong className="text-error">{importErrorCount}</strong> errores</>
              )}
              . {ignoredCount > 0 && `${ignoredCount} ignoradas.`} {duplicateCount > 0 && `${duplicateCount} duplicadas (omitidas).`} {updateCount > 0 && `${updateCount} actualizadas.`}
            </p>
          </div>

          <div className="max-h-80 overflow-y-auto overflow-x-auto rounded-lg border border-outline-variant">
            <table className="w-full min-w-[600px] text-sm">
              <thead className="bg-surface-bright border-b border-outline-variant sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left font-label-caps text-label-caps text-on-surface-variant uppercase">Materia</th>
                  <th className="px-3 py-2 text-left font-label-caps text-label-caps text-on-surface-variant uppercase">Año</th>
                  <th className="px-3 py-2 text-left font-label-caps text-label-caps text-on-surface-variant uppercase">Nota</th>
                  <th className="px-3 py-2 text-left font-label-caps text-label-caps text-on-surface-variant uppercase">Estado</th>
                  <th className="px-3 py-2 text-left font-label-caps text-label-caps text-on-surface-variant uppercase">Detalle</th>
                </tr>
              </thead>
              <tbody>
                {importResults.map((result) => {
                  const row = validatedRows.find((r) => r.id === result.rowId);
                  if (!row) return null;
                  return (
                    <tr key={result.rowId} className="border-b border-outline-variant/50 hover:bg-surface-container-low">
                      <td className="px-3 py-2 text-body-sm text-on-surface max-w-[200px] truncate" title={row.actividad}>
                        {cleanSubjectName(row.actividad)}
                      </td>
                      <td className="px-3 py-2 text-body-sm text-on-surface">{row.fecha.split("/")[2]}</td>
                      <td className="px-3 py-2 text-body-sm text-on-surface">{row.nota || "-"}</td>
                      <td className="px-3 py-2 text-body-sm text-on-surface">{getImportIcon(result)} {mapEstado(row.resultado)}</td>
                      <td className="px-3 py-2 text-body-sm max-w-[220px]">
                        {result.status === "error" ? (
                          <span className="text-error">{result.error}</span>
                        ) : (
                          <span className="text-on-surface-variant">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex gap-4 pt-4 border-t border-outline-variant">
            <Button variant="secondary" className="flex-1" onClick={() => setStep(3)}>
              Volver
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={() => {
                handleReset();
                onImportComplete();
              }}
            >
              Cerrar
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function mapEstado(resultado: string): string {
  const status = RESULTADO_TO_BACKEND_STATUS[resultado] ?? "en curso";
  if (status === "en curso") return "En curso";
  return status.charAt(0).toUpperCase() + status.slice(1);
}
