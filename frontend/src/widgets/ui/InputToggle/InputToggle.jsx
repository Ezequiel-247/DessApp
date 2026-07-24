import { Toggle } from "@/widgets/ui/Toggle";

export function InputToggle({ label, error, required, className = '', ...props }) {
  return (
    <div className={`flex flex-col gap-xs  ${className}`}>
      {label && (
        <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
          {label}
          {required && <span className="text-error ml-0.5">*</span>}
        </label>
      )}
      <Toggle className="" {...props}/>
      {error && (
        <span className="text-sm text-error">{error}</span>
      )}
    </div>
  );
}
