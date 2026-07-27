import { useCallback, useEffect, useState } from "react";
import Joyride, { ACTIONS, STATUS, type CallBackProps, type Step } from "react-joyride";
import { TourTooltip } from "./TourTooltip";

interface ProductTourProps {
  /** Identificador único de este recorrido (define su clave de "ya visto" en localStorage). */
  tourId: string;
  steps: Step[];
  /** Recién arranca el auto-play cuando esto es true — evita medir posiciones sobre datos aún cargando. */
  ready?: boolean;
}

function storageKey(tourId: string) {
  return `nexo_tour_seen_${tourId}`;
}

export function ProductTour({ tourId, steps, ready = true }: ProductTourProps) {
  const [run, setRun] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (localStorage.getItem(storageKey(tourId))) return;
    // Pequeño delay para que la sección termine de pintar antes de anclar los pasos.
    const timer = setTimeout(() => setRun(true), 500);
    return () => clearTimeout(timer);
  }, [tourId, ready]);

  const handleCallback = useCallback(
    (data: CallBackProps) => {
      const { status, action } = data;
      const finished =
        status === STATUS.FINISHED || status === STATUS.SKIPPED || action === ACTIONS.CLOSE;
      if (finished) {
        localStorage.setItem(storageKey(tourId), "1");
        setRun(false);
      }
    },
    [tourId]
  );

  return (
    <>
      <Joyride
        run={run}
        steps={steps}
        continuous
        showSkipButton
        scrollToFirstStep
        disableOverlayClose
        callback={handleCallback}
        tooltipComponent={TourTooltip}
        styles={{
          options: {
            zIndex: 10000,
            overlayColor: "rgba(11, 28, 48, 0.55)",
            primaryColor: "#0f4c5c",
          },
        }}
      />
      <button
        type="button"
        onClick={() => setRun(true)}
        aria-label="Repetir recorrido guiado de esta sección"
        title="Repetir recorrido guiado"
        className="fixed bottom-24 right-4 md:bottom-6 md:right-6 z-40 w-10 h-10 rounded-full bg-primary text-on-primary shadow-lg flex items-center justify-center hover:bg-primary-container transition-colors"
      >
        <span className="material-symbols-outlined text-[20px]">help</span>
      </button>
    </>
  );
}
