/**
 * Détection des pistes audio encore accessibles à l'écran.
 *
 * Lors d'un changement d'onglet, le lecteur qui disparaît ne doit pas couper
 * la lecture si l'onglet qui s'affiche propose déjà le même fichier : le son
 * se poursuit alors de façon fluide d'un onglet à l'autre.
 */
export function isTrackExposedInVisiblePanel(url: string): boolean {
  if (typeof document === 'undefined') return false;

  const target = url.normalize('NFC');

  return Array.from(
    document.querySelectorAll<HTMLElement>('.main-panel:not([hidden]) [data-audio-url]'),
  ).some((entry) => {
    const entryUrl = entry.dataset.audioUrl;
    return !!entryUrl && entryUrl.normalize('NFC') === target;
  });
}
