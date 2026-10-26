import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QuizSession, type QuizSessionOptions } from '../src/utils/quizSession';

function el<T extends HTMLElement>(tag: string): T {
  return document.createElement(tag) as T;
}

function setup(overrides: Partial<QuizSessionOptions> = {}) {
  const progressLabel = el<HTMLDivElement>('div');
  const scoreLabel = el<HTMLDivElement>('div');
  const progressFill = el<HTMLDivElement>('div');
  const nextBtn = el<HTMLButtonElement>('button');
  const feedback = el<HTMLDivElement>('div');
  const resultContainer = el<HTMLDivElement>('div');
  const gameEl = el<HTMLDivElement>('div');
  const hiddenEl = el<HTMLDivElement>('div');

  document.body.append(
    progressLabel,
    scoreLabel,
    progressFill,
    nextBtn,
    feedback,
    resultContainer,
    gameEl,
    hiddenEl,
  );

  const renderQuestion = vi.fn();

  const options: QuizSessionOptions = {
    unit: 'question',
    progress: { progressLabel, scoreLabel, progressFill },
    nextBtn,
    feedback,
    result: { hide: [hiddenEl], container: resultContainer, restartId: 'btnRestart' },
    game: [gameEl],
    renderQuestion,
    onRestart: vi.fn(),
    ...overrides,
  };

  const session = new QuizSession(options);
  return { session, renderQuestion, nextBtn, resultContainer, gameEl, hiddenEl, feedback };
}

describe('QuizSession', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('démarre à la question 0 sans autoplay', () => {
    const { session, renderQuestion } = setup();
    session.start(3);
    expect(renderQuestion).toHaveBeenCalledWith(0, false);
    expect(session.currentIndex).toBe(0);
    expect(session.isAnswered).toBe(false);
  });

  it('enchaîne automatiquement après une bonne réponse', () => {
    const { session, renderQuestion } = setup();
    session.start(3);
    session.answer(true, 'Bonne réponse');
    expect(session.isAnswered).toBe(true);
    vi.runAllTimers();
    expect(session.currentIndex).toBe(1);
    expect(renderQuestion).toHaveBeenCalledWith(1, true);
  });

  it("n'enchaîne pas automatiquement après une mauvaise réponse", () => {
    const { session, renderQuestion } = setup();
    session.start(3);
    session.answer(false, '');
    expect(session.isAnswered).toBe(true);
    vi.runAllTimers();
    expect(session.currentIndex).toBe(0);
    expect(renderQuestion).toHaveBeenCalledTimes(1);
  });

  it("affiche l'écran de fin après la dernière question", () => {
    const { session, resultContainer } = setup();
    session.start(2);
    session.answer(true, '');
    vi.runAllTimers(); // question 2
    session.answer(true, '');
    vi.runAllTimers(); // fin
    expect(resultContainer.textContent).toContain('Partie terminée !');
    expect(resultContainer.textContent).toContain('2 / 2');
    expect(resultContainer.classList.contains('hidden')).toBe(false);
  });

  it('double-clic sur une réponse : score compté une seule fois', () => {
    const { session, resultContainer } = setup();
    session.start(2);
    session.answer(true, '');
    session.answer(true, ''); // double-clic ignoré
    vi.runAllTimers(); // question 2
    session.answer(true, '');
    vi.runAllTimers(); // fin
    expect(resultContainer.textContent).toContain('2 / 2');
  });

  it('relance : réinitialise score, index et état', () => {
    const { session, renderQuestion, resultContainer, gameEl } = setup();
    session.start(2);
    session.answer(true, '');
    vi.runAllTimers();
    session.answer(true, '');
    vi.runAllTimers(); // écran de fin
    expect(resultContainer.textContent).toContain('Partie terminée !');

    session.start(2);
    expect(resultContainer.classList.contains('hidden')).toBe(true);
    expect(gameEl.classList.contains('hidden')).toBe(false);
    expect(renderQuestion).toHaveBeenLastCalledWith(0, false);
  });

  it('relance avec autoplayFirst (Timbre : première écoute auto)', () => {
    const { session, renderQuestion } = setup();
    session.start(2, true);
    expect(renderQuestion).toHaveBeenCalledWith(0, true);
  });

  it("hook render (multi-sélection Opéra) reçoit l'état et remplace le rendu standard", () => {
    const render = vi.fn();
    const { session } = setup({ render });
    session.start(4);
    expect(render).toHaveBeenCalledWith({ index: 0, total: 4, score: 0, answered: false });
    session.answer(true, '');
    expect(render).toHaveBeenLastCalledWith({ index: 0, total: 4, score: 1, answered: true });
  });

  it('bouton Rejouer déclenche onRestart', () => {
    const onRestart = vi.fn();
    const { session } = setup({ onRestart });
    session.start(1);
    session.answer(true, '');
    vi.runAllTimers(); // fin
    const btn = document.getElementById('btnRestart') as HTMLButtonElement | null;
    expect(btn).not.toBeNull();
    btn?.click();
    expect(onRestart).toHaveBeenCalledTimes(1);
  });
});