/**
 * API exposées sur `window` par les outils d'entraînement.
 * Chaque outil est désormais affiché sur sa propre page, mais ces méthodes
 * restent disponibles pour arrêter proprement audio et animations.
 */
export {};

declare global {
  interface Window {
    /** Safari (anciennes versions) : constructeur Web Audio préfixé, utilisé en repli. */
    webkitAudioContext?: typeof AudioContext;
  }
}