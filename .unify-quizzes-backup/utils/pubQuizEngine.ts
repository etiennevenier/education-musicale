import { shuffle } from './random';
import { makeResultMessages } from './quizUi';
import { getResultTier, type QuizResultTier } from './quiz';
import type { PubSoundEntry } from '../data/pubSounds';

export interface QuizChoice {
  label: string;
  correct: boolean;
}

export interface QuizQuestion {
  sound: PubSoundEntry;
  choices: QuizChoice[];
}

/**
 * Construit 10 questions. Les leurres viennent d'abord de la même catégorie
 * que la bonne réponse, puis d'autres catégories si nécessaire.
 */
export function createQuiz(sounds: readonly PubSoundEntry[], length: number): QuizQuestion[] {
  return shuffle(sounds)
    .slice(0, length)
    .map((sound) => {
      const sameCategory = shuffle(
        sounds.filter(
          (candidate) => candidate.category === sound.category && candidate.id !== sound.id,
        ),
      );
      const otherCategories = shuffle(
        sounds.filter((candidate) => candidate.category !== sound.category),
      );

      const distractors = sameCategory.slice(0, 3);
      if (distractors.length < 3) {
        distractors.push(...otherCategories.slice(0, 3 - distractors.length));
      }

      return {
        sound,
        choices: shuffle([sound, ...distractors]).map((candidate) => ({
          label: candidate.label,
          correct: candidate.id === sound.id,
        })),
      };
    });
}

/** Message de fin par palier (paliers communs à tous les quiz, voir quiz.ts). */
const RESULT_TEXTS: Record<QuizResultTier, string> = {
  perfect: 'Sans faute ! Tu connais le catalogue sur le bout des oreilles.',
  great: 'Excellent ! Tu reconnais presque tous les jingles du catalogue.',
  ok: 'Pas mal ! Encore quelques extraits à réécouter pour progresser.',
  retry: "Continue à explorer le catalogue : ton oreille va vite s'affûter.",
};

export const getResultMessage = (points: number, total: number): string =>
  RESULT_TEXTS[getResultTier(points, total)];

export const PUB_RESULT_MESSAGES = makeResultMessages(RESULT_TEXTS);
