import type { QuizResultTier } from './quiz';

/** Emoji de bilan : identiques pour tous les quiz (seul le texte varie). */
export const QUIZ_EMOJIS: Record<QuizResultTier, string> = {
  perfect: '🏆',
  great: '🌟',
  ok: '👍',
  retry: '💪',
};

export const QUIZ_LABELS = {
  finish: '🏁 Voir mon score',
  restart: '🔄 Rejouer',
  resultTitle: 'Partie terminée !',
} as const;

/** Unité affichée dans la progression et le bouton « suivant ». */
export const QUIZ_UNITS = {
  question: { noun: 'Question', next: 'Question suivante ➔' },
  video: { noun: 'Vidéo', next: 'Vidéo suivante ➔' },
  extrait: { noun: 'Extrait', next: 'Extrait suivant ➔' },
  manche: { noun: 'Manche', next: 'Manche suivante ➔' },
} as const;

export type QuizUnit = keyof typeof QUIZ_UNITS;

export const formatScore = (score: number, total: number): string => `Score : ${score} / ${total}`;

export const formatProgress = (unit: QuizUnit, index: number, total: number): string =>
  `${QUIZ_UNITS[unit].noun} ${index + 1} / ${total}`;
