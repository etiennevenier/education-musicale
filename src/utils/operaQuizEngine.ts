import type { OperaQuestion } from '../data/operaData';

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

export function formatNote(noteValue: number, total: number): string {
  if (!total) return '0';
  const note = Math.round((noteValue / total) * 20 * 2) / 2;
  return Number.isInteger(note) ? String(note) : note.toFixed(1).replace('.', ',');
}
