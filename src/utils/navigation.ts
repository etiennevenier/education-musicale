/**
 * Génère une URL correcte en tenant compte du BASE_URL Astro
 */
export function relativeUrl(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
}