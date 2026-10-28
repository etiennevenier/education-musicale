import { describe, expect, it } from 'vitest';
import {
  CHALLENGE_REASON_LABELS,
  createTargetBag,
  renderChallengeResult,
} from '../src/utils/challengeTool';
import { CHALLENGE_QUESTION_COUNT } from '../src/utils/challenge';

describe('createTargetBag', () => {
  it('parcourt toutes les cibles avant de recommencer', () => {
    const items = [60, 62, 64, 65];
    const bag = createTargetBag(items);
    const firstRound = Array.from({ length: items.length }, () => bag.next());
    expect([...firstRound].sort()).toEqual([...items].sort());
  });

  it("ne renvoie jamais deux fois la même cible d'affilée, même entre deux sacs", () => {
    const bag = createTargetBag([60, 62, 64]);
    let previous = bag.next();
    for (let i = 0; i < 300; i += 1) {
      const current = bag.next();
      expect(current).not.toBe(previous);
      previous = current;
    }
  });

  it('accepte une seule cible (répétition inévitable)', () => {
    const bag = createTargetBag([60]);
    expect(bag.next()).toBe(60);
    expect(bag.next()).toBe(60);
  });

  it('reset() oublie la dernière cible', () => {
    const bag = createTargetBag([60, 62]);
    bag.next();
    bag.reset();
    expect([60, 62]).toContain(bag.next());
  });

  it('lève une erreur explicite si la liste est vide', () => {
    expect(() => createTargetBag<number>([]).next()).toThrow('Aucune cible disponible');
  });
});

describe('renderChallengeResult', () => {
  const make = () => ({
    score: document.createElement('span'),
    percent: document.createElement('span'),
    time: document.createElement('span'),
    reason: document.createElement('p'),
  });

  it("remplit score, pourcentage, temps et motif (fin d'épreuve)", () => {
    const targets = make();
    renderChallengeResult(targets, {
      score: 7,
      total: 10,
      percent: 70,
      elapsedMs: 24_300,
      elapsedLabel: '0:24',
      reason: 'complete',
    });
    expect(targets.score.textContent).toBe('7 / 10');
    expect(targets.percent.textContent).toBe('70 %');
    expect(targets.time.textContent).toBe('0:24');
    expect(targets.reason.textContent).toBe(CHALLENGE_REASON_LABELS.complete);
    expect(targets.reason.textContent).toContain(String(CHALLENGE_QUESTION_COUNT));
  });

  it('affiche le motif « temps écoulé »', () => {
    const targets = make();
    renderChallengeResult(targets, {
      score: 3,
      total: 10,
      percent: 30,
      elapsedMs: 60_000,
      elapsedLabel: '1:00',
      reason: 'timeout',
    });
    expect(targets.reason.textContent).toBe(CHALLENGE_REASON_LABELS.timeout);
  });
});
