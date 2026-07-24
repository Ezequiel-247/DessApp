import type { AcademicRecord } from "@/entities/AcademicRecord";
import type { FinalExam } from "@/entities/FinalExam";
import { getStatusBadge, getMicroEstadoIcon } from "../utils/academicRecordForm";
import { StatusBadge } from "@/widgets/ui/StatusBadge";
import { table as t } from "@/shared/styles/table";

interface DisplayRow {
  id: string;
  subjectName: string;
  year: number;
  semester: number;
  grade: string | undefined;
  status: string;
  _type: "subject" | "exam" | "actividad";
  sourceId: string;
  micro_estado_calculado?: string | null;
}

export interface AcademicRecordTableProps {
  displayRows: DisplayRow[];
  records: AcademicRecord[];
  finalExams: FinalExam[];
  activityRecords: any[];
  approvedExamRecordIds: Set<string>;
  onSelectRecord: (record: AcademicRecord) => void;
  onSelectExam: (exam: FinalExam) => void;
  onSelectActivityRecord: (record: any) => void;
  onOpenEdit: () => void;
}

type RowHandlers = {
  records: AcademicRecord[];
  finalExams: FinalExam[];
  activityRecords: any[];
  onSelectRecord: (r: AcademicRecord) => void;
  onSelectExam: (e: FinalExam) => void;
  onSelectActivityRecord: (r: any) => void;
  onOpenEdit: () => void;
};

function selectRow(row: DisplayRow, handlers: RowHandlers) {
  if (row._type === "subject") {
    const record = handlers.records.find((r) => r.id === row.id);
    if (record) { handlers.onSelectRecord(record); handlers.onOpenEdit(); }
  } else if (row._type === "exam") {
    const exam = handlers.finalExams.find((e) => e.id === row.id);
    if (exam) { handlers.onSelectExam(exam); handlers.onOpenEdit(); }
  } else {
    const actRec = handlers.activityRecords.find((a: any) => a.id === row.id);
    if (actRec) { handlers.onSelectActivityRecord(actRec); handlers.onOpenEdit(); }
  }
}

function TypeTag({ type }: { type: DisplayRow["_type"] }) {
  if (type === "exam") {
    return (
      <span className="ml-1 rounded-full bg-primary-container/40 px-2 py-0.5 font-label-caps text-[10px] font-semibold text-primary">
        Examen
      </span>
    );
  }
  if (type === "actividad") {
    return (
      <span className="ml-1 rounded-full bg-tertiary/10 px-2 py-0.5 font-label-caps text-[10px] font-semibold text-tertiary">
        Actividad
      </span>
    );
  }
  return null;
}

function TableRow({ row, handlers }: { row: DisplayRow; handlers: RowHandlers }) {
  const microIcon = row._type === "subject" && row.status === "pending" ? getMicroEstadoIcon(row.micro_estado_calculado) : null;

  return (
    <tr onClick={() => selectRow(row, handlers)} className={t.tr}>
      <td className={`${t.td} font-medium`}>
        <span className="inline-flex items-center gap-1">
          {row.subjectName}
          {microIcon && (
            <span className={`material-symbols-outlined text-base cursor-help ${microIcon.className}`} title={microIcon.title}>
              {microIcon.icon}
            </span>
          )}
        </span>
        <TypeTag type={row._type} />
      </td>
      <td className={`${t.td} text-center`}>{row.year}</td>
      <td className={`${t.td} text-center`}>{row.semester === 2 ? "Segundo" : "Primero"}</td>
      <td className={`${t.td} text-center`}>
        <StatusBadge
          variant={getStatusBadge(row.status).variant}
          label={getStatusBadge(row.status).label}
        />
      </td>
      <td className={`${t.td} pb-5 text-center font-semibold`}>{row.grade ?? "-"}</td>
    </tr>
  );
}

// Versión "card" de cada fila para pantallas chicas: en vez de forzar scroll horizontal
// sobre una tabla de 5 columnas, cada registro se apila como una card con los mismos
// datos en pares etiqueta/valor. El scroll queda vertical, que es lo natural en mobile.
function RecordCard({ row, handlers }: { row: DisplayRow; handlers: RowHandlers }) {
  const microIcon = row._type === "subject" && row.status === "pending" ? getMicroEstadoIcon(row.micro_estado_calculado) : null;
  const badge = getStatusBadge(row.status);

  return (
    <div
      onClick={() => selectRow(row, handlers)}
      className="flex flex-col gap-2 p-4 cursor-pointer transition-colors hover:bg-surface-container-low/50 active:bg-surface-container-low"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
          <span className="font-medium text-on-surface">{row.subjectName}</span>
          {microIcon && (
            <span className={`material-symbols-outlined text-base shrink-0 ${microIcon.className}`} title={microIcon.title}>
              {microIcon.icon}
            </span>
          )}
          <TypeTag type={row._type} />
        </div>
        <span className="shrink-0">
          <StatusBadge variant={badge.variant} label={badge.label} />
        </span>
      </div>
      <div className="flex items-center justify-between text-body-sm text-on-surface-variant">
        <span>
          {row.year} · {row.semester === 2 ? "2do" : "1er"} cuatrimestre
        </span>
        <span className="font-semibold text-on-surface">Nota: {row.grade ?? "-"}</span>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-2 py-8 text-center text-on-surface-variant">
      <span className="material-symbols-outlined text-outline text-[32px]">folder_open</span>
      <span className="text-body-sm">No hay registros que coincidan con los filtros</span>
    </div>
  );
}

export function AcademicRecordTable(props: AcademicRecordTableProps) {
  const handlers: RowHandlers = {
    records: props.records,
    finalExams: props.finalExams,
    activityRecords: props.activityRecords,
    onSelectRecord: props.onSelectRecord,
    onSelectExam: props.onSelectExam,
    onSelectActivityRecord: props.onSelectActivityRecord,
    onOpenEdit: props.onOpenEdit,
  };

  if (props.displayRows.length === 0) {
    return <EmptyState />;
  }

  return (
    <>
      {/* Mobile/tablet (<lg): lista de cards, sin scroll horizontal. La tabla de 5
          columnas no entra cómoda hasta bien pasado el ancho de tablet (~1024px). */}
      <div className="divide-y divide-slate-50 lg:hidden">
        {props.displayRows.map((row) => (
          <RecordCard key={`${row._type}_${row.id}`} row={row} handlers={handlers} />
        ))}
      </div>

      {/* Desktop (>=lg): tabla clásica */}
      <table className={`hidden lg:table ${t.root}`}>
        <thead className={`${t.thead} bg-surface-bright`}>
          <tr>
            <th className={`${t.th} text-left`}>Materia</th>
            <th className={`${t.th} text-center`}>Año</th>
            <th className={`${t.th} text-center`}>Cuatrimestre</th>
            <th className={`${t.th} text-center`}>Estado</th>
            <th className={`${t.th} text-center`}>Nota</th>
          </tr>
        </thead>
        <tbody className={t.tbody}>
          {props.displayRows.map((row) => (
            <TableRow key={`${row._type}_${row.id}`} row={row} handlers={handlers} />
          ))}
        </tbody>
      </table>
    </>
  );
}
