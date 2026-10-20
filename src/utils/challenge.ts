/**
 * Module « Score & Chrono » commun aux trois nouveaux outils d'entraînement.
 *
 * Un challenge se termine :
 * - quand les 10 réponses ont été données ;
 * - ou quand le chronomètre de 1 minute atteint 0:00.
 *
 * Le module ne touche pas au DOM : il notifie l'interface via des callbacks,
 * ce qui permet de le réutiliser dans n'importe quel outil.
 */

/** Nombre de réponses attendues pour terminer un challenge. */
export const CHALLENGE_QUESTION_COUNT = 10;

/** Durée maximale d'un challenge (1 minute). */
export const CHALLENGE_DURATION_MS = 60_000;

/** Fréquence de rafraîchissement de l'affichage du chrono. */
const TICK_MS = 200;

export type ChallengeEndReason = 'complete' | 'timeout';

export interface ChallengeResult {
  score: number;
  total: number;
  percent: number;
  elapsedMs: number;
  /** Temps écoulé réel, format « m:ss » (ex. « 0:24 »). */
  elapsedLabel: string;
  reason: ChallengeEndReason;
}

export interface ChallengeTick {
  remainingMs: number;
  elapsedMs: number;
  score: number;
  answered: number;
}

export interface ChallengeHandlers {
  onTick?: (tick: ChallengeTick) => void;
  onEnd?: (result: ChallengeResult) => void;
}

/** Formate une durée en « m:ss » (ex. 24 300 ms → « 0:24 »). */
export function formatClock(ms: number): string {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Formate un temps restant en compte à rebours « m:ss ».
 * On arrondit au supérieur pour afficher « 1:00 » au démarrage.
 */
export function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export class ChallengeSession {
  private readonly handlers: ChallengeHandlers;
  private startedAt = 0;
  private timeoutId: number | null = null;
  private intervalId: number | null = null;
  private running = false;
  private scoreValue = 0;
  private answeredValue = 0;

  constructor(handlers: ChallengeHandlers = {}) {
    this.handlers = handlers;
  }

  get isRunning(): boolean {
    return this.running;
  }

  get score(): number {
    return this.scoreValue;
  }

  get answered(): number {
    return this.answeredValue;
  }

  /** Démarre le chronomètre et la session (remet le score à zéro). */
  start(): void {
    this.cancel();
    this.startedAt = Date.now();
    this.scoreValue = 0;
    this.answeredValue = 0;
    this.running = true;

    this.emitTick();
    this.timeoutId = window.setTimeout(() => this.finish('timeout'), CHALLENGE_DURATION_MS);
    this.intervalId = window.setInterval(() => {
      this.emitTick();
      if (this.elapsedMs() >= CHALLENGE_DURATION_MS) this.finish('timeout');
    }, TICK_MS);
  }

  /**
   * Enregistre une réponse. Renvoie true si le challenge continue,
   * false s'il vient de se terminer (10 réponses atteintes).
   */
  recordAnswer(isCorrect: boolean): boolean {
    if (!this.running) return false;

    this.answeredValue += 1;
    if (isCorrect) this.scoreValue += 1;

    if (this.answeredValue >= CHALLENGE_QUESTION_COUNT) {
      this.finish('complete');
      return false;
    }

    this.emitTick();
    return true;
  }

  /** Arrête la session sans afficher de bilan (retour au menu, page quittée). */
  cancel(): void {
    this.clearTimers();
    this.running = false;
  }

  private elapsedMs(): number {
    return Math.max(0, Date.now() - this.startedAt);
  }

  private emitTick(): void {
    if (!this.handlers.onTick) return;
    const elapsedMs = Math.min(this.elapsedMs(), CHALLENGE_DURATION_MS);
    this.handlers.onTick({
      elapsedMs,
      remainingMs: Math.max(0, CHALLENGE_DURATION_MS - elapsedMs),
      score: this.scoreValue,
      answered: this.answeredValue,
    });
  }

  private finish(reason: ChallengeEndReason): void {
    if (!this.running) return;

    const elapsedMs = Math.min(this.elapsedMs(), CHALLENGE_DURATION_MS);
    this.clearTimers();
    this.running = false;

    const total = CHALLENGE_QUESTION_COUNT;
    this.handlers.onEnd?.({
      score: this.scoreValue,
      total,
      percent: Math.round((this.scoreValue / total) * 100),
      elapsedMs,
      elapsedLabel: formatClock(elapsedMs),
      reason,
    });
  }

  private clearTimers(): void {
    if (this.timeoutId !== null) {
      window.clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
