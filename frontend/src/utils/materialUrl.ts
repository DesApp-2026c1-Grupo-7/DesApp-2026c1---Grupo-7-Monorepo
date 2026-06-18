const DEFAULT_API_URL = 'http://localhost:5000/api';

export function resolveMaterialUrl(
  rawUrl: string | null | undefined,
  type: string,
  apiUrl = import.meta.env.VITE_API_URL || DEFAULT_API_URL,
): string | null {
  const url = rawUrl?.trim();
  if (!url) return null;

  if (type !== 'archivo' || /^https?:\/\//i.test(url)) {
    return url;
  }

  const backendBaseUrl = apiUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');
  return `${backendBaseUrl}/${url.replace(/^\//, '')}`;
}
