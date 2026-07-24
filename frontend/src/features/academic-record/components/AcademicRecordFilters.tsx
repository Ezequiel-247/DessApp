import type { AcademicStatus, Semester } from "@/entities/AcademicRecord";
import { Dropdown } from "@/widgets/ui/Dropdown";
import { SearchInput } from "@/widgets/ui/SearchInput";

interface EnrollmentOption {
  id: string;
  career?: { name?: string };
}

interface Props {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  typeFilter: string;
  onTypeFilterChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  yearFilter: number | "";
  onYearFilterChange: (value: number | "") => void;
  semesterFilter: Semester | "";
  onSemesterFilterChange: (value: Semester | "") => void;
  uniqueYears: number[];
  enrollmentOptions: EnrollmentOption[];
  selectedEnrollmentId: string;
  onEnrollmentChange: (id: string) => void;
}

export function AcademicRecordFilters(props: Props) {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-sm">
        <SearchInput
          value={props.searchTerm}
          onChange={props.onSearchChange}
          placeholder="Buscar materia..."
          className="min-w-[240px] flex-1 max-w-md"
        />
        {props.enrollmentOptions.length > 1 && (
          <Dropdown
            label="Carrera"
            icon="school"
            value={props.selectedEnrollmentId}
            options={props.enrollmentOptions.map((e) => ({
              value: String(e.id),
              label: e.career?.name ?? "Sin nombre",
            }))}
            onChange={props.onEnrollmentChange}
            hideAllOption
            className="w-full sm:w-auto sm:max-w-xs"
          />
        )}
      </div>
      <div className="flex flex-wrap items-center gap-sm">
        <Dropdown label="Tipo" icon="category" allValue="all" value={props.typeFilter}
          options={[
            { value: "subject", label: "Materia" },
            { value: "exam", label: "Examen" },
            { value: "actividad", label: "Actividad" },
          ]}
          onChange={(v) => props.onTypeFilterChange(v as "all" | "subject" | "exam" | "actividad")}
        />
        <Dropdown label="Estado" icon="sell" value={props.statusFilter}
          options={[
            { value: "approved", label: "Aprobada" },
            { value: "pending", label: "Pendiente" },
            { value: "enrolled", label: "En curso" },
            { value: "failed", label: "Desaprobada" },
            { value: "equivalencia", label: "Equivalencia" },
          ]}
          onChange={(v) => props.onStatusFilterChange(v as AcademicStatus | "")}
        />
        <Dropdown label="Año" icon="calendar_month" value={props.yearFilter}
          options={props.uniqueYears.map((y) => ({ value: y, label: `Año ${y}` }))}
          onChange={(v) => props.onYearFilterChange(v as number | "")}
        />
        <Dropdown label="Cuatrimestre" icon="date_range" value={props.semesterFilter}
          options={[
            { value: 1, label: "Primero" },
            { value: 2, label: "Segundo" },
          ]}
          onChange={(v) => props.onSemesterFilterChange(v as Semester | "")}
        />
      </div>
    </>
  );
}
