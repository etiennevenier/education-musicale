import { getAutoNextDelay, getResultTier } from './quiz';
import {
  QUIZ_EMOJIS,
  QUIZ_LABELS,
  QUIZ_UNITS,
  formatProgress,
  formatScore,
  type QuizUnit,
} from './quizConfig';

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
  /** Panneau de feedback à vider (absent si le quiz n'en a pas). */
  feedback?: HTMLElement;
  container: HTMLElement;
  score: number;
  total: number;
  restartId: string;
  onRestart: () => void;
}

/** Écran de bilan standard : emoji, « Partie terminée ! », « X / N », « 🔄 Rejouer ». */
export function showQuizResult(o: ShowResultOptions): void {
  o.hide.forEach((el) => el.classList.add('hidden'));
  if (o.feedback) {
    o.feedback.textContent = '';
    o.feedback.className = 'feedback-msg hidden';
  }

  // Même structure que l'ancien gabarit HTML : div.result-emoji, p.result-title,
  // p.result-score > span.result-note, button.btn-restart (id = restartId).
  const emoji = document.createElement('div');
  emoji.className = 'result-emoji';
  emoji.textContent = QUIZ_EMOJIS[getResultTier(o.score, o.total)];

  const title = document.createElement('p');
  title.className = 'result-title';
  title.textContent = QUIZ_LABELS.resultTitle;

  const scoreLine = document.createElement('p');
  scoreLine.className = 'result-score';
  const note = document.createElement('span');
  note.className = 'result-note';
  note.textContent = String(o.score);
  scoreLine.append(note, ` / ${o.total}`);

  const restart = document.createElement('button');
  restart.type = 'button';
  restart.id = o.restartId;
  restart.className = 'btn-restart';
  restart.textContent = QUIZ_LABELS.restart;
  restart.addEventListener('click', o.onRestart);

  o.container.replaceChildren(emoji, title, scoreLine, restart);
  o.container.classList.remove('hidden');
}
