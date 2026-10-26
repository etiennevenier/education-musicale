import type { OperaQuestion } from '../data/operaData';
import type { ResultMessages } from './quiz';

/** Une question à choix multiples a plusieurs bonnes réponses. */
export function isMulti(question: OperaQuestion): boolean {
  return question.correctAnswers.length > 1;
}

export function sameTrack(a: string | null, b: string | null): boolean {
  if (!a || !b) return false;
  return a.normalize('NFC') === b.normalize('NFC');
}

/** Vrai si la sélection correspond exactement à l'ensemble des bonnes réponses. */
export function isCorrectSelection(
  selected: ReadonlySet<string>,
  correct: ReadonlySet<string>,
): boolean {
  return selected.size === correct.size && [...selected].every((option) => correct.has(option));
}

/**
 * Messages de fin sur les 4 paliers standards (voir getResultTier dans quiz.ts) :
 * perfect = 100 %, great ≥ 80 %, ok ≥ 50 %, retry < 50 %.
 */
export const OPERA_RESULT_MESSAGES: ResultMessages = {
  perfect: {
    emoji: '🏆',
    text: "Sans faute ! Tu maîtrises l'opéra sur le bout des doigts.",
  },
  great: {
    emoji: '🌟',
    text: 'Excellent ! Ton oreille et ta culture lyrique sont déjà très solides.',
  },
  ok: {
    emoji: '👍',
    text: "Bien joué ! Encore quelques écoutes et tu vises le sans-faute : réécoute les extraits et repère bien la différence entre air et récitatif.",
  },
  retry: {
    emoji: '💪',
    text: 'Courage ! Relis les questions de théorie, puis réécoute les airs et les récitatifs.',
  },
};

export function formatNote(noteValue: number, total: number): string {
  if (!total) return '0';
  const note = Math.round((noteValue / total) * 20 * 2) / 2;
  return Number.isInteger(note) ? String(note) : note.toFixed(1).replace('.', ',');
}
