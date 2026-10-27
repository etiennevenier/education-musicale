export type QuizResultTier = 'perfect' | 'great' | 'ok' | 'retry';

/**
 * Calcule le palier de résultat selon la note et le total de questions :
 * - ratio = 1 (ou note >= total > 0) -> 'perfect'
 * - ratio >= 0.8 -> 'great'
 * - ratio >= 0.5 -> 'ok'
 * - sinon -> 'retry'
 */
export function getResultTier(note: number, total: number): QuizResultTier {
  if (total <= 0) return 'retry';
  const ratio = note / total;
  if (ratio >= 1) return 'perfect';
  if (ratio >= 0.8) return 'great';
  if (ratio >= 0.5) return 'ok';
  return 'retry';
}

/** Délai minimum commun avant l'enchaînement automatique (ms). */
export const AUTO_NEXT_MIN_MS = 1200;
const AUTO_NEXT_MAX_MS = 6000;
const AUTO_NEXT_MS_PER_CHAR = 50;

/**
 * Délai avant la question suivante : proportionnel à la longueur du texte
 * affiché (temps de lecture), entre le minimum commun et un plafond.
 */
export function getAutoNextDelay(text: string): number {
  return Math.min(
    AUTO_NEXT_MAX_MS,
    Math.max(AUTO_NEXT_MIN_MS, text.length * AUTO_NEXT_MS_PER_CHAR),
  );
}
