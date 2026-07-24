import { useState } from "react";

export function usePlannerSetup() {
  const [setupOpen, setSetupOpen] = useState(false);
  const [hours, setHours] = useState(20);

  const adjustHours = (delta: number) => {
    setHours((prev) => Math.max(10, Math.min(60, prev + delta)));
  };

  const openSetup = () => {
    setHours(20);
    setSetupOpen(true);
  };

  const closeSetup = () => setSetupOpen(false);

  const cancelSetup = () => {
    setSetupOpen(false);
  };

  const confirmSetup = (onConfirmed: () => void) => {
    closeSetup();
    onConfirmed();
  };

  return { setupOpen, hours, adjustHours, openSetup, closeSetup, cancelSetup, confirmSetup };
}
