import { useState, useCallback } from "react";

type ConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "primary";
  onConfirm: () => void | Promise<void>;
};

export function useConfirm() {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const open = useCallback((opts: ConfirmOptions) => {
    setOptions(opts);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setIsLoading(false);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!options) return;
    setIsLoading(true);
    try {
      await options.onConfirm();
      close();
    } catch (err) {
      setIsLoading(false);
      throw err;
    }
  }, [options, close]);

  return {
    isOpen,
    options,
    isLoading,
    open,
    close,
    handleConfirm,
  };
}
