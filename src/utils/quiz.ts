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