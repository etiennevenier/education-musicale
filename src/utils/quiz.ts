import { QUIZ_LABELS } from './quizConfig';
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
export interface ResultMessage {
  emoji: string;
  text: string;
}
export type ResultMessages = Record<QuizResultTier, ResultMessage>;

/** Message de fin correspondant à la note, parmi les messages propres au quiz. */
export function getResultMessage(
  note: number,
  total: number,
  messages: ResultMessages,
): ResultMessage {
  return messages[getResultTier(note, total)];
}

export interface ResultHtmlOptions {
  emoji: string;
  text: string;
  score: number;
  total: number;
  restartId: string;
  title?: string;
  restartLabel?: string;
}

/** HTML de l'écran de fin (chaînes statiques de confiance uniquement). */
export function buildResultHtml({
  emoji,
  text,
  score,
  total,
  restartId,
  title = QUIZ_LABELS.resultTitle,
  restartLabel = QUIZ_LABELS.restart,
}: ResultHtmlOptions): string {
  return `
    <div class="result-emoji">${emoji}</div>
    <p class="result-title">${title}</p>
    <p class="result-score"><span class="result-note">${score}</span> / ${total}</p>
    <p class="result-text">${text}</p>
    <button type="button" id="${restartId}" class="btn-restart">${restartLabel}</button>
  `;
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