import type { AcademicRecord } from "@/entities/AcademicRecord";
import type { FinalExam } from "@/entities/FinalExam";
import type { Subject } from "@/entities/Subject";
import type { Activity } from "@/entities/Activity";
import type { RecordType, FilterMode } from "../utils/academicRecordForm";
import {
  getModalTitle, getDeleteInfo, computeExpiryLabel,
  RECORD_TYPE_LABELS, isPillDisabled, getPillDisabledTitle,
  getSubjectOptions, getExamEligibleOptions,
  CURRENT_YEAR, isYearSemesterDisabled,
  shouldShowGrade, getGradeMinMax, getGradePlaceholder,
} from "../utils/academicRecordForm";
import { Modal } from "@/widgets/ui/Modal";
import { Button } from "@/widgets/ui/Button";
import { Input, InputSelect } from "@/widgets/ui/Input";
import { FormError } from "@/widgets/ui/FormError";
import { InputToggle } from "@/widgets/ui/InputToggle";
import { SegmentedControl } from "@/widgets/ui/SegmentedControl";
import { Form } from "@/widgets/ui/Form";
import { ProductTour, type TourStep } from "@/features/onboarding";

const addRecordTourSteps: TourStep[] = [
  {
    target: "body",
    placement: "center",
    title: "Agregar un registro",
    content: "Acá cargás tu actividad académica: una cursada, un final rendido, o una actividad con créditos.",
  },
  {
    target: '[data-tour="record-type-pills"]',
    title: "¿Qué querés registrar?",
    content: "Materia: una cursada, en curso o ya cerrada. Examen Final: un final que rendiste. Actividad con créditos: una actividad UNaHUR o electiva.",
  },
  {
    target: '[data-tour="record-form-fields"]',
    title: "Completá los datos",
    content: "Elegí la materia (o actividad), el año y cuatrimestre, y el estado. Según lo que elijas arriba, te vamos a pedir la nota si corresponde.",
  },
];

export interface AcademicRecordFormModalProps {
  isOpen: boolean;
  mode: "add" | "edit" | null;
  onClose: () => void;
  draft: {
    _type: RecordType;
    subjectId: string;
    year: number;
    semester: number;
    grade?: string;
    status: string;
    regularityExpiresAt?: string;
  };
  validationErrors: Record<string, string>;
  subjects: Subject[];
  subjectsForRegularidadSelector: Subject[];
  subjectsForUnahurSelector: Subject[];
  subjectsWithRegularidad: Subject[];
  hasExamEligibleSubjects: boolean;
  examEligibleData: any[];
  hasAnySubject: boolean;
  hasPlanSubjects: boolean;
  hasUnahurSubjects: boolean;
  effectiveFilter: FilterMode;
  subjectSourceFilter: FilterMode;
  onSourceFilterChange: (f: FilterMode) => void;
  activities: Activity[];
  availableActivities: Activity[];
  selectedRecord: AcademicRecord | null;
  selectedExam: FinalExam | null;
  selectedActivityRecord: any;
  approvedExamRecordIds: Set<string>;
  onFieldChange: (field: string, value: any) => void;
  onSave: (onSuccess?: () => void) => void;
  onCancelEdit: () => void;
  onDelete: (id: string, type: "subject" | "exam" | "actividad", onSuccess?: () => void) => void;
  onAfterAction: () => void;
}

function CelebrationComplete() {
  return (
    <div className="flex flex-col items-center gap-3 py-8 text-on-surface-variant">
      <span className="material-symbols-outlined text-[48px] text-outline">celebration</span>
      <span className="text-body-md text-center">
        No hay más registros que agregar.<br />Todo completo.
      </span>
    </div>
  );
}

export function AcademicRecordFormModal(props: AcademicRecordFormModalProps) {
  const isEdit = props.mode === "edit";
  const title = getModalTitle(props.mode, props.draft._type);
  const { id: deleteId, type: deleteType } = getDeleteInfo(props.selectedExam, props.selectedActivityRecord, props.selectedRecord);
  const hasApprovedFinal = props.selectedRecord ? props.approvedExamRecordIds.has(props.selectedRecord.id) : false;
  const isActivityConsolidated = props.mode === "edit"
    && props.draft._type === "actividad"
    && props.selectedActivityRecord?.status
    && ["approved", "failed", "equivalencia"].includes(props.selectedActivityRecord.status);

  const handleSave = () => props.onSave(props.onAfterAction);
  const handleClose = () => { props.onCancelEdit(); props.onSourceFilterChange("plan"); props.onClose(); };
  const handleDelete = () => props.onDelete(deleteId, deleteType, props.onAfterAction);

  const showPills = !isEdit;
  const showCelebration = !isEdit && !props.hasAnySubject && !props.hasExamEligibleSubjects && props.availableActivities.length === 0;
  const showWarning = props.draft._type === "regularidad" && props.draft.status === "approved" && (!props.draft.grade || Number(props.draft.grade) <= 6);

  const showGrade = shouldShowGrade(props.draft._type, props.draft.status);
  const { min: gradeMin, max: gradeMax } = getGradeMinMax(props.draft._type, props.draft.status);
  const gradePlaceholder = getGradePlaceholder(props.draft._type, props.draft.status);

  const isEditingPending = props.mode === "edit" && props.selectedRecord?.status === "pending";
  const isPromocionada = props.mode === "edit" && props.selectedRecord?.status === "approved";
  const effectiveMin = isPromocionada ? 7 : gradeMin;
  const effectiveMax = isEditingPending ? 6 : gradeMax;

  const yearSemDisabled = isYearSemesterDisabled(props.draft._type, props.draft.subjectId)
    || hasApprovedFinal === true
    || isEdit === true
    || (props.draft.status === "enrolled" && props.mode !== "edit")
    || (props.draft._type === "actividad" && !props.draft.subjectId);

  const canEditStatus = props.mode !== "edit" || props.selectedRecord?.status === "enrolled";
  const statusDisabled = !canEditStatus || props.draft.subjectId === "";
  const isActivityConsolidatedStatus = props.mode === "edit"
    && props.draft._type === "actividad"
    && props.selectedActivityRecord?.status
    && ["approved", "failed", "equivalencia"].includes(props.selectedActivityRecord.status);
  const isEnrolledEdit = props.mode === "edit" && props.selectedActivityRecord?.status === "enrolled";

  const options = getSubjectOptions(
    props.mode, props.draft._type, props.effectiveFilter,
    props.subjects, props.subjectsForRegularidadSelector,
    props.subjectsForUnahurSelector, props.subjectsWithRegularidad
  );
  const { vigentes: examVigentes, historicas: examHistoricas } = getExamEligibleOptions(props.examEligibleData ?? []);

  const showPlanFilter = props.mode !== "edit" && props.hasAnySubject && props.draft._type === "regularidad";
  const subjectCelebration = props.mode !== "edit" && !props.hasAnySubject && props.draft._type !== "actividad";
  const subjectShowSelect = props.mode === "edit" || props.hasAnySubject || (props.draft._type === "examen" && props.hasExamEligibleSubjects);

  const activityOptions = props.mode === "edit" ? props.activities : props.availableActivities;
  const activityLabel = `Actividad ${props.mode === "edit" ? "(No se puede cambiar)" : ""}`;

  return (
    <>
    <Modal
      isOpen={props.isOpen}
      onClose={handleClose}
      title={title}
      size="lg"
      footer={
        <div className="flex gap-4">
          {isEdit ? (
            <>
              <Button variant="secondary" className="flex-1" onClick={handleClose}>
                <span className="material-symbols-outlined">close</span>
                Cancelar
              </Button>
              {!isActivityConsolidated && (
                <Button variant="primary" className="flex-1" onClick={handleSave}>
                  <span className="material-symbols-outlined">check</span>
                  Actualizar
                </Button>
              )}
              <Button variant="danger" onClick={handleDelete}>
                <span className="material-symbols-outlined">delete</span>
              </Button>
            </>
          ) : (
            <>
              <Button variant="secondary" className="flex-1" onClick={handleClose}>
                <span className="material-symbols-outlined">close</span>
                Cancelar
              </Button>
              <Button variant="primary" className="flex-1" onClick={handleSave}>
                <span className="material-symbols-outlined">check</span>
                Agregar
              </Button>
            </>
          )}
        </div>
      }
    >
      <FormError errors={props.validationErrors} />

      {showPills && (
        <div data-tour="record-type-pills">
          <SegmentedControl
            value={props.draft._type}
            onChange={(type) => props.onFieldChange("_type", type)}
            className="w-full [&>button]:flex-1"
            options={[
              {
                value: "regularidad",
                label: RECORD_TYPE_LABELS.regularidad,
                disabled: isPillDisabled("regularidad", props.hasExamEligibleSubjects, props.availableActivities.length, props.hasAnySubject),
                title: isPillDisabled("regularidad", props.hasExamEligibleSubjects, props.availableActivities.length, props.hasAnySubject) ? getPillDisabledTitle("regularidad") : undefined,
              },
              {
                value: "examen",
                label: RECORD_TYPE_LABELS.examen,
                disabled: isPillDisabled("examen", props.hasExamEligibleSubjects, props.availableActivities.length, props.hasAnySubject),
                title: isPillDisabled("examen", props.hasExamEligibleSubjects, props.availableActivities.length, props.hasAnySubject) ? getPillDisabledTitle("examen") : undefined,
              },
              {
                value: "actividad",
                label: RECORD_TYPE_LABELS.actividad,
                disabled: isPillDisabled("actividad", props.hasExamEligibleSubjects, props.availableActivities.length, props.hasAnySubject),
                title: isPillDisabled("actividad", props.hasExamEligibleSubjects, props.availableActivities.length, props.hasAnySubject) ? getPillDisabledTitle("actividad") : undefined,
              },
            ]}
          />
        </div>
      )}

      {showCelebration && <CelebrationComplete />}

      <div data-tour="record-form-fields">
      <Form>
        <Form.Row cols={2} className="grid-cols-1 sm:grid-cols-[1fr_auto] mt-5">
          <Form.Field label={props.draft._type === "actividad" ? activityLabel : "Materia"} required error={props.validationErrors.subjectId}>
            {subjectCelebration && (
              <div className="flex flex-col items-center gap-2 py-6 text-on-surface-variant">
                <span className="material-symbols-outlined text-[40px] text-outline">celebration</span>
                <div className="text-body-sm text-center">
                  ¡Completaste todas las materias!<br />No hay materias nuevas para registrar.
                </div>
              </div>
            )}

            {props.draft._type === "actividad" ? (
              <div className="space-y-2">
                <InputSelect
                  disabled={props.mode === "edit"}
                  value={props.draft.subjectId || ""}
                  onChange={(e) => props.onFieldChange("subjectId", e.target.value)}
                  error={!!props.validationErrors.subjectId}
                >
                  <option value="">Seleccioná una actividad</option>
                  {activityOptions.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}{(a as any).credits != null ? ` (${(a as any).credits} crédito/s)` : ""}
                    </option>
                  ))}
                </InputSelect>
                {activityOptions.length === 0 && (
                  <p className="text-xs text-on-surface-variant">No hay actividades disponibles.</p>
                )}
              </div>
            ) : subjectShowSelect && (
              <div className="space-y-2">
                {props.draft._type === "examen" ? (
                  <InputSelect
                    disabled={props.mode === "edit"}
                    value={props.draft.subjectId || ""}
                    onChange={(e) => props.onFieldChange("subjectId", e.target.value)}
                    error={!!props.validationErrors.subjectId}
                  >
                    <option value="">Seleccioná una materia</option>
                    {examVigentes.length > 0 && (
                      <optgroup label="VIGENTES">
                        {examVigentes.map((opt) => (
                          <option key={opt.id} value={opt.id}>{opt.label}</option>
                        ))}
                      </optgroup>
                    )}
                    {examHistoricas.length > 0 && (
                      <optgroup label="HISTÓRICAS (Vencidas)">
                        {examHistoricas.map((opt) => (
                          <option key={opt.id} value={opt.id}>{opt.label}</option>
                        ))}
                      </optgroup>
                    )}
                  </InputSelect>
                ) : (
                  <InputSelect
                    disabled={props.mode === "edit"}
                    value={props.draft.subjectId || ""}
                    onChange={(e) => props.onFieldChange("subjectId", e.target.value)}
                    error={!!props.validationErrors.subjectId}
                  >
                    <option value="">Seleccioná una materia</option>
                    {options.map((subject) => (
                      <option key={subject.id} value={subject.id}>{subject.name}</option>
                    ))}
                  </InputSelect>
                )}
                {options.length === 0 && props.mode === "edit" && props.draft._type !== "examen" && (
                  <p className="text-xs text-on-surface-variant">No hay materias disponibles.</p>
                )}
              </div>
            )}
          </Form.Field>

          <Form.Field label="Filtrar" visible={showPlanFilter} className={"gap-5"}>
            <InputToggle
              checked={props.effectiveFilter === "unahur"}
              onChange={(checked) => props.onSourceFilterChange(checked ? "unahur" : "plan")}
              description="Es materia UNaHUR"
              disabled={!props.hasUnahurSubjects}
            />
          </Form.Field>
        </Form.Row>

        <Form.Row cols={2}>
          <Form.Field label="Año de Cursada" required error={props.validationErrors.year}>
            <Input
              type="number"
              min={props.draft.minYear ?? CURRENT_YEAR - 20}
              max={CURRENT_YEAR}
              value={props.draft.year || CURRENT_YEAR}
              disabled={yearSemDisabled}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => props.onFieldChange("year", parseInt(e.target.value))}
            />
          </Form.Field>

          <Form.Field label="Cuatrimestre" required>
            <InputSelect
              value={props.draft.semester || 1}
              disabled={yearSemDisabled}
              onChange={(e) => props.onFieldChange("semester", parseInt(e.target.value))}
            >
              <option value={1}>Primero</option>
              <option value={2}>Segundo</option>
            </InputSelect>
          </Form.Field>

          <Form.Field label="Estado" error={props.validationErrors.status}>
            {props.draft._type === "examen" ? (
              <InputSelect
                value={props.draft.status || "aprobado"}
                disabled={statusDisabled}
                onChange={(e) => props.onFieldChange("status", e.target.value)}
              >
                <option value="aprobado">Aprobado</option>
                <option value="desaprobado">Desaprobado</option>
              </InputSelect>
            ) : props.draft._type === "actividad" ? (
              <InputSelect
                value={props.draft.status || "enrolled"}
                disabled={isActivityConsolidatedStatus || props.draft.subjectId === ""}
                onChange={(e) => props.onFieldChange("status", e.target.value)}
                error={!!props.validationErrors.status}
              >
                {!isEnrolledEdit && (
                  <option value="enrolled">En curso</option>
                )}
                <option value="approved">Aprobada</option>
                <option value="failed">Desaprobada</option>
                <option value="equivalencia">Equivalencia</option>
              </InputSelect>
            ) : (
              <InputSelect
                value={props.draft.status || "enrolled"}
                disabled={statusDisabled}
                onChange={(e) => props.onFieldChange("status", e.target.value)}
                error={!!props.validationErrors.status}
              >
                <option value="enrolled">En curso</option>
                <option value="approved">Aprobada</option>
                <option value="failed">Desaprobada</option>
                <option value="equivalencia">Equivalencia</option>
              </InputSelect>
            )}
          </Form.Field>

          <Form.Field label="Calificación" error={props.validationErrors.grade} visible={showGrade}>
            <Input
              type="number"
              min={effectiveMin}
              max={effectiveMax}
              step="1"
              disabled={props.draft._type === "examen" && !props.draft.subjectId}
              placeholder={gradePlaceholder}
              value={props.draft.grade ?? ""}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const value = e.target.value;
                if (value === "") {
                  props.onFieldChange("grade", undefined);
                } else {
                  const numValue = parseInt(value);
                  if (!isNaN(numValue)) {
                    props.onFieldChange("grade", String(numValue));
                  }
                }
              }}
            />
          </Form.Field>

        </Form.Row>

        <Form.Row cols={1}>
          <Form.Field visible={showWarning}>
            <div className="rounded-lg bg-tertiary-fixed-dim/10 border border-tertiary-fixed-dim/30 p-4 text-body-sm text-on-surface flex items-start gap-2">
              <span className="material-symbols-outlined text-tertiary-container text-lg flex-shrink-0 mt-0.5">info</span>
              <span>
                El vencimiento de la regularidad se producirá en el período{' '}
                <strong>{computeExpiryLabel(props.draft.year, props.draft.semester)}</strong>.
              </span>
            </div>
          </Form.Field>
        </Form.Row>
      </Form>
      </div>
    </Modal>

    {props.isOpen && showPills && (
      <ProductTour tourId="academic-record-add" steps={addRecordTourSteps} />
    )}
    </>
  );
}
