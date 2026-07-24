export function HistoryRulesInfo() {
  return (
    <div className="rounded-lg border border-outline-variant bg-surface-container-low p-md">
      <div className="flex items-start gap-3">
        <span className="material-symbols-outlined text-primary flex-shrink-0">info</span>
        <div className="space-y-1">
          <p className="font-label-caps text-label-caps text-on-surface-variant uppercase">Reglas del Historial</p>
          <ul className="space-y-1 text-body-sm text-on-surface-variant">
            <li>
              <strong>Aprobada:</strong> Nota final entre 4 y 10. La regularidad no vence.
            </li>
            <li>
              <strong>Pendiente:</strong> Materia regularizada sin nota final de examen. Se requiere indicar una fecha de vencimiento futura.
            </li>
            <li>
              <strong>Desaprobada:</strong> Nota final de examen entre 1 y 3. La regularidad no vence.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
