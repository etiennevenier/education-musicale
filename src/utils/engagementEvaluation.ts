import { shuffle } from './random';
import type { Cause, EngagementSong } from '../data/engagementSongs';

export type EvidenceItem = {
  id: string;
  text: string;
  correct: boolean;
};

export type EvidenceReport = {
  found: string[];
  missed: string[];
  trapsSelected: string[];
  trapsAvoided: string[];
  perfect: boolean;
};

export type Result = {
  causeOk: boolean;
  text: EvidenceReport;
  perfect: boolean;
};

export type Answer = {
  cause: Cause | null;
  text: Set<string>;
  validated: boolean;
  result: Result | null;
};

export type SongState = {
  song: EngagementSong;
  text: EvidenceItem[];
  answer: Answer;
};

export const createEvidence = (song: EngagementSong): EvidenceItem[] =>
  shuffle(
    [
      ...song.indicesTextuels.map((text) => ({ text, correct: true })),
      ...song.leurresTextuels.map((text) => ({ text, correct: false })),
    ].map((item, index) => ({ id: `${song.id}-${index}`, ...item })),
  );

export const acceptedCauses = (song: EngagementSong): Cause[] => [
  song.causePrincipale,
  ...(song.causesAcceptees ?? []),
];

export const assessEvidence = (items: EvidenceItem[], selected: Set<string>): EvidenceReport => {
  const found = items
    .filter((item) => item.correct && selected.has(item.id))
    .map((item) => item.text);
  const missed = items
    .filter((item) => item.correct && !selected.has(item.id))
    .map((item) => item.text);
  const trapsSelected = items
    .filter((item) => !item.correct && selected.has(item.id))
    .map((item) => item.text);
  const trapsAvoided = items
    .filter((item) => !item.correct && !selected.has(item.id))
    .map((item) => item.text);

  return {
    found,
    missed,
    trapsSelected,
    trapsAvoided,
    perfect: missed.length === 0 && trapsSelected.length === 0,
  };
};

export const evaluate = (state: SongState): Result => {
  const causeOk =
    state.answer.cause !== null && acceptedCauses(state.song).includes(state.answer.cause);
  const text = assessEvidence(state.text, state.answer.text);

  return {
    causeOk,
    text,
    perfect: causeOk && text.perfect,
  };
};

/** Lien de recherche YouTube pour écouter un morceau. */
export const getListenUrl = (song: Pick<EngagementSong, 'artiste' | 'titre'>): string =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent(`${song.artiste}${song.titre} audio`)}`;
