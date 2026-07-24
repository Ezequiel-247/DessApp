import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useNotifications } from "@/features/notifications/hooks/useNotifications";

vi.mock("@/app/AuthContext", () => ({
  useAuth: () => ({ user: { id: "10" } }),
}));

const getNotifications = vi.fn();
const getUnreadCount = vi.fn();
const markAsRead = vi.fn();
const markAllAsRead = vi.fn();

vi.mock("@/entities/Notification", () => ({
  getNotifications: (...args: any[]) => getNotifications(...args),
  getUnreadCount: (...args: any[]) => getUnreadCount(...args),
  markAsRead: (...args: any[]) => markAsRead(...args),
  markAllAsRead: (...args: any[]) => markAllAsRead(...args),
}));

describe("useNotifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("carga notificaciones y contador al montar", async () => {
    getNotifications.mockResolvedValue([
      {
        id: "1",
        userId: "10",
        type: "info",
        title: "A",
        message: "M",
        read: false,
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    ]);
    getUnreadCount.mockResolvedValue(1);

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(getNotifications).toHaveBeenCalledWith("10");
    expect(getUnreadCount).toHaveBeenCalledWith("10");
    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.unreadCount).toBe(1);
    expect(result.current.hasUnread).toBe(true);
  });

  it("marca una notificacion como leida", async () => {
    getNotifications.mockResolvedValue([
      {
        id: "1",
        userId: "10",
        type: "info",
        title: "A",
        message: "M",
        read: false,
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    ]);
    getUnreadCount.mockResolvedValue(1);
    markAsRead.mockResolvedValue({
      id: "1",
      userId: "10",
      type: "info",
      title: "A",
      message: "M",
      read: true,
      createdAt: "2026-01-01T00:00:00.000Z",
    });

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.markAsRead("1");
    });

    expect(markAsRead).toHaveBeenCalledWith("1");
    expect(result.current.unreadCount).toBe(0);
    expect(result.current.notifications[0].read).toBe(true);
  });

  it("marca todas como leidas", async () => {
    getNotifications.mockResolvedValue([
      {
        id: "1",
        userId: "10",
        type: "info",
        title: "A",
        message: "M",
        read: false,
        createdAt: "2026-01-01T00:00:00.000Z",
      },
      {
        id: "2",
        userId: "10",
        type: "warning",
        title: "B",
        message: "N",
        read: false,
        createdAt: "2026-01-01T00:01:00.000Z",
      },
    ]);
    getUnreadCount.mockResolvedValue(2);
    markAllAsRead.mockResolvedValue(2);

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.markAllAsRead();
    });

    expect(markAllAsRead).toHaveBeenCalledWith("10");
    expect(result.current.unreadCount).toBe(0);
    expect(result.current.notifications.every((item) => item.read)).toBe(true);
  });
});
