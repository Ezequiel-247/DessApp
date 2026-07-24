import { useEffect } from 'react';

const SIZE_CLASSES = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export function Modal({
  isOpen = false,
  onClose,
  header = null,
  title = '',
  children,
  footer = null,
  size = 'md',
  className = '',
  hideCloseButton = false,
  headerBg = 'bg-surface-bright',
  mobileFullScreen = false,
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const resolvedHeader = header ?? (title || null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-inverse-surface/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className={`
        relative z-10 w-full ${mobileFullScreen ? 'h-full sm:h-auto' : ''} ${SIZE_CLASSES[size] || SIZE_CLASSES.md} ${mobileFullScreen ? 'sm:mx-4' : 'mx-4'}
        ${mobileFullScreen ? 'border-0 sm:border' : 'border'} border-outline-variant ${mobileFullScreen ? 'rounded-none sm:rounded-xl' : 'rounded-xl'}
        shadow-[0_4px_20px_rgba(15,76,92,0.08)]
        animate-in fade-in zoom-in-95 duration-200
        flex flex-col ${mobileFullScreen ? 'max-h-full sm:max-h-[90vh]' : 'max-h-[90vh]'}
        ${className}
      `}>
        {(resolvedHeader || !hideCloseButton) && (
          <div className={`p-5 border-b border-slate-100  ${headerBg} ${mobileFullScreen ? 'sm:rounded-t-xl' : 'rounded-t-xl'} flex-shrink-0`}>
            <div className="flex items-center gap-2">
              {resolvedHeader && (
                <div className="flex-1 min-w-0">
                  {typeof resolvedHeader === 'string' ? (
                    <h2 className="text-title-sm font-semibold text-on-surface">{resolvedHeader}</h2>
                  ) : (
                    resolvedHeader
                  )}
                </div>
              )}
              {!resolvedHeader && <div className="flex-1" />}
              {!hideCloseButton && (
                <button
                  onClick={onClose}
                  className="p-2 text-outline hover:text-on-surface transition-colors rounded-full hover:bg-surface-container flex-shrink-0"
                >
                  <span className="material-symbols-outlined text-[24px]">close</span>
                </button>
              )}
            </div>
          </div>
        )}

        <div className={`
          p-5 bg-white overflow-y-auto flex-1 min-h-0
          ${!(resolvedHeader || !hideCloseButton) ? (mobileFullScreen ? 'sm:rounded-t-xl' : 'rounded-t-xl') : ''}
          ${!footer ? (mobileFullScreen ? 'sm:rounded-b-xl' : 'rounded-b-xl') : ''}
        `}>
          {children}
        </div>

        {footer && (
          <div className={`p-5 border-t border-slate-100  bg-white ${mobileFullScreen ? 'sm:rounded-b-xl' : 'rounded-b-xl'} flex-shrink-0 flex flex-col-reverse gap-3 xl:flex-row [&>*]:contents`}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
