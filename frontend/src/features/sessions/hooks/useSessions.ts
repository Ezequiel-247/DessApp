import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/shared/api/apiClient';

export interface StudySessionHost {
  User: {
    id: number;
    name: string;
    lastname: string;
  };
}

export interface StudySessionSubject {
  id: number;
  name: string;
}

export interface StudySessionRegistration {
  id: number;
  study_session_id: number;
  student_id: number;
  status: 'pending' | 'approved' | 'rejected';
  student?: {
    User?: {
      id: number;
      name: string;
      lastname: string;
      email: string;
    };
  };
}

export interface StudySession {
  id: number;
  host_student_id: number;
  subject_id: number;
  title: string;
  description: string | null;
  type: 'virtual' | 'presencial';
  meeting_link: string | null;
  location: string | null;
  date_time: string;
  duration_hours: number;
  duration_minutes: number;
  max_slots: number | null;
  approval_required: boolean;
  status: 'abierta' | 'cancelada' | 'finalizada';
  host: StudySessionHost;
  subject: StudySessionSubject;
  registrations: StudySessionRegistration[];
}

export interface UseSessionsOptions {
  subjectId?: string;
  query?: string;
  type?: string;
}

export function useSessions(options?: UseSessionsOptions) {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (options?.subjectId) params.append('subject_id', options.subjectId);
      if (options?.query) params.append('query', options.query);
      if (options?.type) params.append('type', options.type);

      const queryString = params.toString();
      const url = `/api/study-sessions${queryString ? '?' + queryString : ''}`;
      const response = await apiClient.get(url);
      
      setSessions(Array.isArray(response) ? response : []);
    } catch (err: any) {
      console.error("Sessions error:", err);
      setError(err.message || "Error al cargar sesiones");
      setSessions([]);
    } finally {
      setIsLoading(false);
    }
  }, [options?.subjectId, options?.query, options?.type]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const createSession = async (data: Partial<StudySession>): Promise<void> => {
    try {
      await apiClient.post('/api/study-sessions', data);
      await fetchSessions();
    } catch (err: any) {
      throw new Error(err.response?.data?.error || err.message || "Error al crear la sesión");
    }
  };

  const joinSession = async (sessionId: string | number): Promise<void> => {
    try {
      await apiClient.post(`/api/study-sessions/${sessionId}/join`);
      await fetchSessions();
    } catch (err: any) {
      throw new Error(err.response?.data?.error || err.message || "Error al unirse a la sesión");
    }
  };

  const leaveSession = async (sessionId: string | number): Promise<void> => {
    try {
      await apiClient.post(`/api/study-sessions/${sessionId}/leave`);
      await fetchSessions();
    } catch (err: any) {
      throw new Error(err.response?.data?.error || err.message || "Error al abandonar la sesión");
    }
  };

  const cancelSession = async (sessionId: string | number): Promise<void> => {
    try {
      await apiClient.delete(`/api/study-sessions/${sessionId}/cancel`);
      await fetchSessions();
    } catch (err: any) {
      throw new Error(err.response?.data?.error || err.message || "Error al cancelar la sesión");
    }
  };

  const approveParticipant = async (sessionId: string | number, registrationId: number): Promise<void> => {
    try {
      await apiClient.patch(`/api/study-sessions/${sessionId}/registrations/${registrationId}/approve`);
      await fetchSessions();
    } catch (err: any) {
      throw new Error(err.response?.data?.error || err.message || "Error al aprobar participante");
    }
  };

  const rejectParticipant = async (sessionId: string | number, registrationId: number): Promise<void> => {
    try {
      await apiClient.patch(`/api/study-sessions/${sessionId}/registrations/${registrationId}/reject`);
      await fetchSessions();
    } catch (err: any) {
      throw new Error(err.response?.data?.error || err.message || "Error al rechazar participante");
    }
  };

  const removeParticipant = async (sessionId: string | number, registrationId: number): Promise<void> => {
    try {
      await apiClient.delete(`/api/study-sessions/${sessionId}/registrations/${registrationId}`);
      await fetchSessions();
    } catch (err: any) {
      throw new Error(err.response?.data?.error || err.message || "Error al eliminar participante");
    }
  };

  return {
    sessions,
    isLoading,
    error,
    createSession,
    joinSession,
    leaveSession,
    cancelSession,
    approveParticipant,
    rejectParticipant,
    removeParticipant,
    refetch: fetchSessions,
  };
}
