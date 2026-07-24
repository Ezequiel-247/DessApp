import { useCallback, useEffect, useState } from "react";
import { Button } from "@/widgets/ui/Button";
import { Card } from "@/widgets/ui/Card";
import { Dropdown } from "@/widgets/ui/Dropdown";
import { SearchInput } from "@/widgets/ui/SearchInput";
import { EmptyState } from "@/widgets/ui/EmptyState";
import { MobileFilterSheet } from "@/widgets/ui/MobileFilterSheet";
import { table } from "@/shared/styles/table";
import { getMaterialsBySubject, fetchCareers } from "@/shared/api/adminReportApi";
import type { MaterialsBySubjectRow, CareerOption } from "@/shared/api/adminReportApi";

export function MaterialsTable() {
  const [rows, setRows] = useState<MaterialsBySubjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);

  const [careers, setCareers] = useState<CareerOption[]>([]);
  const [careerFilter, setCareerFilter] = useState("");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<"total" | "subject">("total");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");

  useEffect(() => {
    fetchCareers().then(setCareers).catch(() => {});
  }, []);

  const fetchData = useCallback(async (p: number, sk: string, sd: string, cf: string, q: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getMaterialsBySubject({
        page: p,
        limit: 20,
        sort_key: sk,
        sort_dir: sd,
        career_name: cf || undefined,
        search: q || undefined,
      });
      setRows(res.data);
      setTotalPages(res.totalPages);
      setTotal(res.total);
    } catch (err: any) {
      setError(err.message || "Error al cargar datos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(page, sortKey, sortDir, careerFilter, search);
  }, [page, sortKey, sortDir, careerFilter, search, fetchData]);

  const toggleSort = (key: "total" | "subject") => {
    if (sortKey === key) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else { setSortKey(key); setSortDir("desc"); }
    setPage(1);
  };

  const handleCareerFilter = (val: string) => {
    setCareerFilter(val);
    setPage(1);
  };

  const handleSearch = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const handleReset = () => {
    setSearch("");
    setCareerFilter("");
    setPage(1);
  };

  const [filterOpen, setFilterOpen] = useState(false);

  const grandTotal = total;
  const topSubject = rows.length > 0
    ? rows.reduce((a, b) => (a.total > b.total ? a : b))
    : null;

  return (
    <div className="space-y-gutter">
      <div className="hidden xl:block">
        <Card bodyClassName="!bg-surface-bright px-5 py-3 flex items-center gap-3 w-fit">
          <SearchInput
            value={search}
            onChange={handleSearch}
            placeholder="Buscar materia..."
            className="w-64"
          />
          {careers.length > 0 && (
            <>
              <div className="w-px h-6 bg-outline-variant" />
              <Dropdown
                label="Carrera"
                icon="school"
                value={careerFilter}
                options={careers.map((c) => ({ value: c.name, label: c.name }))}
                onChange={handleCareerFilter}
              />
            </>
          )}
          <div className="w-px h-6 bg-outline-variant" />
          <Button variant="ghost" onClick={handleReset}>
            <span className="material-symbols-outlined text-[24px]">refresh</span>
            Reiniciar
          </Button>
        </Card>
      </div>

      <button
        type="button"
        onClick={() => setFilterOpen(true)}
        className="xl:hidden w-full flex items-center justify-center gap-2 rounded-lg border border-outline-variant bg-white px-4 py-2 text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-colors"
      >
        <span className="material-symbols-outlined text-[24px]">filter_list</span>
        Filtros
      </button>

      <MobileFilterSheet
        isOpen={filterOpen}
        onClose={() => setFilterOpen(false)}
        title="Filtros"
      >
        <div className="flex flex-col gap-4">
          <SearchInput
            value={search}
            onChange={handleSearch}
            placeholder="Buscar materia..."
            className="w-full"
          />
          {careers.length > 0 && (
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Carrera</span>
              <select
                value={careerFilter}
                onChange={(e) => handleCareerFilter(e.target.value)}
                className="w-full rounded border border-outline-variant bg-white px-4 py-2.5 text-sm text-on-surface appearance-none"
              >
                <option value="">Todas las carreras</option>
                {careers.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
          )}
          <Button variant="secondary" onClick={() => { handleReset(); setFilterOpen(false); }} className="w-full">
            <span className="material-symbols-outlined text-[24px]">refresh</span>
            Reiniciar
          </Button>
        </div>
      </MobileFilterSheet>

      <Card
        header={<h2 className="font-title-sm text-title-sm text-on-surface">Materias con más materiales compartidos</h2>}
        bodyClassName="px-0 py-0 space-y-4"
        footer={totalPages > 1 ? (
          <div className="flex items-center justify-between">
            <span className="text-body-sm text-on-surface-variant">
              Pág {page} de {totalPages} ({total} resultados)
            </span>
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
                Anterior
              </Button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                const p = start + i;
                if (p > totalPages) return null;
                return (
                  <Button key={p} variant={p === page ? "primary" : "secondary"} onClick={() => setPage(p)}>
                    {p}
                  </Button>
                );
              })}
              <Button variant="secondary" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                Siguiente
              </Button>
            </div>
          </div>
        ) : undefined}
      >
        <div className="px-5 pt-4">
          <div className="flex flex-wrap gap-6 text-body-sm">
            <div>
              <span className="text-on-surface-variant">Total materiales: </span>
              <span className="font-semibold text-on-surface">{grandTotal}</span>
            </div>
            {topSubject && (
              <div>
                <span className="text-on-surface-variant">Materia con más contenido: </span>
                <span className="font-semibold text-on-surface">{topSubject.subject_name}</span>
                <span className="text-on-surface-variant"> ({topSubject.total})</span>
              </div>
            )}
          </div>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12 text-on-surface-variant">
            <span className="material-symbols-outlined animate-spin mr-2">refresh</span> Cargando...
          </div>
        ) : error ? (
          <div className="rounded-lg bg-error-container/30 border border-error/50 p-4 text-error flex gap-3 items-center">
            <span className="material-symbols-outlined text-2xl">error</span>
            <p className="text-body-sm">{error}</p>
          </div>
        ) : rows.length === 0 ? (
          <EmptyState>Sin resultados para los filtros seleccionados.</EmptyState>
        ) : (
          <div className="overflow-x-auto lg:overflow-x-visible">
            <table className={`${table.root} table-auto lg:table-fixed`}>
              <thead className={table.thead}>
                <tr>
                  <th className={table.th + " w-10"}>#</th>
                  <th className={table.th}>
                    <button onClick={() => toggleSort("subject")} className="flex items-center gap-1 hover:text-on-surface">
                      Materia
                      {sortKey === "subject" && <span className="material-symbols-outlined text-[14px]">{sortDir === "desc" ? "expand_more" : "expand_less"}</span>}
                    </button>
                  </th>
                  <th className={table.th + " text-right"}>Carrera</th>
                  <th className={table.th + " text-right"}>
                    <button onClick={() => toggleSort("total")} className="flex items-center gap-1 ml-auto hover:text-on-surface">
                      Total
                      {sortKey === "total" && <span className="material-symbols-outlined text-[14px]">{sortDir === "desc" ? "expand_more" : "expand_less"}</span>}
                    </button>
                  </th>
                  <th className={table.th + " text-right"}>PDF</th>
                  <th className={table.th + " text-right"}>Video</th>
                  <th className={table.th + " text-right"}>Link</th>
                </tr>
              </thead>
              <tbody className={table.tbody}>
                {rows.map((r, i) => (
                  <tr key={`${r.subject_id}-${r.career_name ?? "none"}`} className={table.tr}>
                    <td className={table.td + " text-on-surface-variant w-10"}>{(page - 1) * 20 + i + 1}</td>
                    <td className={table.td + " font-medium"}>{r.subject_name}</td>
                    <td className={table.td + " text-right text-on-surface-variant"}>{r.career_name ?? "—"}</td>
                    <td className={table.td + " text-right font-semibold tabular-nums"}>{r.total}</td>
                    <td className={table.td + " text-right text-on-surface-variant tabular-nums"}>{r.pdf}</td>
                    <td className={table.td + " text-right text-on-surface-variant tabular-nums"}>{r.video}</td>
                    <td className={table.td + " text-right text-on-surface-variant tabular-nums"}>{r.link}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
