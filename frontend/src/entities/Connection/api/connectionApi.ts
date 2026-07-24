import type { Connection } from "../model/connection";
import { apiUrl } from "../../../shared/lib/api";
import { apiClient } from "@/shared/api/apiClient";

export interface InviteByEmailResponse {
  invited: boolean;
  reason?: string;
  message?: string;
  data?: Connection;
}

export interface InvitationDetailsResponse {
  data: {
    id: string;
    status: string;
    target_email: string;
    inviter: {
      id: string;
      name: string;
      lastname: string;
      email: string;
      avatar?: string | null;
    };
    invitee: {
      id: string;
      name: string;
      lastname: string;
      email: string;
      avatar?: string | null;
    };
  };
}

export async function getConnections(userId: string): Promise<Connection[]> {
  return fetch(apiUrl(`/api/connections?userId=${userId}`)).then((res) => res.json());
}

export async function createConnection(
  connectedUserId: string
): Promise<Connection> {
  return fetch(apiUrl("/api/connections"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ connectedUserId }),
  }).then((res) => res.json());
}

export async function updateConnectionStatus(
  id: string,
  status: string
): Promise<Connection> {
  return fetch(apiUrl(`/api/connections/${id}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  }).then((res) => res.json());
}

export async function inviteConnectionByEmail(email: string): Promise<InviteByEmailResponse> {
  return apiClient.post('/api/connections/invite', { email });
}

export async function getInvitationByToken(token: string): Promise<InvitationDetailsResponse> {
  return apiClient.get(`/api/connections/invitation/${token}`);
}

export async function respondInvitation(
  token: string,
  action: 'accept' | 'reject'
): Promise<{ message: string }> {
  return apiClient.post(`/api/connections/invitation/${token}/respond`, { action });
}
