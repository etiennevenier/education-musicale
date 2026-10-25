/**
 * Synthèse de piano légère pour les outils d'entraînement.
 *
 * Aucun fichier audio n'est chargé : chaque note est fabriquée à la volée
 * avec la Web Audio API (partiels sinusoïdaux + filtre passe-bas + enveloppe
 * percussive), ce qui donne un timbre proche du piano sans latence réseau.
 */

import { midiToFrequency } from './musicNotes';
import { getAudioContext, getMasterBus } from './audioContext';

const HARMONICS = [0.55, 0.18, 0.15, 0.045, 0.04];
const MAX_VOICES = 24;

interface ActiveVoice {
  oscillator: OscillatorNode;
  gain: GainNode;
  filter: BiquadFilterNode;
}

const activeVoices = new Set<ActiveVoice>();
const waveCache = new WeakMap<AudioContext, PeriodicWave>();

function getPianoWave(context: AudioContext): PeriodicWave {
  let wave = waveCache.get(context);
  if (!wave) {
    const real = new Float32Array(HARMONICS.length + 1);
    const imag = new Float32Array([0, ...HARMONICS]);
    wave = context.createPeriodicWave(real, imag);
    waveCache.set(context, wave);
  }
  return wave;
}

function releaseVoice(voice: ActiveVoice, context: AudioContext, fade: number): void {
  const now = context.currentTime;
  const param = voice.gain.gain as AudioParam & {
    cancelAndHoldAtTime?: (time: number) => AudioParam;
  };
  if (typeof param.cancelAndHoldAtTime === 'function') {
    param.cancelAndHoldAtTime(now);
  } else {
    param.cancelScheduledValues(now);
    param.setValueAtTime(Math.max(param.value, 0.0001), now);
  }
  param.exponentialRampToValueAtTime(0.0001, now + fade);
  try {
    voice.oscillator.stop(now + fade + 0.02);
  } catch {
    // L'oscillateur était déjà arrêté : rien à faire.
  }
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

/** Joue une note de piano synthétique connectée au gestionnaire central. */
export function playPianoNote(midi: number, options: PlayNoteOptions = {}): void {
  const context = getAudioContext();
  const bus = getMasterBus();
  if (!context || !bus) return;

  while (activeVoices.size >= MAX_VOICES) {
    const oldest = activeVoices.values().next().value as ActiveVoice;
    activeVoices.delete(oldest);
    releaseVoice(oldest, context, 0.04);
  }

  const duration = options.duration ?? 1.7;
  const velocity = Math.min(1, Math.max(options.velocity ?? 1, 0.01));
  const start = context.currentTime + (options.delay ?? 0);
  const frequency = midiToFrequency(midi);

  const noteGain = context.createGain();
  const filter = context.createBiquadFilter();
  filter.type = 'lowpass';
  filter.Q.value = 0.6;
  
  const cutoffStart = Math.min(frequency * 9, 12_000);
  const cutoffEnd = Math.min(Math.max(frequency * 2.2, 900), cutoffStart);
  filter.frequency.setValueAtTime(cutoffStart, start);
  filter.frequency.exponentialRampToValueAtTime(cutoffEnd, start + duration);

  const peak = 0.45 * velocity;
  noteGain.gain.setValueAtTime(0.0001, start);
  noteGain.gain.exponentialRampToValueAtTime(peak, start + 0.01);
  noteGain.gain.exponentialRampToValueAtTime(peak * 0.45, start + 0.14);
  noteGain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  const oscillator = context.createOscillator();
  oscillator.setPeriodicWave(getPianoWave(context));
  oscillator.frequency.value = frequency;
  oscillator.detune.value = (Math.random() - 0.5) * 6;

  oscillator.connect(noteGain);
  noteGain.connect(filter);
  filter.connect(bus);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.05);

  const voice: ActiveVoice = { oscillator, gain: noteGain, filter };
  activeVoices.add(voice);

  oscillator.onended = () => {
    activeVoices.delete(voice);
    oscillator.disconnect();
    noteGain.disconnect();
    filter.disconnect();
  };
}

export function stopAllNotes(): void {
  const context = getAudioContext();
  if (!context) return;
  activeVoices.forEach((voice) => releaseVoice(voice, context, 0.06));
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