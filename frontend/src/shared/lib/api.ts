const DEFAULT_API_URL = "http://localhost:3001";

const backendApiUrl = import.meta.env.BACKEND_API_URL ?? DEFAULT_API_URL;

export const API_BASE_URL = backendApiUrl.replace(/\/$/, "");

export function apiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}