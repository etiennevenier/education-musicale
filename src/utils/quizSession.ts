import { renderNextButton, renderProgress, scheduleAutoNext, showQuizResult } from './quizUi';
import type { ProgressEls } from './quizUi';
import type { QuizUnit } from './quizConfig';

export interface QuizSessionOptions {
  unit: QuizUnit;
  progress: ProgressEls;
  nextBtn: HTMLButtonElement;
  feedback: HTMLElement;
  result: {
    hide: HTMLElement[];
    container: HTMLElement;
    restartId: string;
  };
  /** Éléments de jeu ré-affichés au (re)démarrage. */
  game: HTMLElement[];
  /** Rend la question d'index donné (DOM propre au quiz). `autoplay` est vrai après « suivant ». */
  renderQuestion: (index: number, autoplay: boolean) => void;
  onRestart: () => void;
  /** Remplace l'écran de fin standard (quiz à résultat personnalisé). */
  showResult?: (score: number, total: number) => void;
  /** Faux si le quiz n'affiche pas de panneau de feedback (ex. blind test). */
  feedbackOnAnswer?: boolean;
  /** Remplace le rendu progression + bouton suivant (ex. multi-sélection avec bouton Valider). */
  render?: (state: { index: number; total: number; score: number; answered: boolean }) => void;
}

/**
 * Moteur de quiz générique : état (index, score, répondu), progression,
 * bouton suivant, enchaînement automatique et écran de fin partagés.
 * Chaque quiz ne conserve que le rendu et la validation de ses questions.
 */
export class QuizSession {
  private index = 0;
  private score = 0;
  private answered = false;
  private total = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly options: QuizSessionOptions) {}

  get currentIndex(): number {
    return this.index;
  }

  get isAnswered(): boolean {
    return this.answered;
  }

  /** Démarre/redémarre la partie avec le nombre total de questions. */
  start(total: number, autoplayFirst = false): void {
    this.clearTimer();
    this.index = 0;
    this.score = 0;
    this.answered = false;
    this.total = total;

    this.options.result.container.classList.add('hidden');
    this.options.result.container.replaceChildren();
    this.options.game.forEach((el) => el.classList.remove('hidden'));
    this.load(autoplayFirst);
  }

  /** Affiche la question courante. */
  load(autoplay: boolean): void {
    this.clearTimer();
    this.answered = false;
    this.options.feedback.textContent = '';
    this.options.feedback.className = 'feedback-msg hidden';
    this.render();
    this.options.renderQuestion(this.index, autoplay);
  }

  /** Met à jour la progression et le bouton suivant. */
  render(): void {
    if (this.options.render) {
      this.options.render({
        index: this.index,
        total: this.total,
        score: this.score,
        answered: this.answered,
      });
      return;
    }
    renderProgress(this.options.progress, {
      unit: this.options.unit,
      index: this.index,
      total: this.total,
      score: this.score,
      answered: this.answered,
    });
    renderNextButton(this.options.nextBtn, {
      unit: this.options.unit,
      isLast: this.index >= this.total - 1,
      answered: this.answered,
    });
  }

  /** Enregistre la réponse ; enchaîne automatiquement si elle est bonne. */
  answer(correct: boolean, feedbackText: string): void {
    if (this.answered) return;
    this.answered = true;

    if (this.options.feedbackOnAnswer !== false) {
      this.options.feedback.textContent = feedbackText;
      this.options.feedback.className = `feedback-msg ${correct ? 'success' : 'error'}`;
    }

    if (correct) {
      this.score += 1;
      this.timer = scheduleAutoNext(() => this.next(), feedbackText || '');
    }

    this.render();
  }

  /** Passe à la question suivante ou termine la partie. */
  next(): void {
    this.clearTimer();
    if (this.index >= this.total - 1) {
      this.finish();
    } else {
      this.index += 1;
      this.load(true);
    }
  }

  /** Affiche l'écran de fin standard ou personnalisé. */
  finish(): void {
    this.clearTimer();
    if (this.options.showResult) {
      this.options.showResult(this.score, this.total);
      return;
    }
    showQuizResult({
      hide: this.options.result.hide,
      feedback: this.options.feedback,
      container: this.options.result.container,
      score: this.score,
      total: this.total,
      restartId: this.options.result.restartId,
      onRestart: this.options.onRestart,
    });
  }

  private clearTimer(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
