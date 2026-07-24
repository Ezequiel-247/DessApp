interface Props {
  totalCredits: number;
}

export function PlannerFooter({ totalCredits }: Props) {
  return (
    <footer className="h-14 bg-surface border-t border-outline-variant px-margin flex items-center justify-end flex-shrink-0 sticky bottom-0 z-30">
      <div className="flex items-center gap-4 text-body-sm">
        <span className="text-on-surface-variant">
          Total Créditos: <strong className="text-primary">{totalCredits}</strong>
        </span>
      </div>
    </footer>
  );
}
