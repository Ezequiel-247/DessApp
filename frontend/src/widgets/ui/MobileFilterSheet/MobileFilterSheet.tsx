import type { ReactNode } from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function MobileFilterSheet({ isOpen, onClose, title, children }: Props) {
  return (
    <div className={`fixed inset-0 z-[80] xl:hidden ${isOpen ? "" : "pointer-events-none"}`}>
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />
      <div
        className={`absolute bottom-0 left-0 right-0 bg-surface-bright rounded-t-xl shadow-xl transition-transform duration-300 max-h-[85vh] flex flex-col ${
          isOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="sticky top-0 bg-surface-bright z-10 flex items-center justify-between p-5 border-b border-outline-variant rounded-t-xl">
          <h2 className="font-title-sm text-title-sm text-on-surface">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-surface-container rounded-full transition-colors"
          >
            <span className="material-symbols-outlined text-[24px]">close</span>
          </button>
        </div>
        <div className="overflow-y-auto p-5">
          {children}
        </div>
      </div>
    </div>
  );
}
