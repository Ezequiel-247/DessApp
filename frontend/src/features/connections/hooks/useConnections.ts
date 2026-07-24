import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/shared/api/apiClient';
import { useAuth } from '@/app/AuthContext';

export type ConnectionStatus = 'pending' | 'accepted' | 'rejected';

export interface Connection {
  id: string;
  userId: string;
  connectedUserId: string;
  userName: string;
  userEmail: string;
  userImage?: string;
  status: ConnectionStatus;
  createdAt: string;
  updatedAt: string;
}

interface InviteByEmailResult {
  invited: boolean;
  reason?: string;
  message?: string;
}

export function useConnections() {
  const { user } = useAuth();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConnections = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      // Build query params
      const params = new URLSearchParams();
      if (user.id) {
        params.append('userId', user.id);
      }

      const queryString = params.toString();
      const url = `/api/connections${queryString ? '?' + queryString : ''}`;
      const response = await apiClient.get(url);

      const rawConnections = Array.isArray(response?.data) ? response.data : [];
      const currentUserId = Number(user.id);

      // Transform API response to Connection interface
      const formattedConnections: Connection[] = rawConnections.map((conn: any) => ({
        id: conn.id?.toString() || `conn_${Math.random()}`,
        userId: conn.id_user?.toString() || user.id,
        connectedUserId:
          conn.connected_user?.id?.toString() ||
          (Number(conn.id_user) === currentUserId
            ? conn.id_connected_user?.toString()
            : conn.id_user?.toString()) ||
          '',
        userName: conn.connected_user?.full_name || 'Usuario',
        userEmail: conn.connected_user?.email || '',
        userImage: conn.connected_user?.profile_image || conn.connected_user?.avatar || undefined,
        status: conn.status || 'pending',
        createdAt: conn.createdAt || new Date().toISOString(),
        updatedAt: conn.updatedAt || new Date().toISOString(),
      }));

      setConnections(formattedConnections);
    } catch (err: any) {
      console.error("Connections error:", err);
      setError(err.message || "Error al cargar conexiones");
      setConnections([]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  const acceptConnection = async (connectionId: string): Promise<void> => {
    try {
      await apiClient.patch(`/api/connections/${connectionId}`, {
        status: 'accepted',
      });

      // Update local state
      setConnections((prev) =>
        prev.map((c) =>
          c.id === connectionId ? { ...c, status: 'accepted' } : c
        )
      );
    } catch (err: any) {
      throw new Error(err.message || "Error al aceptar conexión");
    }
  };

  const rejectConnection = async (connectionId: string): Promise<void> => {
    try {
      await apiClient.patch(`/api/connections/${connectionId}`, {
        status: 'rejected',
      });

      // Remove from local state
      setConnections((prev) => prev.filter((c) => c.id !== connectionId));
    } catch (err: any) {
      throw new Error(err.message || "Error al rechazar conexión");
    }
  };

  const removeConnection = async (connectionId: string): Promise<void> => {
    try {
      await apiClient.delete(`/api/connections/${connectionId}`);

      // Remove from local state
      setConnections((prev) => prev.filter((c) => c.id !== connectionId));
    } catch (err: any) {
      throw new Error(err.message || "Error al remover conexión");
    }
  };

  const inviteByEmail = async (email: string): Promise<InviteByEmailResult> => {
    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      throw new Error('Debes ingresar un email');
    }

    const response = await apiClient.post('/api/connections/invite', {
      email: normalizedEmail,
    });

    if (response?.invited) {
      await fetchConnections();
    }

    return {
      invited: Boolean(response?.invited),
      reason: response?.reason,
      message: response?.message,
    };
  };

  return {
    connections,
    isLoading,
    error,
    acceptConnection,
    rejectConnection,
    inviteByEmail,
    removeConnection,
    refetch: fetchConnections,
  };
}
