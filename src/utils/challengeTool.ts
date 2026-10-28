/**
 * Briques communes aux outils « challenge » (ClavierNotes, OreilleClavier, OreilleNom).
 * Remplace les copies de pickTarget / pickMidi / showResult.
 */
import { shuffle } from './random';
import { CHALLENGE_QUESTION_COUNT, type ChallengeResult } from './challenge';

export interface TargetBag<T> {
  /** Tire la cible suivante : sac mélangé, jamais deux fois la même d'affilée. */
  next(): T;
  reset(): void;
}

export function createTargetBag<T>(items: readonly T[]): TargetBag<T> {
  let bag: T[] = [];
  let last: T | undefined;

  return {
    next(): T {
      if (bag.length === 0) {
        bag = shuffle(items);
        const first = bag[0];
        const second = bag[1];
        if (bag.length > 1 && first === last && first !== undefined && second !== undefined) {
          bag[0] = second;
          bag[1] = first;
        }
      }
      const value = bag.shift();
      if (value === undefined) {
        const fallback = items[0];
        if (fallback === undefined) throw new Error('Aucune cible disponible');
        return fallback;
      }
      last = value;
      return value;
    },
    reset(): void {
      bag = [];
      last = undefined;
    },
  };
}

export interface ResultTargets {
  score: HTMLElement;
  percent: HTMLElement;
  time: HTMLElement;
  reason: HTMLElement;
}

export const CHALLENGE_REASON_LABELS = {
  timeout: '⏱ Temps écoulé !',
  complete: '🏁 Les ' + CHALLENGE_QUESTION_COUNT + ' questions sont terminées.',
} as const;

/** Remplit l'écran « Défi terminé ! » (score, réussite, temps, motif). */
export function renderChallengeResult(targets: ResultTargets, result: ChallengeResult): void {
  targets.score.textContent = result.score + ' / ' + result.total;
  targets.percent.textContent = result.percent + ' %';
  targets.time.textContent = result.elapsedLabel;
  targets.reason.textContent = CHALLENGE_REASON_LABELS[result.reason];
}
