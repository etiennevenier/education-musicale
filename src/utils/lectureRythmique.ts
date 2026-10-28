/**
 * Outil « Lecture Rythmique » : moteur d’interface, partition et synthèse.
 * Logique extraite de LectureRythmique.astro.
 */
import { getAudioContext, getMasterBus } from './audioContext';
import { stopAudio } from './audioManager';
import { plural } from './plural';
import {
    evaluate,
    generateRhythm,
    getVerdict,
    type Evaluation,
    type Grade,
    type Rhythm,
} from './rhythmEngine';
import { synthClick, synthPerc } from './rhythmSounds';    
export function initLectureRythmique(): void {
    'use strict';

    /* =====================================================================
       0. TYPES — Astro compile le contenu des balises <script> en TypeScript.
    ===================================================================== */
    type NotePart = { el: SVGElement; attr: string };
    type SvgAttrs = Record<string, string | number>;
    type ClockEvent =
        | { type: 'click'; time: number; accent: boolean; soft: boolean }
        | { type: 'perc'; time: number; variant: 'model' | 'tap' };
    type ToolState = 'idle' | 'running' | 'result';
    type ReplayKind = 'q' | 'a';

    /* =====================================================================
       ACCÈS AU DOM — chaque recherche est vérifiée une fois (garde instanceof),
       puis le type précis est conservé partout ailleurs.
    ===================================================================== */
    function byId(id: string): HTMLElement {
        const el = document.getElementById(id);
        if (!(el instanceof HTMLElement)) throw new Error(`Élément introuvable : ${id}`);
        return el;
    }
    function byIdSvg(id: string): SVGElement {
        const el = document.getElementById(id);
        if (!(el instanceof SVGElement)) throw new Error(`Élément SVG introuvable : ${id}`);
        return el;
    }
    function byIdButton(id: string): HTMLButtonElement {
        const el = document.getElementById(id);
        if (!(el instanceof HTMLButtonElement)) throw new Error(`Bouton introuvable : ${id}`);
        return el;
    }
    function byIdInput(id: string): HTMLInputElement {
        const el = document.getElementById(id);
        if (!(el instanceof HTMLInputElement)) throw new Error(`Champ introuvable : ${id}`);
        return el;
    }
    function byIdSelect(id: string): HTMLSelectElement {
        const el = document.getElementById(id);
        if (!(el instanceof HTMLSelectElement)) throw new Error(`Liste introuvable : ${id}`);
        return el;
    }

    // Conteneur de l'outil dans la plateforme (sert à savoir s'il est affiché)
    const toolEl = byId('tool-rhythm');

    /* =====================================================================
       1. RÉGLAGES
    ===================================================================== */
    const LOOKAHEAD = 0.12;         // s : on planifie les sons à l'avance de 120 ms
    const SCHEDULER_MS = 25;        // ms : fréquence de la boucle de planification
    const LEAD_IN = 0.30;           // s : délai avant le tout premier coup d'intro
    const ACCEPT_BEFORE = 0.25;     // s : frappes acceptées juste avant le début de l'enregistrement
    const ACCEPT_AFTER = 0.30;      // s : ... et juste après sa fin
    const REPLAY_TAIL = 0.45;       // s : on laisse sonner la fin avant d'arrêter une réécoute
    const USER_OFFSET_MS = 0;       // décalage manuel de tous les temps de frappe, si besoin (ms)
    
    const GREEN = '#15803d', ORANGE = '#b45309', RED = '#d9382f', INK = '#1b2a8a', PAPER = '#fbfcff';

    /* =====================================================================
       2. GÉOMÉTRIE DE LA PARTITION (SVG)
       La partition est découpée en « lignes » de 2 mesures :
         2 mesures = 1 ligne ; 4 mesures = 2 lignes l'une sous l'autre.
       Chaque ligne garde la même largeur (TOTAL_W), donc les notes restent aussi lisibles
       qu'avec 2 mesures. Une croche = 1 « slot ».
    ===================================================================== */
    const NS = 'http://www.w3.org/2000/svg';
    const MEASURES_PER_ROW = 2;     // mesures par ligne de portée
    const SYS_X = 30;               // trait de début de portée
    const XS = 130;                 // x du slot 0 de chaque ligne (première note)
    const TOTAL_W = 900;            // largeur occupée par UNE ligne (2 mesures)
    const XE = XS + TOTAL_W;        // x de la fin d'une ligne
    const STAFF_Y = 105;            // ligne rythmique (une seule ligne) dans une ligne de portée
    const VIEW_W = 1060;            // largeur du viewBox
    const ROW_VIEW_H = 272;         // hauteur d'une ligne : notes, pulsations, marqueurs de résultat
    const ROW_H = 270;              // décalage vertical entre deux lignes de portée
    const BAR_PAD = 30;             // les barres de mesure sont 30 px avant la première note de la mesure
    const HL_TOP = 16, HL_H = 246;  // position et hauteur du cadre de surbrillance d'une mesure

    const gStatic = byIdSvg('rt-gStatic');
    const gNotes = byIdSvg('rt-gNotes');
    const gResults = byIdSvg('rt-gResults');
    const board = byIdSvg('rt-board');
    const hl = byIdSvg('rt-hl');    // le cadre de surbrillance de la mesure en cours

    function el(name: string, attrs: SvgAttrs, parent?: SVGElement): SVGElement {
        const e = document.createElementNS(NS, name) as SVGElement;
        for (const k in attrs) e.setAttribute(k, String(attrs[k]));
        if (parent) parent.appendChild(e);
        return e;
    }

    // Géométrie courante, recalculée à chaque nouvel exercice
    const geo = { ts: 4, measures: 2, rows: 1, slotsPerRow: 16, slotW: 56 };
    function setGeometry(ts: number, measures: number): void {
        geo.ts = ts;
        geo.measures = measures;
        geo.rows = Math.ceil(measures / MEASURES_PER_ROW);
        geo.slotsPerRow = MEASURES_PER_ROW * ts * 2;       // croches par ligne
        geo.slotW = TOTAL_W / geo.slotsPerRow;             // largeur d'une croche
    }
    const rowOfSlot = (s: number): number => Math.floor(s / geo.slotsPerRow);               // ligne de portée d'un slot
    const localX = (s: number): number => XS + (s % geo.slotsPerRow) * geo.slotW;           // x d'un slot dans sa ligne

    // Un groupe SVG par ligne de portée (décalé vers le bas pour les lignes suivantes)
    let staticRows: SVGElement[] = [], noteRows: SVGElement[] = [], resultRows: SVGElement[] = [];
    const rowGroup = (parent: SVGElement, r: number): SVGElement => el('g', { transform: `translate(0 ${r * ROW_H})` }, parent);

    function resetResultRows() {
        gResults.replaceChildren();
        resultRows = [];
        for (let r = 0; r < geo.rows; r++) resultRows.push(rowGroup(gResults, r));
    }

    /* =====================================================================
       3. FIGURES ET NIVEAUX
       len  = durée en temps (noires) ; hits = croches (dans le temps) où l'on doit taper
    ===================================================================== */
    // Figures, niveaux et génération des rythmes : voir utils/rhythmEngine.ts

    /* =====================================================================
       4. DESSIN DE LA PARTITION ET SURBRILLANCE DE LA MESURE
    ===================================================================== */
    let rhythm: Rhythm = { ts: 4, measures: 2, totalBeats: 8, elements: [], hits: [] };
    let noteParts: Record<number, NotePart[]> = {};   // slot -> [{el, attr}] pour colorer chaque note

    function drawQuarterRest(x: number, parent: SVGElement): void {
        const y = STAFF_Y;
        el('path', {
            d: `M${x + 5} ${y - 31} L${x - 6} ${y - 15} L${x + 6} ${y + 1} L${x - 5} ${y + 15} C${x + 10} ${y + 10} ${x + 11} ${y + 27} ${x - 2} ${y + 31}`,
            fill: 'none', stroke: INK, 'stroke-width': 6.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'
        }, parent);
    }

    function drawEighthRest(x: number, parent: SVGElement): void {
        const y = STAFF_Y;
        el('circle', { cx: x - 7, cy: y - 11, r: 5.8, fill: INK }, parent);
        el('path', {
            d: `M${x - 7} ${y - 5} C${x + 1} ${y - 4} ${x + 7} ${y - 9} ${x + 9} ${y - 17} L${x - 4} ${y + 24}`,
            fill: 'none', stroke: INK, 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'
        }, parent);
    }

    // Tête de note + hampe (+ crochet) ; `open` = tête creuse (blanche). Retourne le x de la hampe.
    // `slot` est le numéro de croche depuis le début de l'exercice : on en déduit la ligne de portée.
    function drawNoteHead(slot: number, withFlag: boolean, open: boolean): number {
        const parent = noteRows[rowOfSlot(slot)];
        const x = localX(slot), y = STAFF_Y, top = y - 58, sx = x + 7.9;
        const head = open
            ? el('ellipse', { cx: x, cy: y, rx: 8.8, ry: 6.2, fill: PAPER, stroke: INK, 'stroke-width': 3, transform: `rotate(-20 ${x} ${y})` }, parent)
            : el('ellipse', { cx: x, cy: y, rx: 8.8, ry: 6.5, fill: INK, transform: `rotate(-20 ${x} ${y})` }, parent);
        const stem = el('line', { x1: sx, y1: y - 2, x2: sx, y2: top, stroke: INK, 'stroke-width': 3, 'stroke-linecap': 'butt' }, parent);
        const parts: NotePart[] = [{ el: head, attr: open ? 'stroke' : 'fill' }, { el: stem, attr: 'stroke' }];
        if (withFlag) {
            const flag = el('path', {
                d: `M${sx} ${top} C${sx + 2} ${top + 12} ${sx + 22} ${top + 14} ${sx + 15} ${top + 36}`,
                fill: 'none', stroke: INK, 'stroke-width': 5, 'stroke-linecap': 'round'
            }, parent);
            parts.push({ el: flag, attr: 'stroke' });
        }
        noteParts[slot] = parts;
        return sx;
    }

    function drawRhythm(): void {
        const ts = rhythm.ts;
        setGeometry(ts, rhythm.measures);
        gStatic.replaceChildren(); gNotes.replaceChildren();
        noteParts = {};
        hideHighlight();

        // Le viewBox grandit avec le nombre de lignes de portée (1 ligne = 2 mesures)
        board.setAttribute('viewBox', `0 0 ${VIEW_W} ${ROW_VIEW_H + (geo.rows - 1) * ROW_H}`);
        board.setAttribute('preserveAspectRatio', 'xMidYMid meet');

        staticRows = []; noteRows = [];
        for (let r = 0; r < geo.rows; r++) {
            staticRows.push(rowGroup(gStatic, r));
            noteRows.push(rowGroup(gNotes, r));
        }
        resetResultRows();

        const measSlots = ts * 2;                       // croches par mesure
        for (let r = 0; r < geo.rows; r++) {
            const g = staticRows[r];
            const isLastRow = r === geo.rows - 1;

            // Ligne rythmique, trait de début de portée
            el('line', { x1: SYS_X, y1: STAFF_Y, x2: XE - 18, y2: STAFF_Y, stroke: '#3b4a6b', 'stroke-width': 2.5 }, g);
            el('line', { x1: SYS_X, y1: STAFF_Y - 24, x2: SYS_X, y2: STAFF_Y + 24, stroke: '#3b4a6b', 'stroke-width': 2.5 }, g);

            // Barres de mesure intermédiaires, puis barre de fin de ligne (épaisse seulement à la toute fin)
            for (let mi = 1; mi < MEASURES_PER_ROW; mi++) {
                const bx = XS + mi * measSlots * geo.slotW - BAR_PAD;
                el('line', { x1: bx, y1: STAFF_Y - 24, x2: bx, y2: STAFF_Y + 24, stroke: '#3b4a6b', 'stroke-width': 2.5 }, g);
            }
            el('line', { x1: XE - 18, y1: STAFF_Y - 24, x2: XE - 18, y2: STAFF_Y + 24, stroke: '#3b4a6b', 'stroke-width': isLastRow ? 4.5 : 2.5 }, g);

            // Chiffrage (3/4 ou 4/4) : seulement au début de la première ligne
            if (r === 0) {
                [[ts, STAFF_Y - 13], [4, STAFF_Y + 15]].forEach(([n, cy]) => {
                    const t = el('text', { x: 74, y: cy + 11, 'font-size': 34, 'font-weight': 800, 'text-anchor': 'middle', fill: '#3b4a6b', 'font-family': 'Georgia, serif' }, g);
                    t.textContent = String(n);
                });
            }

            // Numéro de chaque mesure, en petit, en haut à gauche de la mesure
            for (let mi = 0; mi < MEASURES_PER_ROW; mi++) {
                const mx = (mi === 0 ? XS - BAR_PAD : XS + mi * measSlots * geo.slotW - BAR_PAD) + 12;
                const t = el('text', { x: mx, y: 34, 'font-size': 13, 'font-weight': 800, fill: '#64748b', 'font-family': 'system-ui, sans-serif' }, g);
                t.textContent = String(r * MEASURES_PER_ROW + mi + 1);
            }

            // Pulsation écrite sous la ligne : 1 + 2 + 3 (+ 4 +), mesure après mesure
            for (let s = 0; s < geo.slotsPerRow; s++) {
                const onBeat = s % 2 === 0;
                const t = el('text', {
                    x: XS + s * geo.slotW, y: 168, 'text-anchor': 'middle',
                    'font-size': onBeat ? 20 : 17, 'font-weight': onBeat ? 800 : 600,
                    fill: onBeat ? '#6b7a99' : '#64748b', 'font-family': 'system-ui, sans-serif'
                }, g);
                t.textContent = onBeat ? String((s / 2) % ts + 1) : '+';
            }
        }

        // Figures (chacune est dessinée dans la ligne de portée qui la contient)
        rhythm.elements.forEach(e => {
            const s0 = e.start * 2, s1 = s0 + 1;
            const parent = noteRows[rowOfSlot(s0)];
            switch (e.type) {
                case 'quarter':     drawNoteHead(s0, false, false); break;
                case 'half':        drawNoteHead(s0, false, true); break;
                case 'rest':        drawQuarterRest(localX(s0), parent); break;
                case 'eighths': {
                    const sxA = drawNoteHead(s0, false, false), sxB = drawNoteHead(s1, false, false);
                    el('rect', { x: sxA - 1.5, y: STAFF_Y - 58, width: sxB - sxA + 3, height: 8, fill: INK }, parent);   // la barre de croches
                    break;
                }
                case 'eighth_rest': drawNoteHead(s0, true, false); drawEighthRest(localX(s1), parent); break;
                case 'rest_eighth': drawEighthRest(localX(s0), parent); drawNoteHead(s1, true, false); break;
            }
        });
    }

    function colorNote(slot: number, color: string): void {
        (noteParts[slot] || []).forEach(p => p.el.setAttribute(p.attr, color));
    }

    /* ---------- Surbrillance de la mesure en cours (style EarMaster) ----------
       Un seul cadre coloré entoure la mesure entière. Il change net de mesure
       à l'instant exact du premier temps de la mesure suivante (pas d'animation). */
    let hlKey = '';

    function measureBox(m: number): { x: number; y: number; w: number; h: number } {
        const r = Math.floor(m / MEASURES_PER_ROW);              // ligne de portée
        const mi = m % MEASURES_PER_ROW;                         // mesure dans la ligne (0 ou 1)
        const measW = geo.ts * 2 * geo.slotW;                    // largeur d'une mesure
        const left = (mi === 0 ? XS - BAR_PAD : XS + mi * measW - BAR_PAD) + 3;
        const right = (mi === MEASURES_PER_ROW - 1 ? XE - 18 : XS + (mi + 1) * measW - BAR_PAD) - 3;
        return { x: left, y: HL_TOP + r * ROW_H, w: right - left, h: HL_H };
    }

    // mode 'rec' = tu joues (vert) ; mode 'replay' = réécoute (bleu), comme le bandeau d'état
    function setHighlight(m: number, mode: 'rec' | 'replay'): void {
        const key = m + ':' + mode;
        if (key === hlKey) return;
        hlKey = key;
        const b = measureBox(m);
        const color = mode === 'replay' ? '#7e22ce' : '#15803d';
        hl.setAttribute('x', String(b.x)); hl.setAttribute('y', String(b.y));
        hl.setAttribute('width', String(b.w)); hl.setAttribute('height', String(b.h));
        hl.setAttribute('fill', color); hl.setAttribute('stroke', color);
        hl.setAttribute('visibility', 'visible');
        // Smartphone : la partition défile horizontalement, on garde la mesure active au centre
        const sheet = board.parentElement;
        if (sheet && sheet.scrollWidth > sheet.clientWidth + 2) {
            const scale = board.getBoundingClientRect().width / VIEW_W;
            sheet.scrollTo({ left: Math.max(0, (b.x + b.w / 2) * scale - sheet.clientWidth / 2), behavior: 'smooth' });
        }
    }

    function hideHighlight(): void {
        hlKey = '';
        hl.setAttribute('visibility', 'hidden');
    }

    /* =====================================================================
       5. AUDIO : horloge Web Audio + planificateur « lookahead »
    ===================================================================== */
    let bus: GainNode | null = null;   // sortie des sons planifiés : on peut la couper d'un coup (arrêt d'une réécoute)
    const BUS_DELAY = 0.006;           // s : pré-délai du limiteur du bus partagé (≈ 6 ms)

    /** Contexte Web Audio partagé du site (reprend un contexte suspendu). */
    function getCtx(): AudioContext {
        const ac = getAudioContext();
        if (!ac) throw new Error('Web Audio API non disponible');
        return ac;
    }
    function newBus(): void {
        const ac = getCtx();
        killBus();
        bus = ac.createGain();
        bus.connect(getMasterBus() ?? ac.destination);
    }
    // Coupure avec fondu : évite le « clac » d'une déconnexion brutale en plein son.
    const BUS_FADE = 0.012;            // s : durée du fondu de coupure
    function killBus(): void {
        if (!bus) return;
        const old = bus;
        bus = null;
        try { old.gain.setTargetAtTime(0, getCtx().currentTime, BUS_FADE / 3); } catch { /* contexte indisponible */ }
        window.setTimeout(() => { try { old.disconnect(); } catch { /* déjà déconnecté */ } }, BUS_FADE * 4000);
    }

    // Latence de sortie : ce que l'élève ENTEND à l'instant t correspond au temps audio (t - latence).
    function latency(): number {
        const ac = getAudioContext();
        return ac ? (ac.outputLatency || ac.baseLatency || 0) + BUS_DELAY : 0;
    }
    const audioNow = (): number => getCtx().currentTime - latency();

    // Clic de métronome planifié à l'instant précis `time` (horloge audio)
    function playClick(time: number, accent: boolean, soft: boolean): void {
        const ac = getCtx();
        synthClick(ac, bus ?? getMasterBus() ?? ac.destination, time, accent, soft);
    }

    // Percussion à l'instant `time`. variant 'tap' = le son de frappe de l'élève ;
    // variant 'model' = un son de bois plus aigu, pour reconnaître « la question ».
    function playPerc(time: number, variant: 'tap' | 'model', out?: AudioNode | null): void {
        const ac = getCtx();
        synthPerc(ac, out ?? getMasterBus() ?? ac.destination, time, variant);
    }

    /* =====================================================================
       6. ÉVALUATION : comparaison des frappes et des temps attendus
       Toutes les valeurs sont en secondes, relatives au début de la mesure 1
       de l'enregistrement (0 = premier temps de la première mesure).
    ===================================================================== */
    // Comparaison frappes / temps attendus : voir utils/rhythmEngine.ts (evaluate)

    /* =====================================================================
       7. ÉTAT, EXERCICE, RÉÉCOUTE ET BOUCLE D'ANIMATION
    ===================================================================== */
    const ui = {
        status: byId('rt-status'), phase: byId('rt-phase'), beats: byId('rt-beats'),
        dots: [] as HTMLElement[],
        btnStart: byIdButton('rt-btnStart'), btnGenerate: byIdButton('rt-btnGenerate'), btnTap: byIdButton('rt-btnTap'),
        bpm: byIdInput('rt-bpm'), bpmLabel: byId('rt-bpmLabel'),
        level: byIdSelect('rt-level'), ts: byIdSelect('rt-ts'), measures: byIdSelect('rt-measures'),
        result: byId('rt-result'), score: byId('rt-score'), verdict: byId('rt-verdict'), chips: byId('rt-chips'),
        replay: byId('rt-replay'), btnPlayQ: byIdButton('rt-btnPlayQ'), btnPlayA: byIdButton('rt-btnPlayA')
    };
    const rtMobileLandscapeMq = window.matchMedia('(pointer: coarse) and (orientation: landscape) and (max-height: 550px)');

    let state: ToolState = 'idle';       // 'idle' | 'running' | 'result'
    let replayKind: ReplayKind | null = null;   // null | 'q' (question) | 'a' (réponse de l'élève)
    let beatDur = 0.75, T0 = 0, recStart = 0, recEnd = 0;
    let events: ClockEvent[] = [], nextEvent = 0;
    let schedTimer: ReturnType<typeof setInterval> | null = null;
    let rafId: number | null = null;
    let taps: number[] = [];             // frappes retenues (secondes, relatives à recStart)

    // Temps (s, relatif au début de l'exercice) -> position (x, ligne de portée) sur la partition.
    // `rowHint` force la ligne (pour rattacher une frappe à la ligne de sa note) ; sinon on la déduit du temps.
    function tapXY(rel: number, rowHint?: number): { x: number; r: number } {
        const pos = rel / (beatDur / 2);                                   // en croches depuis le début
        const r = rowHint !== undefined ? rowHint
                : Math.max(0, Math.min(geo.rows - 1, Math.floor(pos / geo.slotsPerRow)));
        const x = XS + (pos - r * geo.slotsPerRow) * geo.slotW;
        return { x: Math.max(XS - 75, Math.min(XE + 25, x)), r };
    }

    function buildDots(n: number): void {
        ui.beats.replaceChildren();
        ui.dots = [];
        for (let i = 1; i <= n; i++) {
            const d = document.createElement('span');
            d.className = 'beat-dot';
            d.textContent = String(i);
            ui.beats.appendChild(d);
            ui.dots.push(d);
        }
    }
    function setPhase(mode: string, title: string, sub?: string): void {
        ui.status.className = 'status ' + mode;
        if (sub) {
            const detail = document.createElement('small');
            detail.textContent = sub;
            ui.phase.replaceChildren(document.createTextNode(title), detail);
        } else {
            ui.phase.replaceChildren(document.createTextNode(title));
        }
    }
    function lightDot(index: number): void {
        ui.dots.forEach((d, i) => d.classList.toggle('on', i === index));
    }

    // Boucle de planification : programme les sons un peu à l'avance sur l'horloge audio
    function scheduler(): void {
        const ac = getCtx();
        while (nextEvent < events.length && events[nextEvent].time < ac.currentTime + LOOKAHEAD) {
            const e = events[nextEvent++];
            if (e.type === 'click') playClick(e.time, e.accent, e.soft);
            else playPerc(e.time, e.variant, bus);
        }
    }
    function runScheduler(): void {
        nextEvent = 0;
        scheduler();
        schedTimer = setInterval(scheduler, SCHEDULER_MS);
    }
    function stopTimers(): void {
        if (schedTimer !== null) { clearInterval(schedTimer); schedTimer = null; }
        if (rafId !== null) cancelAnimationFrame(rafId);
        rafId = null;
    }

    // Prépare la ligne de temps : chronologie (T0, recStart, recEnd) + clics de métronome
    function buildClock(softMetronomeInRec: boolean): void {
        const ts = rhythm.ts, total = rhythm.totalBeats;
        T0 = getCtx().currentTime + LEAD_IN;            // 1er coup d'intro
        recStart = T0 + ts * beatDur;                   // début de la mesure 1 de l'exercice
        recEnd = recStart + total * beatDur;
        events = [];
        for (let i = 0; i < ts; i++) events.push({ type: 'click', time: T0 + i * beatDur, accent: i === 0, soft: false });
        if (softMetronomeInRec) {
            for (let i = 0; i < total; i++) events.push({ type: 'click', time: recStart + i * beatDur, accent: i % ts === 0, soft: true });
        }
    }

    /* ---------- Exercice ---------- */
        function startExercise(): void {
        stopAudio();                      // une seule source sonore à la fois sur le site
        stopReplay(true);
        getCtx(); newBus();
        clearResults();
        beatDur = 60 / Number(ui.bpm.value);
        taps = [];
        if (rtMobileLandscapeMq.matches) {
            ui.ts.value = '4';
            ui.measures.value = '2';
        }
        buildClock(true);   // le métronome accompagne toujours la réponse de l'élève
        runScheduler();

        state = 'running';
        ui.btnStart.textContent = 'Arrêter';
        ui.btnStart.classList.add('running');
        setControlsDisabled(true);
        rafId = requestAnimationFrame(frame);
    }

    // Le nombre de mesures n'est jamais verrouillé : le changer en cours d'exercice l'interrompt et en génère un nouveau
    function setControlsDisabled(v: boolean): void {
        ui.btnGenerate.disabled = v; ui.bpm.disabled = v; ui.level.disabled = v; ui.ts.disabled = v;
    }

    function backToIdle(): void {
        ui.btnStart.textContent = state === 'result' ? 'Recommencer' : 'Démarrer l\'exercice';
        ui.btnStart.classList.remove('running');
        setControlsDisabled(false);
        hideHighlight();
        lightDot(-1);
    }

    function cancelExercise(): void {
        stopTimers(); killBus();
        state = 'idle';
        resetResultRows();
        backToIdle();
        setPhase('', 'Exercice arrêté', 'Clique sur « Démarrer l\'exercice » pour réessayer.');
    }

    // Une image d'animation : tout est calculé à partir de l'horloge audio (exercice ET réécoute)
    function frame(): void {
        if (state !== 'running' && !replayKind) return;
        const now = audioNow();
        const ts = rhythm.ts, total = rhythm.totalBeats, nMeasures = rhythm.measures;
        const beatPos = (now - T0) / beatDur;           // position en temps depuis le 1er coup d'intro

        if (beatPos < 0) {
            setPhase('intro', 'Prépare-toi…', 'La mesure d\'introduction arrive.');
            lightDot(-1);
            hideHighlight();
        } else if (beatPos < ts) {
            const n = Math.floor(beatPos);
            setPhase('intro', 'Mesure d\'introduction', 'Écoute le tempo : ' + (n + 1) + ' sur ' + ts);
            lightDot(n);
            hideHighlight();
        } else if (beatPos < ts + total) {
            const rb = beatPos - ts;                    // temps écoulés depuis le début de l'exercice
            const measure = Math.min(nMeasures - 1, Math.floor(rb / ts));      // 0, 1, 2, 3...
            if (replayKind) {
                setPhase('replay', replayKind === 'q' ? 'Écoute la question' : 'Écoute ta réponse', 'Mesure ' + (measure + 1) + ' sur ' + nMeasures);
            } else {
                setPhase('rec', 'À toi ! Mesure ' + (measure + 1) + ' sur ' + nMeasures, 'Barre d\'espace ou bouton TAPER');
            }
            lightDot(Math.floor(rb) % ts);
            setHighlight(measure, replayKind ? 'replay' : 'rec');    // la mesure entière est mise en valeur
        } else {
            // terminé : plus de surbrillance, on attend les dernières frappes / la fin du son
            hideHighlight();
            lightDot(-1);
            if (!replayKind) setPhase('', 'Mesures terminées', 'Calcul du résultat…');
        }

        if (replayKind) {
            if (now >= recEnd + REPLAY_TAIL) { stopReplay(false); return; }
        } else if (now >= recEnd + ACCEPT_AFTER) { finishExercise(); return; }
        rafId = requestAnimationFrame(frame);
    }

    /* ---------- Réécoute : « Jouer la question » / « Jouer ma réponse » ---------- */
    function setReplayButtons(): void {
        ui.btnPlayQ.textContent = replayKind === 'q' ? '■ Arrêter la lecture' : '▶ Jouer la question';
        ui.btnPlayA.textContent = replayKind === 'a' ? '■ Arrêter la lecture' : '▶ Jouer ma réponse';
        ui.btnPlayQ.classList.toggle('active', replayKind === 'q');
        ui.btnPlayA.classList.toggle('active', replayKind === 'a');
        ui.btnPlayA.disabled = taps.length === 0 && replayKind !== 'a';
        ui.btnPlayA.title = taps.length === 0 ? 'Aucune frappe enregistrée' : '';
    }

    function startReplay(kind: ReplayKind): void {
        if (state !== 'result') return;
        const same = replayKind === kind;
        stopReplay(false);
         if (same) return;                                 // un second clic sur le même bouton = arrêt

        stopAudio();
        getCtx(); newBus();
        replayKind = kind;
        buildClock(true);                                 // mesure d'intro + métronome discret : même cadre pour les deux
        if (kind === 'q') {
            // la question : les temps théoriques exacts
            rhythm.hits.forEach(s => events.push({ type: 'perc', time: recStart + s * beatDur / 2, variant: 'model' }));
        } else {
            // la réponse : les frappes réelles de l'élève, à leurs temps enregistrés
            taps.forEach(rel => events.push({ type: 'perc', time: recStart + rel, variant: 'tap' }));
        }
        events.sort((a, b) => a.time - b.time);
        runScheduler();
        setReplayButtons();
        rafId = requestAnimationFrame(frame);
    }

    function stopReplay(silent: boolean): void {
        if (!replayKind) return;
        replayKind = null;
        stopTimers(); killBus();
        hideHighlight();
        lightDot(-1);
        setReplayButtons();
        if (!silent && state === 'result') {
            setPhase('', 'Résultat', 'Réécoute la question ou ta réponse, ou clique sur « Recommencer ».');
        }
    }

    /* =====================================================================
       8. FRAPPES DE L'UTILISATEUR
    ===================================================================== */
    function onTap(): void {
        const ac = getCtx();
        playPerc(ac.currentTime, 'tap');                 // retour sonore immédiat
        ui.btnTap.classList.add('hit');
        setTimeout(() => ui.btnTap.classList.remove('hit'), 90);

        if (state !== 'running') return;
        const rel = audioNow() + USER_OFFSET_MS / 1000 - recStart;
        if (rel >= -ACCEPT_BEFORE && rel <= rhythm.totalBeats * beatDur + ACCEPT_AFTER) {
            taps.push(rel);
            // petite pastille grise pendant l'enregistrement, pour voir où l'on a frappé
            if (rel >= 0) {
                const p = tapXY(rel);
                el('circle', { cx: p.x, cy: 200, r: 5, fill: '#c4b5fd' }, resultRows[p.r]);
            }
        }
    }

    ui.btnTap.addEventListener('pointerdown', e => { e.preventDefault(); onTap(); });
    ui.btnTap.addEventListener('contextmenu', e => e.preventDefault());
    // Mobile paysage : le bouton TAPER est masqué ; un tap sur la partition appelle la même logique.
    const rtSheetEl = toolEl.querySelector('.sheet');
    if (!(rtSheetEl instanceof HTMLElement)) throw new Error('Partition de l\'outil introuvable');
    function onSheetTap(e: PointerEvent): void {
        if (!rtMobileLandscapeMq.matches) return;
        e.preventDefault();
        onTap();
    }
    rtSheetEl.addEventListener('pointerdown', onSheetTap);
    rtSheetEl.addEventListener('contextmenu', e => {
        if (rtMobileLandscapeMq.matches) e.preventDefault();
    });
    if (rtMobileLandscapeMq.addEventListener) {
        rtMobileLandscapeMq.addEventListener('change', () => {
            if (rtMobileLandscapeMq.matches && state !== 'running') newRhythm();
        });
    }
    // La barre d'espace sert à taper. On bloque son comportement par défaut (défilement / clic sur bouton).
    document.addEventListener('keydown', e => {
        if (e.code !== 'Space') return;
        if (toolEl.classList.contains('hidden')) return;      // la barre d'espace ne sert qu'à cet outil, et seulement s'il est affiché
        const target = e.target;
        const tag = target instanceof HTMLElement ? target.tagName.toLowerCase() : '';
        if (tag === 'select' || (target instanceof HTMLInputElement && target.type !== 'range' && target.type !== 'checkbox')) return;
        e.preventDefault();
        if (!e.repeat) onTap();
    });
    document.addEventListener('keyup', e => { if (e.code === 'Space' && !toolEl.classList.contains('hidden')) e.preventDefault(); });

    // Tactile (iOS / Safari) : le contexte audio ne se débloque qu'au relâchement du doigt (pointerup / touchend)
    function unlockAudioOnTouch(): void {
        if (toolEl.classList.contains('hidden')) return;
        const ac = getAudioContext();           // crée et reprend le contexte partagé
        if (ac && ac.state === 'running') {
            document.removeEventListener('pointerup', unlockAudioOnTouch, true);
            document.removeEventListener('touchend', unlockAudioOnTouch, true);
        }
    }
    document.addEventListener('pointerup', unlockAudioOnTouch, true);
    document.addEventListener('touchend', unlockAudioOnTouch, true);

    /* =====================================================================
       9. RÉSULTAT
    ===================================================================== */
    function clearResults(): void {
        resetResultRows();
        ui.result.hidden = true;
        ui.replay.hidden = true;
        Object.keys(noteParts).forEach(s => colorNote(Number(s), INK));
    }

    const gradeColor = (g: Grade): string => g === 'perfect' ? GREEN : g === 'good' ? ORANGE : RED;

    function finishExercise(): void {
        stopTimers(); killBus();
        state = 'result';
        backToIdle();

        const expected = rhythm.hits.map(s => s * beatDur / 2);       // temps théoriques (s) de chaque note
        const res = evaluate(expected, taps, beatDur);
        drawResults(res);
        showScore(res);
        ui.replay.hidden = false;
        setReplayButtons();
        setPhase('', 'Résultat', 'Réécoute la question ou ta réponse, ou clique sur « Recommencer ».');
    }

    function drawResults(res: Evaluation): void {
        resetResultRows();
        const labels: { x: number; r: number; str: string; color: string }[] = [];   // étiquettes sous les repères (placées ensuite sans chevauchement)
        res.notes.forEach((n, i) => {
            const slot = rhythm.hits[i];
            const r = rowOfSlot(slot);                                 // chaque note est annotée dans SA ligne de portée
            const g = resultRows[r];
            const color = gradeColor(n.grade);
            const ex = localX(slot);
            colorNote(slot, color);

            // repère de la position théorique
            el('line', { x1: ex, y1: 166, x2: ex, y2: 180, stroke: '#9aa7c2', 'stroke-width': 2 }, g);

            if (n.tap === null) {                                     // note manquée : croix rouge
                el('path', { d: `M${ex - 6} 194 L${ex + 6} 206 M${ex + 6} 194 L${ex - 6} 206`, stroke: RED, 'stroke-width': 3.5, 'stroke-linecap': 'round' }, g);
                labels.push({ x: ex, r, str: 'manqué', color: RED });
            } else {
                const tx = tapXY(n.tap, r).x;
                if (Math.abs(tx - ex) > 3) el('line', { x1: ex, y1: 180, x2: tx, y2: 193, stroke: color, 'stroke-width': 2 }, g);
                el('circle', { cx: tx, cy: 200, r: 7.5, fill: color }, g);
                const ms = n.ms ?? 0;
                const sign = ms > 0 ? '+' : ms < 0 ? '−' : '';
                const label = n.grade === 'off' ? (ms < 0 ? 'trop tôt' : 'trop tard') : sign + Math.round(Math.abs(ms)) + ' ms';
                labels.push({ x: tx, r, str: label, color });
            }
        });
        res.extras.forEach(t => {                                      // frappes en trop : cercle vide rouge
            const p = tapXY(t);
            el('circle', { cx: p.x, cy: 200, r: 6.5, fill: 'none', stroke: RED, 'stroke-width': 2.5 }, resultRows[p.r]);
            labels.push({ x: p.x, r: p.r, str: 'en trop', color: RED });
        });

        // Étiquettes : deux rangées par ligne de portée, pour éviter qu'elles se chevauchent quand les notes sont proches
        for (let r = 0; r < geo.rows; r++) {
            const lastX = [-1e9, -1e9];
            labels.filter(l => l.r === r).sort((a, b) => a.x - b.x).forEach(l => {
                const row = (l.x - lastX[0] >= 62) ? 0 : (l.x - lastX[1] >= 62) ? 1 : 0;
                lastX[row] = l.x;
                const t = el('text', { x: l.x, y: row === 0 ? 232 : 250, 'text-anchor': 'middle', 'font-size': 13, 'font-weight': 700, fill: l.color, 'font-family': 'system-ui, sans-serif' }, resultRows[r]);
                t.textContent = l.str;
            });
        }
    }

    function showScore(res: Evaluation): void {
        const p = res.percent;
        const color = p >= 85 ? GREEN : p >= 60 ? ORANGE : RED;
        const precision = document.createElement('small');
        precision.textContent = 'Précision';
        ui.score.replaceChildren(precision, document.createTextNode(p + ' %'));
        ui.score.style.color = color;
        ui.verdict.textContent = getVerdict(p);

        ui.chips.replaceChildren();
        const chip = (cls: string, str: string): void => { const c = document.createElement('span'); c.className = 'chip ' + cls; c.textContent = str; ui.chips.appendChild(c); };
        chip('green', plural(res.perfect, 'parfaite', 'parfaites'));
        chip('orange', plural(res.good, 'correcte', 'correctes'));
        chip('red', plural(res.bad, 'ratée', 'ratées'));
        if (res.extras.length) chip('gray', plural(res.extras.length, 'frappe en trop', 'frappes en trop'));
        ui.result.hidden = false;
    }

    /* =====================================================================
       10. COMMANDES
    ===================================================================== */
    // Onglet masqué : exercice et réécoute n'ont plus de sens, on les arrête proprement.
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) return;
        if (state === 'running') cancelExercise();
        stopReplay(true);
    });
    function newRhythm(): void {
        stopReplay(true); stopTimers(); killBus();
        state = 'idle';
        taps = [];
        if (rtMobileLandscapeMq.matches) {
            ui.ts.value = '4';
            ui.measures.value = '2';
        }
        rhythm = generateRhythm(ui.level.value, Number(ui.ts.value), Number(ui.measures.value));
        buildDots(rhythm.ts);
        drawRhythm();                                                 // recalcule aussi la géométrie (largeur, lignes de portée)
        ui.result.hidden = true;
        ui.replay.hidden = true;
        backToIdle();
        setPhase('', 'Prêt ?', 'Clique sur « Démarrer l\'exercice ».');
    }

    ui.btnGenerate.addEventListener('click', () => { newRhythm(); ui.btnGenerate.blur(); });
    ui.level.addEventListener('change', () => { newRhythm(); ui.level.blur(); });
    ui.ts.addEventListener('change', () => { newRhythm(); ui.ts.blur(); });
    ui.measures.addEventListener('change', () => {
        if (state === 'running') cancelExercise();                    // changement en plein exercice : on l'arrête puis on en génère un nouveau
        newRhythm();
        ui.measures.blur();
    });
    ui.bpm.addEventListener('input', () => { ui.bpmLabel.textContent = ui.bpm.value + ' BPM'; });
    ui.btnStart.addEventListener('click', () => {
        ui.btnStart.blur();                                           // pour que la barre d'espace ne « re-clique » pas sur ce bouton
        if (state === 'running') cancelExercise(); else startExercise();
    });
    ui.btnPlayQ.addEventListener('click', () => { startReplay('q'); ui.btnPlayQ.blur(); });
    ui.btnPlayA.addEventListener('click', () => { startReplay('a'); ui.btnPlayA.blur(); });

    // Avertissement de rotation : uniquement sur petit mobile en portrait.
    const rotateHint = document.getElementById('rt-rotate-hint');
    const dismissRotateHint = document.getElementById('dismiss-rotate-hint');
    const rotatePortraitMq = window.matchMedia('(max-width: 640px) and (orientation: portrait)');
    let ignoreRotateHint = false;
    try {
        ignoreRotateHint = localStorage.getItem('education-musicale:ignore-rotate-hint') === 'true';
    } catch {
        // Stockage indisponible (navigation privée restrictive) : l'avertissement reste fermable.
    }

    const syncRotateHint = (): void => {
        if (!(rotateHint instanceof HTMLElement)) return;
        rotateHint.hidden = ignoreRotateHint || !rotatePortraitMq.matches;
    };
    syncRotateHint();
    if (rotatePortraitMq.addEventListener) {
        rotatePortraitMq.addEventListener('change', syncRotateHint);
    }

    if (dismissRotateHint instanceof HTMLElement) {
        dismissRotateHint.addEventListener('click', () => {
            ignoreRotateHint = true;
            if (rotateHint instanceof HTMLElement) rotateHint.hidden = true;
            try {
                localStorage.setItem('education-musicale:ignore-rotate-hint', 'true');
            } catch {
                // La préférence ne pourra pas être mémorisée, mais le calque est bien fermé.
            }
        });
    }

    newRhythm();
}
