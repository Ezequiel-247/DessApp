const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

export function resolveMediaUrl(path?: string | null): string | null {
  if (!path) return null;

  const normalizedPath = path.trim();
  if (!normalizedPath) return null;

  if (
    /^(?:https?:)?\/\//i.test(normalizedPath) ||
    normalizedPath.startsWith('data:') ||
    normalizedPath.startsWith('blob:')
  ) {
    return normalizedPath;
  }

  if (normalizedPath.startsWith('/')) {
    return API_BASE_URL ? `${API_BASE_URL}${normalizedPath}` : normalizedPath;
  }

  return API_BASE_URL ? `${API_BASE_URL}/${normalizedPath}` : `/${normalizedPath}`;
}
