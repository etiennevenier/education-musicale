import {
  buildResultHtml,
  getAutoNextDelay,
  getResultMessage,
  type QuizResultTier,
  type ResultMessages,
} from './quiz';
import {
  QUIZ_EMOJIS,
  QUIZ_LABELS,
  QUIZ_UNITS,
  formatProgress,
  formatScore,
  type QuizUnit,
} from './quizConfig';

/** Associe les emoji communs aux textes propres à un quiz. */
export function makeResultMessages(texts: Record<QuizResultTier, string>): ResultMessages {
  return {
    perfect: { emoji: QUIZ_EMOJIS.perfect, text: texts.perfect },
    great: { emoji: QUIZ_EMOJIS.great, text: texts.great },
    ok: { emoji: QUIZ_EMOJIS.ok, text: texts.ok },
    retry: { emoji: QUIZ_EMOJIS.retry, text: texts.retry },
  };
}

export interface ProgressEls {
  progressLabel: HTMLElement;
  scoreLabel: HTMLElement;
  progressFill: HTMLElement;
}

export interface ProgressState {
  unit: QuizUnit;
  index: number;
  total: number;
  score: number;
  answered: boolean;
}

/** Libellé de progression, score « X / N » et barre (avance une fois la réponse donnée). */
export function renderProgress(els: ProgressEls, s: ProgressState): void {
  els.progressLabel.textContent = formatProgress(s.unit, s.index, s.total);
  els.scoreLabel.textContent = formatScore(s.score, s.total);
  const done = s.index + (s.answered ? 1 : 0);
  els.progressFill.style.width = `${s.total ? (done / s.total) * 100 : 0}%`;
}

export function renderNextButton(
  btn: HTMLButtonElement,
  s: { unit: QuizUnit; isLast: boolean; answered: boolean },
): void {
  btn.textContent = s.isLast ? QUIZ_LABELS.finish : QUIZ_UNITS[s.unit].next;
  btn.disabled = !s.answered;
}

/** Suite automatique après une bonne réponse : délai proportionnel au feedback affiché. */
export function scheduleAutoNext(callback: () => void, feedbackText: string) {
  return setTimeout(callback, getAutoNextDelay(feedbackText));
}

export interface ShowResultOptions {
  /** Éléments de l'écran de jeu à masquer. */
  hide: HTMLElement[];
  feedback: HTMLElement;
  container: HTMLElement;
  score: number;
  total: number;
  messages: ResultMessages;
  restartId: string;
  onRestart: () => void;
}

/** Écran de bilan standard : emoji, « Partie terminée ! », « X / N », texte, « 🔄 Rejouer ». */
export function showQuizResult(o: ShowResultOptions): void {
  const { emoji, text } = getResultMessage(o.score, o.total, o.messages);
  o.hide.forEach((el) => el.classList.add('hidden'));
  o.feedback.textContent = '';
  o.feedback.className = 'feedback-msg hidden';
  o.container.innerHTML = buildResultHtml({
    emoji,
    text,
    score: o.score,
    total: o.total,
    restartId: o.restartId,
  });
  o.container.classList.remove('hidden');
  document.getElementById(o.restartId)?.addEventListener('click', o.onRestart);
}
