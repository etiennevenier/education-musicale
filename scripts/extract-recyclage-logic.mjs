#!/usr/bin/env node
// Usage : node scripts/extract-recyclage-logic.mjs [--dry]
// Extrait la logique pure de RecyclageNuancier.astro vers src/utils/recyclageEvaluation.ts.
// Toutes les ancres sont vérifiées AVANT toute écriture ; au moindre écart : abandon sans rien modifier.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = process.cwd();
const FILE = resolve(ROOT, 'src/components/RecyclageNuancier.astro');
const OUT = resolve(ROOT, 'src/utils/recyclageEvaluation.ts');
const DRY = process.argv.includes('--dry');

const fail = (msg) => {
  console.error(`✖ ${msg}\nAucun fichier modifié.`);
  process.exit(1);
};

if (!existsSync(FILE)) fail(`Introuvable : ${FILE}`);
if (existsSync(OUT)) fail(`Existe déjà : ${OUT} (script déjà appliqué ?)`);

let src = readFileSync(FILE, 'utf8');

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
  if (end === -1 || count(src, endNeedle) < 1) fail(`Ancre « ${label} » (fin) introuvable après le début.`);
  const removed = src.slice(start, end);
  src = src.slice(0, start) + replacement + src.slice(end);
  return removed;
};

// 1. Frontmatter : CARDS_PER_GAME importé
replaceOnce(
  '---\ninterface TechniqueOption',
  "---\nimport { CARDS_PER_GAME } from '../utils/recyclageEvaluation';\n\ninterface TechniqueOption",
  'frontmatter import',
);
replaceOnce('const CARDS_PER_GAME = 8;\nconst slots', 'const slots', 'frontmatter CARDS_PER_GAME');

// 2. <script> : imports + types + constantes -> import module
replaceRegion(
  "<script>\n  import {\n    estLegal,",
  '  const plural = (',
  `<script>
  import {
    estLegal,
    getBalancedDeck,
    SCENARIOS,
    TECHNIQUE_LABELS,
    type Scenario,
  } from '../data/recyclageData';
  import {
    buildNotes,
    CARDS_PER_GAME,
    CRITERION_IDS,
    createAnswer,
    getExpectedCriteria,
    getFeedbackTitle,
    isCriterionId,
    isTechniqueId,
    validateAnswer,
    type Answer,
    type Validation,
  } from '../utils/recyclageEvaluation';

`,
  'script imports/types',
);

// 3. createAnswer / getStudentVerdict / buildNotes -> retirés (buildNotes récupéré verbatim)
const removed = replaceRegion(
  '    const createAnswer = (): Answer => ({',
  '    const renderFeedback = (',
  "    const labelFor = (technique: Scenario['technique']): string => TECHNIQUE_LABELS[technique];\n\n",
  'logique pure',
);
const bnStart = removed.indexOf('    const buildNotes = (');
const bnEndMark = '      return notes;\n    };\n';
const bnEnd = removed.indexOf(bnEndMark);
if (bnStart === -1 || bnEnd === -1) fail('buildNotes introuvable dans la région extraite.');
const buildNotes = removed
  .slice(bnStart, bnEnd + bnEndMark.length)
  .split('\n')
  .map((l) => (l.startsWith('    ') ? l.slice(4) : l))
  .join('\n')
  .replace('const buildNotes = (', 'export const buildNotes = (');

// 4. renderFeedback : titre + checks
replaceRegion(
  '      if (title) {\n        if (validation.success && validation.criteriaOk) {',
  "      const verdict = feedback.querySelector<HTMLElement>('[data-feedback-verdict]');",
  '      if (title) title.textContent = getFeedbackTitle(validation);\n\n',
  'renderFeedback titre',
);
replaceRegion(
  '      const checks: Record<CriterionId, boolean> = {',
  '      CRITERION_IDS.forEach((criterionId) => {',
  '      const checks = getExpectedCriteria(scenario);\n\n',
  'renderFeedback checks',
);

// 5. validateCard
replaceRegion(
  '      const actualLegal = estLegal(scenario);\n      const studentLegal = getStudentVerdict(answer.criteria);',
  '      card.querySelectorAll<HTMLButtonElement>(\'[data-technique]\').forEach((button) => {\n        button.disabled = true;',
  `      const validation = validateAnswer(scenario, answer);
      const { success, actualLegal, studentLegal } = validation;

      answer.success = success;
      card.dataset.cardState = success ? 'success' : 'danger';

      const notes = buildNotes(scenario, answer, validation);

`,
  'validateCard',
);

// 6. Divers
replaceOnce(
  "          if (technique !== 'reprise' && technique !== 'sample' && technique !== 'remix') return;",
  '          if (!isTechniqueId(technique)) return;',
  'garde technique',
);
replaceOnce(
  "'Réinitialiser la session et tirer 8 nouvelles cartes ?'",
  '`Réinitialiser la session et tirer ${CARDS_PER_GAME} nouvelles cartes ?`',
  'confirm 8 cartes',
);

// 7. Contrôles post-édition (références orphelines)
const scriptPart = src.slice(src.indexOf('<script>'), src.indexOf('</script>'));
if (/\bgetStudentVerdict\b/.test(scriptPart)) fail('Référence orpheline : getStudentVerdict');
if (/\bCriterionId\b/.test(scriptPart)) fail('Référence orpheline : CriterionId');
if (count(scriptPart, 'labelFor(') < 1) fail('labelFor devrait rester utilisé.');

const moduleSrc = `import { estLegal, TECHNIQUE_LABELS, type Scenario } from '../data/recyclageData';

export const CARDS_PER_GAME = 8;

export const CRITERION_IDS = [
  'oeuvreLibre',
  'enregistrementLibre',
  'exception',
  'accord',
] as const;

export type CriterionId = (typeof CRITERION_IDS)[number];
export type TechniqueId = Scenario['technique'];
export type Criteria = Record<CriterionId, boolean>;

export interface Answer {
  technique: TechniqueId | null;
  criteria: Criteria;
  validated: boolean;
  success: boolean;
}

export interface Validation {
  techniqueOk: boolean;
  verdictOk: boolean;
  criteriaOk: boolean;
  success: boolean;
  actualLegal: boolean;
  studentLegal: boolean;
}

const TECHNIQUE_IDS = Object.keys(TECHNIQUE_LABELS) as TechniqueId[];

export const isCriterionId = (value: string | undefined): value is CriterionId =>
  value !== undefined && (CRITERION_IDS as readonly string[]).includes(value);

export const isTechniqueId = (value: string | undefined): value is TechniqueId =>
  value !== undefined && (TECHNIQUE_IDS as string[]).includes(value);

const labelFor = (technique: TechniqueId): string => TECHNIQUE_LABELS[technique];

export const createAnswer = (): Answer => ({
  technique: null,
  criteria: { oeuvreLibre: false, enregistrementLibre: false, exception: false, accord: false },
  validated: false,
  success: false,
});

export const getStudentVerdict = (criteria: Criteria): boolean =>
  criteria.exception || (criteria.oeuvreLibre && criteria.enregistrementLibre) || criteria.accord;

export const getExpectedCriteria = (scenario: Scenario): Criteria => ({
  oeuvreLibre: scenario.oeuvreLibre,
  enregistrementLibre: scenario.enregistrementLibre,
  exception: scenario.exception !== null,
  accord: scenario.accord,
});

export const validateAnswer = (scenario: Scenario, answer: Answer): Validation => {
  const actualLegal = estLegal(scenario);
  const studentLegal = getStudentVerdict(answer.criteria);
  const expected = getExpectedCriteria(scenario);
  const techniqueOk = answer.technique === scenario.technique;
  const verdictOk = studentLegal === actualLegal;
  const criteriaOk = CRITERION_IDS.every((id) => answer.criteria[id] === expected[id]);
  return { techniqueOk, verdictOk, criteriaOk, success: techniqueOk && verdictOk, actualLegal, studentLegal };
};

export const getFeedbackTitle = (v: Validation): string => {
  if (v.success && v.criteriaOk) return 'Analyse complète : technique et raisonnement justes.';
  if (v.success) return 'Bon verdict, mais certains critères sont mal identifiés.';
  if (!v.verdictOk) {
    return v.actualLegal
      ? "Cette situation était légale : tu l'as jugée interdite."
      : "Cette situation est illégale : tu l'as crue autorisée.";
  }
  return "Le verdict est bon, mais la technique n'est pas la bonne.";
};

${buildNotes}`;

if (DRY) {
  console.log(`[dry] OK — ${count(src, '\n') + 1} lignes .astro après édition, module ${moduleSrc.split('\n').length} lignes.`);
  process.exit(0);
}

writeFileSync(OUT, moduleSrc);
writeFileSync(FILE, src);
console.log(`✔ ${OUT}\n✔ ${FILE}\nVérifier : npx astro check`);
