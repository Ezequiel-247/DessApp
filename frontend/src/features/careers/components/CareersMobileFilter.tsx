import { SearchInput } from "@/widgets/ui/SearchInput";
import { Button } from "@/widgets/ui/Button";

interface Props {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filterInstituteId: string;
  onInstituteChange: (value: string) => void;
  institutes: { id: string; name: string }[];
  onReset: () => void;
  onClose: () => void;
}

export function CareersMobileFilter({
  searchTerm,
  onSearchChange,
  filterInstituteId,
  onInstituteChange,
  institutes,
  onReset,
}: Props) {
  return (
    <div className="flex flex-col gap-4">
      <SearchInput
        value={searchTerm}
        onChange={onSearchChange}
        placeholder="Buscar por nombre, título o instituto"
        className="w-full"
      />

      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Instituto</span>
        <select
          value={filterInstituteId}
          onChange={(e) => onInstituteChange(e.target.value)}
          className="w-full rounded border border-outline-variant bg-white px-4 py-2.5 text-sm text-on-surface appearance-none"
        >
          {institutes.map((i) => (
            <option key={i.id} value={i.id}>{i.name}</option>
          ))}
        </select>
      </div>

      <Button variant="secondary" onClick={onReset} className="w-full">
        <span className="material-symbols-outlined text-[24px]">refresh</span>
        Reiniciar
      </Button>
    </div>
  );
}
