/**
 * apiClient - Cliente centralizado para peticiones a la API
 * Nexo - Professional API Connection
 */

const BASE_URL = import.meta.env.VITE_API_URL || '';

/**
 * Wrapper de fetch para manejar headers, auth y errores de forma centralizada
 */
async function apiFetch(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
  
  const token = localStorage.getItem('desapp_token');
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  
  const headers = {
    ...options.headers,
  };

  if (!isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.errors?.join('; ') || errorData.details || errorData.message || errorData.error || `Error: ${response.status} ${response.statusText}`;

    // En login/register, 401 representa credenciales inválidas y debe propagarse como error.
    const isPublicAuthEndpoint = endpoint === '/api/auth/login' || endpoint === '/api/auth/register';

    // En endpoints protegidos, 401 invalida sesión y redirige a login.
    if (response.status === 401 && token && !isPublicAuthEndpoint) {
      localStorage.removeItem('desapp_token');
      localStorage.removeItem('desapp_user');
      window.location.assign('/login');
      // allow execution to fall through and throw the error
    }

    const error = new Error(errorMessage);
    error.code = errorData.code;
    error.status = response.status;
    throw error;
  }

  // Si no hay contenido (204 No Content), devolver null
  if (response.status === 204) return null;

  return response.json();
}

export const apiClient = {
  get: (endpoint, options) => apiFetch(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options) => apiFetch(endpoint, { ...options, method: 'POST', body: body instanceof FormData ? body : JSON.stringify(body) }),
  put: (endpoint, body, options) => apiFetch(endpoint, { ...options, method: 'PUT', body: body instanceof FormData ? body : JSON.stringify(body) }),
  delete: (endpoint, options) => apiFetch(endpoint, { ...options, method: 'DELETE' }),
  patch: (endpoint, body, options) => apiFetch(endpoint, { ...options, method: 'PATCH', body: body instanceof FormData ? body : JSON.stringify(body) }),
};
