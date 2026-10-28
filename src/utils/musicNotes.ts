/**
 * Données et utilitaires de notation musicale partagés par les outils
 * d'entraînement (identification clavier, oreille).
 *
 * Les noms sont en français et utilisent les symboles ♯ / ♭.
 */

export type NoteSpelling = 'natural' | 'sharp' | 'flat' | 'mixed';

export interface PianoKey {
  /** Numéro MIDI de la note (Do4 = 60). */
  midi: number;
  /** Nom affiché, ex. « Do », « Ré♭ ». */
  name: string;
  /** Nom lisible par un lecteur d'écran, ex. « Do dièse ». */
  spokenName: string;
  type: 'white' | 'black';
  /** Touches noires : nombre de touches blanches situées à leur gauche. */
  whiteOffset: number;
}

const NATURAL_NAMES: Record<number, string> = {
  0: 'Do',
  2: 'Ré',
  4: 'Mi',
  5: 'Fa',
  7: 'Sol',
  9: 'La',
  11: 'Si',
};

const SHARP_NAMES = [
  'Do', 'Do♯', 'Ré', 'Ré♯', 'Mi', 'Fa', 'Fa♯', 'Sol', 'Sol♯', 'La', 'La♯', 'Si',
] as const;

const FLAT_NAMES = [
  'Do', 'Ré♭', 'Ré', 'Mi♭', 'Mi', 'Fa', 'Sol♭', 'Sol', 'La♭', 'La', 'Si♭', 'Si',
] as const;

/** Graphies mélangées : une seule graphie par touche, dièses et bémols cohabitent. */
const MIXED_NAMES = [
  'Do', 'Do♯', 'Ré', 'Mi♭', 'Mi', 'Fa', 'Fa♯', 'Sol', 'Sol♯', 'La', 'Si♭', 'Si',
] as const;

const BLACK_PITCH_CLASSES = new Set([1, 3, 6, 8, 10]);

/** Classe de hauteur (0 = Do … 11 = Si), quel que soit l'octave. */
function pitchClass(midi: number): number {
  return ((midi % 12) + 12) % 12;
}

/** Indique si la note MIDI correspond à une touche noire du piano. */
export function isBlackKey(midi: number): boolean {
  return BLACK_PITCH_CLASSES.has(pitchClass(midi));
}

/** Nom français de la note, selon la graphie demandée. */
export function noteName(midi: number, spelling: NoteSpelling = 'mixed'): string {
  const pc = pitchClass(midi);

  if (spelling === 'natural') {
    return NATURAL_NAMES[pc] ?? MIXED_NAMES[pc] ?? 'Do';
  }
  if (spelling === 'sharp') return SHARP_NAMES[pc] ?? 'Do';
  if (spelling === 'flat') return FLAT_NAMES[pc] ?? 'Do';
  return MIXED_NAMES[pc] ?? 'Do';
}

/** Transforme « Do♯ » en « Do dièse » pour les lecteurs d'écran. */
export function spokenNoteName(name: string): string {
  return name.replace(/♯/g, ' dièse').replace(/♭/g, ' bémol').trim();
}

/** Fréquence en hertz d'une note MIDI (La4 = 440 Hz). */
export function midiToFrequency(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}

export interface KeyboardOptions {
  includeBlackKeys?: boolean;
  spelling?: NoteSpelling;
}

/**
 * Construit les touches d'un clavier entre deux notes MIDI incluses.
 * Les touches noires connaissent le nombre de touches blanches à leur gauche,
 * ce qui permet de les positionner en CSS.
 */
export function buildKeyboard(
  fromMidi: number,
  toMidi: number,
  options: KeyboardOptions = {},
): PianoKey[] {
  const { includeBlackKeys = true, spelling = 'mixed' } = options;
  const lowest = Math.min(fromMidi, toMidi);
  const highest = Math.max(fromMidi, toMidi);
  const keys: PianoKey[] = [];
  let whiteCount = 0;

  for (let midi = lowest; midi <= highest; midi += 1) {
    const black = isBlackKey(midi);
    if (black && !includeBlackKeys) continue;

    const name = noteName(midi, spelling);
    keys.push({
      midi,
      name,
      spokenName: spokenNoteName(name),
      type: black ? 'black' : 'white',
      whiteOffset: whiteCount,
    });

    if (!black) whiteCount += 1;
  }

  return keys;
}
