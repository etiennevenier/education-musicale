#!/usr/bin/env node
// scripts/unify-quizzes.mjs
// Unifie tous les quiz du site (apparence + comportement + écran de fin sans bilan).
// Usage (depuis la racine du projet) :
//   node scripts/unify-quizzes.mjs          → applique tout (sauvegarde dans .unify-quizzes-backup/)
//   node scripts/unify-quizzes.mjs --dry    → vérifie tous les motifs sans rien écrire
// Tout est calculé en mémoire d'abord : à la moindre erreur, AUCUN fichier n'est modifié.

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'src');
const DRY = process.argv.includes('--dry');

if (!fs.existsSync(SRC)) {
  console.error('✖ Dossier src/ introuvable : lance le script depuis la racine du projet.');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Contenus complets des deux composants réécrits
// ---------------------------------------------------------------------------

const VOIX_BLIND_TEST = `---
import { relativeUrl } from '../utils/navigation';
import '../styles/quiz-card.css';

const baseUrl = relativeUrl('/');
---

<div class="quiz-card voix-quiz-card" data-base-url={baseUrl}>
  <div class="fuzeau-header">
    <span class="badge">Écoute &amp; Voix</span>
    <h4>Blind Test : Quelle est cette tessiture ?</h4>
  </div>

  <p class="quiz-intro">
    Écoute 10 extraits vocaux et devine à chaque fois quelle tessiture chante.
  </p>

  <!-- Progression -->
  <div id="vxProgressBox" class="progress-box">
    <div class="progress-text">
      <span id="vxProgressLabel">Question 1 / 10</span>
      <span id="vxScoreLabel" class="score-label">Score : 0 / 10</span>
    </div>
    <div class="progress-bar"><div id="vxProgressFill" class="progress-fill"></div></div>
  </div>

  <!-- Question + lecteur -->
  <div id="vxQuestionContainer" class="question-container" tabindex="-1">
    <p class="question-text">Quelle tessiture entends-tu ?</p>
    <div class="audio-q-box">
      <button type="button" id="vxBtnPlay" class="btn-play-sound"></button>
    </div>
  </div>

  <!-- Réponses -->
  <div id="vxOptionsContainer" class="options-grid">
    <button type="button" class="btn-option" data-tessiture="soprano">Soprano</button>
    <button type="button" class="btn-option" data-tessiture="alto">Alto</button>
    <button type="button" class="btn-option" data-tessiture="tenor">Ténor</button>
    <button type="button" class="btn-option" data-tessiture="basse">Basse</button>
  </div>

  <div id="vxFeedback" class="feedback-msg hidden" role="status" aria-live="polite"></div>

  <div id="vxActionFooter" class="action-footer">
    <button type="button" id="vxBtnNext" class="btn-next" disabled>Question suivante ➔</button>
  </div>

  <!-- Bilan final -->
  <div id="vxResultContainer" class="result-container hidden" aria-live="polite"></div>
</div>

<script>
  import { shuffle } from '../utils/random';
  import { stopAudio } from '../utils/audioManager';
  import { bindPlayButton } from '../utils/quizAudio';
  import {
    renderNextButton,
    renderProgress,
    scheduleAutoNext,
    showQuizResult,
  } from '../utils/quizUi';

  type TessitureId = 'soprano' | 'alto' | 'tenor' | 'basse';

  interface TessitureProfile {
    id: TessitureId;
    label: string;
    filePrefix: string;
  }

  interface AudioTrack {
    id: TessitureId;
    label: string;
    file: string;
  }

  const TESSITURES: TessitureProfile[] = [
    { id: 'soprano', label: 'Soprano', filePrefix: 'Soprano' },
    { id: 'alto', label: 'Alto', filePrefix: 'Alto' },
    { id: 'tenor', label: 'Ténor', filePrefix: 'Tenor' },
    { id: 'basse', label: 'Basse', filePrefix: 'Basse' },
  ];

  const TRACKS_PER_TESSITURE = 6;
  const QUESTIONS_PER_GAME = 10;
  const MIN_QUESTIONS_PER_TESSITURE = 2;

  // 24 fichiers MP3 réels, chacun associé à la tessiture attendue.
  const AUDIO_TRACKS: AudioTrack[] = TESSITURES.flatMap((tessiture) =>
    Array.from({ length: TRACKS_PER_TESSITURE }, (_, index) => ({
      id: tessiture.id,
      label: tessiture.label,
      file: \`/tessitures/\${tessiture.filePrefix} \${index + 1}.mp3\`,
    })),
  );

  const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

  const card = document.querySelector<HTMLElement>('.voix-quiz-card')!;
  const siteBaseUrl = (card.dataset.baseUrl ?? '/').replace(/\\/$/, '');

  const progressBox = $<HTMLDivElement>('vxProgressBox');
  const progressLabel = $<HTMLSpanElement>('vxProgressLabel');
  const scoreLabel = $<HTMLSpanElement>('vxScoreLabel');
  const progressFill = $<HTMLDivElement>('vxProgressFill');
  const questionContainer = $<HTMLDivElement>('vxQuestionContainer');
  const playBtn = $<HTMLButtonElement>('vxBtnPlay');
  const optionsContainer = $<HTMLDivElement>('vxOptionsContainer');
  const quizFeedback = $<HTMLDivElement>('vxFeedback');
  const actionFooter = $<HTMLDivElement>('vxActionFooter');
  const btnNext = $<HTMLButtonElement>('vxBtnNext');
  const resultContainer = $<HTMLDivElement>('vxResultContainer');
  const choiceBtns = Array.from(optionsContainer.querySelectorAll<HTMLButtonElement>('.btn-option'));

  // Lecture via le gestionnaire audio partagé : une seule piste à la fois.
  const player = bindPlayButton(playBtn);

  let currentTrack: AudioTrack = AUDIO_TRACKS[0];
  let gameTracks: AudioTrack[] = [];
  let questionIndex = 0;
  let score = 0;
  let isAnswered = false;

  // Passage automatique à la question suivante après une BONNE réponse uniquement
  let autoNextTimer: ReturnType<typeof setTimeout> | null = null;

  function clearAutoNext() {
    if (autoNextTimer) {
      clearTimeout(autoNextTimer);
      autoNextTimer = null;
    }
  }

  function getTrackUrl(track: AudioTrack): string {
    // Le préfixe de base est nécessaire sur GitHub Pages (/education-musicale/).
    return \`\${siteBaseUrl}\${encodeURI(track.file)}\`;
  }

  function buildGameTracks(): AudioTrack[] {
    // 2 extraits par tessiture (8) + 2 extraits parmi les restants = 10 questions.
    const pools = TESSITURES.map((tessiture) =>
      shuffle(AUDIO_TRACKS.filter((track) => track.id === tessiture.id)),
    );
    const selected: AudioTrack[] = [];

    pools.forEach((pool) => {
      selected.push(...pool.splice(0, MIN_QUESTIONS_PER_TESSITURE));
    });

    const remaining = shuffle(pools.flat());
    selected.push(...remaining.slice(0, QUESTIONS_PER_GAME - selected.length));

    return shuffle(selected).slice(0, QUESTIONS_PER_GAME);
  }

  function setFeedback(kind: 'success' | 'error' | null, text = '') {
    quizFeedback.textContent = text;
    quizFeedback.className = kind ? \`feedback-msg \${kind}\` : 'feedback-msg hidden';
  }

  /** Bascule entre l'écran de jeu et l'écran de résultat. */
  function showQuizScreen(visible: boolean) {
    [progressBox, questionContainer, optionsContainer, actionFooter].forEach((el) =>
      el.classList.toggle('hidden', !visible),
    );
    resultContainer.classList.toggle('hidden', visible);
  }

  function updateProgress() {
    renderProgress(
      { progressLabel, scoreLabel, progressFill },
      { unit: 'question', index: questionIndex, total: gameTracks.length, score, answered: isAnswered },
    );
  }

  function updateNextButton() {
    renderNextButton(btnNext, {
      unit: 'question',
      isLast: questionIndex >= gameTracks.length - 1,
      answered: isAnswered,
    });
  }

  function loadQuestion() {
    clearAutoNext();
    const track = gameTracks[questionIndex];
    if (!track) return;

    currentTrack = track;
    isAnswered = false;
    setFeedback(null);

    stopAudio();
    player.setUrl(getTrackUrl(track));

    choiceBtns.forEach((btn) => {
      btn.disabled = false;
      btn.classList.remove('correct', 'incorrect');
    });

    updateProgress();
    updateNextButton();
  }

  function checkAnswer(button: HTMLButtonElement) {
    if (isAnswered) return;
    isAnswered = true;

    const isCorrect = button.dataset.tessiture === currentTrack.id;
    choiceBtns.forEach((btn) => (btn.disabled = true));

    if (isCorrect) {
      score++;
      button.classList.add('correct');
      const message = \`🎉 Bravo ! C'était bien la tessiture \${currentTrack.label}.\`;
      setFeedback('success', message);
      autoNextTimer = scheduleAutoNext(goToNext, message);
    } else {
      button.classList.add('incorrect');
      choiceBtns
        .find((btn) => btn.dataset.tessiture === currentTrack.id)
        ?.classList.add('correct');
      setFeedback('error', \`❌ Dommage ! C'était la tessiture \${currentTrack.label}.\`);
    }

    updateProgress();
    updateNextButton();
  }

  function showResult() {
    clearAutoNext();
    stopAudio();
    player.setUrl(null);
    showQuizResult({
      hide: [progressBox, questionContainer, optionsContainer, actionFooter],
      feedback: quizFeedback,
      container: resultContainer,
      score,
      total: gameTracks.length,
      restartId: 'vxBtnRestart',
      onRestart: startGame,
    });
  }

  function startGame() {
    clearAutoNext();
    gameTracks = buildGameTracks();
    questionIndex = 0;
    score = 0;
    isAnswered = false;

    resultContainer.innerHTML = '';
    showQuizScreen(true);
    loadQuestion();
  }

  function goToNext() {
    clearAutoNext();
    if (!isAnswered) return;
    if (questionIndex >= gameTracks.length - 1) {
      showResult();
      return;
    }
    questionIndex++;
    loadQuestion();
  }

  choiceBtns.forEach((btn) => btn.addEventListener('click', () => checkAnswer(btn)));
  btnNext.addEventListener('click', goToNext);

  startGame();
</script>
`;

const NUANCES_QUIZ = `---
import '../styles/quiz-card.css';

const ROUNDS = 5;
const EXCERPTS = [1, 2, 3] as const;
const CHOICES = [
  { code: 'p', label: 'Piano' },
  { code: 'mf', label: 'Mezzo Forte' },
  { code: 'ff', label: 'Fortissimo' },
] as const;
---

<div class="quiz-card nuances-quiz-card" data-rounds={ROUNDS}>
  <div class="fuzeau-header">
    <span class="badge">Quiz Écoute</span>
    <h4>Devine la suite des 3 Nuances !</h4>
  </div>

  <p class="quiz-intro">
    {ROUNDS} manches : écoute l'enchaînement des 3 extraits et indique la nuance de chacun.
  </p>

  <!-- Progression -->
  <div id="nqProgressBox" class="progress-box">
    <div class="progress-text">
      <span id="nqProgressLabel">Manche 1 / {ROUNDS}</span>
      <span id="nqScoreLabel" class="score-label">Score : 0 / {ROUNDS}</span>
    </div>
    <div class="progress-bar"><div id="nqProgressFill" class="progress-fill"></div></div>
  </div>

  <!-- Écoute -->
  <div id="nqQuestionContainer" class="question-container" tabindex="-1">
    <p class="question-text">Quelle nuance pour chaque extrait ?</p>
    <div class="audio-q-box">
      <button type="button" id="nqBtnPlayAll" class="btn-play-sound"></button>
    </div>
    <div class="sub-players">
      {
        EXCERPTS.map((n) => (
          <button type="button" class="btn-sub" data-excerpt={n - 1}>
            🎵 Extrait {n}
          </button>
        ))
      }
    </div>
  </div>

  <!-- Réponses -->
  <div id="nqAnswers" class="filters-bar">
    {
      EXCERPTS.map((n) => (
        <div class="filter-group">
          <label for={\`nqSelect\${n}\`}>Extrait {n}</label>
          <select id={\`nqSelect\${n}\`} class="quiz-select" data-excerpt={n - 1}>
            <option value="">-- Choisis --</option>
            {CHOICES.map((c) => (
              <option value={c.code}>{c.label}</option>
            ))}
          </select>
        </div>
      ))
    }
  </div>

  <div id="nqFeedback" class="feedback-msg hidden" role="status" aria-live="polite"></div>

  <div id="nqActionFooter" class="action-footer">
    <button type="button" id="nqBtnValidate" class="btn-validate">Valider mes réponses</button>
    <button type="button" id="nqBtnNext" class="btn-next" disabled>Manche suivante ➔</button>
  </div>

  <!-- Bilan final -->
  <div id="nqResultContainer" class="result-container hidden" aria-live="polite"></div>
</div>

<script>
  import { shuffle } from '../utils/random';
  import { stopAudio } from '../utils/audioManager';
  import {
    renderNextButton,
    renderProgress,
    scheduleAutoNext,
    showQuizResult,
  } from '../utils/quizUi';

  // Nuances retenues avec des volumes (gains) bien tranchés pour éviter l'ambiguïté
  const NUANCE_OPTIONS = [
    { code: 'p', label: 'Piano', gain: 0.08 },
    { code: 'mf', label: 'Mezzo Forte', gain: 0.38 },
    { code: 'ff', label: 'Fortissimo', gain: 0.9 },
  ];

  const PENTATONIC = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25];
  const EXCERPT_MS = 1100; // durée d'un extrait + pause
  const PLAY_ALL_LABELS = {
    idle: '▶ Écouter les 3 extraits à la suite',
    playing: '🔊 Écoute en cours…',
  };

  const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

  const card = document.querySelector<HTMLElement>('.nuances-quiz-card')!;
  const ROUNDS = Number(card.dataset.rounds ?? 5);

  const progressBox = $<HTMLDivElement>('nqProgressBox');
  const progressLabel = $<HTMLSpanElement>('nqProgressLabel');
  const scoreLabel = $<HTMLSpanElement>('nqScoreLabel');
  const progressFill = $<HTMLDivElement>('nqProgressFill');
  const questionContainer = $<HTMLDivElement>('nqQuestionContainer');
  const btnPlayAll = $<HTMLButtonElement>('nqBtnPlayAll');
  const subButtons = Array.from(card.querySelectorAll<HTMLButtonElement>('.btn-sub'));
  const answers = $<HTMLDivElement>('nqAnswers');
  const selects = Array.from(card.querySelectorAll<HTMLSelectElement>('.quiz-select'));
  const quizFeedback = $<HTMLDivElement>('nqFeedback');
  const actionFooter = $<HTMLDivElement>('nqActionFooter');
  const btnValidate = $<HTMLButtonElement>('nqBtnValidate');
  const btnNext = $<HTMLButtonElement>('nqBtnNext');
  const resultContainer = $<HTMLDivElement>('nqResultContainer');

  let currentSequence: typeof NUANCE_OPTIONS = [];
  let roundIndex = 0;
  let score = 0;
  let isAnswered = false;
  let audioCtx: AudioContext | null = null;
  let masterGain: GainNode | null = null;
  let playToken = 0;
  let autoNextTimer: ReturnType<typeof setTimeout> | null = null;

  function clearAutoNext() {
    if (autoNextTimer) {
      clearTimeout(autoNextTimer);
      autoNextTimer = null;
    }
  }

  // --- Audio ---------------------------------------------------------------

  function initAudio() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = audioCtx.createGain();
      masterGain.connect(audioCtx.destination);
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function setPlayAllState(playing: boolean) {
    btnPlayAll.disabled = playing;
    btnPlayAll.textContent = playing ? PLAY_ALL_LABELS.playing : PLAY_ALL_LABELS.idle;
    subButtons.forEach((btn) => (btn.disabled = playing));
  }

  // Joue un extrait donné (index 0, 1 ou 2) avec un petit motif de 4 notes
  function playExcerpt(index: number, onComplete?: () => void) {
    initAudio();
    if (!audioCtx || !masterGain) return;
    stopAudio(); // coupe un éventuel extrait d'un autre quiz

    const nuance = currentSequence[index];
    const now = audioCtx.currentTime;

    // Ajuster le volume global de cet extrait
    masterGain.gain.setValueAtTime(nuance.gain, now);

    // Jouer 4 notes rapprochées
    for (let i = 0; i < 4; i++) {
      const noteTime = now + i * 0.22;
      const freq = PENTATONIC[(i * 2 + index) % PENTATONIC.length];

      const osc = audioCtx.createOscillator();
      const noteGain = audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteTime);

      noteGain.gain.setValueAtTime(0, noteTime);
      noteGain.gain.linearRampToValueAtTime(0.8, noteTime + 0.03);
      noteGain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.2);

      osc.connect(noteGain);
      noteGain.connect(masterGain);

      osc.start(noteTime);
      osc.stop(noteTime + 0.22);
    }

    if (onComplete) setTimeout(onComplete, EXCERPT_MS);
  }

  // Joue la séquence complète des 3 extraits (annulable via playToken)
  function playFullSequence() {
    const token = ++playToken;
    setPlayAllState(true);

    const step = (i: number) => {
      if (token !== playToken) return;
      if (i >= currentSequence.length) {
        setPlayAllState(false);
        return;
      }
      playExcerpt(i, () => step(i + 1));
    };
    step(0);
  }

  function cancelPlayback() {
    playToken++;
    setPlayAllState(false);
  }

  // --- Affichage -----------------------------------------------------------

  function setFeedback(kind: 'success' | 'error' | 'warning' | null, text = '') {
    quizFeedback.textContent = text;
    quizFeedback.className = kind ? \`feedback-msg \${kind}\` : 'feedback-msg hidden';
  }

  /** Bascule entre l'écran de jeu et l'écran de résultat. */
  function showQuizScreen(visible: boolean) {
    [progressBox, questionContainer, answers, actionFooter].forEach((el) =>
      el.classList.toggle('hidden', !visible),
    );
    resultContainer.classList.toggle('hidden', visible);
  }

  function updateProgress() {
    renderProgress(
      { progressLabel, scoreLabel, progressFill },
      { unit: 'manche', index: roundIndex, total: ROUNDS, score, answered: isAnswered },
    );
  }

  function updateNextButton() {
    renderNextButton(btnNext, {
      unit: 'manche',
      isLast: roundIndex >= ROUNDS - 1,
      answered: isAnswered,
    });
  }

  // --- Partie --------------------------------------------------------------

  // Nouvelle manche : tirage aléatoire des 3 nuances (mélangées)
  function loadRound() {
    clearAutoNext();
    cancelPlayback();
    isAnswered = false;
    currentSequence = shuffle(NUANCE_OPTIONS);

    selects.forEach((select) => {
      select.value = '';
      select.disabled = false;
      select.className = 'quiz-select';
    });
    btnValidate.disabled = false;
    setFeedback(null);
    updateProgress();
    updateNextButton();
  }

  function validateAnswers() {
    if (isAnswered) return;

    if (selects.some((select) => select.value === '')) {
      setFeedback('warning', '⚠️ Choisis une nuance pour les 3 extraits avant de valider !');
      return;
    }

    isAnswered = true;
    cancelPlayback();

    let correctCount = 0;
    selects.forEach((select, idx) => {
      const ok = select.value === currentSequence[idx].code;
      if (ok) correctCount++;
      select.className = \`quiz-select \${ok ? 'correct' : 'incorrect'}\`;
      select.disabled = true;
    });
    btnValidate.disabled = true;

    if (correctCount === selects.length) {
      score++;
      const message = '🎉 Bravo ! Tu as identifié parfaitement la suite des 3 nuances !';
      setFeedback('success', message);
      autoNextTimer = scheduleAutoNext(goToNext, message);
    } else {
      const solution = currentSequence
        .map((nuance, idx) => \`\${idx + 1} → \${nuance.label}\`)
        .join(' · ');
      setFeedback(
        'error',
        \`💡 \${correctCount} bonne(s) réponse(s) sur \${selects.length}. Réponses : \${solution}\`,
      );
    }

    updateProgress();
    updateNextButton();
  }

  function showResult() {
    clearAutoNext();
    cancelPlayback();
    showQuizResult({
      hide: [progressBox, questionContainer, answers, actionFooter],
      feedback: quizFeedback,
      container: resultContainer,
      score,
      total: ROUNDS,
      restartId: 'nqBtnRestart',
      onRestart: startGame,
    });
  }

  function startGame() {
    clearAutoNext();
    roundIndex = 0;
    score = 0;
    resultContainer.innerHTML = '';
    showQuizScreen(true);
    loadRound();
  }

  function goToNext() {
    clearAutoNext();
    if (!isAnswered) return;
    if (roundIndex >= ROUNDS - 1) {
      showResult();
      return;
    }
    roundIndex++;
    loadRound();
  }

  // --- Événements ----------------------------------------------------------

  btnPlayAll.addEventListener('click', playFullSequence);
  subButtons.forEach((btn) =>
    btn.addEventListener('click', () => playExcerpt(Number(btn.dataset.excerpt))),
  );
  btnValidate.addEventListener('click', validateAnswers);
  btnNext.addEventListener('click', goToNext);

  startGame();
</script>

<style is:global>
  .nuances-quiz-card .sub-players {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.5rem;
    margin-top: 0.75rem;
  }

  .nuances-quiz-card .btn-sub {
    flex: 1 1 7rem;
    background: var(--qc-border);
    color: var(--qc-text);
    border: none;
    padding: 0.5rem;
    border-radius: 6px;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
  }

  .nuances-quiz-card .btn-sub:hover:not(:disabled) {
    background: var(--qc-border-strong);
  }

  .nuances-quiz-card .btn-sub:disabled {
    opacity: 0.5;
    cursor: default;
  }

  .nuances-quiz-card .btn-sub:focus-visible {
    outline: 2px solid var(--qc-accent);
    outline-offset: 2px;
  }
</style>
`;

// ---------------------------------------------------------------------------
// Utilitaires
// ---------------------------------------------------------------------------

/** Remplace un motif (texte ou regex) ; lève une erreur s'il est introuvable. */
function sub(content, pattern, replacement, label) {
  if (typeof pattern === 'string') {
    if (!content.includes(pattern)) throw new Error(`motif introuvable : ${label}`);
    return content.replace(pattern, () => replacement);
  }
  if (!pattern.test(content)) throw new Error(`motif introuvable : ${label}`);
  return content.replace(pattern, replacement);
}

/** Remplace un bloc regex en vérifiant que sa taille reste raisonnable. */
function subBlock(content, regex, replacement, label, maxLen) {
  const m = content.match(regex);
  if (!m) throw new Error(`motif introuvable : ${label}`);
  if (m[0].length > maxLen) throw new Error(`bloc suspect (trop long) : ${label}`);
  return content.replace(regex, () => replacement);
}

/** Remplace le fichier entier, après vérification d'un marqueur de l'ancienne version. */
function replaceFile(marker, newContent, label) {
  return (content) => {
    if (!content.includes(marker)) throw new Error(`fichier inattendu (${label}) : marqueur « ${marker} » absent`);
    return newContent;
  };
}

// --- Retrait du plumbing « messages de bilan » commun aux composants --------

const RESULT_BLOCK = /\n[ \t]*const RESULT_MESSAGES = makeResultMessages\(\{[\s\S]*?\}\);\n/;
const MESSAGES_LINE = /\n[ \t]*messages: (?:RESULT_MESSAGES|OPERA_RESULT_MESSAGES|PUB_RESULT_MESSAGES),/;

function stripMakeResultMessages(c) {
  c = sub(c, 'makeResultMessages, ', '', 'import makeResultMessages');
  c = subBlock(c, RESULT_BLOCK, '\n', 'bloc RESULT_MESSAGES', 400);
  c = sub(c, MESSAGES_LINE, '', 'ligne messages:');
  return c;
}

// ---------------------------------------------------------------------------
// Opérations par fichier
// ---------------------------------------------------------------------------

const QUIZ_TS = `import { QUIZ_EMOJIS, QUIZ_LABELS } from './quizConfig';

export type QuizResultTier = 'perfect' | 'great' | 'ok' | 'retry';

/**
 * Calcule le palier de résultat selon la note et le total de questions :
 * - ratio = 1 (ou note >= total > 0) -> 'perfect'
 * - ratio >= 0.8 -> 'great'
 * - ratio >= 0.5 -> 'ok'
 * - sinon -> 'retry'
 */
export function getResultTier(note: number, total: number): QuizResultTier {
  if (total <= 0) return 'retry';
  const ratio = note / total;
  if (ratio >= 1) return 'perfect';
  if (ratio >= 0.8) return 'great';
  if (ratio >= 0.5) return 'ok';
  return 'retry';
}

export interface ResultHtmlOptions {
  score: number;
  total: number;
  restartId: string;
  title?: string;
  restartLabel?: string;
}

/**
 * HTML de l'écran de fin, identique pour tous les quiz :
 * emoji (selon le palier), titre, score « X / N », bouton « Rejouer ». Aucun texte de bilan.
 * (chaînes statiques de confiance uniquement)
 */
export function buildResultHtml({
  score,
  total,
  restartId,
  title = QUIZ_LABELS.resultTitle,
  restartLabel = QUIZ_LABELS.restart,
}: ResultHtmlOptions): string {
  const emoji = QUIZ_EMOJIS[getResultTier(score, total)];
  return \`
    <div class="result-emoji">\${emoji}</div>
    <p class="result-title">\${title}</p>
    <p class="result-score"><span class="result-note">\${score}</span> / \${total}</p>
    <button type="button" id="\${restartId}" class="btn-restart">\${restartLabel}</button>
  \`;
}

/** Délai minimum commun avant l'enchaînement automatique (ms). */
export const AUTO_NEXT_MIN_MS = 1200;
const AUTO_NEXT_MAX_MS = 6000;
const AUTO_NEXT_MS_PER_CHAR = 50;

/**
 * Délai avant la question suivante : proportionnel à la longueur du texte
 * affiché (temps de lecture), entre le minimum commun et un plafond.
 */
export function getAutoNextDelay(text: string): number {
  return Math.min(
    AUTO_NEXT_MAX_MS,
    Math.max(AUTO_NEXT_MIN_MS, text.length * AUTO_NEXT_MS_PER_CHAR),
  );
}
`;

const QUIZ_UI_TS = `import { buildResultHtml, getAutoNextDelay } from './quiz';
import { QUIZ_LABELS, QUIZ_UNITS, formatProgress, formatScore, type QuizUnit } from './quizConfig';

export interface ProgressEls {
  progressLabel: HTMLElement;
  scoreLabel: HTMLElement;
  progressFill: HTMLElement;
}

export interface ProgressState {
  unit: QuizUnit;
  index: number;
  total: number;
  score: number;
  answered: boolean;
}

/** Libellé de progression, score « X / N » et barre (avance une fois la réponse donnée). */
export function renderProgress(els: ProgressEls, s: ProgressState): void {
  els.progressLabel.textContent = formatProgress(s.unit, s.index, s.total);
  els.scoreLabel.textContent = formatScore(s.score, s.total);
  const done = s.index + (s.answered ? 1 : 0);
  els.progressFill.style.width = \`\${s.total ? (done / s.total) * 100 : 0}%\`;
}

export function renderNextButton(
  btn: HTMLButtonElement,
  s: { unit: QuizUnit; isLast: boolean; answered: boolean },
): void {
  btn.textContent = s.isLast ? QUIZ_LABELS.finish : QUIZ_UNITS[s.unit].next;
  btn.disabled = !s.answered;
}

/** Suite automatique après une bonne réponse : délai proportionnel au feedback affiché. */
export function scheduleAutoNext(callback: () => void, feedbackText: string) {
  return setTimeout(callback, getAutoNextDelay(feedbackText));
}

export interface ShowResultOptions {
  /** Éléments de l'écran de jeu à masquer. */
  hide: HTMLElement[];
  feedback: HTMLElement;
  container: HTMLElement;
  score: number;
  total: number;
  restartId: string;
  onRestart: () => void;
}

/** Écran de bilan standard : emoji, « Partie terminée ! », « X / N », « 🔄 Rejouer ». */
export function showQuizResult(o: ShowResultOptions): void {
  o.hide.forEach((el) => el.classList.add('hidden'));
  o.feedback.textContent = '';
  o.feedback.className = 'feedback-msg hidden';
  o.container.innerHTML = buildResultHtml({
    score: o.score,
    total: o.total,
    restartId: o.restartId,
  });
  o.container.classList.remove('hidden');
  document.getElementById(o.restartId)?.addEventListener('click', o.onRestart);
}
`;

const CSS_ADDITIONS = `
/* ==========================================================================
   Ajouts v3 — zone d'écoute et listes déroulantes de réponse
   ========================================================================== */
.quiz-card .audio-q-box {
  display: flex;
  justify-content: center;
  margin-top: 0.75rem;
}
.quiz-card .quiz-select:disabled { opacity: 1; cursor: default; }
.quiz-card .quiz-select.correct {
  background: var(--qc-ok-bg);
  border-color: var(--qc-ok-border);
  color: var(--qc-ok-text);
}
.quiz-card .quiz-select.incorrect {
  background: var(--qc-ko-bg);
  border-color: var(--qc-ko-border);
  color: var(--qc-ko-text);
}
`;

const QUIZ_COMPONENTS = [
  'JazzChorusQuiz',
  'JazzQuiz',
  'OstinatoQuiz',
  'PlansSonoresQuiz',
  'HymneVideoAnalyzer',
];

/** @type {Record<string, (c: string) => string>} */
const OPS = {
  // --- Utilitaires communs ---
  'utils/quiz.ts': replaceFile('export function buildResultHtml', QUIZ_TS, 'quiz.ts'),
  'utils/quizUi.ts': replaceFile('export function showQuizResult', QUIZ_UI_TS, 'quizUi.ts'),

  'utils/quizConfig.ts': (c) =>
    sub(
      c,
      "  extrait: { noun: 'Extrait', next: 'Extrait suivant ➔' },\n",
      "  extrait: { noun: 'Extrait', next: 'Extrait suivant ➔' },\n  manche: { noun: 'Manche', next: 'Manche suivante ➔' },\n",
      'QUIZ_UNITS.extrait',
    ),

  'styles/quiz-card.css': (c) => {
    if (c.includes('Ajouts v3')) throw new Error('quiz-card.css déjà mis à jour');
    return c.replace(/\s*$/, '\n') + CSS_ADDITIONS;
  },

  // --- Moteurs de quiz : suppression des textes de bilan ---
  'utils/pubQuizEngine.ts': (c) => {
    c = sub(c, "import { makeResultMessages } from './quizUi';\n", '', 'import makeResultMessages');
    c = sub(c, "import { getResultTier, type QuizResultTier } from './quiz';\n", '', 'import getResultTier');
    c = subBlock(c, /\n\/\*\* Message de fin par palier[\s\S]*$/, '\n', 'RESULT_TEXTS → fin de fichier', 1200);
    return c;
  },

  'utils/operaQuizEngine.ts': (c) => {
    c = sub(c, "import type { ResultMessages } from './quiz';\n", '', 'import ResultMessages');
    c = subBlock(
      c,
      /\/\*\*\n \* Messages de fin sur les 4 paliers[\s\S]*?\n\};\n\n/,
      '',
      'OPERA_RESULT_MESSAGES',
      1500,
    );
    return c;
  },

  // --- Composants conformes : plus de messages de bilan ---
  ...Object.fromEntries(
    QUIZ_COMPONENTS.map((name) => [`components/${name}.astro`, stripMakeResultMessages]),
  ),

  'components/TimbreQuiz.astro': (c) => {
    c = stripMakeResultMessages(c);
    // Type local devenu inutile (plus de message de bilan)
    c = sub(c, "  type ResultMessage = { emoji: string; text: string };\n", '', 'type ResultMessage local');
    return c;
  },

  'components/OperaQuiz.astro': (c) => {
    c = sub(
      c,
      "import { OPERA_RESULT_MESSAGES, isCorrectSelection, isMulti } from",
      'import { isCorrectSelection, isMulti } from',
      'import OPERA_RESULT_MESSAGES',
    );
    c = sub(c, MESSAGES_LINE, '', 'ligne messages: OPERA');
    return c;
  },

  'components/HymneQuiz.astro': (c) => {
    c = sub(c, "  import type { ResultMessages } from '../utils/quiz';\n", '', 'import ResultMessages');
    c = sub(
      c,
      "import { buildResultHtml, getAutoNextDelay, getResultMessage } from '../utils/quiz';",
      "import { buildResultHtml, getAutoNextDelay } from '../utils/quiz';",
      'import getResultMessage',
    );
    c = subBlock(
      c,
      /\n[ \t]*const RESULT_MESSAGES: ResultMessages = \{[\s\S]*?\n[ \t]*\};\n/,
      '\n',
      'RESULT_MESSAGES Hymne',
      500,
    );
    c = sub(
      c,
      /\n[ \t]*const \{ emoji, text \} = getResultMessage\(score, total, RESULT_MESSAGES\);\n/,
      '\n',
      'getResultMessage Hymne',
    );
    c = sub(c, /(buildResultHtml\(\{\n)[ \t]*emoji,\n[ \t]*text,\n/, '$1', 'emoji/text Hymne');
    return c;
  },

  'components/PubQuiz.astro': (c) => {
    c = sub(c, 'PUB_RESULT_MESSAGES, createQuiz', 'createQuiz', 'import PUB_RESULT_MESSAGES');
    c = sub(c, MESSAGES_LINE, '', 'ligne messages: PUB');
    // En-tête : retire l'ancien bandeau extérieur, place badge + h4 + intro dans la carte quiz
    c = subBlock(c, /  <header class="pub-header">[\s\S]*?<\/header>\n\n/, '', 'en-tête pub-header', 400);
    c = sub(
      c,
      '<div class="quiz-card pub-quiz-card" data-quiz-card>\n',
      '<div class="quiz-card pub-quiz-card" data-quiz-card>\n' +
        '      <div class="fuzeau-header">\n' +
        '        <span class="badge">Culture pub</span>\n' +
        '        <h4>Musique &amp; Publicité</h4>\n' +
        '      </div>\n' +
        '      <p class="quiz-intro">Teste ton oreille avec un quiz de {PUB_QUIZ_LENGTH} extraits.</p>\n\n',
      'ouverture quiz-card Pub',
    );
    // Plus de « carte dans la carte » : le conteneur extérieur devient transparent
    c = subBlock(
      c,
      /    padding: 1\.25rem;\n    background:\n[\s\S]*?border-radius: 18px;\n/,
      '',
      'fond du conteneur .quiz-musique-pub',
      500,
    );
    // CSS mort de l'ancien en-tête
    c = subBlock(
      c,
      /  \.pub-header \{[\s\S]*?\n  \.pub-tabs \{/,
      '  .pub-tabs {',
      'CSS .pub-header … .pub-intro',
      900,
    );
    return c;
  },

  // --- Composants réécrits ---
  'components/VoixBlindTest.astro': replaceFile('blindtest-card', VOIX_BLIND_TEST, 'VoixBlindTest'),
  'components/NuancesQuiz.astro': replaceFile('nuances-card', NUANCES_QUIZ, 'NuancesQuiz'),
};

// ---------------------------------------------------------------------------
// Garde-fou : symboles supprimés encore utilisés ailleurs dans src/
// ---------------------------------------------------------------------------

const REMOVED = /\b(makeResultMessages|getResultMessage|ResultMessages?|OPERA_RESULT_MESSAGES|PUB_RESULT_MESSAGES)\b/;
const BUILD_RESULT_WITH_TEXT = /buildResultHtml\(\{[^}]*\b(emoji|text)\b/;

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return walk(p);
    return /\.(ts|astro|js|mjs)$/.test(e.name) ? [p] : [];
  });
}

// ---------------------------------------------------------------------------
// Exécution
// ---------------------------------------------------------------------------

const errors = [];
const results = new Map();

for (const [rel, fn] of Object.entries(OPS)) {
  const file = path.join(SRC, rel);
  try {
    if (!fs.existsSync(file)) throw new Error('fichier absent');
    const before = fs.readFileSync(file, 'utf8');
    const after = fn(before);
    results.set(file, { rel, before, after });
  } catch (e) {
    errors.push(`✖ src/${rel} : ${e.message}`);
  }
}

// Fichiers non traités qui utiliseraient encore l'ancienne API
const handled = new Set([...results.keys()]);
const leftovers = [];
for (const file of walk(SRC)) {
  if (handled.has(file)) continue;
  const text = fs.readFileSync(file, 'utf8');
  if (REMOVED.test(text) || BUILD_RESULT_WITH_TEXT.test(text)) {
    leftovers.push(`✖ ${path.relative(ROOT, file)} utilise encore l'ancienne API de bilan`);
  }
}

// Vérification post-traitement des fichiers modifiés
for (const { rel, after } of results.values()) {
  if (rel.startsWith('components/') && REMOVED.test(after)) {
    errors.push(`✖ src/${rel} : référence résiduelle à l'ancienne API de bilan`);
  }
}

if (errors.length || leftovers.length) {
  [...errors, ...leftovers].forEach((l) => console.error(l));
  console.error('\nAucun fichier modifié. Envoie-moi ces lignes pour ajuster le script.');
  process.exit(1);
}

if (DRY) {
  console.log(`✔ Vérification OK : ${results.size} fichiers seraient modifiés (aucune écriture).`);
  process.exit(0);
}

const backupDir = path.join(ROOT, '.unify-quizzes-backup');
for (const [file, { rel, before, after }] of results) {
  const backup = path.join(backupDir, rel);
  fs.mkdirSync(path.dirname(backup), { recursive: true });
  fs.writeFileSync(backup, before);
  fs.writeFileSync(file, after);
  const delta = after.split('\n').length - before.split('\n').length;
  console.log(`✔ src/${rel} (${delta >= 0 ? '+' : ''}${delta} lignes)`);
}

console.log(`\n${results.size} fichiers modifiés. Sauvegardes : .unify-quizzes-backup/`);
console.log('Ensuite : npx astro check');
