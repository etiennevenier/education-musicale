/**
 * Contexte Web Audio unique + bus master partagé (MP3 et synthés).
 * Chaîne : entrées -> volume -> limiteur -> sourdine -> sortie.
 */

export const DEFAULT_AUDIO_VOLUME = 0.85;
const RAMP = 0.015; // constante de temps anti-clic (s)

type WebkitWindow = Window & { webkitAudioContext?: typeof AudioContext };

let context: AudioContext | null = null;
let volumeGain: GainNode | null = null;
let muteGain: GainNode | null = null;
let volume = DEFAULT_AUDIO_VOLUME;
let muted = false;

function clamp01(value: number): number {
  return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
}

function buildBus(ctx: AudioContext): void {
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -2;
  limiter.knee.value = 0;
  limiter.ratio.value = 20;
  limiter.attack.value = 0.003;
  limiter.release.value = 0.25;

  volumeGain = ctx.createGain();
  volumeGain.gain.value = volume;
  muteGain = ctx.createGain();
  muteGain.gain.value = muted ? 0 : 1;

  volumeGain.connect(limiter);
  limiter.connect(muteGain);
  muteGain.connect(ctx.destination);
}

/** Contexte unique (null côté serveur ou sans Web Audio). Reprend un contexte suspendu. */
export function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;

  if (!context) {
    const Ctor = window.AudioContext || (window as WebkitWindow).webkitAudioContext;
    if (!Ctor) return null;
    try {
      context = new Ctor();
      buildBus(context);
    } catch {
      context = null;
      return null;
    }
  }

  if (context.state === 'suspended') void context.resume().catch(() => {});
  return context;
}

/** Entrée du bus : y connecter toute source (MP3, synthé). */
export function getMasterBus(): GainNode | null {
  return getAudioContext() ? volumeGain : null;
}

export function setMasterVolume(level: number): number {
  volume = clamp01(level);
  if (context && volumeGain) volumeGain.gain.setTargetAtTime(volume, context.currentTime, RAMP);
  return volume;
}

/** Bascule la sourdine globale (MP3 + synthés). Retourne le nouvel état. */
export function toggleGlobalMute(): boolean {
  muted = !muted;
  if (context && muteGain) muteGain.gain.setTargetAtTime(muted ? 0 : 1, context.currentTime, RAMP);
  return muted;
}

export function getGlobalMuteState(): boolean {
  return muted;
}

/** Suspend le contexte sans le détruire (le lecteur MP3 reste fonctionnel). */
export async function suspendAudioContext(): Promise<void> {
  if (context && context.state === 'running') await context.suspend();
}

/**
 * Coupe le contexte quand l'onglet passe en arrière-plan (économie CPU/batterie).
 * La reprise est automatique au geste suivant : `getAudioContext()` appelle
 * `resume()` si le contexte est suspendu (voir ligne 55).
 */
export function initAudioSuspendOnHidden(): void {
  if (typeof document === 'undefined') return;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) void suspendAudioContext();
  });
}