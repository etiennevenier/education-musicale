/**
 * Gestionnaire de lecture audio centralisé.
 *
 * Objectifs :
 * - une seule instance de lecture pour tout le site (aucun chevauchement) ;
 * - volume master homogène (0.85 par défaut) + limiteur anti-saturation ;
 * - API simple : playAudio(), stopAudio(), pauseAudio(), resumeAudio() ;
 * - événements écoutables par les composants (statechange, ended, error, ...).
 *
 * Le module est sûr côté serveur : aucun accès au DOM tant que playAudio()
 * n'est pas appelé dans le navigateur.
 */

export type AudioState = 'idle' | 'loading' | 'playing' | 'paused' | 'ended' | 'error';

export type AudioEventName =
  | 'statechange'
  | 'ended'
  | 'error'
  | 'timeupdate'
  | 'loadedmetadata'
  | 'canplay'
  | 'waiting';

export interface AudioEventPayload {
  state: AudioState;
  url: string | null;
  audio: HTMLAudioElement | null;
}

export interface PlayAudioOptions {
  /** Volume propre à cet extrait (0 à 1), appliqué en plus du volume master. */
  volume?: number;
  loop?: boolean;
  /**
   * Réessaie une fois avec l'encodage NFD si le fichier n'est pas trouvé
   * (certains serveurs encodent différemment les accents). Activé par défaut.
   */
  retryOnEncodingError?: boolean;
}

export type AudioListener = (payload: AudioEventPayload) => void;

/** Volume master commun à tous les MP3 du site. */
import {
  DEFAULT_AUDIO_VOLUME,
  getAudioContext,
  getMasterBus,
  getGlobalMuteState,
  setMasterVolume,
} from './audioContext';

export { DEFAULT_AUDIO_VOLUME };
// Compatibilité : anciens imports depuis audioManager
export {
  getAudioContext as getSharedAudioContext,
  getMasterBus as getMasterGainNode,
  toggleGlobalMute,
  getGlobalMuteState,
  suspendAudioContext as closeAudioContext,
} from './audioContext';

const MIN_VOLUME = 0;
const MAX_VOLUME = 1;

function clamp(value: number, min = MIN_VOLUME, max = MAX_VOLUME): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

class AudioManager {
  private audio: HTMLAudioElement | null = null;
  private trackGain: GainNode | null = null;
  private graphAttempted = false;
  private usesWebAudio = false;

  private masterVolume = DEFAULT_AUDIO_VOLUME;
  private playOptions: PlayAudioOptions = {};

  /** Jeton de requête : invalide les lectures devenues obsolètes. */
  private requestId = 0;
  private currentUrl: string | null = null;
  private state: AudioState = 'idle';
  private retriedEncoding = false;

  private listeners = new Map<AudioEventName, Set<AudioListener>>();

  // --- API publique ------------------------------------------------------

  /**
   * Lance un extrait. Si `url` est omise, reprend/relance l'extrait chargé.
   * Coupe systématiquement le son en cours avant de démarrer le suivant.
   */
  async playAudio(url?: string, options: PlayAudioOptions = {}): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    const audio = this.ensureAudio();
    if (!audio) return false;

    const requestId = ++this.requestId;
    this.playOptions = { ...options };
    if (options.retryOnEncodingError !== false) this.retriedEncoding = false;

    if (url) {
      this.hardStop();
      this.currentUrl = url;
      audio.src = url;
      audio.load();
      this.setState('loading');
    } else if (!audio.getAttribute('src')) {
      this.setState('error');
      this.emit('error');
      return false;
    } else if (this.state === 'idle' || this.state === 'ended') {
      // Nouvelle écoute : on repart du début. En pause, on reprend au même endroit.
      audio.currentTime = 0;
    }

    if (options.loop !== undefined) audio.loop = options.loop;
    this.applyVolume();

       this.ensureWebAudio();
    if (this.usesWebAudio) getAudioContext(); // reprend un contexte suspendu

    try {
      await audio.play();
      // Une autre piste a été demandée entre-temps : la requête la plus récente
      // pilote déjà l'élément partagé, on ne le met surtout pas en pause ici.
      if (requestId !== this.requestId) return false;
      this.setState('playing');
      return true;
    } catch {
      if (requestId === this.requestId) {
        this.setState('error');
        this.emit('error');
      }
      return false;
    }
  }

  /**
   * Charge un extrait sans le lire (préchargement).
   * Utile aux quiz qui préparent la question suivante.
   */
  loadAudio(url: string): void {
    const audio = this.ensureAudio();
    if (!audio) return;

    this.requestId += 1; // invalide toute lecture en attente
    this.retriedEncoding = false;
    this.hardStop();
    this.currentUrl = url;
    audio.src = url;
    audio.load();
    this.setState('idle');
  }

  /** Arrête complètement la lecture et remet l'extrait au début. */
  stopAudio(): void {
    this.requestId += 1;
    this.hardStop();
    this.setState('idle');
  }

  /** Met en pause l'extrait en cours (le bouton peut ensuite le reprendre). */
  pauseAudio(): void {
    if (!this.audio || this.state !== 'playing') return;
    this.audio.pause();
    this.setState('paused');
  }

  /** Reprend l'extrait en pause, ou relance l'extrait terminé. */
  resumeAudio(): Promise<boolean> {
    return this.playAudio();
  }

  /** Règle le volume master (0 à 1). Retourne la valeur réellement appliquée. */
    setVolume(level: number): number {
    this.masterVolume = setMasterVolume(level);
    this.applyVolume();
    return this.masterVolume;
  }

  getVolume(): number {
    return this.masterVolume;
  }

  getState(): AudioState {
    return this.state;
  }

  getCurrentUrl(): string | null {
    return this.currentUrl;
  }

  /** Abonne un composant aux événements du lecteur. Retourne une fonction de désabonnement. */
  on(event: AudioEventName, listener: AudioListener): () => void {
    let listeners = this.listeners.get(event);
    if (!listeners) {
      listeners = new Set();
      this.listeners.set(event, listeners);
    }
    listeners.add(listener);
    return () => this.off(event, listener);
  }

  off(event: AudioEventName, listener: AudioListener): void {
    this.listeners.get(event)?.delete(listener);
  }

  // --- Interne -----------------------------------------------------------

  private ensureAudio(): HTMLAudioElement | null {
    if (typeof window === 'undefined' || typeof Audio === 'undefined') return null;

    if (!this.audio) {
      const audio = new Audio();
      audio.preload = 'auto';
      audio.volume = this.masterVolume;
      this.bindNativeEvents(audio);
      this.audio = audio;
    }

    return this.audio;
  }

  private bindNativeEvents(audio: HTMLAudioElement): void {
    audio.addEventListener('playing', () => this.setState('playing'));
    audio.addEventListener('ended', () => {
      this.setState('ended');
      this.emit('ended');
    });
    audio.addEventListener('error', () => this.handlePlaybackError());
    audio.addEventListener('timeupdate', () => this.emit('timeupdate'));
    audio.addEventListener('loadedmetadata', () => this.emit('loadedmetadata'));
    audio.addEventListener('canplay', () => this.emit('canplay'));
    audio.addEventListener('waiting', () => this.emit('waiting'));
  }

  /**
   * Construit une seule fois la chaîne Web Audio :
   * source -> gain de piste -> gain master -> limiteur -> sortie.
   * En cas d'échec (navigateur sans Web Audio), on retombe sur audio.volume.
   */
  /** Branche l'élément audio sur le bus partagé : source -> gain de piste -> bus. */
/** Branche l'élément audio sur le bus partagé : source -> gain de piste -> bus. */
  private ensureWebAudio(): void {
    if (this.graphAttempted || !this.audio) return;
    this.graphAttempted = true;

    const context = getAudioContext();
    const bus = getMasterBus();
    if (!context || !bus) {
      this.applyFallbackVolume();
      return;
    }

    try {
      const source = context.createMediaElementSource(this.audio);
      const trackGain = context.createGain();
      trackGain.gain.value = clamp(this.playOptions.volume ?? 1);
      source.connect(trackGain);
      trackGain.connect(bus);

      this.trackGain = trackGain;
      this.usesWebAudio = true;
      this.audio.volume = 1; // le bus gère le volume
    } catch {
      this.usesWebAudio = false;
      this.applyFallbackVolume();
    }
  }

  /** Coupe le son en cours sans émettre d'état « pause ». */
  private hardStop(): void {
    if (!this.audio) return;
    this.audio.pause();
    try {
      this.audio.currentTime = 0;
    } catch {
      // Le média n'a pas encore de métadonnées : rien à remettre à zéro.
    }
    this.setState('idle');
  }

  private handlePlaybackError(): void {
    if (
      this.playOptions.retryOnEncodingError !== false &&
      !this.retriedEncoding &&
      this.currentUrl
    ) {
      const retryUrl = this.currentUrl.normalize('NFD');
      if (retryUrl !== this.currentUrl) {
        this.retriedEncoding = true;
        void this.playAudio(retryUrl, { ...this.playOptions, retryOnEncodingError: false });
        return;
      }
    }

    this.setState('error');
    this.emit('error');
  }

  private applyVolume(): void {
    const trackVolume = clamp(this.playOptions.volume ?? 1);
    if (this.usesWebAudio && this.trackGain) {
      this.trackGain.gain.value = trackVolume;
    } else if (this.audio) {
      this.applyFallbackVolume(trackVolume);
    }
  }

  private applyFallbackVolume(trackVolume = clamp(this.playOptions.volume ?? 1)): void {
    if (!this.audio) return;
    this.audio.volume = clamp(this.masterVolume * trackVolume);
    this.audio.muted = getGlobalMuteState();
  }

  private setState(next: AudioState): void {
    if (this.state === next) return;
    this.state = next;
    this.emit('statechange');
  }

  private emit(event: AudioEventName): void {
    const listeners = this.listeners.get(event);
    if (!listeners || listeners.size === 0) return;

    const payload: AudioEventPayload = {
      state: this.state,
      url: this.currentUrl,
      audio: this.audio,
    };

    listeners.forEach((listener) => {
      try {
        listener(payload);
      } catch {
        // Un abonné défaillant ne doit pas bloquer les autres.
      }
    });
  }
}

/** Instance unique partagée par tous les composants de la page. */
export const audioManager = new AudioManager();

// --- Raccourcis fonctionnels (API demandée) ------------------------------

export function playAudio(url?: string, options?: PlayAudioOptions): Promise<boolean> {
  return audioManager.playAudio(url, options);
}

export function stopAudio(): void {
  audioManager.stopAudio();
}

export function pauseAudio(): void {
  audioManager.pauseAudio();
}

export function resumeAudio(): Promise<boolean> {
  return audioManager.resumeAudio();
}

export function getAudioState(): AudioState {
  return audioManager.getState();
}

export function getCurrentAudioUrl(): string | null {
  return audioManager.getCurrentUrl();
}

export function onAudioEvent(event: AudioEventName, listener: AudioListener): () => void {
  return audioManager.on(event, listener);
}