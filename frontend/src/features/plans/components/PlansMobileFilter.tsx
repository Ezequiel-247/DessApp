import { SearchInput } from "@/widgets/ui/SearchInput";
import { Button } from "@/widgets/ui/Button";

interface Props {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedInstitute: string;
  onInstituteChange: (value: string) => void;
  institutes: { id: string; name: string }[];
  selectedCareer: string;
  onCareerChange: (value: string) => void;
  filteredCareers: { id: string; name: string }[];
  onReset: () => void;
  onClose: () => void;
}

export function PlansMobileFilter({
  searchTerm,
  onSearchChange,
  selectedInstitute,
  onInstituteChange,
  institutes,
  selectedCareer,
  onCareerChange,
  filteredCareers,
  onReset,
}: Props) {
  return (
    <div className="flex flex-col gap-4">
      <SearchInput
        value={searchTerm}
        onChange={onSearchChange}
        placeholder="Buscar por nombre de plan"
        className="w-full"
      />

      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Instituto</span>
        <select
          value={selectedInstitute}
          onChange={(e) => onInstituteChange(e.target.value)}
          className="w-full rounded border border-outline-variant bg-white px-4 py-2.5 text-sm text-on-surface appearance-none"
        >
          {institutes.map((i) => (
            <option key={i.id} value={i.id}>{i.name}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Carrera</span>
        {filteredCareers.length === 0 ? (
          <div className="w-full rounded border border-outline-variant bg-white px-4 py-2.5 text-sm text-on-surface-variant opacity-50">
            Sin carreras
          </div>
        ) : (
          <select
            value={selectedCareer}
            onChange={(e) => onCareerChange(e.target.value)}
            className="w-full rounded border border-outline-variant bg-white px-4 py-2.5 text-sm text-on-surface appearance-none"
          >
            {filteredCareers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}
      </div>

      <Button variant="secondary" onClick={onReset} className="w-full">
        <span className="material-symbols-outlined text-[24px]">refresh</span>
        Reiniciar
      </Button>
    </div>
  );
}
