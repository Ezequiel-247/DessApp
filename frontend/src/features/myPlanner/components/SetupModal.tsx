import { Modal } from "@/widgets/ui/Modal";
import { Button } from "@/widgets/ui/Button";
import { Tooltip } from "@/widgets/ui/Tooltip";
import { Dropdown } from "@/widgets/ui/Dropdown";

interface Props {
  hours: number;
  onAdjustHours: (delta: number) => void;
  onCancel: () => void;
  onContinue: () => void;
  enrollmentOptions?: { id: number; career?: { name: string } }[];
  selectedEnrollmentId?: string;
  onSelectEnrollment?: (id: string) => void;
  isLoadingCareerData?: boolean;
}

export function SetupModal({
  hours,
  onAdjustHours,
  onCancel,
  onContinue,
  enrollmentOptions = [],
  selectedEnrollmentId = "",
  onSelectEnrollment,
  isLoadingCareerData = false,
}: Props) {
  // Configuración de límites
  const MIN_HOURS_PER_SUBJECT = 4;
  const MAX_AVG_HOURS_PER_SUBJECT = 6;
  const MIN_SUBJECTS = 1;
  const MAX_SUBJECTS = 5;

  // Calcular rango de horas posible
  const ABSOLUTE_MIN_HOURS = MIN_SUBJECTS * MIN_HOURS_PER_SUBJECT; // 4h
  // El tope real ya no asume las 5 materias a 8hs (práctica intensiva) a la vez —
  // ese combo no se da en la práctica. Se usa el promedio (6hs) como techo real.
  const ABSOLUTE_MAX_HOURS = MAX_SUBJECTS * MAX_AVG_HOURS_PER_SUBJECT; // 30h
  // Un escalón antes del tope: ya se puede armar una carga de MAX_SUBJECTS-1 materias,
  // aviso previo al rojo (que se dispara solo cuando la tabla de abajo llega a MAX_SUBJECTS).
  const AMBER_START_HOURS = 20;

  const RECOMMENDED_RANGE = {
    min: ABSOLUTE_MIN_HOURS,
    max: AMBER_START_HOURS,
  };

  // Umbrales de horas a partir de los cuales se estima cada cantidad de materias.
  // Ajustados a mano (no siguen una división prolija). El rojo/ámbar se calculan a
  // partir de esta misma tabla (más abajo), así nunca quedan desincronizados entre sí.
  const SUBJECT_COUNT_THRESHOLDS: { subjects: number; fromHours: number }[] = [
    { subjects: 1, fromHours: ABSOLUTE_MIN_HOURS }, // 4h
    { subjects: 2, fromHours: 9 },
    { subjects: 3, fromHours: 14 },
    { subjects: 4, fromHours: AMBER_START_HOURS }, // 20h
    { subjects: 5, fromHours: 26 },
  ];

  const estimateSubjectCount = (h: number): number => {
    let count = SUBJECT_COUNT_THRESHOLDS[0].subjects;
    for (const { subjects, fromHours } of SUBJECT_COUNT_THRESHOLDS) {
      if (h >= fromHours) count = subjects;
    }
    return count;
  };

  // Calcular número de materias según horas
  const calculateSubjects = (h: number) => {
    const minSubjects = Math.ceil(h / 8);
    const maxSubjects = Math.floor(h / MIN_HOURS_PER_SUBJECT);

    return {
      min: Math.max(MIN_SUBJECTS, Math.min(MAX_SUBJECTS, minSubjects)),
      max: Math.max(MIN_SUBJECTS, Math.min(MAX_SUBJECTS, maxSubjects)),
      recommended: estimateSubjectCount(h),
    };
  };

  const subjects = calculateSubjects(hours);
  const isValidHours = hours >= ABSOLUTE_MIN_HOURS && hours <= ABSOLUTE_MAX_HOURS;
  const isTooLow = hours < ABSOLUTE_MIN_HOURS;
  // Rojo apenas la tabla de materias estimadas llega al tope (MAX_SUBJECTS) — así el
  // color siempre coincide con la cifra mostrada, sin un número de horas aparte.
  const isTooHigh = subjects.recommended >= MAX_SUBJECTS;
  // Un escalón antes del máximo: todavía no es "carga alta", pero conviene avisar
  // que se está por llegar al tope.
  const isApproachingMax = !isTooHigh && hours >= AMBER_START_HOURS;

  // Interpretación de carga
  const getLoadLabel = (): string => {
    if (subjects.recommended === 1) return "Tiempo parcial";
    if (subjects.recommended <= 3) return "Tiempo parcial-completo";
    if (subjects.recommended <= 4) return "Tiempo completo";
    return "Tiempo completo intenso";
  };

  // Color según carga (usando tokens del Design System)
  const getLoadColor = (): string => {
    if (isTooLow) return "text-error";
    if (isTooHigh) return "text-error";
    if (isApproachingMax) return "text-tertiary-container";
    return "text-secondary";
  };

  // Barra de progreso
  const getProgressWidth = (): number => {
    return (Math.min(hours, ABSOLUTE_MAX_HOURS) / ABSOLUTE_MAX_HOURS) * 100;
  };

  return (
    <Modal
      isOpen
      onClose={onCancel}
      title="Configura tu Nuevo Plan"
      size="md"
      footer={
        <div className="flex gap-4">
          <Button variant="secondary" className="flex-1" onClick={onCancel}>
            <span className="material-symbols-outlined">close</span>
            Cancelar
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            onClick={onContinue}
            disabled={!isValidHours || isLoadingCareerData}
          >
            <span className="material-symbols-outlined">check</span>
            Continuar al Plan
          </Button>
        </div>
      }
    >
      {enrollmentOptions.length > 1 && onSelectEnrollment && (
        <div className="mb-6">
          <label className="block text-xs font-medium text-on-surface-variant uppercase tracking-wider mb-2">
            ¿Para qué carrera es este plan?
          </label>
          <Dropdown
            icon="school"
            label="Carrera"
            value={selectedEnrollmentId}
            options={enrollmentOptions.map((e) => ({
              value: String(e.id),
              label: e.career?.name ?? "Sin nombre",
            }))}
            onChange={onSelectEnrollment}
            hideAllOption
            className="w-full"
          />
        </div>
      )}

      <p className="text-body-md text-on-surface-variant mb-6">
        ¿Cuántas horas semanales puedes dedicar a este cuatrimestre?
      </p>

      <div className="space-y-6">
        {/* Input de horas con + y - */}
        <div className="flex items-center justify-center gap-4 sm:gap-6">
          <Button
            variant="secondary"
            onClick={() => onAdjustHours(-1)}
            disabled={hours <= ABSOLUTE_MIN_HOURS}
            className="w-12 h-12 !p-0 flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-2xl">remove</span>
          </Button>

          <div className="text-center min-w-[120px]">
            <div className="text-display-lg font-bold text-primary leading-none mb-1">
              {hours}
            </div>
            <div className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">
              HORAS / SEMANA
            </div>
          </div>

          <Button
            variant="secondary"
            onClick={() => onAdjustHours(1)}
            disabled={hours >= ABSOLUTE_MAX_HOURS}
            className="w-12 h-12 !p-0 flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-2xl">add</span>
          </Button>
        </div>

        {/* Información de materias */}
        <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/30">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className={`font-semibold ${getLoadColor()}`}>
                {getLoadLabel()}
              </span>
              <Tooltip content={
                <div className="space-y-2">
                  <p className="font-semibold text-on-surface mb-1">📚 Guía de horas por materia</p>
                  <ul className="space-y-1.5">
                    <li><strong>Mínimo:</strong> 4 horas/sem (materia teórica ligera)</li>
                    <li><strong>Promedio:</strong> 6 horas/sem (lo común)</li>
                    <li><strong>Máximo:</strong> 8 horas/sem (práctica intensiva)</li>
                  </ul>
                </div>
              }>
                <span className="material-symbols-outlined text-base text-outline cursor-help">info</span>
              </Tooltip>
            </div>
            <div className="text-body-sm text-on-surface">
              <strong>Materias estimadas:</strong> {subjects.recommended}
            </div>
          </div>
        </div>

        {/* Barra de recomendación */}
        <div className="space-y-3">
          <div className="text-xs text-on-surface-variant font-medium uppercase tracking-wider ">
            Rango recomendado
          </div>
          <div className="relative h-3 bg-surface-container rounded-full overflow-hidden border border-slate-150">
            {/* Fondo de rango recomendado */}
            <div
              className={`absolute h-full ${isApproachingMax ? "bg-tertiary-container" : "bg-secondary-container"}`}
              style={{
                left: `${(RECOMMENDED_RANGE.min / ABSOLUTE_MAX_HOURS) * 100}%`,
                right: `${100 - (RECOMMENDED_RANGE.max / ABSOLUTE_MAX_HOURS) * 100}%`,
              }}
            />
            {/* Progreso actual */}
            <div
              className={`absolute h-full transition-all ${
                !isValidHours || isTooHigh
                  ? "bg-error"
                  : isApproachingMax
                  ? "bg-tertiary-fixed-dim"
                  : "bg-secondary"
              }`}
              style={{ width: `${getProgressWidth()}%` }}
            />
          </div>

          {/* Etiquetas del rango */}
          <div className="flex justify-between text-[10px] text-on-surface-variant font-medium">
            <span>
              {ABSOLUTE_MIN_HOURS}h
              <br />
              (1 materia)
            </span>
            <span className="text-center">
              {RECOMMENDED_RANGE.max}h
              <br />
              (aviso desde acá)
            </span>
            <span className="text-right">
              {ABSOLUTE_MAX_HOURS}h
              <br />
              (máximo)
            </span>
          </div>
        </div>

        {/* Advertencias y sugerencias */}
        {isTooLow && (
          <div className="p-3 bg-error-container/20 border border-error/30 rounded-lg">
            <div className="flex gap-2">
              <span className="material-symbols-outlined text-error flex-shrink-0 text-lg">
                info
              </span>
              <div className="text-body-sm text-error">
                <strong>Mínimo: {ABSOLUTE_MIN_HOURS} horas</strong>
                <p className="text-on-surface-variant mt-1">
                  Necesitas al menos 1 materia con 4 horas semanales.
                </p>
              </div>
            </div>
          </div>
        )}

        {isTooHigh && !isTooLow && (
          <div className="p-3 bg-error-container/20 border border-error/30 rounded-lg">
            <div className="flex gap-2">
              <span className="material-symbols-outlined text-error flex-shrink-0 text-lg">
                warning
              </span>
              <div className="text-body-sm text-error">
                <strong>Carga alta</strong>
                <p className="text-on-surface-variant mt-1 text-xs">
                  Con {hours} horas ya llegás al máximo de {MAX_SUBJECTS} materias simultáneas. Asegúrate de poder sostenerlo.
                </p>
              </div>
            </div>
          </div>
        )}

        {isApproachingMax && (
          <div className="p-3 bg-tertiary-fixed/10 border border-tertiary-fixed-dim/30 rounded-lg">
            <div className="flex gap-2">
              <span className="material-symbols-outlined text-tertiary-container flex-shrink-0 text-lg">
                warning
              </span>
              <div className="text-body-sm text-on-surface">
                <strong>Te estás acercando al máximo</strong>
                <p className="text-on-surface-variant mt-1 text-xs">
                  Con {hours} horas ya estás cursando <strong>{subjects.recommended} materias</strong>, a una sola del tope de {MAX_SUBJECTS}.
                </p>
              </div>
            </div>
          </div>
        )}

        {isValidHours && !isTooHigh && !isApproachingMax && (
          <div className="p-3 bg-secondary-container/20 border border-secondary/30 rounded-lg">
            <div className="flex gap-2">
              <span className="material-symbols-outlined text-secondary flex-shrink-0 text-lg">
                check_circle
              </span>
              <div className="text-body-sm text-on-surface">
                <strong>Carga balanceada</strong>
                <p className="text-on-surface-variant mt-1 text-xs">
                  Con {hours} horas puedes cursar aprox. <strong>{subjects.recommended} materias</strong> sin sobrecargarte.
                </p>
              </div>
            </div>
          </div>
        )}


      </div>
    </Modal>
  );
}
