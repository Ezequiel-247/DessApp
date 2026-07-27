import { useEffect, useState, useCallback, useRef } from "react";
import { PageHeader } from "@/widgets/ui/PageHeader";
import {
  useMyProgress,
  YearAccordion,
  PendingFinalsSection,
  CreditBlockAccordion,
  useAccordion,
  AccordionKey,
  SkeletonLoader,
  CarouselContainer,
  DetailedProgressItem,
  SimplifiedProgressItem,
  TextStatItem,
} from "@/features/my-progress";
import { Dropdown } from "@/widgets/ui/Dropdown";
import { SegmentedControl } from "@/widgets/ui/SegmentedControl";
import { getStudent } from "@/entities/Student";
import { useAuth } from "@/app/AuthContext";
import { ProductTour, type TourStep } from "@/features/onboarding";

const myProgressTourSteps: TourStep[] = [
  {
    target: "body",
    placement: "center",
    title: "Mi Progreso Académico",
    content: "Acá seguís tu avance en la carrera con estadísticas detalladas. Te mostramos las secciones principales.",
  },
  {
    target: '[data-tour="progress-carousel"]',
    title: "Tu avance general",
    content: "Deslizá para alternar entre la vista detallada y la simplificada de tu porcentaje de avance.",
  },
  {
    target: '[data-tour="progress-viewmode"]',
    title: "Materias o actividades",
    content: "Cambiá entre ver el desglose por año de tus materias o las actividades con créditos.",
  },
  {
    target: '[data-tour="progress-accordions"]',
    title: "Desglose por año",
    content: "Expandí cada año para ver el detalle de tus materias y su estado.",
  },
  {
    target: '[data-tour="progress-finals"]',
    title: "Finales pendientes",
    content: "Acá tenés a mano los finales que todavía te quedan por rendir.",
  },
];

export function MyProgressPage() {
  const { user } = useAuth();
  useEffect(() => {
    document.title = "Mi Progreso";
  }, []);

  const [enrollmentOptions, setEnrollmentOptions] = useState<any[]>([]);
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState<string>("");

  useEffect(() => {
    if (!user) return;
    getStudent(user.id).then((student) => {
      const enrollments = (student.enrollments ?? []).filter((e: any) => e.studyPlanId != null);
      setEnrollmentOptions(enrollments);
      const saved = localStorage.getItem("selected_enrollment_id");
      if (saved && enrollments.some((e: any) => String(e.id) === saved)) {
        setSelectedEnrollmentId(saved);
      } else if (enrollments.length > 0) {
        setSelectedEnrollmentId(String(enrollments[0].id));
      }
    }).catch(() => setEnrollmentOptions([]));
  }, [user]);

  const handleEnrollmentChange = (id: string) => {
    setSelectedEnrollmentId(id);
    localStorage.setItem("selected_enrollment_id", id);
  };

  const { data, isLoading, error } = useMyProgress(selectedEnrollmentId);
  const { activeAccordion, toggleAccordion, setAccordion } = useAccordion();
  const [viewMode, setViewMode] = useState<"materias" | "actividades">("materias");

  const regularYears = (data?.years ?? []).filter((yr) => yr.year != null);
  const creditBlocks = (data?.years ?? [])
    .filter((yr) => yr.year == null)
    .flatMap((yr) => yr.subjects.filter((s) => s.is_block && s.block_type === "credit"));

  const findYearToOpen = useCallback((years: typeof regularYears): AccordionKey | null => {
    const inProgress = years.find((y) =>
      y.subjects.some((s) => s.classification === "regularizada" || s.classification === "en_curso")
    );
    if (inProgress) return { type: "year", id: inProgress.year };
    const pending = years.find((y) =>
      y.subjects.every((s) => s.classification !== "finalizada" && s.classification !== "equivalencia")
    );
    if (pending) return { type: "year", id: pending.year };
    if (years.length > 0) return { type: "year", id: years[0].year };
    return null;
  }, []);

  const findCreditToOpen = useCallback((blocks: typeof creditBlocks): AccordionKey | null => {
    const enCurso = blocks.find((b) =>
      (b.pool_activities ?? []).some((a) => a.classification === "en_curso")
    );
    if (enCurso) return { type: "credit", id: enCurso.name };
    const incomplete = blocks.find((b) =>
      (b.pool_activities ?? []).some((a) =>
        a.classification !== "finalizada" && a.classification !== "equivalencia"
      )
    );
    if (incomplete) return { type: "credit", id: incomplete.name };
    if (blocks.length > 0) return { type: "credit", id: blocks[0].name };
    return null;
  }, []);

  const handleViewModeChange = useCallback((mode: "materias" | "actividades") => {
    setViewMode(mode);
    const key = mode === "materias"
      ? findYearToOpen(regularYears)
      : findCreditToOpen(creditBlocks);
    setAccordion(key);
  }, [regularYears, creditBlocks, findYearToOpen, findCreditToOpen, setAccordion]);

  // Initial auto-select — runs once on data load
  const initialized = useRef(false);
  useEffect(() => {
    if (!data || initialized.current) return;
    initialized.current = true;
    const years = data.years.filter((yr) => yr.year != null);
    setAccordion(findYearToOpen(years));
  }, [data, setAccordion, findYearToOpen]);

  if (isLoading) {
    return <SkeletonLoader />;
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-error">{error || "No se pudo cargar el progreso"}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-gutter pb-24 md:pb-8">
      <PageHeader
        eyebrow="Estadísticas de carrera"
        title="Mi Progreso Académico"
        actions={
          enrollmentOptions.length > 1 && (
            <Dropdown
              label="Carrera"
              icon="school"
              value={selectedEnrollmentId}
              options={enrollmentOptions.map((e) => ({
                value: String(e.id),
                label: e.career?.name ?? "Sin nombre",
              }))}
              onChange={handleEnrollmentChange}
              hideAllOption
            />
          )
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-gutter">
        <div data-tour="progress-carousel" className="col-span-1 xl:col-span-2">
          <CarouselContainer
            storageKey="my-progress:carousel:progress"
            minHeight="160px"
            items={[
              { id: "detail", component: <DetailedProgressItem percent={data.progressPercent} mandatory={data.mandatory} unahur={data.unahur} elective={data.elective} credit={data.credit} /> },
              { id: "simplified", component: <SimplifiedProgressItem percent={data.progressPercent} completedUnits={data.completedUnits} totalUnits={data.totalUnits} accumulatedCredits={data.accumulatedCredits} totalCredits={data.totalCredits} /> },
            ]}
          />
        </div>
        <div className="col-span-1">
          <CarouselContainer
            storageKey="my-progress:carousel:year-average"
            minHeight="160px"
            items={[
              { id: "year", component: <TextStatItem title="Antigüedad" subtitle={data.currentAcademicYear} icon="calendar_month" /> },
              { id: "average", component: <TextStatItem title="Promedio General" subtitle={`Sin aplazo: ${data.average.toFixed(1)}`} secondarySubtitle={`Con aplazo: ${data.averageWithFailures.toFixed(1)}`} icon="star" /> },
            ]}
          />
        </div>
        <div className="col-span-1">
          <CarouselContainer
            storageKey="my-progress:carousel:efficiency-streak"
            minHeight="160px"
            items={[
              { id: "efficiency", component: <TextStatItem title="Efectividad" subtitle={`Tu efectividad histórica de cursada (con aplazos) es del ${data.efficiencyPercentage.toFixed(1)}%`} subtext={`${data.completedUnits} finalizadas de ${data.totalAttempted} cursadas`} icon="bolt" /> },
              { id: "streak", component: <TextStatItem title="Racha" subtitle={data.streakCount > 1 ? `${data.streakCount} cuatrimestres consecutivos sin materias reprobadas` : data.streakCount === 1 ? "1 cuatrimestre sin materias reprobadas" : "Buen momento para iniciar una nueva serie invicta. ¡A seguir adelante!"} icon="whatshot" /> },
            ]}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-gutter mt-3">
        <div className="xl:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-title-sm text-title-sm text-on-surface">
              {viewMode === "materias" ? "Desglose por año" : "Actividades con créditos"}
            </h3>
            <div data-tour="progress-viewmode">
              <SegmentedControl
                value={viewMode}
                onChange={handleViewModeChange}
                options={[
                  { value: "materias", label: "Ver materias" },
                  {
                    value: "actividades",
                    label: "Ver actividades",
                    disabled: creditBlocks.length === 0,
                    title: creditBlocks.length === 0 ? "No hay bloques de créditos disponibles" : undefined,
                  },
                ]}
              />
            </div>
          </div>

          {viewMode === "materias" ? (
            <div data-tour="progress-accordions" className="space-y-3">
              {regularYears.map((yr) => (
                <YearAccordion
                  key={yr.year}
                  year={yr}
                  isOpen={activeAccordion?.type === "year" && activeAccordion.id === yr.year}
                  onToggle={() => toggleAccordion({ type: "year", id: yr.year })}
                />
              ))}
            </div>
          ) : creditBlocks.length > 0 && (
            <div className="space-y-3">
              {creditBlocks.map((block) => (
                <CreditBlockAccordion
                  key={block.name}
                  block={block}
                  isOpen={activeAccordion?.type === "credit" && activeAccordion.id === block.name}
                  onToggle={() => toggleAccordion({ type: "credit", id: block.name })}
                />
              ))}
            </div>
          )}
        </div>
        <div data-tour="progress-finals" className="xl:col-span-4 space-y-gutter">
          <PendingFinalsSection finals={data.pendingFinals} />
        </div>
      </div>

      <ProductTour tourId="my-progress" steps={myProgressTourSteps} />
    </div>
  );
}
