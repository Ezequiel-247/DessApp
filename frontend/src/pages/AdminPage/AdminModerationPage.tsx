import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/app/AuthContext";
import { getReportedMaterials, resolveReport } from "@/entities/Material";
import type { Material } from "@/entities/Material";
import { EmptyState } from "@/widgets/ui/EmptyState";
import { Button } from "@/widgets/ui/Button";
import { Card } from "@/widgets/ui/Card";
import { Modal } from "@/widgets/ui/Modal";
import { PageHeader } from "@/widgets/ui/PageHeader";
import { StatusBadge } from "@/widgets/ui/StatusBadge";
import { Tag } from "@/widgets/ui/Tag";
import { getModerationStats } from "@/shared/api/adminReportApi";
import type { ModerationStats } from "@/shared/api/adminReportApi";
import { ProductTour, type TourStep } from "@/features/onboarding";

const moderationTourSteps: TourStep[] = [
  {
    target: "body",
    placement: "center",
    title: "Moderación de Contenidos",
    content: "Acá revisás y resolvés las denuncias que hacen los estudiantes sobre materiales.",
  },
  {
    target: '[data-tour="moderation-stats"]',
    title: "Estadísticas de moderación",
    content: "Desplegá esta sección para ver la tasa de resolución y el desglose por motivo y tipo de contenido.",
  },
  {
    target: '[data-tour="moderation-tabs"]',
    title: "Pendientes e historial",
    content: "Alterná entre las denuncias que todavía necesitan revisión y el historial de las ya resueltas.",
  },
  {
    target: '[data-tour="moderation-list"]',
    title: "Materiales denunciados",
    content: "Expandí un material para ver el detalle de cada denuncia y confirmarla o rechazarla.",
  },
];

function DonutChart({ title, data }: { title: string; data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const segments = data.map((d) => `${d.color} ${(d.value / total) * 360}deg`).join(", ");
  return (
    <div className="space-y-3">
      <p className="font-title-sm text-title-sm text-on-surface font-semibold">{title}</p>
      <div className="flex items-center gap-6">
        <div
          className="w-28 h-28 rounded-full shrink-0"
          style={{ background: `conic-gradient(${segments})` }}
        />
        <div className="space-y-2">
          {data.map((d) => (
            <div key={d.label} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: d.color }} />
              <span className="text-body-sm text-on-surface-variant">{d.label}</span>
              <span className="text-body-sm text-on-surface font-semibold tabular-nums">{d.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AdminModerationPage() {
  const { user } = useAuth();
  const [allMaterials, setAllMaterials] = useState<Material[]>([]);
  const [thresholds, setThresholds] = useState({ pending: 10, verified: 3 });
  const [activeTab, setActiveTab] = useState<"pending" | "resolved">("pending");
  const [expandedMaterialId, setExpandedMaterialId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [bulkAction, setBulkAction] = useState<{ material: Material; action: "confirm" | "reject" } | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [moderationStats, setModerationStats] = useState<ModerationStats | null>(null);

  const reportStats = useMemo(() => {
    let confirmed = 0, rejected = 0, pending = 0;
    for (const m of allMaterials) {
      for (const r of m.reports ?? []) {
        if (r.status === "verified") confirmed++;
        else if (r.status === "rejected") rejected++;
        else pending++;
      }
    }
    return { confirmed, rejected, pending };
  }, [allMaterials]);

  const materials = useMemo(() => {
    if (activeTab === "resolved") {
      return allMaterials.filter((m) =>
        m.reports?.some((r) => r.status === "verified" || r.status === "rejected")
      );
    }
    return allMaterials.filter((m) =>
      m.reports?.some((r) => r.status === "pending")
    );
  }, [allMaterials, activeTab]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [resp, stats] = await Promise.all([
        getReportedMaterials({}),
        getModerationStats(),
      ]);
      setAllMaterials(resp.data);
      setThresholds(resp.thresholds);
      setModerationStats(stats);
    } catch (err: any) {
      setError(err.message || "Error al cargar los materiales reportados.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 4000);
    return () => clearTimeout(timer);
  }, [feedback]);

  const handleResolveSingleReport = async (reportId: string, action: "confirm" | "reject") => {
    if (!user?.id) return;
    setActioningId(reportId);
    setFeedback(null);
    try {
      await resolveReport(reportId, action, String(user.id));
      await loadData();
      setFeedback({
        tone: "success",
        text: action === "confirm" ? "Denuncia confirmada correctamente." : "Denuncia rechazada correctamente.",
      });
    } catch (err: any) {
      setFeedback({ tone: "error", text: err.message || "Error al procesar la denuncia." });
    } finally {
      setActioningId(null);
    }
  };

  const handleResolveAllReports = (material: Material, action: "confirm" | "reject") => {
    setBulkAction({ material, action });
  };

  const handleConfirmResolveAllReports = async () => {
    if (!bulkAction || !user?.id || !bulkAction.material.reports) return;

    const { material, action } = bulkAction;
    if (!user?.id || !material.reports) return;
    const pendingReports = material.reports.filter((r) => r.status === "pending");
    if (pendingReports.length === 0) {
      setBulkAction(null);
      return;
    }

    setIsLoading(true);
    setFeedback(null);
    try {
      await Promise.all(
        pendingReports.map((r) => resolveReport(String(r.id), action, String(user.id)))
      );
      await loadData();
      setFeedback({
        tone: "success",
        text:
          action === "confirm"
            ? "Denuncias confirmadas. Se aplicó la moderación del material."
            : "Denuncias desestimadas correctamente.",
      });
    } catch (err: any) {
      setFeedback({ tone: "error", text: err.message || "Error al procesar las denuncias." });
    } finally {
      setIsLoading(false);
      setBulkAction(null);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedMaterialId(expandedMaterialId === id ? null : id);
  };

  return (
    <>
    <div className="space-y-gutter">
      <PageHeader
        eyebrow="Moderación de Contenidos"
        title="Reportes de Materiales"
      />

      {/* Moderation stats collapsible */}
      <Card
        data-tour="moderation-stats"
        headerClassName="!px-0 !py-0"
        header={
          <button
            type="button"
            onClick={() => setShowStats(!showStats)}
            className="w-full flex items-center justify-between p-5 bg-surface-container-lowest hover:bg-surface-container transition-colors rounded-t-xl"
          >
            <span className="font-title-sm text-title-sm text-on-surface font-semibold">
              Estadísticas de moderación
            </span>
            <span className="material-symbols-outlined text-on-surface-variant">
              {showStats ? "expand_less" : "expand_more"}
            </span>
          </button>
        }
      >
        {showStats && moderationStats && (
          <div className="space-y-6">
            {/* Resolution rate */}
            <div className="space-y-2">
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Tasa de resolución
              </p>
              <div className="h-3 rounded-full bg-surface-container-high overflow-hidden">
                <div
                  className="h-full rounded-full bg-success transition-all"
                  style={{ width: `${Math.min(moderationStats.resolution_rate, 100)}%` }}
                />
              </div>
              <p className="font-title-sm text-title-sm text-on-surface font-bold tabular-nums">
                {moderationStats.resolution_rate.toFixed(1)}%
              </p>
            </div>

            {/* By reason */}
            <div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mb-2">Por motivo</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {moderationStats.by_reason.map((r: any) => (
                  <div key={r.reason_name} className="rounded-lg border border-outline-variant bg-surface-container-lowest p-3">
                    <p className="text-body-xs text-on-surface-variant truncate">{r.reason_name}</p>
                    <p className="font-title-sm text-title-sm font-bold text-on-surface tabular-nums">{r.count}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* By content type */}
            <div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mb-2">Por tipo de contenido</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {moderationStats.by_content_type.map((c: any) => (
                  <div key={c.content_type} className="rounded-lg border border-outline-variant bg-surface-container-lowest p-3">
                    <p className="text-body-xs text-on-surface-variant truncate">{c.content_type}</p>
                    <p className="font-title-sm text-title-sm font-bold text-on-surface tabular-nums">{c.count}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Report statistics row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter items-center">
        <div className="hidden sm:grid sm:grid-cols-3 gap-3">
          <Card bodyClassName="flex flex-col items-center justify-center p-3 text-center">
            <p className="text-2xl font-black text-error tabular-nums">{reportStats.pending}</p>
            <p className="text-body-xs text-on-surface-variant">Pendientes</p>
          </Card>
          <Card bodyClassName="flex flex-col items-center justify-center p-3 text-center">
            <p className="text-2xl font-black text-success tabular-nums">{reportStats.confirmed}</p>
            <p className="text-body-xs text-on-surface-variant">Confirmadas</p>
          </Card>
          <Card bodyClassName="flex flex-col items-center justify-center p-3 text-center">
            <p className="text-2xl font-black text-outline tabular-nums">{reportStats.rejected}</p>
            <p className="text-body-xs text-on-surface-variant">Rechazadas</p>
          </Card>
        </div>
        <DonutChart
          title="Distribución de denuncias"
          data={[
            { label: "Pendientes", value: reportStats.pending, color: "#dc2626" },
            { label: "Confirmadas", value: reportStats.confirmed, color: "#16a34a" },
            { label: "Rechazadas", value: reportStats.rejected, color: "#6b7280" },
          ]}
        />
      </div>

      {/* Tabs */}
      <div data-tour="moderation-tabs" className="flex border-b border-outline-variant">
        <button
          type="button"
          onClick={() => setActiveTab("pending")}
          className={`px-6 py-3 font-title-sm text-title-sm border-b-2 transition-colors ${
            activeTab === "pending"
              ? "border-primary text-primary font-semibold"
              : "border-transparent text-on-surface-variant hover:text-on-surface"
          }`}
        >
          Pendientes de revisión
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("resolved")}
          className={`px-6 py-3 font-title-sm text-title-sm border-b-2 transition-colors ${
            activeTab === "resolved"
              ? "border-primary text-primary font-semibold"
              : "border-transparent text-on-surface-variant hover:text-on-surface"
          }`}
        >
          Historial / Resueltos
        </button>
      </div>

      {feedback && (
        <Card
          bodyClassName={`text-body-sm flex items-center gap-3 ${
            feedback.tone === "error"
              ? "bg-error-container/30 text-on-error-container"
              : "bg-secondary-container/30 text-on-secondary-container"
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">
            {feedback.tone === "error" ? "error" : "check_circle"}
          </span>
          <span className="flex-1">{feedback.text}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="ml-auto p-1 hover:bg-black/10 rounded-full transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </Card>
      )}

      <div data-tour="moderation-list">
      {isLoading && materials.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-on-surface-variant text-body-md">Cargando reportes...</p>
        </div>
      ) : error ? (
        <div className="rounded-lg bg-error-container/30 border border-error/50 p-6 text-error flex gap-3 items-center">
          <span className="material-symbols-outlined text-3xl">error</span>
          <div>
            <p className="font-title-sm text-title-sm font-semibold">Error al cargar datos</p>
            <p className="text-body-sm">{error}</p>
          </div>
        </div>
      ) : materials.length === 0 ? (
        <EmptyState>
          {activeTab === "pending"
            ? "¡Excelente! No hay reportes pendientes de revisión."
            : "No hay registros en el historial de moderación."}
        </EmptyState>
      ) : (
        <div className="space-y-4">
          {materials.map((m) => {
            const isExpanded = expandedMaterialId === m.id;
            const pendingReports = m.reports?.filter((r) => r.status === "pending") ?? [];
            const isSuspended = m.status === "suspended";
            const reportsCount = activeTab === "pending" ? pendingReports.length : m.reports?.length ?? 0;
            
            return (
              <Card
                key={m.id}
                header={
                  <div className="flex flex-col gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-primary font-semibold text-xs tracking-wider uppercase">
                          {m.subjectName || "Materia no especificada"}
                        </span>
                        <Tag variant="info">{m.type.toUpperCase()}</Tag>
                        {isSuspended ? (
                          <Tag variant="danger">
                            <span className="material-symbols-outlined text-[12px] align-middle">block</span> Suspendido
                          </Tag>
                        ) : pendingReports.length >= thresholds.pending ? (
                          <Tag variant="warning">
                            <span className="material-symbols-outlined text-[12px] align-middle">warning</span> Auto-suspendido
                          </Tag>
                        ) : (
                          <Tag variant="positive">
                            <span className="material-symbols-outlined text-[12px] align-middle">check_circle</span> Activo
                          </Tag>
                        )}
                      </div>
                      <h3 className="font-title-md text-title-md text-on-surface font-bold">
                        {m.title}
                      </h3>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        Subido por <span className="font-semibold text-on-surface">{m.authorName || "Estudiante"}</span> · {new Date(m.uploadedAt).toLocaleDateString("es-AR")}
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-body-xs text-on-surface-variant">Total denuncias</span>
                        <p className="font-title-sm text-title-sm font-black text-error">
                          {reportsCount} {reportsCount === 1 ? "reporte" : "reportes"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleExpand(m.id)}
                        className="p-2 hover:bg-surface-container rounded-full text-on-surface-variant transition-colors"
                      >
                        <span className="material-symbols-outlined">
                          {isExpanded ? "expand_less" : "expand_more"}
                        </span>
                      </button>
                    </div>
                  </div>
                }
                footer={isExpanded ? (
                  <div className="flex flex-col gap-4">
                    {(activeTab === "pending" ? pendingReports : m.reports ?? []).map((r) => {
                      const isReportPending = r.status === "pending";
                      const isReportVerified = r.status === "verified";
                      return (
                        <div key={r.id} className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                          <div className="space-y-1 flex-1">
                            <div className="flex flex-col lg:flex-row lg:items-center lg:gap-2">
                              <span className="font-body-sm text-body-sm font-semibold text-on-surface">
                                {r.reporter ? `${r.reporter.name} ${r.reporter.lastname}` : "Usuario Anónimo"}
                              </span>
                              <span className="text-body-xs text-on-surface-variant">
                                {r.reporter?.email || "Sin email"}
                              </span>
                              <span className="text-body-xs text-on-surface-variant">
                                {new Date(r.createdAt || r.created_at).toLocaleDateString("es-AR")}
                              </span>
                            </div>
                            <p className="font-body-md text-body-md text-on-surface">
                              Motivo: <span className="font-semibold">{r.ReportReason?.name || "Sin motivo"}</span>
                            </p>
                            {r.ReportReason?.description && (
                              <p className="font-body-sm text-body-sm text-on-surface-variant italic">
                                "{r.ReportReason.description}"
                              </p>
                            )}
                          </div>

                          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2">
                            {isReportPending ? (
                              <>
                                <Button variant="secondary" disabled={actioningId === String(r.id)} onClick={() => handleResolveSingleReport(String(r.id), "reject")}>
                                  <span className="material-symbols-outlined text-[24px]">block</span>
                                  Rechazar
                                </Button>
                                <Button variant="danger" disabled={actioningId === String(r.id)} onClick={() => handleResolveSingleReport(String(r.id), "confirm")}>
                                  <span className="material-symbols-outlined text-[24px]">check_circle</span>
                                  Confirmar
                                </Button>
                              </>
                            ) : (
                              <StatusBadge
                                variant={isReportVerified ? "danger" : "neutral"}
                                label={isReportVerified ? "Confirmada" : "Rechazada"}
                                className="self-start"
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : undefined}
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap gap-1">
                    {m.tags.map((tag) => (
                      <Tag key={tag} variant="info">#{tag}</Tag>
                    ))}
                  </div>

                  <div className="flex items-center gap-3">
                    {isSuspended ? (
                      <span className="text-body-sm text-error font-medium italic">
                        Contenido bloqueado (material suspendido)
                      </span>
                    ) : m.fileUrl ? (
                      <a
                        href={m.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-body-sm text-primary hover:underline font-semibold"
                      >
                        <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                        Ver contenido original
                      </a>
                    ) : (
                      <span className="text-body-sm text-on-surface-variant italic">
                        Sin enlace disponible
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-4">
                  <h4 className="font-title-sm text-title-sm text-on-surface font-semibold">
                    Detalle de denuncias ({activeTab === "pending" ? "Pendientes" : "Todas"})
                  </h4>
                  {activeTab === "pending" && pendingReports.length > 0 && (
                    <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2 mt-2 lg:mt-0">
                      <Button variant="secondary" onClick={() => handleResolveAllReports(m, "reject")}>
                        <span className="material-symbols-outlined text-[24px]">close</span>
                        Desestimar
                      </Button>
                      <Button variant="danger" onClick={() => handleResolveAllReports(m, "confirm")}>
                        <span className="material-symbols-outlined text-[24px]">gavel</span>
                        Suspender
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
      </div>
    </div>

    <ProductTour tourId="admin-moderation" steps={moderationTourSteps} />

    <Modal
      isOpen={Boolean(bulkAction)}
      onClose={() => setBulkAction(null)}
      title={bulkAction?.action === "confirm" ? "Confirmar denuncias" : "Desestimar denuncias"}
      size="sm"
    >
      <div className="space-y-4">
        <p className="text-body-sm text-on-surface">
          {bulkAction?.action === "confirm"
            ? `Vas a confirmar todas las denuncias pendientes y moderar el material "${bulkAction?.material.title}".`
            : `Vas a desestimar todas las denuncias pendientes de "${bulkAction?.material.title}".`}
        </p>
        <p className="text-body-sm text-on-surface-variant">
          Denuncias pendientes: {bulkAction?.material.reports?.filter((r) => r.status === "pending").length ?? 0}
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setBulkAction(null)}>
            Cancelar
          </Button>
          <Button
            className={bulkAction?.action === "confirm" ? "bg-error text-on-error hover:bg-error/90" : ""}
            onClick={handleConfirmResolveAllReports}
          >
            {bulkAction?.action === "confirm" ? "Confirmar" : "Desestimar"}
          </Button>
        </div>
      </div>
    </Modal>
    </>
  );
}

export default AdminModerationPage;
