/**
 * Synthèse de piano légère pour les outils d'entraînement.
 *
 * Aucun fichier audio n'est chargé : chaque note est fabriquée à la volée
 * avec la Web Audio API (partiels sinusoïdaux + filtre passe-bas + enveloppe
 * percussive), ce qui donne un timbre proche du piano sans latence réseau.
 */

import { midiToFrequency } from './musicNotes';

interface Partial {
  ratio: number;
  gain: number;
  type: OscillatorType;
}

/** Harmoniques du timbre « piano » (léger désaccord pour un rendu naturel). */
const PARTIALS: Partial[] = [
  { ratio: 1, gain: 0.55, type: 'triangle' },
  { ratio: 2, gain: 0.18, type: 'sine' },
  { ratio: 3, gain: 0.09, type: 'sine' },
  { ratio: 4.01, gain: 0.045, type: 'sine' },
  { ratio: 5.02, gain: 0.02, type: 'sine' },
];

interface ActiveVoice {
  oscillators: OscillatorNode[];
  gain: GainNode;
  filter: BiquadFilterNode;
}

interface WebAudioWindow extends Window {
  webkitAudioContext?: typeof AudioContext;
}

let audioContext: AudioContext | null = null;
let masterGain: GainNode | null = null;
const activeVoices = new Set<ActiveVoice>();

/** Crée (ou réutilise) le contexte audio partagé par l'outil. */
function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;

  if (!audioContext) {
    const ContextClass = window.AudioContext ?? (window as WebAudioWindow).webkitAudioContext;
    if (!ContextClass) return null;

    audioContext = new ContextClass();
    masterGain = audioContext.createGain();
    masterGain.gain.value = 0.3;
    masterGain.connect(audioContext.destination);
  }

  // iOS / Safari : le contexte reste suspendu tant qu'aucun geste n'a eu lieu.
  if (audioContext.state === 'suspended') void audioContext.resume();
  return audioContext;
}

/** À appeler depuis un geste utilisateur pour débloquer le son (iOS, Safari). */
export function unlockAudio(): void {
  getAudioContext();
}

export interface PlayNoteOptions {
  /** Durée de la note en secondes (défaut : 1,7 s). */
  duration?: number;
  /** Nuance de 0 à 1 (défaut : 1). */
  velocity?: number;
  /** Retard avant attaque en secondes (défaut : 0). */
  delay?: number;
}

/** Joue une note de piano synthétique. */
export function playPianoNote(midi: number, options: PlayNoteOptions = {}): void {
  const context = getAudioContext();
  if (!context || !masterGain) return;

  const duration = options.duration ?? 1.7;
  const velocity = options.velocity ?? 1;
  const start = context.currentTime + (options.delay ?? 0);
  const frequency = midiToFrequency(midi);

  const noteGain = context.createGain();
  const filter = context.createBiquadFilter();
  filter.type = 'lowpass';
  filter.Q.value = 0.6;
  filter.frequency.setValueAtTime(Math.min(frequency * 9, 12_000), start);
  filter.frequency.exponentialRampToValueAtTime(
    Math.max(frequency * 2.2, 900),
    start + duration,
  );

  // Enveloppe percussive : attaque très courte, décroissance naturelle.
  const peak = 0.45 * velocity;
  noteGain.gain.setValueAtTime(0.0001, start);
  noteGain.gain.exponentialRampToValueAtTime(peak, start + 0.01);
  noteGain.gain.exponentialRampToValueAtTime(peak * 0.45, start + 0.14);
  noteGain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  noteGain.connect(filter);
  filter.connect(masterGain);

  const oscillators: OscillatorNode[] = [];
  for (const partial of PARTIALS) {
    const oscillator = context.createOscillator();
    oscillator.type = partial.type;
    oscillator.frequency.value = frequency * partial.ratio;
    oscillator.detune.value = (Math.random() - 0.5) * 6;

    const partialGain = context.createGain();
    partialGain.gain.value = partial.gain;

    oscillator.connect(partialGain);
    partialGain.connect(noteGain);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.05);
    oscillators.push(oscillator);
  }

  const voice: ActiveVoice = { oscillators, gain: noteGain, filter };
  activeVoices.add(voice);

  oscillators[0].onended = () => {
    activeVoices.delete(voice);
    noteGain.disconnect();
    filter.disconnect();
  };
}

/** Coupe immédiatement toutes les notes en cours (changement de question, bilan…). */
export function stopAllNotes(): void {
  const context = audioContext;
  if (!context) return;

  const now = context.currentTime;
  activeVoices.forEach((voice) => {
    voice.gain.gain.cancelScheduledValues(now);
    voice.gain.gain.setValueAtTime(Math.max(voice.gain.gain.value, 0.0001), now);
    voice.gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
    voice.oscillators.forEach((oscillator) => {
      try {
        oscillator.stop(now + 0.08);
      } catch {
        // L'oscillateur était déjà arrêté : rien à faire.
      }
    });
  });
  activeVoices.clear();
}

/** Petit retour sonore : carillon montant si juste, note grave sinon. */
export function playFeedback(isCorrect: boolean): void {
  if (isCorrect) {
    playPianoNote(84, { duration: 0.5, velocity: 0.5 });
    playPianoNote(88, { duration: 0.6, velocity: 0.4, delay: 0.08 });
  } else {
    playPianoNote(48, { duration: 0.45, velocity: 0.45 });
  }
}
