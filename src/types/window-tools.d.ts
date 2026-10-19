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
    /** Outil « Lecture Rythmique » (src/components/entrainement/LectureRythmique.astro) */
    RhythmTool?: {
      /** Coupe l'exercice en cours et la réécoute audio. */
      stop(): void;
    };
    /** Outil « Dessiner les clefs » (src/components/entrainement/DessinerClefs.astro) */
    ClefsTool?: {
      /** Coupe l'animation en cours. */
      stop(): void;
      /** Redessine l'étape courante à l'ouverture de l'outil. */
      onShow(): void;
    };
  }
}
