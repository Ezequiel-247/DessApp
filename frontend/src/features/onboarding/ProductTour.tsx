import { useCallback, useEffect, useState } from "react";
import Joyride, { ACTIONS, EVENTS, STATUS, type CallBackProps, type Step } from "react-joyride";
import { TourTooltip } from "./TourTooltip";

interface ProductTourProps {
  /** Identificador único de este recorrido (define su clave de "ya visto" en localStorage). */
  tourId: string;
  steps: Step[];
  /** Recién arranca el auto-play cuando esto es true — evita medir posiciones sobre datos aún cargando. */
  ready?: boolean;
  /**
   * Se dispara al terminar cada paso, con el índice del paso al que se está por pasar (adelante o atrás).
   * Útil para hacer side-effects como cambiar de pestaña ANTES de que el tour busque el elemento a
   * resaltar del próximo paso (si el target no existe en el DOM en ese momento, react-joyride aborta
   * el tour entero en vez de saltear el paso — por eso este hook no puede ir en STEP_BEFORE).
   */
  onStepChange?: (index: number) => void;
  /**
   * Ponelo en `true` para cortar el tour en seco (ej. un modal se abrió por encima de la página).
   * Sin esto, si uno de los pasos resalta un botón que abre un modal, y el usuario clickea ese botón
   * en vez de "Siguiente", el tour de la página sigue corriendo por detrás del modal — los pasos que
   * le quedan apuntan a elementos ahora tapados, y si el modal tiene su propio tour, terminan los dos
   * corriendo al mismo tiempo.
   */
  forceStop?: boolean;
}

function storageKey(tourId: string) {
  return `nexo_tour_seen_${tourId}`;
}

export function ProductTour({ tourId, steps, ready = true, onStepChange, forceStop = false }: ProductTourProps) {
  const [run, setRun] = useState(false);

  useEffect(() => {
    if (forceStop && run) {
      localStorage.setItem(storageKey(tourId), "1");
      setRun(false);
    }
  }, [forceStop, run, tourId]);
  // Tour "controlado": react-joyride no avanza el paso por su cuenta, nosotros le pasamos
  // el índice. Así, cuando un paso necesita un side-effect (ej. cambiar de pestaña) antes de
  // que busque el target, ese cambio ya está commiteado en el DOM cuando React vuelve a
  // renderizar con el stepIndex nuevo — evita la carrera de "target_not_found" que daba
  // avanzar el índice en el mismo tick sincrónico del click.
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (!ready) return;
    if (localStorage.getItem(storageKey(tourId))) return;
    // Pequeño delay para que la sección termine de pintar antes de anclar los pasos.
    const timer = setTimeout(() => {
      setStepIndex(0);
      setRun(true);
    }, 500);
    return () => clearTimeout(timer);
  }, [tourId, ready]);

  const handleCallback = useCallback(
    (data: CallBackProps) => {
      const { status, action, type, index } = data;
      const finished =
        status === STATUS.FINISHED || status === STATUS.SKIPPED || action === ACTIONS.CLOSE;
      if (finished) {
        localStorage.setItem(storageKey(tourId), "1");
        setRun(false);
        setStepIndex(0);
        return;
      }
      if (type === EVENTS.STEP_AFTER) {
        const nextIndex = action === ACTIONS.PREV ? index - 1 : index + 1;
        onStepChange?.(nextIndex);
        setStepIndex(nextIndex);
      }
    },
    [tourId, onStepChange]
  );

  return (
    <>
      <Joyride
        run={run}
        stepIndex={stepIndex}
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
        onClick={() => {
          setStepIndex(0);
          setRun(true);
        }}
        aria-label="Repetir recorrido guiado de esta sección"
        title="Repetir recorrido guiado"
        className="fixed bottom-24 right-4 md:bottom-6 md:right-6 z-[70] w-10 h-10 rounded-full bg-primary text-on-primary shadow-lg flex items-center justify-center hover:bg-primary-container transition-colors"
      >
        <span className="material-symbols-outlined text-[20px]">help</span>
      </button>
    </>
  );
}
