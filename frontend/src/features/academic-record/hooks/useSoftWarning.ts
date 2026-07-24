import { useState, useCallback } from "react";

export interface SoftWarningConfig {
  title: string;
  message: string;
  storageKey: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

export function useSoftWarning() {
  const [config, setConfig] = useState<SoftWarningConfig | null>(null);

  const showWarning = useCallback((cfg: SoftWarningConfig) => {
    if (localStorage.getItem(cfg.storageKey)) {
      cfg.onConfirm();
      return;
    }
    setConfig(cfg);
  }, []);

  const confirmWarning = useCallback(
    (dontShowAgain: boolean) => {
      if (!config) return;
      if (dontShowAgain) {
        localStorage.setItem(config.storageKey, "true");
      }
      config.onConfirm();
      setConfig(null);
    },
    [config]
  );

  const cancelWarning = useCallback(() => {
    if (!config) return;
    config.onCancel?.();
    setConfig(null);
  }, [config]);

  return {
    warning: config,
    isWarningOpen: config !== null,
    showWarning,
    confirmWarning,
    cancelWarning,
  };
}
