/**
 * Card - Contenedor con header, body y footer
 * Stitch Design System - Academic Precision
 */
export function Card({
  header = null,
  headerVariant = 'surface-bright',
  footer = null,
  title = '',
  subtitle = '',
  children,
  className = '',
  footerClassName = '',
  bodyClassName = '',
  headerClassName = '',
  ...props
}) {
  const resolvedHeader = header ?? (title || subtitle ? (
    <div>
      {title && <h3 className="text-lg font-semibold text-on-surface">{title}</h3>}
      {subtitle && <p className="text-sm text-on-surface-variant mt-0.5">{subtitle}</p>}
    </div>
  ) : null);

  const hasHeader = resolvedHeader !== null;
  const hasFooter = footer !== null;

  const headerBg = headerVariant === 'white' ? 'bg-white' : 'bg-surface-bright';

  return (
    <div className={`
      border border-outline-variant rounded-xl shadow-sm
      ${className}
    `} {...props}>
      {hasHeader && (
        <div className={`p-5 border-b border-slate-100  ${headerBg} rounded-t-xl ${headerClassName}`}>
          {resolvedHeader}
        </div>
      )}
      
      <div className={`
        p-5 bg-white
        ${!hasHeader ? 'rounded-t-xl' : ''}
        ${!hasFooter ? 'rounded-b-xl' : ''}
        ${bodyClassName}
      `}>
        {children}
      </div>
      {hasFooter && (
        <div className={`p-5 border-t border-slate-100 bg-white rounded-b-xl ${footerClassName}`}>
          {footer}
        </div>
      )}
    </div>
  );
}