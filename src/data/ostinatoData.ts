/**
 * Données du quiz « L'Ostinato » (séquence 5ème « Musique et Répétition »).
 *
 * Les fichiers MP3 sont dans /public/ostinato. Les noms sont conservés à
 * l'identique (majuscules comprises) pour retrouver les fichiers :
 * - « Extrait 6/7/8 … Fois » prend une majuscule ;
 * - les noms de fichiers n'ont volontairement aucun accent (« Melodique »),
 *   pour éviter les différences d'encodage entre macOS et le serveur Linux.
 */

export type OstinatoPart = 'type' | 'repetitions' | 'superposes';

interface OstinatoQuestionBase {
  id: string;
  part: OstinatoPart;
  audioUrl: string;
  prompt: string;
}

export interface OstinatoChoiceQuestion extends OstinatoQuestionBase {
  kind: 'choice';
  options: readonly string[];
  correctAnswer: string;
}

export interface OstinatoNumberQuestion extends OstinatoQuestionBase {
  kind: 'number';
  correctAnswer: number;
}

export type OstinatoQuestion = OstinatoChoiceQuestion | OstinatoNumberQuestion;

export const OSTINATO_TYPE_OPTIONS = ['Rythmique', 'Harmonique', 'Mélodique'] as const;

/** Nombre de questions tirées au hasard pour une partie. */
export const OSTINATO_QUESTIONS_PER_GAME = 10;

const REPETITION_PROMPT = "Combien de fois est répété l'ostinato ?";

// --- Partie A : reconnaître le type d'ostinato ---------------------------

const typeQuestions: OstinatoChoiceQuestion[] = [
  {
    id: 'type-1-rythmique',
    part: 'type',
    kind: 'choice',
    audioUrl: '/ostinato/Extrait 1 Rythmique.mp3',
    prompt: "Écoute l'extrait : quel type d'ostinato entends-tu ?",
    options: OSTINATO_TYPE_OPTIONS,
    correctAnswer: 'Rythmique',
  },
  {
    id: 'type-2-harmonique',
    part: 'type',
    kind: 'choice',
    audioUrl: '/ostinato/Extrait 2 Harmonique.mp3',
    prompt: "Écoute l'extrait : quel type d'ostinato entends-tu ?",
    options: OSTINATO_TYPE_OPTIONS,
    correctAnswer: 'Harmonique',
  },
  {
    id: 'type-3-melodique',
    part: 'type',
    kind: 'choice',
    audioUrl: '/ostinato/Extrait 3 Melodique.mp3',
    prompt: "Écoute l'extrait : quel type d'ostinato entends-tu ?",
    options: OSTINATO_TYPE_OPTIONS,
    correctAnswer: 'Mélodique',
  },
  {
    id: 'type-4-melodique',
    part: 'type',
    kind: 'choice',
    audioUrl: '/ostinato/Extrait 4 Melodique.mp3',
    prompt: "Écoute l'extrait : quel type d'ostinato entends-tu ?",
    options: OSTINATO_TYPE_OPTIONS,
    correctAnswer: 'Mélodique',
  },
];

// --- Partie B : compter les répétitions ----------------------------------

const repetitionQuestions: OstinatoNumberQuestion[] = [
  {
    id: 'repetition-5-6',
    part: 'repetitions',
    kind: 'number',
    audioUrl: '/ostinato/Extrait 5 - 6 fois.mp3',
    prompt: REPETITION_PROMPT,
    correctAnswer: 6,
  },
  {
    id: 'repetition-5-7',
    part: 'repetitions',
    kind: 'number',
    audioUrl: '/ostinato/Extrait 5 - 7 fois.mp3',
    prompt: REPETITION_PROMPT,
    correctAnswer: 7,
  },
  {
    id: 'repetition-5-8',
    part: 'repetitions',
    kind: 'number',
    audioUrl: '/ostinato/Extrait 5 - 8 fois.mp3',
    prompt: REPETITION_PROMPT,
    correctAnswer: 8,
  },
  {
    id: 'repetition-6-4',
    part: 'repetitions',
    kind: 'number',
    audioUrl: '/ostinato/Extrait 6 - 4 Fois.mp3',
    prompt: REPETITION_PROMPT,
    correctAnswer: 4,
  },
  {
    id: 'repetition-6-5',
    part: 'repetitions',
    kind: 'number',
    audioUrl: '/ostinato/Extrait 6 - 5 fois.mp3',
    prompt: REPETITION_PROMPT,
    correctAnswer: 5,
  },
  {
    id: 'repetition-6-6',
    part: 'repetitions',
    kind: 'number',
    audioUrl: '/ostinato/Extrait 6 - 6 fois.mp3',
    prompt: REPETITION_PROMPT,
    correctAnswer: 6,
  },
  {
    id: 'repetition-7-6',
    part: 'repetitions',
    kind: 'number',
    audioUrl: '/ostinato/Extrait 7 - 6 Fois.mp3',
    prompt: REPETITION_PROMPT,
    correctAnswer: 6,
  },
  {
    id: 'repetition-7-7',
    part: 'repetitions',
    kind: 'number',
    audioUrl: '/ostinato/Extrait 7 - 7 fois.mp3',
    prompt: REPETITION_PROMPT,
    correctAnswer: 7,
  },
  {
    id: 'repetition-7-8',
    part: 'repetitions',
    kind: 'number',
    audioUrl: '/ostinato/Extrait 7 - 8 fois.mp3',
    prompt: REPETITION_PROMPT,
    correctAnswer: 8,
  },
  {
    id: 'repetition-8-3',
    part: 'repetitions',
    kind: 'number',
    audioUrl: '/ostinato/Extrait 8 - 3 Fois.mp3',
    prompt: REPETITION_PROMPT,
    correctAnswer: 3,
  },
  {
    id: 'repetition-8-4',
    part: 'repetitions',
    kind: 'number',
    audioUrl: '/ostinato/Extrait 8 - 4 Fois.mp3',
    prompt: REPETITION_PROMPT,
    correctAnswer: 4,
  },
  {
    id: 'repetition-8-5',
    part: 'repetitions',
    kind: 'number',
    audioUrl: '/ostinato/Extrait 8 - 5 Fois.mp3',
    prompt: REPETITION_PROMPT,
    correctAnswer: 5,
  },
  {
    id: 'repetition-10-8',
    part: 'repetitions',
    kind: 'number',
    audioUrl: '/ostinato/Extrait 10 - Bounty 8 fois.mp3',
    prompt: "Combien de fois est répété l'ostinato Bounty ?",
    correctAnswer: 8,
  },
  {
    id: 'repetition-10-9',
    part: 'repetitions',
    kind: 'number',
    audioUrl: '/ostinato/Extrait 10 - Bounty 9 fois.mp3',
    prompt: "Combien de fois est répété l'ostinato Bounty ?",
    correctAnswer: 9,
  },
  {
    id: 'repetition-10-10',
    part: 'repetitions',
    kind: 'number',
    audioUrl: '/ostinato/Extrait 10 - Bounty 10 fois.mp3',
    prompt: "Combien de fois est répété l'ostinato Bounty ?",
    correctAnswer: 10,
  },
  {
    id: 'repetition-10-11',
    part: 'repetitions',
    kind: 'number',
    audioUrl: '/ostinato/Extrait 10 - Bounty 11 fois.mp3',
    prompt: "Combien de fois est répété l'ostinato Bounty ?",
    correctAnswer: 11,
  },
  {
    id: 'repetition-10-12',
    part: 'repetitions',
    kind: 'number',
    audioUrl: '/ostinato/Extrait 10 - Bounty 12 fois.mp3',
    prompt: "Combien de fois est répété l'ostinato Bounty ?",
    correctAnswer: 12,
  },
];

// --- Partie C : ostinatis superposés (Extrait 9) -------------------------

// Deux fichiers seulement, partagés par plusieurs questions : les MP3 ne
// sont donc jamais dupliqués.
const EXTRAIT_9_QUATRE_OSTINATIS = '/ostinato/Extrait 9 - 4 ostinatis.mp3';
const EXTRAIT_9_CINQ_OSTINATIS = '/ostinato/Extrait 9 - 5 ostinatis.mp3';

const superposedQuestions: OstinatoNumberQuestion[] = [
  {
    id: 'superposes-4-snickers',
    part: 'superposes',
    kind: 'number',
    audioUrl: EXTRAIT_9_QUATRE_OSTINATIS,
    prompt: "Combien de fois l'ostinato Snickers est répété ?",
    correctAnswer: 2,
  },
  {
    id: 'superposes-4-twix',
    part: 'superposes',
    kind: 'number',
    audioUrl: EXTRAIT_9_QUATRE_OSTINATIS,
    prompt: "Combien de fois l'ostinato Twix Twix est répété ?",
    correctAnswer: 5,
  },
  {
    id: 'superposes-4-bounty',
    part: 'superposes',
    kind: 'number',
    audioUrl: EXTRAIT_9_QUATRE_OSTINATIS,
    prompt: "Combien de fois l'ostinato Bounty est répété ?",
    correctAnswer: 20,
  },
  {
    id: 'superposes-4-kitkat',
    part: 'superposes',
    kind: 'number',
    audioUrl: EXTRAIT_9_QUATRE_OSTINATIS,
    prompt: "Combien de fois l'ostinato Kit-Kat est répété ?",
    correctAnswer: 0,
  },
  {
    id: 'superposes-5-snickers',
    part: 'superposes',
    kind: 'number',
    audioUrl: EXTRAIT_9_CINQ_OSTINATIS,
    prompt: "Combien de fois l'ostinato Snickers est répété ?",
    correctAnswer: 2,
  },
  {
    id: 'superposes-5-twix',
    part: 'superposes',
    kind: 'number',
    audioUrl: EXTRAIT_9_CINQ_OSTINATIS,
    prompt: "Combien de fois l'ostinato Twix Twix est répété ?",
    correctAnswer: 5,
  },
  {
    id: 'superposes-5-bounty',
    part: 'superposes',
    kind: 'number',
    audioUrl: EXTRAIT_9_CINQ_OSTINATIS,
    prompt: "Combien de fois l'ostinato Bounty est répété ?",
    correctAnswer: 16,
  },
  {
    id: 'superposes-5-kitkat',
    part: 'superposes',
    kind: 'number',
    audioUrl: EXTRAIT_9_CINQ_OSTINATIS,
    prompt: "Combien de fois l'ostinato Kit-Kat est répété ?",
    correctAnswer: 2,
  },
];

export const ostinatoQuestions: OstinatoQuestion[] = [
  ...typeQuestions,
  ...repetitionQuestions,
  ...superposedQuestions,
];
