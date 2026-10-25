#!/usr/bin/env node
// Usage : node scripts/extract-rhythm-logic.mjs [--dry]
// LectureRythmique.astro -> moteur pur (src/utils/rhythmEngine.ts), synthèse Web Audio
// (src/utils/rhythmSounds.ts), plural partagé, + coupure du bus audio avec fondu anti-clic.
// Toutes les ancres sont vérifiées AVANT écriture ; au moindre écart : abandon sans rien modifier.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = process.cwd();
const FILE = resolve(ROOT, 'src/components/entrainement/LectureRythmique.astro');
const OUT_ENGINE = resolve(ROOT, 'src/utils/rhythmEngine.ts');
const OUT_SOUNDS = resolve(ROOT, 'src/utils/rhythmSounds.ts');
const OUT_PLURAL = resolve(ROOT, 'src/utils/plural.ts');
const DRY = process.argv.includes('--dry');

const fail = (msg) => {
  console.error(`✖ ${msg}\nAucun fichier modifié.`);
  process.exit(1);
};

if (!existsSync(FILE)) fail(`Introuvable : ${FILE}`);
for (const f of [OUT_ENGINE, OUT_SOUNDS]) if (existsSync(f)) fail(`Existe déjà : ${f} (script déjà appliqué ?)`);

let src = readFileSync(FILE, 'utf8');
const original = src;

const count = (s, needle) => s.split(needle).length - 1;
const once = (needle, label) => {
  const n = count(src, needle);
  if (n !== 1) fail(`Ancre « ${label} » : ${n} occurrence(s), 1 attendue.`);
  return src.indexOf(needle);
};
const replaceOnce = (from, to, label) => {
  once(from, label);
  src = src.replace(from, () => to);
};
const replaceRegion = (startNeedle, endNeedle, replacement, label) => {
  const start = once(startNeedle, `${label} (début)`);
  const end = src.indexOf(endNeedle, start);
  if (end === -1) fail(`Ancre « ${label} » (fin) introuvable après le début.`);
  const removed = src.slice(start, end);
  src = src.slice(0, start) + replacement + src.slice(end);
  return removed;
};
const dedent = (text, n) =>
  text
    .split('\n')
    .map((l) => (l.startsWith(' '.repeat(n)) ? l.slice(n) : l))
    .join('\n');
const swap = (text, from, to, label) => {
  if (count(text, from) !== 1) fail(`Module « ${label} » : motif attendu une fois : ${from.slice(0, 60)}`);
  return text.replace(from, () => to);
};

// ── 1. Imports ────────────────────────────────────────────────────────────────
replaceOnce(
  "import { stopAudio } from '../../utils/audioManager';",
  `import { stopAudio } from '../../utils/audioManager';
import { plural } from '../../utils/plural';
import {
    evaluate,
    generateRhythm,
    getVerdict,
    type Evaluation,
    type Grade,
    type Rhythm,
} from '../../utils/rhythmEngine';
import { synthClick, synthPerc } from '../../utils/rhythmSounds';`,
  'imports',
);

// ── 2. Types : ceux du moteur sortent, ceux de l'UI restent ───────────────────
const removedTypes = replaceRegion(
  "    type ElemType = 'quarter'",
  "    /* =====================================================================\n       ACCÈS AU DOM",
  `    type NotePart = { el: SVGElement; attr: string };
    type SvgAttrs = Record<string, string | number>;
    type ClockEvent =
        | { type: 'click'; time: number; accent: boolean; soft: boolean }
        | { type: 'perc'; time: number; variant: 'model' | 'tap' };
    type ToolState = 'idle' | 'running' | 'result';
    type ReplayKind = 'q' | 'a';

`,
  'types',
);
for (const t of ['type NotePart', 'type SvgAttrs', 'type ClockEvent', 'type ToolState', 'type ReplayKind', 'type Evaluation', 'type Rhythm ']) {
  if (!removedTypes.includes(t)) fail(`Bloc types : « ${t} » absent (structure inattendue).`);
}

// ── 3. Constantes de scoring ──────────────────────────────────────────────────
const constRe = /^    const (PERFECT_MS|GOOD_MS|GOOD_WEIGHT|EXTRA_PENALTY) = .*\n/gm;
const constLines = src.match(constRe) ?? [];
if (constLines.length !== 4) fail(`Constantes de scoring : ${constLines.length} trouvée(s), 4 attendues.`);
src = src.replace(constRe, '');

// ── 4. Section 3 (figures, niveaux, génération) ───────────────────────────────
const removedEngine = replaceRegion(
  '    const ELEM: Record<ElemType, ElemDef> = {',
  '    /* =====================================================================\n       4. DESSIN',
  '    // Figures, niveaux et génération des rythmes : voir utils/rhythmEngine.ts\n\n',
  'moteur rythmique',
);

// ── 5. Sons ───────────────────────────────────────────────────────────────────
src = swap(src, '    let noiseBuffer: AudioBuffer | null = null;\n', '', 'noiseBuffer').toString();
replaceRegion('    function getNoise(ac: AudioContext): AudioBuffer {', '    function newBus(): void {', '', 'getNoise');
replaceRegion(
  "    // Clic de métronome planifié à l'instant précis `time` (horloge audio)",
  '    /* =====================================================================\n       6. ÉVALUATION',
  `    // Clic de métronome planifié à l'instant précis \`time\` (horloge audio)
    function playClick(time: number, accent: boolean, soft: boolean): void {
        const ac = getCtx();
        synthClick(ac, bus ?? getMasterBus() ?? ac.destination, time, accent, soft);
    }

    // Percussion à l'instant \`time\`. variant 'tap' = le son de frappe de l'élève ;
    // variant 'model' = un son de bois plus aigu, pour reconnaître « la question ».
    function playPerc(time: number, variant: 'tap' | 'model', out?: AudioNode | null): void {
        const ac = getCtx();
        synthPerc(ac, out ?? getMasterBus() ?? ac.destination, time, variant);
    }

`,
  'sons',
);
replaceOnce(
  '    function killBus(): void {\n        if (bus) { try { bus.disconnect(); } catch { /* déjà déconnecté */ } bus = null; }\n    }',
  `    // Coupure avec fondu : évite le « clac » d'une déconnexion brutale en plein son.
    const BUS_FADE = 0.012;            // s : durée du fondu de coupure
    function killBus(): void {
        if (!bus) return;
        const old = bus;
        bus = null;
        try { old.gain.setTargetAtTime(0, getCtx().currentTime, BUS_FADE / 3); } catch { /* contexte indisponible */ }
        window.setTimeout(() => { try { old.disconnect(); } catch { /* déjà déconnecté */ } }, BUS_FADE * 4000);
    }`,
  'killBus',
);

// ── 6. Évaluation ─────────────────────────────────────────────────────────────
const removedEval = replaceRegion(
  '    function evaluate(expected: number[], taps: number[], beatDur: number): Evaluation {',
  '    /* =====================================================================\n       7. ÉTAT',
  '    // Comparaison frappes / temps attendus : voir utils/rhythmEngine.ts (evaluate)\n\n',
  'évaluation',
);

// ── 7. Résultat : verdict + plural ────────────────────────────────────────────
replaceOnce(
  "        ui.verdict.textContent = p >= 90 ? 'Excellent !' : p >= 75 ? 'Bien joué !' : p >= 50 ? 'Pas mal, encore un essai !' : 'On y retourne tranquillement.';",
  '        ui.verdict.textContent = getVerdict(p);',
  'verdict',
);
replaceOnce(
  "        const plural = (n: number, one: string, many: string): string => n + ' ' + (n > 1 ? many : one);\n",
  '',
  'plural local',
);

// ── 8. Contrôles post-édition ─────────────────────────────────────────────────
const scriptPart = src.slice(src.indexOf('<script>'), src.lastIndexOf('</script>'));
for (const orphan of ['getNoise', 'noiseBuffer', 'PERFECT_MS', 'GOOD_MS', 'GOOD_WEIGHT', 'EXTRA_PENALTY', 'ElemType', 'ElemDef', 'LevelDef', 'RhythmElement', 'TapPair', 'NoteResult', 'pickWeighted', 'acceptable']) {
  if (new RegExp(`\\b${orphan}\\b`).test(scriptPart)) fail(`Référence orpheline dans le composant : ${orphan}`);
}
for (const used of ['Evaluation', 'Grade', 'Rhythm', 'plural(', 'synthClick(', 'synthPerc(', 'generateRhythm(', 'evaluate(', 'getVerdict(']) {
  if (!scriptPart.includes(used)) fail(`« ${used} » devrait rester utilisé dans le composant.`);
}

// ── 9. Modules générés ────────────────────────────────────────────────────────
const exportConsts = constLines.map((l) => 'export ' + dedent(l, 4).trimEnd()).join('\n');

let engineBody = dedent(removedEngine.trimEnd(), 4);
engineBody = swap(engineBody, 'const ELEM: Record<ElemType, ElemDef> = {', 'export const ELEM: Record<ElemType, ElemDef> = {', 'ELEM');
engineBody = swap(engineBody, 'const LEVELS: Record<string, LevelDef> = {', 'export const LEVELS: Record<string, LevelDef> = {', 'LEVELS');
engineBody = swap(
  engineBody,
  'function pickWeighted<T extends string>(weights: Partial<Record<T, number>>): T {',
  'function pickWeighted<T extends string>(weights: Partial<Record<T, number>>, rng: () => number = Math.random): T {',
  'pickWeighted',
);
engineBody = swap(engineBody, 'let r = Math.random() * entries', 'let r = rng() * entries', 'rng');
engineBody = swap(
  engineBody,
  'function generateRhythm(levelKey: string, beatsPerMeasure: number, measures: number): Rhythm {',
  'export function generateRhythm(levelKey: string, beatsPerMeasure: number, measures: number, rng: () => number = Math.random): Rhythm {',
  'generateRhythm',
);
engineBody = swap(engineBody, 'const type = pickWeighted(allowed);', 'const type = pickWeighted(allowed, rng);', 'appel pickWeighted');

const evalBody = dedent(removedEval.trimEnd(), 4).replace('function evaluate(', 'export function evaluate(');
if (!evalBody.startsWith('export function evaluate(')) fail('evaluate : extraction incohérente.');

const engineModule = `/**
 * Moteur de « Lecture rythmique » : figures, niveaux, génération, évaluation des frappes.
 * Logique pure (aucun DOM, aucun audio) ; \`rng\` injectable pour les tests.
 */

export type ElemType = 'quarter' | 'rest' | 'half' | 'eighths' | 'eighth_rest' | 'rest_eighth';
export type ElemDef = { len: number; hits: number[] };
export type LevelDef = { weights: Partial<Record<ElemType, number>>; required?: ElemType[]; startWithNote: boolean };
export type RhythmElement = { type: ElemType; start: number; len: number };
export type Rhythm = { ts: number; measures: number; totalBeats: number; elements: RhythmElement[]; hits: number[] };
export type Grade = 'perfect' | 'good' | 'off' | 'miss';
type TapPair = { i: number; j: number; d: number };
export type NoteResult = { exp: number; tap: number | null; grade: Grade; ms: number | null };
export type Evaluation = { notes: NoteResult[]; extras: number[]; perfect: number; good: number; bad: number; percent: number };

${exportConsts}

${engineBody}

${evalBody}

export const getVerdict = (percent: number): string =>
  percent >= 90 ? 'Excellent !' : percent >= 75 ? 'Bien joué !' : percent >= 50 ? 'Pas mal, encore un essai !' : 'On y retourne tranquillement.';
`;

const soundsModule = `/**
 * Synthèse Web Audio de « Lecture rythmique » : clic de métronome et percussions.
 * Chaque fonction planifie un son à l'instant \`time\` (horloge audio) vers le nœud \`out\`.
 */

const noiseBuffers = new WeakMap<BaseAudioContext, AudioBuffer>();

function getNoise(ac: AudioContext): AudioBuffer {
  let buffer = noiseBuffers.get(ac);
  if (!buffer) {
    buffer = ac.createBuffer(1, Math.floor(ac.sampleRate * 0.05), ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    noiseBuffers.set(ac, buffer);
  }
  return buffer;
}

export function synthClick(ac: AudioContext, out: AudioNode, time: number, accent: boolean, soft: boolean): void {
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(accent ? 1568 : 1046, time);
  const vol = soft ? 0.22 : 0.5;
  gain.gain.setValueAtTime(vol, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.07);
  osc.connect(gain);
  gain.connect(out);
  osc.start(time);
  osc.stop(time + 0.08);
}

export function synthPerc(ac: AudioContext, dest: AudioNode, time: number, variant: 'tap' | 'model'): void {
  const osc = ac.createOscillator();
  const g = ac.createGain();
  if (variant === 'model') {
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(900, time);
    osc.frequency.exponentialRampToValueAtTime(620, time + 0.06);
    g.gain.setValueAtTime(0.7, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.13);
    osc.connect(g);
    g.connect(dest);
    osc.start(time);
    osc.stop(time + 0.14);
    return;
  }
  osc.type = 'sine';
  osc.frequency.setValueAtTime(520, time);
  osc.frequency.exponentialRampToValueAtTime(140, time + 0.09);
  g.gain.setValueAtTime(0.9, time);
  g.gain.exponentialRampToValueAtTime(0.001, time + 0.14);
  osc.connect(g);
  g.connect(dest);
  osc.start(time);
  osc.stop(time + 0.15);

  const noise = ac.createBufferSource();
  const ng = ac.createGain();
  noise.buffer = getNoise(ac);
  ng.gain.setValueAtTime(0.35, time);
  ng.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
  noise.connect(ng);
  ng.connect(dest);
  noise.start(time);
}
`;

const pluralModule = `export const plural = (count: number, singular: string, pluralForm = \`\${singular}s\`): string =>
  \`\${count} \${count > 1 ? pluralForm : singular}\`;
`;

if (DRY) {
  console.log(
    `[dry] OK — .astro ${original.split('\n').length} → ${src.split('\n').length} lignes ; moteur ${engineModule.split('\n').length} l. ; sons ${soundsModule.split('\n').length} l.`,
  );
  process.exit(0);
}

writeFileSync(OUT_ENGINE, engineModule);
writeFileSync(OUT_SOUNDS, soundsModule);
if (!existsSync(OUT_PLURAL)) writeFileSync(OUT_PLURAL, pluralModule);
writeFileSync(FILE, src);
console.log(`✔ ${OUT_ENGINE}\n✔ ${OUT_SOUNDS}\n✔ ${OUT_PLURAL}\n✔ ${FILE}\nVérifier : npx astro check`);
