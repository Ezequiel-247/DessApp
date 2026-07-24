import { type ReactNode } from "react";

interface Props {
  isOpen: boolean;
  children: ReactNode;
}

export function CollapsibleContent({ isOpen, children }: Props) {
  return (
    <div
      className="grid transition-[grid-template-rows] duration-300 ease"
      style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
    >
      <div className="overflow-hidden min-h-0">
        {children}
      </div>
    </div>
  );
}
