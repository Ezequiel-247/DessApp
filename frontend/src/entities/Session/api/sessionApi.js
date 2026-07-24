/**
 * sessionApi - Llamadas a la API de autenticación usando apiClient
 */
// @ts-ignore
import { apiClient } from "@/shared/api/apiClient";

export async function login(credentials) {
  return apiClient.post('/api/auth/login', credentials);
}

export async function register(userData) {
  return apiClient.post('/api/auth/register', userData);
}

export async function getMe() {
  const res = await apiClient.get('/api/auth/me');
  return res?.data ?? res;
}
