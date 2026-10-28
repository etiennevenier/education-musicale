import { onAudioEvent, stopAudio } from './audioManager';

let ready = false;
let group: Set<HTMLAudioElement> | null = null;

/** Autorise temporairement la superposition des pistes d'un même groupe. */
export function allowSimultaneous(audios: HTMLAudioElement[]): void {
  group = new Set(audios);
}

/** Lève l'autorisation ; si owner est fourni, seulement si ce groupe est celui actif. */
export function clearSimultaneous(owner?: HTMLAudioElement[]): void {
  if (!owner || (owner[0] && group?.has(owner[0]))) group = null;
}

/**
 * Exclusivité globale : dès qu'un <audio> démarre, tous les autres (et le lecteur
 * central de audioManager) sont coupés. Idempotent.
 */
export function initAudioExclusivity(): void {
  if (ready || typeof document === 'undefined') return;
  ready = true;

  document.addEventListener(
    'play',
    (event) => {
      const current = event.target;
      if (!(current instanceof HTMLAudioElement)) return;
      // Le lecteur d'audioManager est détaché du DOM : coupure explicite.
      stopAudio();
      document.querySelectorAll<HTMLAudioElement>('audio').forEach((audio) => {
        if (audio === current || audio.paused) return;
        if (group && group.has(current) && group.has(audio)) return;
        audio.pause();
      });
    },
    true,
  );

  // Sens inverse : audioManager démarre → les <audio> du DOM sont mis en pause.
  onAudioEvent('statechange', ({ state }) => {
    if (state !== 'playing') return;
    document.querySelectorAll<HTMLAudioElement>('audio').forEach((audio) => audio.pause());
  });
}
