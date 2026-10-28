import {
  getAudioState,
  getCurrentAudioUrl,
  onAudioEvent,
  pauseAudio,
  playAudio,
  resumeAudio,
  type AudioState,
} from './audioManager';

/** Libellés du bouton d'écoute : identiques dans tous les quiz. */
export const PLAY_LABELS: Record<AudioState, string> = {
  idle: "🔊 Écouter l'extrait",
  loading: '⏳ Chargement…',
  playing: '⏸ Mettre en pause',
  paused: '▶️ Reprendre',
  ended: '🔁 Réécouter',
  error: '⚠️ Réessayer',
};

const sameTrack = (a: string | null, b: string | null): boolean =>
  !!a && !!b && a.normalize('NFC') === b.normalize('NFC');

export interface PlayButtonController {
  /** Définit l'extrait de la question courante (null = aucun). */
  setUrl(url: string | null): void;
  /** Lance l'extrait courant (autoplay après une interaction). */
  play(): void;
  refresh(): void;
}

/**
 * Bouton d'écoute unique : écouter → pause → reprendre → réécouter.
 * Le libellé suit l'état réel du lecteur partagé, uniquement pour SON extrait.
 */
export function bindPlayButton(button: HTMLButtonElement): PlayButtonController {
  let url: string | null = null;

  const refresh = (): void => {
    const isCurrent = !!url && sameTrack(getCurrentAudioUrl(), url);
    const state: AudioState = isCurrent ? getAudioState() : 'idle';
    button.textContent = PLAY_LABELS[state];
    button.disabled = state === 'loading';
  };

  button.addEventListener('click', () => {
    if (!url) return;
    const isCurrent = sameTrack(getCurrentAudioUrl(), url);
    const state = getAudioState();
    if (isCurrent && state === 'playing') pauseAudio();
    else if (isCurrent && state === 'paused') void resumeAudio();
    else void playAudio(url);
  });

  onAudioEvent('statechange', refresh);

  return {
    setUrl(next) {
      url = next;
      refresh();
    },
    play() {
      if (url) void playAudio(url);
    },
    refresh,
  };
}
