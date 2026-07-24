/**
 * Header - Barra superior con búsqueda
 * Stitch Design System - Academic Precision
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/app/AuthContext";
import { resolveMediaUrl } from "@/shared/lib/resolveMediaUrl";
import { useNotifications } from "@/features/notifications/hooks/useNotifications";

function getRelativeTimeLabel(dateString) {
  const timestamp = new Date(dateString).getTime();
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));

  if (diffMinutes < 60) return `hace ${diffMinutes} min`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `hace ${diffHours} h`;

  const diffDays = Math.floor(diffHours / 24);
  return `hace ${diffDays} d`;
}

function getTypeIcon(type) {
  if (type === "success") return "task_alt";
  if (type === "warning") return "warning";
  if (type === "error") return "error";
  return "notifications";
}

export function Header() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    notifications,
    unreadCount,
    hasUnread,
    isLoading,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef(null);

  const latestNotifications = useMemo(() => notifications.slice(0, 10), [notifications]);

  const handleNotificationClick = async (item) => {
    if (!item.read) {
      await markAsRead(item.id);
    }

    const parsedTargetId = Number(item.targetId);
    const hasValidPostTarget = item.targetType === 'post' && Number.isFinite(parsedTargetId) && parsedTargetId > 0;

    if (hasValidPostTarget) {
      navigate(`/student/novelties?post=${parsedTargetId}`);
    } else if (item.type === 'content_vote' || item.type === 'post_comment') {
      navigate('/student/novelties');
    }

    setIsOpen(false);
  };

  useEffect(() => {
    if (!isOpen) return;

    const onClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const onEscape = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEscape);

    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, [isOpen]);

  return (
    <header className="bg-white/95 backdrop-blur-md font-sans antialiased text-sm border-b border-slate-200 shadow-sm flex justify-between items-center w-full px-8 h-16 sticky top-0 z-40">
      <div className="flex items-center gap-6" />

      <div className="flex items-center gap-sm relative" ref={panelRef}>
        <button
          type="button"
          className="w-10 h-10 flex items-center justify-center rounded-full text-outline hover:bg-surface-container-low transition-colors duration-200 relative"
          onClick={() => setIsOpen((current) => !current)}
          aria-label="Abrir notificaciones"
        >
          <span className="material-symbols-outlined">notifications</span>
          {hasUnread && (
            <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-error text-white text-[10px] font-semibold leading-4 text-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {isOpen && (
          <div className="absolute right-0 top-12 w-[22rem] max-w-[92vw] rounded-xl border border-outline-variant bg-surface-bright shadow-xl overflow-hidden z-50">
            <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant">
              <div>
                <p className="font-semibold text-on-surface">Notificaciones</p>
                <p className="text-xs text-on-surface-variant">{unreadCount} sin leer</p>
              </div>
              <button
                type="button"
                className="text-xs font-semibold text-primary hover:underline disabled:opacity-40"
                onClick={markAllAsRead}
                disabled={!hasUnread}
              >
                Marcar todas leidas
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {isLoading && (
                <div className="px-4 py-6 text-sm text-on-surface-variant text-center">Cargando notificaciones...</div>
              )}

              {!isLoading && latestNotifications.length === 0 && (
                <div className="px-4 py-6 text-sm text-on-surface-variant text-center">No tenes notificaciones por ahora.</div>
              )}

              {!isLoading && latestNotifications.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNotificationClick(item)}
                  className={`w-full text-left px-4 py-3 border-b border-outline-variant/60 hover:bg-surface-container-low transition-colors ${item.read ? "opacity-80" : "bg-primary/5"}`}
                >
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-on-surface-variant">{getTypeIcon(item.type)}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-on-surface truncate">{item.title}</p>
                      <p className="text-xs text-on-surface-variant mt-0.5">{item.message}</p>
                      <p className="text-[11px] text-outline mt-1">{getRelativeTimeLabel(item.createdAt)}</p>
                    </div>
                    {!item.read && <span className="w-2 h-2 rounded-full bg-primary mt-1" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="ml-sm w-9 h-9 rounded-full overflow-hidden border border-outline-variant cursor-pointer">
          {user?.avatar ? (
            <img
              src={resolveMediaUrl(user.avatar) || undefined}
              alt={user.name || "Avatar"}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-surface-container flex items-center justify-center">
              <span className="material-symbols-outlined text-on-surface-variant">person</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}