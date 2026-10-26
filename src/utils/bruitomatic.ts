/**
 * Séquenceur « Bruitomatic » : moteur d’interface et Web Audio.
 * Logique extraite de Bruitomatic.astro pour alléger le composant.
 */
  import { shuffle } from '../utils/random';
  import { stopAudio, onAudioEvent } from '../utils/audioManager';
  import { getAudioContext, getMasterBus } from '../utils/audioContext';

  interface BruitomaticPresetData {
    id: string;
    name: string;
    icon: string;
    desc: string;
    pattern: Record<string, number[]>;
  }

  interface TrackState {
    id: string;
    name: string;
    category: string;
    volume: number;
    muted: boolean;
    solo: boolean;
    buffer: AudioBuffer | null;
    gain: GainNode | null;
    row: HTMLElement;
  }


export function initBruitomatic(root: HTMLElement): void {
    const STEPS = 16;
    const LOOKAHEAD_MS = 25;
    const SCHEDULE_AHEAD = 0.12;
    const DEFAULT_BPM = 100;

    const must = <T extends Element>(selector: string): T => {
      const element = root.querySelector<T>(selector);
      if (!element) throw new Error(`Élément introuvable : ${selector}`);
      return element;
    };

    const playButton = must<HTMLButtonElement>('#bruitomaticPlay');
    const pauseButton = must<HTMLButtonElement>('#bruitomaticPause');
    const stopButton = must<HTMLButtonElement>('#bruitomaticStop');
    const clearButton = must<HTMLButtonElement>('#bruitomaticClear');
    const bpmInput = must<HTMLInputElement>('#bruitomaticBpm');
    const bpmOutput = must<HTMLOutputElement>('#bruitomaticBpmValue');
    const statusElement = must<HTMLParagraphElement>('#bruitomaticStatus');
    const board = must<HTMLElement>('#bruitomaticBoard');
    const labelsToggle = must<HTMLButtonElement>('#bruitomaticLabelToggle');
    const presetButtons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-preset]'));
    const randomButton = must<HTMLButtonElement>('#bruitomaticRandom');
    const groupMuteButtons = Array.from(
      root.querySelectorAll<HTMLButtonElement>('[data-group-mute]'),
    );
    const memorySaveButtons = Array.from(
      root.querySelectorAll<HTMLButtonElement>('[data-memory-save]'),
    );
    const memoryRecallButtons = Array.from(
      root.querySelectorAll<HTMLButtonElement>('[data-memory-recall]'),
    );

    const presetData: BruitomaticPresetData[] = (() => {
      const holder = document.getElementById('bruitomaticPresets');
      const raw = holder?.getAttribute('data-presets');
      if (!raw) return [];
      try {
        return JSON.parse(raw) as BruitomaticPresetData[];
      } catch {
        return [];
      }
    })();

    const setStatus = (message: string) => {
      statusElement.textContent = message;
    };

    // --- Panneau latéral des pistes -----------------------------------------

    let labelsHidden = false;

    const setLabelsHidden = (hidden: boolean, announce = true) => {
      labelsHidden = hidden;
      board.classList.toggle('is-labels-hidden', hidden);
      labelsToggle.setAttribute('aria-expanded', String(!hidden));
      labelsToggle.setAttribute(
        'aria-label',
        hidden ? 'Afficher le panneau des pistes' : 'Masquer le panneau des pistes',
      );
      labelsToggle.title = hidden
        ? 'Afficher le panneau des pistes'
        : 'Masquer le panneau des pistes';
      if (announce) {
        setStatus(
          hidden
            ? 'Panneau des pistes masqué : la grille est plus large. Clique sur ▶ en haut à gauche pour le rouvrir.'
            : 'Panneau des pistes affiché : tu peux régler chaque son (écoute, muet, solo, volume).',
        );
      }
    };

    labelsToggle.addEventListener('click', () => {
      setLabelsHidden(!labelsHidden);
    });

    // --- Pistes et motifs ---------------------------------------------------

    const tracks = new Map<string, TrackState>();
    root.querySelectorAll<HTMLElement>('.seq-row').forEach((row) => {
      const id = row.dataset.trackId;
      if (!id) return;
      const name = row.querySelector<HTMLElement>('.seq-name')?.textContent?.trim() ?? id;
      tracks.set(id, {
        id,
        name,
        category: row.dataset.category ?? '',
        volume: 0.8,
        muted: false,
        solo: false,
        buffer: null,
        gain: null,
        row,
      });
    });

    const pattern = new Map<string, boolean[]>();
    tracks.forEach((_track, id) => {
      pattern.set(id, Array<boolean>(STEPS).fill(false));
    });

    const cells = Array.from(root.querySelectorAll<HTMLButtonElement>('.seq-cell'));
    const cellsByStep: HTMLButtonElement[][] = Array.from({ length: STEPS }, () => []);
    cells.forEach((cell) => {
      const step = Number(cell.dataset.step);
      if (Number.isInteger(step) && step >= 0 && step < STEPS) {
        cellsByStep[step].push(cell);
      }
    });
    const ticks = Array.from(root.querySelectorAll<HTMLElement>('.seq-tick'));

    // --- Contexte Web Audio -------------------------------------------------

        let ctx: AudioContext | null = null;
    let mixGain: GainNode | null = null;

    /**
     * Contexte et bus master partagés du site ; sous-mix local
     * (gain + compresseur réglé pour la somme des pistes) branché sur le bus.
     */
    const ensureContext = (): AudioContext | null => {
      const context = getAudioContext(); // reprend aussi un contexte suspendu
      const bus = getMasterBus();
      if (!context || !bus) {
        setStatus('Ton navigateur ne prend pas en charge le séquenceur audio.');
        return null;
      }

      if (!mixGain) {
        const mix = context.createGain();
        mix.gain.value = 0.9;

        const limiter = context.createDynamicsCompressor();
        limiter.threshold.value = -8;
        limiter.knee.value = 6;
        limiter.ratio.value = 12;
        limiter.attack.value = 0.003;
        limiter.release.value = 0.25;

        mix.connect(limiter);
        limiter.connect(bus);
        mixGain = mix;
      }

      ctx = context;
      return context;
    };

    // --- Chargement des sons ------------------------------------------------

    let loadPromise: Promise<number> | null = null;

    const loadSounds = (): Promise<number> => {
      if (loadPromise) return loadPromise;

      const context = ensureContext();
      const master = mixGain;
      if (!context || !master) return Promise.resolve(0);

      const entries = Array.from(tracks.values());
      let done = 0;

      setStatus(`Chargement des sons… 0/${entries.length}`);

      loadPromise = Promise.all(
        entries.map(async (track) => {
          const src = track.row.dataset.src;
          if (!src) return;

          track.row.classList.remove('is-unavailable');
          track.row.querySelectorAll<HTMLButtonElement>('button').forEach((button) => {
            button.disabled = false;
          });

          if (!track.gain) {
            track.gain = context.createGain();
            track.gain.gain.value = 0;
            track.gain.connect(master);
          }

          try {
            let response = await fetch(src);
            if (!response.ok) {
              const normalized = src.normalize('NFD');
              if (normalized !== src) response = await fetch(normalized);
            }
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.arrayBuffer();
            track.buffer = await context.decodeAudioData(data);
          } catch (error) {
            console.warn('[Bruitomatic] Son indisponible :', src, error);
            track.buffer = null;
            track.row.classList.add('is-unavailable');
            track.row
              .querySelectorAll<HTMLButtonElement>('button')
              .forEach((button) => {
                button.disabled = true;
              });
          } finally {
            done += 1;
            setStatus(`Chargement des sons… ${done}/${entries.length}`);
          }
        }),
      ).then(() => {
        const ready = entries.filter((track) => track.buffer).length;
        const missing = entries.length - ready;
        applyVolumes();

        if (ready === 0) {
          loadPromise = null;
          setStatus(
            "Aucun son n'a pu être chargé. Vérifie que le dossier /bruits/ est accessible, puis réessaie.",
          );
        } else {
          setStatus(
            missing === 0
              ? 'Sons prêts. Clique sur Lecture pour lancer la boucle.'
              : `Sons prêts (${missing} fichier(s) introuvable(s)). Clique sur Lecture.`,
          );
        }
        return ready;
      });

      return loadPromise;
    };

    // --- Volume, mute et solo ----------------------------------------------

    const anySolo = (): boolean => Array.from(tracks.values()).some((track) => track.solo);

    const gainFor = (track: TrackState, soloActive: boolean): number => {
      if (track.muted) return 0;
      if (soloActive && !track.solo) return 0;
      return track.volume;
    };

    const applyVolumes = () => {
      const context = ctx;
      if (!context) return;
      const soloActive = anySolo();
      tracks.forEach((track) => {
        if (!track.gain) return;
        track.gain.gain.setTargetAtTime(gainFor(track, soloActive), context.currentTime, 0.01);
      });
    };

    const tracksInCategory = (categoryId: string): TrackState[] =>
      Array.from(tracks.values()).filter((track) => track.category === categoryId);

    const updateGroupMuteUI = () => {
      groupMuteButtons.forEach((button) => {
        const categoryId = button.dataset.groupMute;
        if (!categoryId) return;

        const familyTracks = tracksInCategory(categoryId);
        const allMuted =
          familyTracks.length > 0 && familyTracks.every((track) => track.muted);
        const someMuted = familyTracks.some((track) => track.muted);
        const family = button.dataset.groupName ?? 'cette famille';
        const label = allMuted
          ? `Muet : rétablir tous les sons de la famille ${family}`
          : `Muet : couper tous les sons de la famille ${family}`;

        button.setAttribute('aria-pressed', String(allMuted));
        button.classList.toggle('is-active', allMuted);
        button.classList.toggle('is-partial', someMuted && !allMuted);
        button.setAttribute('aria-label', label);
        button.title = label;
      });
    };

    const toggleGroupMute = (button: HTMLButtonElement) => {
      const categoryId = button.dataset.groupMute;
      if (!categoryId) return;

      const familyTracks = tracksInCategory(categoryId);
      if (familyTracks.length === 0) return;

      const shouldMute = !familyTracks.every((track) => track.muted);
      familyTracks.forEach((track) => {
        track.muted = shouldMute;
        const muteButton = track.row.querySelector<HTMLButtonElement>('[data-mute]');
        if (!muteButton) return;
        muteButton.setAttribute('aria-pressed', String(track.muted));
        muteButton.classList.toggle('is-active', track.muted);
      });

      applyVolumes();
      updateGroupMuteUI();
      const family = button.dataset.groupName ?? 'cette famille';
      setStatus(
        shouldMute
          ? `Tous les sons de la famille ${family} sont coupés.`
          : `Tous les sons de la famille ${family} sont réactivés.`,
      );
    };

    groupMuteButtons.forEach((button) => {
      button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        toggleGroupMute(button);
      });
    });

    // --- Lecture et programmation ------------------------------------------

    let playing = false;
    let loading = false;
    let playRequestId = 0;
    let bpm = DEFAULT_BPM;
    let nextStep = 0;
    let nextTime = 0;
    let lastStep = -1;
    let playTimer: number | null = null;
    let rafId: number | null = null;
    let uiQueue: { step: number; time: number }[] = [];
    const liveSources = new Set<AudioBufferSourceNode>();

    const updateTransport = () => {
      playButton.disabled = playing || loading;
      pauseButton.disabled = !playing;
      playButton.classList.toggle('is-active', playing);
    };

    const setPlayhead = (step: number) => {
      if (step === lastStep) return;
      if (lastStep >= 0) {
        cellsByStep[lastStep]?.forEach((cell) => cell.classList.remove('is-current'));
        ticks[lastStep]?.classList.remove('is-current');
      }
      lastStep = step;
      if (step >= 0) {
        cellsByStep[step]?.forEach((cell) => cell.classList.add('is-current'));
        ticks[step]?.classList.add('is-current');
      }
    };

    const clearLiveSources = () => {
      liveSources.forEach((source) => {
        try {
          source.stop();
        } catch {
          // Source déjà arrêtée : rien à faire.
        }
      });
      liveSources.clear();
    };

    const scheduleStep = (step: number, time: number) => {
      const context = ctx;
      if (!context) return;

      const soloActive = anySolo();
      tracks.forEach((track) => {
        if (!track.buffer || !track.gain) return;
        if (track.muted || (soloActive && !track.solo)) return;

        const rowPattern = pattern.get(track.id);
        if (!rowPattern?.[step]) return;

        const source = context.createBufferSource();
        source.buffer = track.buffer;
        source.connect(track.gain);
        source.start(time);
        liveSources.add(source);
        source.addEventListener('ended', () => liveSources.delete(source), { once: true });
      });
    };

    const scheduler = () => {
      const context = ctx;
      if (!context || !playing) return;

      while (nextTime < context.currentTime + SCHEDULE_AHEAD) {
        scheduleStep(nextStep, nextTime);
        uiQueue.push({ step: nextStep, time: nextTime });
        nextTime += 60 / bpm / 4;
        nextStep = (nextStep + 1) % STEPS;
      }
    };

    const tick = () => {
      const context = ctx;
      if (!context) {
        rafId = null;
        return;
      }

      const now = context.currentTime;
      while (uiQueue.length > 0 && (uiQueue[0]?.time ?? Infinity) <= now + 0.02) {
        const scheduled = uiQueue.shift();
        if (scheduled) setPlayhead(scheduled.step);
      }

      rafId = playing ? window.requestAnimationFrame(tick) : null;
    };

    const startPlayback = async () => {
      if (playing || loading) return;

      const context = ensureContext();
      if (!context) return;

      stopAudio(); // une seule source sonore à la fois sur le site

      if (!hasActiveSteps()) applyPresetById('groove');

      const requestId = ++playRequestId;
      loading = true;
      updateTransport();
      const ready = await loadSounds();
      if (requestId !== playRequestId) return;
      loading = false;

      if (ready === 0) {
        updateTransport();
        return;
      }

      if (context.state === 'suspended') {
        try {
          await context.resume();
        } catch {
          // La reprise sera retentée au prochain clic.
        }
      }

      playing = true;
      if (lastStep < 0) nextStep = 0;
      nextTime = context.currentTime + 0.08;
      uiQueue = [];

      if (playTimer !== null) window.clearInterval(playTimer);
      playTimer = window.setInterval(scheduler, LOOKAHEAD_MS);
      scheduler();

      if (rafId === null) rafId = window.requestAnimationFrame(tick);

      updateTransport();
      setStatus('Lecture : la boucle de 16 pas tourne. Clique sur les cases pour la modifier.');
    };

    const pausePlayback = (silent = false) => {
      if (!playing) return;

      playing = false;
      if (playTimer !== null) {
        window.clearInterval(playTimer);
        playTimer = null;
      }
      clearLiveSources();
      uiQueue = [];
      if (lastStep >= 0) nextStep = (lastStep + 1) % STEPS;

      updateTransport();
      if (!silent) setStatus('Pause : clique sur Lecture pour reprendre au pas suivant.');
    };

    const stopPlayback = (silent = false) => {
      playRequestId += 1;
      playing = false;
      loading = false;

      if (playTimer !== null) {
        window.clearInterval(playTimer);
        playTimer = null;
      }
      clearLiveSources();
      uiQueue = [];
      nextStep = 0;

      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
        rafId = null;
      }
      setPlayhead(-1);
      updateTransport();

      if (!silent) setStatus('Stop : la lecture est arrêtée et la tête de lecture revenue au début.');
    };

    // --- Interaction avec la grille ----------------------------------------

    const toggleCell = (cell: HTMLButtonElement) => {
      const id = cell.dataset.track;
      const step = Number(cell.dataset.step);
      if (!id || !Number.isInteger(step)) return;

      const rowPattern = pattern.get(id);
      if (!rowPattern) return;

      rowPattern[step] = !rowPattern[step];
      cell.setAttribute('aria-pressed', String(rowPattern[step]));
      presetButtons.forEach((button) => button.classList.remove('is-active'));

      if (rowPattern[step] && !playing) void previewTrack(id);
    };

    const syncCells = () => {
      cells.forEach((cell) => {
        const id = cell.dataset.track;
        const step = Number(cell.dataset.step);
        const active = Boolean(id && pattern.get(id)?.[step]);
        cell.setAttribute('aria-pressed', String(active));
      });
    };

    const applyPattern = (partial: Record<string, number[]>) => {
      pattern.forEach((rowPattern) => rowPattern.fill(false));
      Object.entries(partial).forEach(([id, activeSteps]) => {
        const rowPattern = pattern.get(id);
        if (!rowPattern) return;
        activeSteps.forEach((step) => {
          if (step >= 0 && step < STEPS) rowPattern[step] = true;
        });
      });

      syncCells();
    };

    const clearGrid = () => {
      pattern.forEach((rowPattern) => rowPattern.fill(false));
      syncCells();
      presetButtons.forEach((button) => button.classList.remove('is-active'));
      setStatus('Grille effacée : repars d’une page blanche ou choisis un modèle.');
    };

    const hasActiveSteps = (): boolean =>
      Array.from(pattern.values()).some((rowPattern) => rowPattern.some(Boolean));

    const applyPresetById = (id: string): boolean => {
      const preset = presetData.find((item) => item.id === id);
      if (!preset) return false;

      applyPattern(preset.pattern);
      presetButtons.forEach((button) => {
        button.classList.toggle('is-active', button.dataset.preset === id);
      });
      return true;
    };

    // --- Génération aléatoire ------------------------------------------------

    const randomInt = (min: number, max: number): number =>
      Math.floor(Math.random() * (max - min + 1)) + min;

    const pickOne = <T,>(items: T[]): T => items[randomInt(0, items.length - 1)]!;

    const randomizePattern = () => {
      const allTracks = Array.from(tracks.values());
      if (allTracks.length === 0) return;

      const familyIds = Array.from(
        new Set(allTracks.map((track) => track.category).filter(Boolean)),
      );
      const selected = new Map<string, TrackState>();
      const familyCount = Math.min(familyIds.length, randomInt(3, 4));

      shuffle(familyIds)
        .slice(0, familyCount)
        .forEach((categoryId) => {
          const familyTracks = allTracks.filter((track) => track.category === categoryId);
          if (familyTracks.length === 0) return;
          const track = pickOne(familyTracks);
          selected.set(track.id, track);
        });

      const remaining = shuffle(allTracks.filter((track) => !selected.has(track.id)));
      const minTrackCount = Math.min(6, allTracks.length);
      const maxTrackCount = Math.min(8, allTracks.length);
      const targetTrackCount = randomInt(minTrackCount, maxTrackCount);

      while (selected.size < targetTrackCount && remaining.length > 0) {
        const track = remaining.pop();
        if (track) selected.set(track.id, track);
      }

      const randomPattern: Record<string, number[]> = {};
      const hitsByStep = Array<number>(STEPS).fill(0);
      const strongBeats = [0, 4, 8, 12];
      const maxHitsPerStep = 3;
      const maxTotalHits = 24;
      let totalHits = 0;

      selected.forEach((track) => {
        const desiredHits = randomInt(2, 3);
        const stepsForTrack = new Set<number>();

        const addStep = (step: number): boolean => {
          if (stepsForTrack.has(step)) return false;
          if ((hitsByStep[step] ?? 0) >= maxHitsPerStep) return false;
          if (totalHits >= maxTotalHits) return false;
          stepsForTrack.add(step);
          hitsByStep[step] = (hitsByStep[step] ?? 0) + 1;
          totalHits += 1;
          return true;
        };

        if (Math.random() < 0.7) {
          addStep(pickOne(strongBeats));
        }

        const candidates = shuffle(Array.from({ length: STEPS }, (_value, step) => step));
        while (stepsForTrack.size < desiredHits && totalHits < maxTotalHits) {
          const available = candidates.filter(
            (step) => !stepsForTrack.has(step) && (hitsByStep[step] ?? 0) < maxHitsPerStep,
          );
          if (available.length === 0) break;

          const strongAvailable = available.filter((step) => step % 4 === 0);
          const step =
            strongAvailable.length > 0 && Math.random() < 0.3
              ? pickOne(strongAvailable)
              : pickOne(available);
          addStep(step);
        }

        if (stepsForTrack.size > 0) {
          randomPattern[track.id] = Array.from(stepsForTrack).sort((a, b) => a - b);
        }
      });

      if (totalHits === 0) {
        setStatus('La génération aléatoire n’a rien produit. Réessaie.');
        return;
      }

      applyPattern(randomPattern);
      presetButtons.forEach((button) => button.classList.remove('is-active'));

      const familyTotal = new Set(
        Array.from(selected.values())
          .map((track) => track.category)
          .filter(Boolean),
      ).size;
      setStatus(
        `Séquence aléatoire : ${selected.size} sons dans ${familyTotal} familles, ${totalHits} frappes. ${
          playing ? 'Le motif change en direct.' : 'Lance la lecture pour l’écouter.'
        }`,
      );
    };

    // --- Mémoire temporaire (deux boutons, effacés en quittant la page) -----

    type MemorySlot = '1' | '2';

    const memory: Record<MemorySlot, Map<string, boolean[]> | null> = {
      '1': null,
      '2': null,
    };

    const snapshotPattern = (): Map<string, boolean[]> => {
      const snapshot = new Map<string, boolean[]>();
      pattern.forEach((rowPattern, id) => {
        snapshot.set(id, [...rowPattern]);
      });
      return snapshot;
    };

    const restorePattern = (snapshot: Map<string, boolean[]>) => {
      pattern.forEach((rowPattern, id) => {
        const saved = snapshot.get(id);
        if (!saved) {
          rowPattern.fill(false);
          return;
        }
        saved.forEach((active, step) => {
          rowPattern[step] = active;
        });
      });

      syncCells();
      presetButtons.forEach((button) => button.classList.remove('is-active'));
    };

    const updateMemoryUI = () => {
      memorySaveButtons.forEach((button) => {
        const slot = button.dataset.memorySave;
        if (slot !== '1' && slot !== '2') return;
        const slotElement = button.closest<HTMLElement>('[data-memory-slot]');
        slotElement?.classList.toggle('is-filled', memory[slot] !== null);
      });

      memoryRecallButtons.forEach((button) => {
        const slot = button.dataset.memoryRecall;
        if (slot !== '1' && slot !== '2') return;
        button.disabled = memory[slot] === null;
      });
    };

    const clearMemory = () => {
      memory['1'] = null;
      memory['2'] = null;
      updateMemoryUI();
    };

    const saveToMemory = (slot: MemorySlot) => {
      if (!hasActiveSteps()) {
        setStatus('La grille est vide : coche au moins une case avant de mémoriser un rythme.');
        return;
      }

      const replacing = memory[slot] !== null;
      memory[slot] = snapshotPattern();
      updateMemoryUI();
      setStatus(
        replacing
          ? `Nouveau rythme mémorisé dans le bouton ${slot} (l’ancien est remplacé). ▶ ${slot} le recharge.`
          : `Rythme mémorisé dans le bouton ${slot}. Tu peux tout effacer : ▶ ${slot} le retrouve tant que tu restes sur cette page.`,
      );
    };

    const recallFromMemory = (slot: MemorySlot) => {
      const snapshot = memory[slot];
      if (!snapshot) {
        setStatus(
          `Le bouton ${slot} est vide : clique d’abord sur 💾 ${slot} pour y mémoriser ton rythme.`,
        );
        return;
      }

      restorePattern(snapshot);
      setStatus(
        `Rythme ${slot} rechargé. Tu peux le modifier ou le mémoriser à nouveau dans ce bouton.`,
      );
    };

    const toggleMute = (button: HTMLButtonElement) => {
      const id = button.dataset.mute;
      const track = id ? tracks.get(id) : undefined;
      if (!track) return;

      track.muted = !track.muted;
      button.setAttribute('aria-pressed', String(track.muted));
      button.classList.toggle('is-active', track.muted);
      applyVolumes();
      updateGroupMuteUI();
      setStatus(track.muted ? `${track.name} coupé.` : `${track.name} réactivé.`);
    };

    const toggleSolo = (button: HTMLButtonElement) => {
      const id = button.dataset.solo;
      const track = id ? tracks.get(id) : undefined;
      if (!track) return;

      track.solo = !track.solo;
      button.setAttribute('aria-pressed', String(track.solo));
      button.classList.toggle('is-active', track.solo);
      applyVolumes();
      setStatus(
        track.solo
          ? `Solo sur ${track.name} : les autres pistes sont muettes.`
          : 'Solo retiré : toutes les pistes réactivées.',
      );
    };

    const previewTrack = async (id: string | undefined) => {
      if (!id) return;
      const context = ensureContext();
      if (!context) return;

      const ready = await loadSounds();
      if (ready === 0) return;

      if (context.state === 'suspended') {
        try {
          await context.resume();
        } catch {
          return;
        }
      }

      const track = tracks.get(id);
      if (!track?.buffer || !track.gain) return;

      const source = context.createBufferSource();
      source.buffer = track.buffer;
      source.connect(track.gain);
      source.start();
    };

    root.addEventListener('click', (event) => {
      if (!(event.target instanceof HTMLElement)) return;

      const cell = event.target.closest<HTMLButtonElement>('.seq-cell');
      if (cell) {
        toggleCell(cell);
        return;
      }

      const mute = event.target.closest<HTMLButtonElement>('[data-mute]');
      if (mute) {
        toggleMute(mute);
        return;
      }

      const solo = event.target.closest<HTMLButtonElement>('[data-solo]');
      if (solo) {
        toggleSolo(solo);
        return;
      }

      const memorySave = event.target.closest<HTMLButtonElement>('[data-memory-save]');
      if (memorySave) {
        const slot = memorySave.dataset.memorySave;
        if (slot === '1' || slot === '2') saveToMemory(slot);
        return;
      }

      const memoryRecall = event.target.closest<HTMLButtonElement>('[data-memory-recall]');
      if (memoryRecall) {
        const slot = memoryRecall.dataset.memoryRecall;
        if (slot === '1' || slot === '2') recallFromMemory(slot);
        return;
      }

      const preview = event.target.closest<HTMLButtonElement>('[data-preview]');
      if (preview) void previewTrack(preview.dataset.preview);
    });

    root.querySelectorAll<HTMLInputElement>('[data-volume]').forEach((input) => {
      input.addEventListener('input', () => {
        const id = input.dataset.volume;
        const track = id ? tracks.get(id) : undefined;
        if (!track) return;
        track.volume = Number(input.value) / 100;
        applyVolumes();
      });
    });

    presetButtons.forEach((button, index) => {
      button.addEventListener('click', () => {
        const preset = presetData.find((item) => item.id === button.dataset.preset);
        if (!preset) return;

        applyPattern(preset.pattern);
        presetButtons.forEach((item) => item.classList.toggle('is-active', item === button));
        setStatus(`Modèle ${index + 1} chargé. Lance la lecture pour l’écouter.`);
      });
    });

    randomButton.addEventListener('click', randomizePattern);

    playButton.addEventListener('click', () => {
      void startPlayback();
    });
    pauseButton.addEventListener('click', () => pausePlayback());
    stopButton.addEventListener('click', () => stopPlayback());
    clearButton.addEventListener('click', () => clearGrid());

    // --- Navigation clavier dans la grille ----------------------------------

    const focusCell = (row: number, step: number) => {
      const target = root.querySelector<HTMLButtonElement>(
        `.seq-cell[data-row="${row}"][data-step="${step}"]`,
      );
      if (!target) return;
      const group = target.closest('details');
      if (group) group.open = true;
      cells.forEach((cell) => {
        cell.tabIndex = -1;
      });
      target.tabIndex = 0;
      target.focus();
    };

    board.addEventListener('keydown', (event) => {
      if (!(event.target instanceof HTMLElement)) return;
      if (!event.target.classList.contains('seq-cell')) return;

      const row = Number(event.target.dataset.row);
      const step = Number(event.target.dataset.step);
      if (!Number.isInteger(row) || !Number.isInteger(step)) return;

      let targetRow = row;
      let targetStep = step;

      if (event.key === 'ArrowRight') targetStep = (step + 1) % STEPS;
      else if (event.key === 'ArrowLeft') targetStep = (step - 1 + STEPS) % STEPS;
      else if (event.key === 'ArrowDown') targetRow = Math.min(row + 1, tracks.size - 1);
      else if (event.key === 'ArrowUp') targetRow = Math.max(row - 1, 0);
      else if (event.key === 'Home') targetStep = 0;
      else if (event.key === 'End') targetStep = STEPS - 1;
      else return;

      event.preventDefault();
      focusCell(targetRow, targetStep);
    });

    // --- Tempo --------------------------------------------------------------

    const setBpm = (value: number) => {
      bpm = Math.min(180, Math.max(60, Math.round(value)));
      bpmInput.value = String(bpm);
      bpmOutput.textContent = `${bpm} BPM`;
    };

    bpmInput.addEventListener('input', () => setBpm(Number(bpmInput.value)));

    // --- Remise à zéro (retour arrière / mémoire temporaire) ----------------

    const resetBruitomatic = () => {
      stopPlayback(true);
      clearMemory();

      tracks.forEach((track) => {
        track.muted = false;
        track.solo = false;
        track.volume = 0.8;
      });

      root.querySelectorAll<HTMLButtonElement>('[data-mute], [data-solo]').forEach((button) => {
        button.setAttribute('aria-pressed', 'false');
        button.classList.remove('is-active');
      });
      updateGroupMuteUI();
      root.querySelectorAll<HTMLInputElement>('[data-volume]').forEach((input) => {
        input.value = '80';
      });
      root.querySelectorAll<HTMLDetailsElement>('details').forEach((details) => {
        details.open = true;
      });

      applyVolumes();
      applyPresetById('groove');
      setBpm(DEFAULT_BPM);
      setLabelsHidden(false, false);
      setStatus(
        'Retour sur la page : la mémoire temporaire a été effacée et Bruitomatic remis à zéro (modèle 1).',
      );
    };

    // --- Arrêt automatique --------------------------------------------------

    document.addEventListener('bruits:tab-change', (event) => {
      const detail = (event as CustomEvent<{ tab?: string }>).detail;
      if (!detail) return;

      if (detail.tab === 'bruitomatic') {
        ensureContext();
        void loadSounds();
        return;
      }

      stopPlayback(true);
    });

    window.addEventListener('pagehide', () => {
      stopPlayback(true);
      clearMemory();
      if (ctx && ctx.state === 'running') void ctx.suspend();
    });

    window.addEventListener('pageshow', (event) => {
      if (!event.persisted) return;
      resetBruitomatic();
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) pausePlayback(true);
    });

    onAudioEvent('statechange', ({ state }) => {
      if (state === 'playing' && playing) stopPlayback(true);
    });

    // --- Initialisation -----------------------------------------------------

    root.addEventListener('pointerdown', () => ensureContext());

    resetBruitomatic();
    setStatus(
      'Modèle 1 préchargé. Clique sur Lecture pour écouter, ou coche des cases pour tester les sons.',
    );
  }
