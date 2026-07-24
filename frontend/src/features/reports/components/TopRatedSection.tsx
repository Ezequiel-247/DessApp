import { useCallback, useEffect, useState } from "react";
import { Button } from "@/widgets/ui/Button";
import { Card } from "@/widgets/ui/Card";
import { Dropdown } from "@/widgets/ui/Dropdown";
import { SegmentedControl } from "@/widgets/ui/SegmentedControl";
import { EmptyState } from "@/widgets/ui/EmptyState";
import { MobileFilterSheet } from "@/widgets/ui/MobileFilterSheet";
import { getTopRatedMaterials, fetchSubjects } from "@/shared/api/adminReportApi";
import type { TopRatedMaterial, SubjectOption } from "@/shared/api/adminReportApi";

const SORT_OPTIONS = [
  { value: "ratio", label: "Valoración" },
  { value: "likes", label: "Me gusta" },
  { value: "total", label: "Votos totales" },
];

export function TopRatedSection() {
  const [materials, setMaterials] = useState<TopRatedMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [subjectFilter, setSubjectFilter] = useState("");
  const [sortBy, setSortBy] = useState<"ratio" | "likes" | "total">("ratio");
  const [filterOpen, setFilterOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTopRatedMaterials({
        subject_id: subjectFilter ? Number(subjectFilter) : undefined,
        sort: sortBy,
      });
      setMaterials(data);
    } catch (err: any) {
      setError(err.message || "Error al cargar datos");
    } finally {
      setLoading(false);
    }
  }, [subjectFilter, sortBy]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchSubjects().then(setSubjects).catch(() => {});
  }, []);

  const handleClear = () => {
    setSubjectFilter("");
    setSortBy("ratio");
  };

  return (
    <div className="space-y-gutter">
      {/* Filter card - desktop */}
      <div className="hidden xl:block">
        <Card bodyClassName="!bg-surface-bright px-5 py-3 flex items-center gap-3 w-fit">
          <Dropdown
            label="Materia"
            icon="subject"
            value={subjectFilter}
            options={subjects.map((s) => ({ value: String(s.id), label: s.name }))}
            onChange={(v) => setSubjectFilter(v)}
          />
          <div className="w-px h-6 bg-outline-variant" />
          <Button variant="ghost" onClick={handleClear}>
            <span className="material-symbols-outlined text-[24px]">refresh</span>
            Reiniciar
          </Button>
        </Card>
      </div>

      {/* Mobile filter button */}
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
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Materia</span>
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="w-full rounded border border-outline-variant bg-white px-4 py-2.5 text-sm text-on-surface appearance-none"
            >
              <option value="">Materia</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <Button variant="secondary" onClick={() => { handleClear(); setFilterOpen(false); }} className="w-full">
            <span className="material-symbols-outlined text-[24px]">refresh</span>
            Reiniciar
          </Button>
        </div>
      </MobileFilterSheet>

      <Card
        header={<h2 className="font-title-sm text-title-sm text-on-surface">Materiales más valorados</h2>}
      >
        <SegmentedControl
          value={sortBy}
          onChange={(v) => setSortBy(v as "ratio" | "likes" | "total")}
          options={SORT_OPTIONS}
          className="w-fit mb-4"
        />

        {loading ? (
          <div className="flex items-center justify-center py-12 text-on-surface-variant">
            <span className="material-symbols-outlined animate-spin mr-2">refresh</span> Cargando...
          </div>
        ) : error ? (
          <div className="rounded-lg bg-error-container/30 border border-error/50 p-4 text-error flex gap-3 items-center">
            <span className="material-symbols-outlined text-2xl">error</span>
            <p className="text-body-sm">{error}</p>
          </div>
        ) : materials.length === 0 ? (
          <EmptyState>No hay materiales valorados disponibles.</EmptyState>
        ) : (
          <div className="space-y-3">
            {materials.map((m, idx) => (
              <Card key={m.id} bodyClassName="px-0 py-0">
                <div className="flex flex-col gap-1 px-5 py-3 xl:hidden">
                  <span className="text-body-sm text-on-surface-variant font-semibold">#{idx + 1}</span>
                  <p className="text-body-sm font-semibold text-on-surface truncate">{m.title}</p>
                  <p className="text-body-xs text-on-surface-variant truncate">{m.subject_name ?? "—"}</p>
                  <div className="border-t border-outline-variant pt-2 mt-1 space-y-1">
                    <p>
                      <span className="text-body-xs text-on-surface-variant">Valoración </span>
                      <span className="text-body-sm font-semibold text-on-surface tabular-nums">
                        {m.valoracion_ratio != null ? m.valoracion_ratio.toFixed(2) : "—"}
                      </span>
                    </p>
                    <p className="flex items-center gap-2">
                      <span>👍 </span>
                      <span className="text-body-sm font-semibold text-success tabular-nums">{m.likes_count}</span>
                      <span className="text-on-surface-variant">·</span>
                      <span>👎 </span>
                      <span className="text-body-sm font-semibold text-error tabular-nums">{m.dislikes_count}</span>
                    </p>
                    <p>
                      <span className="text-body-xs text-on-surface-variant">Total </span>
                      <span className="text-body-sm font-semibold text-on-surface tabular-nums">{m.total_upvotes}</span>
                    </p>
                  </div>
                </div>
                <div className="hidden xl:flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-4 min-w-0">
                    <span className="text-body-sm text-on-surface-variant font-semibold w-6 shrink-0">#{idx + 1}</span>
                    <div className="min-w-0">
                      <p className="text-body-sm font-semibold text-on-surface truncate">{m.title}</p>
                      <p className="text-body-xs text-on-surface-variant truncate">{m.subject_name ?? "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0 ml-4">
                    <div className="text-right">
                      <p className="text-body-xs text-on-surface-variant">Valoración</p>
                      <p className="text-body-sm font-semibold text-on-surface tabular-nums">
                        {m.valoracion_ratio != null ? m.valoracion_ratio.toFixed(2) : "—"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-body-xs text-on-surface-variant">👍</p>
                      <p className="text-body-sm font-semibold text-success tabular-nums">{m.likes_count}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-body-xs text-on-surface-variant">👎</p>
                      <p className="text-body-sm font-semibold text-error tabular-nums">{m.dislikes_count}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-body-xs text-on-surface-variant">Total</p>
                      <p className="text-body-sm font-semibold text-on-surface tabular-nums">{m.total_upvotes}</p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
