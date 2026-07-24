import { SearchInput } from "@/widgets/ui/SearchInput";
import { Button } from "@/widgets/ui/Button";

interface Props {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  statusOptions: { value: string; label: string }[];
  onReset: () => void;
  onClose: () => void;
}

export function InstitutesMobileFilter({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  statusOptions,
  onReset,
}: Props) {
  return (
    <div className="flex flex-col gap-4">
      <SearchInput
        value={searchTerm}
        onChange={onSearchChange}
        placeholder="Buscar por nombre, sigla o responsable"
        className="w-full"
      />

      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Estado</span>
        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          className="w-full rounded border border-outline-variant bg-white px-4 py-2.5 text-sm text-on-surface appearance-none"
        >
          {statusOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
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
