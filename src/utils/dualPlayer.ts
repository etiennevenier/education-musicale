import { getAudioContext, getMasterBus } from './audioContext';
import { formatTime } from './formatTime';
import { allowSimultaneous, clearSimultaneous, initAudioExclusivity } from './audioExclusivity';

type Player = {
  audio: HTMLAudioElement;
  card: HTMLElement;
  playBtn: HTMLButtonElement;
  cueBtn: HTMLButtonElement;
  resetBtn: HTMLButtonElement;
  cueTimeEl: HTMLElement;
  marker: HTMLButtonElement;
  range: HTMLInputElement;
  fill: HTMLElement;
  currentEl: HTMLElement;
  durationEl: HTMLElement;
  cue: number | null;
  raf: number;
};

const routed = new WeakSet<HTMLAudioElement>();

/** Route un <audio> vers le bus unique (sourdine / limiteur). Sortie native conservée en cas d'échec. */
async function routeThroughBus(audio: HTMLAudioElement): Promise<void> {
  if (routed.has(audio)) return;
  routed.add(audio);
  try {
    // createMediaElementSource rend l'élément muet sans CORS : sources externes exclues.
    const url = new URL(audio.currentSrc || audio.src, location.href);
    if (url.origin !== location.origin) return;
    const ctx: unknown = await Promise.resolve(getAudioContext());
    const input: unknown = await Promise.resolve(getMasterBus());
    if (!(ctx instanceof AudioContext) || !(input instanceof AudioNode)) return;
    if (ctx.state === 'suspended') await ctx.resume();
    ctx.createMediaElementSource(audio).connect(input);
  } catch {
    // Sortie native conservée.
  }
}

function collectPlayers(root: HTMLElement): Player[] {
  const players: Player[] = [];
  root.querySelectorAll<HTMLElement>('[data-card]').forEach((card) => {
    const audio = card.querySelector<HTMLAudioElement>('[data-audio]');
    const range = card.querySelector<HTMLInputElement>('[data-range]');
    const fill = card.querySelector<HTMLElement>('[data-fill]');
    const marker = card.querySelector<HTMLButtonElement>('[data-marker]');
    const playBtn = card.querySelector<HTMLButtonElement>('[data-play]');
    const cueBtn = card.querySelector<HTMLButtonElement>('[data-cue]');
    const resetBtn = card.querySelector<HTMLButtonElement>('[data-reset]');
    const cueTimeEl = card.querySelector<HTMLElement>('[data-cue-time]');
    const currentEl = card.querySelector<HTMLElement>('[data-current]');
    const durationEl = card.querySelector<HTMLElement>('[data-duration]');
    if (
      !audio || !range || !fill || !marker || !playBtn || !cueBtn ||
      !resetBtn || !cueTimeEl || !currentEl || !durationEl
    ) {
      return;
    }
    players.push({
      audio, card, playBtn, cueBtn, resetBtn, cueTimeEl, marker, range, fill,
      currentEl, durationEl, cue: null, raf: 0,
    });
  });
  return players;
}

function setupRoot(root: HTMLElement): void {
  const groupBtn = root.querySelector<HTMLButtonElement>('[data-play-all]');
  const players = collectPlayers(root);
  const audios = players.map((p) => p.audio);

  const paintRange = (player: Player) => {
    const duration = player.audio.duration;
    const progress =
      Number.isFinite(duration) && duration > 0
        ? Math.min(1, Math.max(0, player.audio.currentTime / duration))
        : 0;
    // Même géométrie que le pouce : le remplissage s'arrête sous le centre du pouce.
    player.fill.style.width = 'calc((100% - var(--thumb-size)) * ' + progress + ')';
  };

  const paintCue = (player: Player) => {
    const duration = player.audio.duration;
    if (player.cue === null || !Number.isFinite(duration) || duration <= 0) {
      player.marker.hidden = true;
      player.resetBtn.disabled = true;
      player.cueTimeEl.hidden = true;
      return;
    }
    const progress = player.cue / duration;
    player.marker.hidden = false;
    player.marker.style.left =
      'calc(var(--thumb-size) / 2 + (100% - var(--thumb-size)) * ' + progress + ')';
    const trackLabel = player.card.dataset.label ?? '';
    player.marker.setAttribute(
      'aria-label',
      'Revenir au repère ' + formatTime(player.cue) + ' — ' + trackLabel,
    );
    player.resetBtn.disabled = false;
    player.cueTimeEl.hidden = false;
    player.cueTimeEl.textContent = formatTime(player.cue);
  };

  /** Recale durée et course du range (loadedmetadata peut précéder l'exécution du script). */
  const syncMetadata = (player: Player) => {
    const duration = player.audio.duration;
    if (!Number.isFinite(duration) || duration <= 0) return;
    player.range.max = String(duration);
    player.durationEl.textContent = formatTime(duration);
    paintRange(player);
    paintCue(player);
  };

  const render = (player: Player) => {
    const { audio } = player;
    const text = formatTime(audio.currentTime);
    if (player.currentEl.textContent !== text) {
      player.currentEl.textContent = text;
      player.range.setAttribute('aria-valuetext', text + ' sur ' + formatTime(audio.duration));
    }
    player.range.value = String(audio.currentTime);
    paintRange(player);
  };

  // Boucle rAF active uniquement pendant la lecture : remplissage fluide.
  const loop = (player: Player) => {
    render(player);
    player.raf = player.audio.paused ? 0 : requestAnimationFrame(() => loop(player));
  };
  const startLoop = (player: Player) => {
    if (!player.raf) player.raf = requestAnimationFrame(() => loop(player));
  };

  const syncPlayButton = (player: Player) => {
    const playing = !player.audio.paused;
    const trackLabel = player.card.dataset.label ?? '';
    let action = 'Lire';
    if (playing) action = 'Mettre en pause';
    else if (player.cue !== null) action = 'Lire depuis le repère ' + formatTime(player.cue);
    player.playBtn.textContent = playing ? '❚❚' : '▶';
    player.playBtn.setAttribute('aria-label', action + ' ' + trackLabel);
    player.card.classList.toggle('is-playing', playing);
  };

  const syncGroup = () => {
    if (!groupBtn) return;
    const anyPlaying = players.some((p) => !p.audio.paused);
    const letters = players.map((p) => p.card.dataset.letter ?? '').join(' + ');
    groupBtn.textContent = (anyPlaying ? 'Pause' : 'Play') + ' ' + letters;
  };

  // Toute lecture repart du repère s'il existe, sinon du début (ou d'où elle en était).
  const startPlayback = async (player: Player): Promise<void> => {
    const { audio } = player;
    if (player.cue !== null) audio.currentTime = player.cue;
    else if (audio.ended) audio.currentTime = 0;
    await audio.play().catch(() => {});
  };

  const onStopped = (player: Player) => {
    render(player);
    syncPlayButton(player);
    syncGroup();
    if (audios.every((a) => a.paused)) clearSimultaneous(audios);
  };

  players.forEach((player) => {
    const { audio } = player;
    player.range.step = 'any';

    player.playBtn.addEventListener('click', () => {
      if (audio.paused) {
        clearSimultaneous();
        void startPlayback(player);
      } else {
        audio.pause();
      }
    });

    audio.addEventListener('play', () => {
      // Quel que soit le déclencheur (bouton, clavier, touches média), repartir du repère.
      if (player.cue !== null && audio.readyState > 0 && Math.abs(audio.currentTime - player.cue) > 0.1) {
        audio.currentTime = player.cue;
      }
      void routeThroughBus(audio);
      startLoop(player);
      syncPlayButton(player);
      syncGroup();
    });
    audio.addEventListener('pause', () => onStopped(player));
    audio.addEventListener('ended', () => onStopped(player));

    audio.addEventListener('loadedmetadata', () => syncMetadata(player));
    audio.addEventListener('durationchange', () => syncMetadata(player));
    audio.addEventListener('canplay', () => syncMetadata(player));
    audio.addEventListener('timeupdate', () => {
      if (Number.isFinite(audio.duration) && Number(player.range.max) !== audio.duration) {
        syncMetadata(player);
      }
      if (audio.paused) render(player);
    });

    player.range.addEventListener('input', () => {
      if (!Number.isFinite(audio.duration)) return;
      audio.currentTime = Number(player.range.value);
      render(player);
    });

    player.cueBtn.addEventListener('click', () => {
      player.cue = audio.currentTime;
      paintCue(player);
      syncPlayButton(player);
    });

    player.resetBtn.addEventListener('click', () => {
      player.cue = null;
      if (audio.readyState > 0) audio.currentTime = 0;
      render(player);
      paintCue(player);
      syncPlayButton(player);
    });

    player.marker.addEventListener('click', () => {
      if (player.cue === null) return;
      clearSimultaneous();
      audio.currentTime = player.cue;
      void audio.play().catch(() => {});
    });
    syncPlayButton(player);
    render(player);
    syncMetadata(player);
  });

  syncGroup();

  groupBtn?.addEventListener('click', () => {
    if (players.some((p) => !p.audio.paused)) {
      players.forEach((p) => p.audio.pause());
      clearSimultaneous(audios);
      return;
    }
    allowSimultaneous(audios);
    void Promise.all(players.map(startPlayback)).then(() => {
      if (audios.every((a) => a.paused)) clearSimultaneous(audios);
    });
  });
}

/** Initialise tous les blocs [data-dual-player] (idempotent). */
export function initDualPlayers(scope: ParentNode = document): void {
  initAudioExclusivity();
  scope.querySelectorAll<HTMLElement>('[data-dual-player]').forEach((root) => {
    if (root.dataset.dualReady === 'true') return;
    root.dataset.dualReady = 'true';
    setupRoot(root);
  });
}
