// Façade de chargement différé des vidéos YouTube.
// Aucun iframe n'est présent dans le DOM au chargement : un <button data-video-facade>
// affiche la vignette ; au clic (ou Entrée/Espace via le <button> natif), l'iframe
// youtube-nocookie est créé à la place. Un seul script (celui-ci) en délégation
// d'événement, pour tout le site.

const NCOOKIE_ORIGIN = 'https://www.youtube-nocookie.com';
let preconnected = false;

function ensurePreconnect(): void {
  if (preconnected) return;
  preconnected = true;
  const link = document.createElement('link');
  link.rel = 'preconnect';
  link.href = NCOOKIE_ORIGIN;
  link.crossOrigin = 'anonymous';
  document.head.appendChild(link);
}

function createIframe(facade: HTMLElement): HTMLIFrameElement {
  const id = facade.dataset.videoId;
  const title = facade.dataset.videoTitle || 'Vidéo';
  const iframe = document.createElement('iframe');
  iframe.src = `${NCOOKIE_ORIGIN}/embed/${id}?autoplay=1&rel=0`;
  iframe.title = title;
  iframe.allow = 'autoplay; encrypted-media; picture-in-picture';
  iframe.setAttribute('allowfullscreen', '');
  iframe.referrerPolicy = 'strict-origin-when-cross-origin';
  iframe.className = 'video-facade-iframe';
  if (facade.dataset.iframeId) iframe.id = facade.dataset.iframeId;
  return iframe;
}

function activate(facade: HTMLElement): void {
  if (!facade.dataset.videoId) return;
  ensurePreconnect();
  const iframe = createIframe(facade);
  facade.replaceWith(iframe);
  iframe.focus();
  document.dispatchEvent(new CustomEvent('videofacade:activated', { detail: { iframe } }));
}

export function initVideoFacades(root: Document | HTMLElement = document): void {
  // Clic (Entrée/Espace déclenchent nativement click sur un <button>).
  root.addEventListener('click', (event) => {
    const target = event.target as HTMLElement | null;
    const facade = target?.closest?.('[data-video-facade]');
    if (facade) activate(facade as HTMLElement);
  });

  // preconnect au premier survol / focus d'une façade.
  root.addEventListener('pointerover', (event) => {
    const target = event.target as HTMLElement | null;
    if (target?.closest?.('[data-video-facade]')) ensurePreconnect();
  });
  root.addEventListener('focusin', (event) => {
    const target = event.target as HTMLElement | null;
    if (target?.closest?.('[data-video-facade]')) ensurePreconnect();
  });

  // Vignette indisponible (vidéo supprimée / identifiant inconnu) : on la masque,
  // la façade garde son fond sombre et sa pastille de lecture.
  root.addEventListener('error', (event) => {
    const target = event.target as HTMLElement | null;
    if (target && target.tagName === 'IMG' && target.closest('.video-facade')) {
      target.style.visibility = 'hidden';
    }
  }, true);
}
