/**
 * Déclarations globales pour `window`.
 * Seul le constructeur Web Audio préfixé (anciennes versions de Safari) est déclaré ici.
 */
export {};

declare global {
  interface Window {
    /** Safari (anciennes versions) : constructeur Web Audio préfixé, utilisé en repli. */
    webkitAudioContext?: typeof AudioContext;
  }
}