#!/usr/bin/env node
// Usage : node scripts/extract-rockstage-logic.mjs [--dry]
// RockStageBuilder.astro -> données (src/data/rockStageData.ts), logique pure
// (src/utils/rockStageEvaluation.ts), helper plural (src/utils/plural.ts),
// et suppression du JSON <script id="rock-stage-data"> qui exposait les recettes dans le DOM.
// Toutes les ancres sont vérifiées AVANT écriture ; au moindre écart : abandon sans rien modifier.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = process.cwd();
const FILE = resolve(ROOT, 'src/components/RockStageBuilder.astro');
const OUT_DATA = resolve(ROOT, 'src/data/rockStageData.ts');
const OUT_EVAL = resolve(ROOT, 'src/utils/rockStageEvaluation.ts');
const OUT_PLURAL = resolve(ROOT, 'src/utils/plural.ts');
const DRY = process.argv.includes('--dry');

const fail = (msg) => {
  console.error(`✖ ${msg}\nAucun fichier modifié.`);
  process.exit(1);
};

if (!existsSync(FILE)) fail(`Introuvable : ${FILE}`);
for (const f of [OUT_DATA, OUT_EVAL]) if (existsSync(f)) fail(`Existe déjà : ${f} (script déjà appliqué ?)`);

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

// ── 1. Frontmatter -> module de données ───────────────────────────────────────
const fmEndMark = '\nconst stageData = { items, styles };\n---\n';
const fmEnd = once(fmEndMark, 'fin frontmatter');
const frontmatter = src.slice(0, fmEnd);

const ifStart = frontmatter.indexOf('interface StageItem {');
const ifEnd = frontmatter.indexOf('// Les visuels vivent dans public/rock/quizrock');
const dataStart = frontmatter.indexOf('const groups: ItemGroup[] = [');
if (ifStart === -1 || ifEnd === -1 || dataStart === -1) fail('Frontmatter : ancres interfaces/données introuvables.');

let interfaces = frontmatter.slice(ifStart, ifEnd).trimEnd();
if (count(interfaces, '  image: string;\n') !== 2) fail('Interfaces : 2 champs image attendus (StageItem, RockStyle).');
interfaces = interfaces.replaceAll('  image: string;\n', '  file: string;\n').replaceAll('interface ', 'export interface ');

let dataBody = frontmatter.slice(dataStart);
const imageCalls = count(dataBody, "image('");
dataBody = dataBody.replace(/image: image\('([^']+)'\)/g, "file: '$1'");
if (imageCalls === 0 || count(dataBody, "image('") !== 0) fail('Données : appels image() non convertis.');
dataBody = dataBody
  .replace('const groups: ItemGroup[] = [', 'export const groups: ItemGroup[] = [')
  .replace('const items: StageItem[] =', 'export const items: StageItem[] =')
  .replace('const styles: RockStyle[] = [', 'export const styles: RockStyle[] = [');
for (const e of ['export const groups', 'export const items', 'export const styles']) {
  if (count(dataBody, e) !== 1) fail(`Données : « ${e} » attendu une fois.`);
}

const dataModule = `/**
 * Données du « Studio Rock » (RockStageBuilder).
 * Importé par le composant (markup) ET par son script client : les recettes
 * (requirements) ne sont plus sérialisées dans le DOM.
 * Les URL d'images sont résolues côté composant (relativeUrl) à partir de \`file\`.
 */

${interfaces}

${dataBody.trimEnd()}
`;

const newFrontmatter = `---
import { relativeUrl } from '../utils/navigation';
import { groups as rawGroups, styles as rawStyles } from '../data/rockStageData';

// Les visuels vivent dans public/rock/quizrock ; relativeUrl tient compte du base Astro.
const image = (file: string) => relativeUrl(\`/rock/quizrock/\${file}\`);
const withImage = <T extends { file: string }>(entry: T) => ({
  ...entry,
  image: image(entry.file),
});

const groups = rawGroups.map((group) => ({ ...group, items: group.items.map(withImage) }));
const items = groups.flatMap((group) => group.items);
const styles = rawStyles.map(withImage);
---
`;
src = newFrontmatter + src.slice(fmEnd + fmEndMark.length);

// ── 2. Suppression du JSON exposé + texte « 8 » ───────────────────────────────
replaceOnce(
  '\n<script\n  is:inline\n  type="application/json"\n  id="rock-stage-data"\n  set:html={JSON.stringify(stageData)}\n></script>\n',
  '',
  'JSON rock-stage-data',
);
replaceOnce('débloquer 8 grands styles du rock.', 'débloquer {styles.length} grands styles du rock.', 'texte 8 styles');

// ── 3. <script> client ────────────────────────────────────────────────────────
replaceRegion(
  "<script>\n  import { shuffle } from '../utils/random';\n  interface StageItem {",
  "  const dataElement = document.getElementById('rock-stage-data');",
  `<script>
  import { items, styles, type RockStyle } from '../data/rockStageData';
  import {
    evaluateAll,
    getGaugeDetail,
    getHeat,
    getIntruderRemark,
    getTargetNames,
    MIN_ITEMS_FOR_GAUGE,
    type HeatLevel,
  } from '../utils/rockStageEvaluation';
  import { plural } from '../utils/plural';
  import { shuffle } from '../utils/random';

  const STORAGE_KEY = 'rock-stage-builder:discovered';

`,
  'script en-tête',
);

replaceOnce(
  "  const dataElement = document.getElementById('rock-stage-data');\n  const root = document.querySelector<HTMLElement>('.rock-stage-builder');\n\n  if (dataElement?.textContent && root) {\n    const { items, styles } = JSON.parse(dataElement.textContent) as StageData;\n\n",
  "  const root = document.querySelector<HTMLElement>('.rock-stage-builder');\n\n  if (root) {\n",
  'bootstrap JSON.parse',
);

replaceRegion('    const evaluate = (style: RockStyle): Evaluation => {', '    const applyGauge = (', '', 'evaluate/evaluateAll');

const removedRemark = replaceRegion(
  '    const getIntruderRemark = (extras: number): string | null => {',
  '    const renderIntruderNote = (',
  '',
  'getIntruderRemark',
);
const intruderFn = dedent(removedRemark.trimEnd(), 4).replace('const getIntruderRemark', 'export const getIntruderRemark');
if (!intruderFn.includes('return null;') || !intruderFn.endsWith('};')) fail('getIntruderRemark : extraction incohérente.');

replaceOnce('      if (selection.size < 3) {', '      if (selection.size < MIN_ITEMS_FOR_GAUGE) {', 'seuil 3');
replaceOnce('      const result = evaluateAll();', '      const result = evaluateAll(styles, selection);', 'appel evaluateAll');
replaceOnce(
  '        const level = HEAT_LEVELS.find((entry) => best.score >= entry.min) ?? HEAT_LEVELS[0];\n        if (level) applyGauge(best.score, level.heat, level.headline);\n',
  '        const level = getHeat(best.score);\n        applyGauge(best.score, level.heat, level.headline);\n',
  'heat level',
);
replaceRegion(
  '        if (gaugeTarget) {\n          const names =',
  '      }\n\n      if (gaugeDetail) {\n        if (best.score === 100) {',
  '        if (gaugeTarget) {\n          gaugeTarget.textContent = `Style le plus proche : ${getTargetNames(best, tied)}`;\n        }\n',
  'noms ex æquo',
);
replaceRegion(
  '      if (gaugeDetail) {\n        if (best.score === 100) {',
  '      renderIntruderNote(best.extras);',
  '      if (gaugeDetail) gaugeDetail.textContent = getGaugeDetail(best);\n\n',
  'détail jauge',
);

// ── 4. Contrôles post-édition ─────────────────────────────────────────────────
const scriptPart = src.slice(src.indexOf('<script>'), src.indexOf('</script>'));
for (const orphan of ['HEAT_LEVELS', 'StageData', 'rock-stage-data', 'dataElement', 'stageData']) {
  if (new RegExp(`(?<![\\w-])${orphan}(?![\\w-])`).test(src)) fail(`Référence orpheline : ${orphan}`);
}
if (/\bEvaluation\b/.test(scriptPart)) fail('Référence orpheline : Evaluation');
if (/\bHeatLevel\b/.test(scriptPart) === false) fail('HeatLevel devrait rester utilisé (applyGauge).');
if (/\bplural\(/.test(scriptPart) === false) fail('plural devrait rester utilisé (renderStage).');

// ── 5. Modules générés ────────────────────────────────────────────────────────
const evalModule = `import type { RockStyle } from '../data/rockStageData';
import { plural } from './plural';

export interface Evaluation {
  style: RockStyle;
  score: number;
  matched: number;
  missing: number;
  extras: number;
}

export interface HeatLevel {
  min: number;
  heat: 'cold' | 'warm' | 'hot' | 'fire' | 'perfect';
  headline: string;
}

/** En dessous de ce nombre d'éléments, l'évaluation reste neutre. */
export const MIN_ITEMS_FOR_GAUGE = 3;

export const HEAT_LEVELS: readonly HeatLevel[] = [
  { min: 100, heat: 'perfect', headline: 'Match parfait !' },
  { min: 90, heat: 'fire', headline: 'Brûlant !' },
  { min: 60, heat: 'hot', headline: 'Ça chauffe sérieusement !' },
  { min: 1, heat: 'warm', headline: 'Tu chauffes !' },
  { min: 0, heat: 'cold', headline: 'Tu chauffes !' },
];

const COLD_LEVEL: HeatLevel = { min: 0, heat: 'cold', headline: 'Tu chauffes !' };

export const getHeat = (score: number): HeatLevel =>
  HEAT_LEVELS.find((entry) => score >= entry.min) ?? COLD_LEVEL;

export const evaluate = (style: RockStyle, selection: ReadonlySet<string>): Evaluation => {
  const required = new Set(style.requirements);
  let matched = 0;

  selection.forEach((id) => {
    if (required.has(id)) matched += 1;
  });

  const extras = selection.size - matched;

  return {
    style,
    score: matched === 0 ? 0 : Math.round((matched / (required.size + extras)) * 100),
    matched,
    missing: required.size - matched,
    extras,
  };
};

export const evaluateAll = (
  styles: readonly RockStyle[],
  selection: ReadonlySet<string>,
): { best: Evaluation; tied: Evaluation[] } | null => {
  const evaluations = styles.map((style) => evaluate(style, selection));
  if (evaluations.length === 0) return null;

  const topScore = evaluations.reduce((max, entry) => Math.max(max, entry.score), 0);
  const contenders = evaluations
    .filter((entry) => entry.score === topScore)
    .sort((a, b) => a.missing - b.missing || a.extras - b.extras);
  const best = contenders[0];
  if (!best) return null;

  return {
    best,
    tied: contenders.filter((entry) => entry.missing === best.missing && entry.extras === best.extras),
  };
};

export const getTargetNames = (best: Evaluation, tied: Evaluation[]): string =>
  tied.length > 1
    ? \`\${tied
        .slice(0, 2)
        .map((entry) => entry.style.name)
        .join(' ou ')}\${tied.length > 2 ? \` (+\${tied.length - 2} autres pistes)\` : ''}\`
    : best.style.name;

export const getGaugeDetail = (best: Evaluation): string => {
  if (best.score === 100) return 'Tous les ingrédients sont réunis, sans élément en trop.';
  const extrasLabel = best.extras > 0 ? \`\${plural(best.extras, 'élément')} en trop\` : 'sans intrus';
  return \`\${best.matched} / \${best.style.requirements.length} ingrédients · \${extrasLabel}\`;
};

${intruderFn}
`;

const pluralModule = `export const plural = (count: number, singular: string, pluralForm = \`\${singular}s\`): string =>
  \`\${count} \${count > 1 ? pluralForm : singular}\`;
`;

if (DRY) {
  console.log(
    `[dry] OK — .astro ${original.split('\n').length} → ${src.split('\n').length} lignes ; data ${dataModule.split('\n').length} l. ; eval ${evalModule.split('\n').length} l. ; ${imageCalls} image() convertis.`,
  );
  process.exit(0);
}

writeFileSync(OUT_DATA, dataModule);
writeFileSync(OUT_EVAL, evalModule);
if (!existsSync(OUT_PLURAL)) writeFileSync(OUT_PLURAL, pluralModule);
writeFileSync(FILE, src);
console.log(`✔ ${OUT_DATA}\n✔ ${OUT_EVAL}\n✔ ${OUT_PLURAL}\n✔ ${FILE}\nVérifier : npx astro check`);
