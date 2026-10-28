import { shuffle } from './random';
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

