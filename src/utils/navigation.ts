/**
 * Génère une URL correcte en tenant compte du BASE_URL Astro
 */
export function relativeUrl(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
}

/** État du bouton de retour d'un outil d'entraînement. */
export type HubBackMode = 'hub' | 'level';

/**
 * Met à jour le bouton de retour d'un outil :
 * - `hub`   : « ← Retour à l'entraînement » (menu des niveaux) ;
 * - `level` : « ← Choix du niveau » (pendant le jeu ou sur le bilan).
 */
export function setHubBackMode(link: HTMLAnchorElement | null, mode: HubBackMode): void {
  if (!link) return;

  const longLabel = link.querySelector<HTMLElement>('.hub-back-text');
  const shortLabel = link.querySelector<HTMLElement>('.hub-back-text-short');

  if (longLabel) {
    longLabel.textContent = mode === 'hub' ? "Retour à l'entraînement" : 'Choix du niveau';
  }
  if (shortLabel) {
    shortLabel.textContent = mode === 'hub' ? 'Entraînement' : 'Niveaux';
  }

  link.dataset.backMode = mode;
  link.setAttribute(
    'aria-label',
    mode === 'hub' ? "Retour à l'entraînement" : 'Revenir au choix du niveau',
  );
}

/** Indique si le bouton de retour doit ramener au menu des niveaux. */
export function isHubBackInLevelMode(link: HTMLAnchorElement): boolean {
  return link.dataset.backMode === 'level';
}