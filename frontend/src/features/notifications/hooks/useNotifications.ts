import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getNotifications,
  getUnreadCount,
  markAllAsRead as markAllAsReadApi,
  markAsRead as markAsReadApi,
  type Notification,
} from "@/entities/Notification";
import { useAuth } from "@/app/AuthContext";

export function useNotifications() {
  const { user } = useAuth();
  const userId = user?.id ? String(user.id) : "";

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!userId) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [list, unread] = await Promise.all([
        getNotifications(userId),
        getUnreadCount(userId),
      ]);

      const sorted = [...list].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      setNotifications(sorted);
      setUnreadCount(unread);
    } catch (err: any) {
      setError(err?.message || "No se pudieron cargar las notificaciones");
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // No hay polling ni websocket: createNotification() dispara este evento apenas se
  // crea una notificación (guardar plan, cargar nota, importar Excel) para que la
  // campanita se refresque sin esperar a que el usuario recargue la página.
  useEffect(() => {
    const handleNotificationsUpdated = () => fetchNotifications();
    window.addEventListener("notifications:updated", handleNotificationsUpdated);
    return () => window.removeEventListener("notifications:updated", handleNotificationsUpdated);
  }, [fetchNotifications]);

  const markAsRead = useCallback(async (id: string) => {
    if (!userId) return;

    try {
      const updated = await markAsReadApi(id);
      setNotifications((current) =>
        current.map((item) => (item.id === id ? updated : item)),
      );
      setUnreadCount((current) => Math.max(0, current - 1));
    } catch (err: any) {
      setError(err?.message || "No se pudo marcar la notificacion como leida");
    }
  }, [userId]);

  const markAllAsRead = useCallback(async () => {
    if (!userId) return;

    try {
      const updated = await markAllAsReadApi(userId);
      setNotifications((current) => current.map((item) => ({ ...item, read: true })));
      setUnreadCount((current) => Math.max(0, current - updated));
    } catch (err: any) {
      setError(err?.message || "No se pudieron marcar las notificaciones como leidas");
    }
  }, [userId]);

  const hasUnread = useMemo(() => unreadCount > 0, [unreadCount]);

  return {
    notifications,
    unreadCount,
    hasUnread,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
  };
}
