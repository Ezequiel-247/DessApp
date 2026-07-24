import type { Notification } from "../model/notification";
import { apiClient } from "@/shared/api/apiClient";

function normalizeNotification(raw: any): Notification {
  const rawTargetType = raw?.targetType ?? raw?.target_type;
  const normalizedTargetType = typeof rawTargetType === 'string'
    ? rawTargetType.trim().toLowerCase()
    : null;

  const rawTargetId = raw?.targetId ?? raw?.target_id;
  const hasTargetId = rawTargetId !== null && rawTargetId !== undefined && String(rawTargetId).trim() !== '';
  const parsedTargetId = hasTargetId ? Number(rawTargetId) : null;

  return {
    id: String(raw.id),
    userId: String(raw.userId ?? raw.id_user),
    type: raw.type,
    title: raw.title,
    message: raw.message,
    targetType: normalizedTargetType,
    targetId: parsedTargetId === null || Number.isNaN(parsedTargetId) ? null : parsedTargetId,
    read: Boolean(raw.read),
    createdAt: raw.createdAt ?? raw.created_at ?? new Date().toISOString(),
  };
}

export async function getNotifications(userId: string): Promise<Notification[]> {
  const response = await apiClient.get(`/api/notifications?userId=${userId}`);
  const list = Array.isArray(response?.data) ? response.data : [];
  return list.map(normalizeNotification);
}

export async function markAsRead(id: string): Promise<Notification> {
  const response = await apiClient.patch(`/api/notifications/${id}`, { read: true });
  return normalizeNotification(response?.data ?? response);
}

export async function markAllAsRead(userId: string): Promise<number> {
  const response = await apiClient.post("/api/notifications/mark-all-read", { userId });
  return Number(response?.data?.updated ?? 0);
}

export async function getUnreadCount(userId: string): Promise<number> {
  const response = await apiClient.get(`/api/notifications/unread-count?userId=${userId}`);
  return Number(response?.data?.count ?? 0);
}

// Notificación "cliente a cliente": se dispara desde el frontend justo después de una
// acción exitosa (guardar plan, cargar nota, importar Excel), en vez de acoplar este
// aviso al backend — así el importador de Excel puede mandar UN resumen al terminar,
// en vez de una notificación por cada fila procesada.
export async function createNotification(data: {
  userId: string;
  type: string;
  title: string;
  message: string;
}): Promise<Notification> {
  const response = await apiClient.post("/api/notifications", {
    id_user: data.userId,
    type: data.type,
    title: data.title,
    message: data.message,
  });
  // El dropdown de la campanita solo carga notificaciones al montar (sin polling) —
  // este evento le avisa que hay una nueva para que se refresque sin recargar la página.
  window.dispatchEvent(new CustomEvent("notifications:updated"));
  return normalizeNotification(response?.data ?? response);
}
