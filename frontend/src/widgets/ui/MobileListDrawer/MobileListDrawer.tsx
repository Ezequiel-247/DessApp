import type { ReactNode } from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  headerButtons?: ReactNode;
  children: ReactNode;
}

export function MobileListDrawer({ isOpen, onClose, title, headerButtons, children }: Props) {
  return (
    <div className={`fixed inset-0 z-[70] xl:hidden ${isOpen ? "" : "pointer-events-none"}`}>
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />
      <div
        className={`absolute left-0 top-0 bottom-0 w-full xl:w-80 xl:max-w-[85vw] bg-surface-bright shadow-xl transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-5 border-b border-outline-variant">
          <h2 className="font-title-sm text-title-sm text-on-surface">{title}</h2>
          <div className="flex items-center gap-1">
            {headerButtons}
            <button
              type="button"
              onClick={onClose}
              className="p-1 hover:bg-surface-container rounded-full transition-colors"
            >
              <span className="material-symbols-outlined text-[24px]">close</span>
            </button>
          </div>
        </div>
        <div className="overflow-y-auto h-[calc(100%-65px)]">
          {children}
        </div>
      </div>
    </div>
  );
}
