import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Header } from "@/widgets/layout/Header/Header";

vi.mock("@/app/AuthContext", () => ({
  useAuth: () => ({
    user: {
      id: "10",
      name: "Ada",
      avatar: null,
    },
  }),
}));

const markAsRead = vi.fn();
const markAllAsRead = vi.fn();

vi.mock("@/features/notifications/hooks/useNotifications", () => ({
  useNotifications: () => ({
    notifications: [
      {
        id: "n1",
        userId: "10",
        type: "info",
        title: "Recordatorio",
        message: "Sesion manana",
        read: false,
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    ],
    unreadCount: 1,
    hasUnread: true,
    isLoading: false,
    error: null,
    markAsRead,
    markAllAsRead,
  }),
}));

describe("Header notifications", () => {
  it("abre dropdown y permite marcar acciones", () => {
    render(<Header />);

    const bellButton = screen.getByLabelText("Abrir notificaciones");
    expect(screen.queryByText("Notificaciones")).not.toBeInTheDocument();

    fireEvent.click(bellButton);

    expect(screen.getByText("Notificaciones")).toBeInTheDocument();
    expect(screen.getByText("Recordatorio")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Marcar todas leidas"));
    expect(markAllAsRead).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText("Recordatorio"));
    expect(markAsRead).toHaveBeenCalledWith("n1");
  });
});
