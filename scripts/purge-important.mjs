#!/usr/bin/env node
/**
 * purge-important.mjs
 *
 * Retire les `!important` dont l'inutilité est démontrée par la cascade
 * (même spécificité + déclaration plus tardive, media queries exclusives,
 * aucune règle concurrente), dans les 5 composants d'entraînement concernés.
 *
 * Usage :
 *   node scripts/purge-important.mjs            # simulation (aucune écriture)
 *   node scripts/purge-important.mjs --write    # applique le palier 1
 *   node scripts/purge-important.mjs --write --tier2
 *
 * Palier 1 : sûr, aucune dépendance hors des fichiers audités.
 * Palier 2 : sûr SI (a) la page porte bien `body.mobile-header-hidden` et
 *            (b) tools-shared.css / Layout.astro ne redéfinissent pas les
 *            mêmes propriétés avec une spécificité supérieure
 *            (vérifier avec `node scripts/audit-important.mjs` avant).
 *
 * Garde-fous (même esprit que dedupe-tools-css.mjs) :
 *  - chaque motif doit être trouvé EXACTEMENT une fois, sinon : abandon total
 *    avant toute écriture ;
 *  - un motif déjà appliqué est ignoré (idempotent) ;
 *  - équilibre des accolades dans chaque <style> contrôlé avant/après ;
 *  - le nombre de `!important` retirés est comparé au nombre attendu.
 */
import fs from 'node:fs';
import path from 'node:path';

const args = new Set(process.argv.slice(2));
const WRITE = args.has('--write');
const TIER2 = args.has('--tier2');
const ROOT = process.cwd();
const COMP = 'src/components/entrainement/';
const CSS = 'src/styles/';

/** @type {{file:string, tier:1|2, why:string, find:string, replace:string, removes:number}[]} */
const EDITS = [
  // ───────────── ClavierNotes ─────────────
  {
    file: COMP + 'ClavierNotes.astro', tier: 1, removes: 2,
    why: "portrait : #cn-game est redéclaré APRÈS la règle groupée (même spécificité 2,0,0) → l'ordre suffit",
    find: `      justify-content: flex-start !important;\n      gap: 0.85rem !important;`,
    replace: `      justify-content: flex-start;\n      gap: 0.85rem;`,
  },
  {
    file: COMP + 'ClavierNotes.astro', tier: 1, removes: 3,
    why: "portrait : .cn-piano redéclaré après la règle de base (1,1,0) ; la règle paysage coarse est exclusive (media portrait vs landscape)",
    find: `      flex: 0 0 auto !important;\n      height: clamp(120px, 25dvh, 160px) !important;\n      margin: 0.25rem 0 !important;`,
    replace: `      flex: 0 0 auto;\n      height: clamp(120px, 25dvh, 160px);\n      margin: 0.25rem 0;`,
  },
  // ───────────── PianoInteractif ─────────────
  {
    file: COMP + 'PianoInteractif.astro', tier: 1, removes: 1,
    why: ".white-key.active (1,2,0) est déclaré APRÈS .white-key:hover (1,2,0) → gagne par l'ordre",
    find: `background:linear-gradient(135deg, var(--accent-strong), var(--accent)) !important; color:#fff; box-shadow:inset 0 0 0 2px rgba(255,255,255,0.35); }`,
    replace: `background:linear-gradient(135deg, var(--accent-strong), var(--accent)); color:#fff; box-shadow:inset 0 0 0 2px rgba(255,255,255,0.35); }`,
  },
  {
    file: COMP + 'PianoInteractif.astro', tier: 1, removes: 1,
    why: ".black-key.active (1,2,0) est déclaré APRÈS .black-key:hover (1,2,0) → gagne par l'ordre",
    find: `#tool-piano .black-key.active { background:linear-gradient(135deg, var(--accent-strong), var(--accent)) !important; color:#fff; }`,
    replace: `#tool-piano .black-key.active { background:linear-gradient(135deg, var(--accent-strong), var(--accent)); color:#fff; }`,
  },
  // ───────────── DessinerClefs ─────────────
  {
    file: COMP + 'DessinerClefs.astro', tier: 1, removes: 1,
    why: "#cl-board (2,0,0) : aucune règle concurrente ; doublon exact de la déclaration plus bas",
    find: `        touch-action: none !important;\n        -webkit-tap-highlight-color: transparent;`,
    replace: `        touch-action: none;\n        -webkit-tap-highlight-color: transparent;`,
  },
  {
    file: COMP + 'DessinerClefs.astro', tier: 1, removes: 4,
    why: "#cl-board (2,0,0) : aucune règle concurrente dans le dump (seul un style inline pourrait lutter, aucun n'écrit ces propriétés)",
    find: `        touch-action: none !important;\n        -webkit-user-select: none !important;\n        user-select: none !important;\n        -webkit-touch-callout: none !important;`,
    replace: `        touch-action: none;\n        -webkit-user-select: none;\n        user-select: none;\n        -webkit-touch-callout: none;`,
  },
  // ───────────── LectureRythmique ─────────────
  {
    file: COMP + 'LectureRythmique.astro', tier: 1, removes: 1,
    why: "la règle d'affichage du calque est déjà limitée à :not([hidden]) : rien ne peut rendre [hidden] visible",
    find: `#tool-rhythm .rt-rotate-hint[hidden] { display: none !important; }`,
    replace: `#tool-rhythm .rt-rotate-hint[hidden] { display: none; }`,
  },
  {
    file: COMP + 'LectureRythmique.astro', tier: 1, removes: 1,
    why: "label.check / champs masqués : (2,1,1) et (1,1,1) > (1,1,0) du display:inline-flex d'origine ; aucune règle landscape ne fixe display sur ces éléments",
    find: `            #tool-rhythm label.check { display: none !important; }`,
    replace: `            #tool-rhythm label.check { display: none; }`,
  },
  {
    file: COMP + 'LectureRythmique.astro', tier: 1, removes: 1,
    why: ".field.tempo (1,2,0) > .field (1,1,0) ; aucune règle landscape ne fixe display dessus",
    find: `            #tool-rhythm .field.tempo { display: none !important; }`,
    replace: `            #tool-rhythm .field.tempo { display: none; }`,
  },
  // ───────────── LectureNotes ─────────────
  {
    file: COMP + 'LectureNotes.astro', tier: 1, removes: 2,
    why: "paysage ≤ 550 : la règle plus tardive du bloc compact (1,1,0) l'emporte déjà ; en 501–550 tools-landscape.css (1,2,1, !important) gagne de toute façon → résultat identique",
    find: `    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;\n    gap: 6px !important;`,
    replace: `    grid-template-columns: repeat(2, minmax(0, 1fr));\n    gap: 6px;`,
  },
  {
    file: COMP + 'LectureNotes.astro', tier: 1, removes: 1,
    why: "bloc tablette placé APRÈS la règle .notes-rotate-hint {display:flex} de même spécificité, et les deux media ne se recouvrent qu'à 768 px exactement",
    find: `  #tool-notes .notes-rotate-hint { display: none !important; }`,
    replace: `  #tool-notes .notes-rotate-hint { display: none; }`,
  },
  // ───────────── palier 2 ─────────────
  {
    file: COMP + 'LectureRythmique.astro', tier: 2, removes: 5,
    why: "doublon de la dernière @media de tools-landscape.css (≤ 550 px, même spécificité 1,2,1 ; elle règle déjà wrap/justify/gap). Suppose body.mobile-header-hidden présent.",
    find: `                display: flex !important;\n                flex: 0 0 auto;\n                flex-direction: row !important;\n                flex-wrap: nowrap !important;\n                align-items: center !important;\n                justify-content: space-between !important;`,
    replace: `                display: flex;\n                flex: 0 0 auto;\n                flex-direction: row;\n                flex-wrap: nowrap;\n                align-items: center;\n                justify-content: space-between;`,
  },
  {
    file: COMP + 'LectureNotes.astro', tier: 2, removes: 4,
    why: "icônes de clé : aucune règle concurrente dans le dump ; la chaîne !important de base force le !important du bloc ≤ 550. Vérifier tools-shared.css (svg { … }).",
    find: `  width: 1.35rem !important;\n  height: 2.7rem !important;\n}\n\n#tool-notes .level-clef--fa {\n  width: 1.35rem !important;\n  height: 1.5rem !important;`,
    replace: `  width: 1.35rem;\n  height: 2.7rem;\n}\n\n#tool-notes .level-clef--fa {\n  width: 1.35rem;\n  height: 1.5rem;`,
  },
  {
    file: COMP + 'LectureNotes.astro', tier: 2, removes: 2,
    why: "suite de la chaîne ci-dessus (bloc ≤ 550 px)",
    find: `  #tool-notes .level-clef--sol { height: 2rem !important; }\n  #tool-notes .level-clef--fa { height: 1.3rem !important; }`,
    replace: `  #tool-notes .level-clef--sol { height: 2rem; }\n  #tool-notes .level-clef--fa { height: 1.3rem; }`,
  },
  // ───────────── tools-landscape.css : requête redondante (identique au comportement actuel) ─────────────
  {
    file: CSS + 'tools-landscape.css', tier: 1, removes: 0,
    why: "les 3 requêtes de la liste sont A∧coarse, A∧any-coarse, A : leur union vaut A → on garde A",
    find: `@media (orientation: landscape) and (min-height: 501px) and (max-height: 768px) and (pointer: coarse),\n       (orientation: landscape) and (min-height: 501px) and (max-height: 768px) and (any-pointer: coarse),\n       (orientation: landscape) and (min-height: 501px) and (max-height: 768px) {`,
    replace: `@media (orientation: landscape) and (min-height: 501px) and (max-height: 768px) {`,
  },
];

const countImportant = (s) => (s.match(/!important/g) ?? []).length;
const braces = (s) => [(s.match(/\{/g) ?? []).length, (s.match(/\}/g) ?? []).length];
const occurrences = (hay, needle) => (needle ? hay.split(needle).length - 1 : 0);

const selected = EDITS.filter((e) => e.tier === 1 || TIER2);
const byFile = new Map();
for (const e of selected) byFile.set(e.file, [...(byFile.get(e.file) ?? []), e]);

const plan = [];
let fatal = false;
for (const [file, edits] of byFile) {
  const abs = path.join(ROOT, file);
  if (!fs.existsSync(abs)) { console.error(`✗ introuvable : ${file}`); fatal = true; continue; }
  let text = fs.readFileSync(abs, 'utf8');
  const before = { imp: countImportant(text), br: braces(text) };
  let applied = 0, skipped = 0, expected = 0;
  for (const e of edits) {
    const n = occurrences(text, e.find);
    if (n === 1) { text = text.replace(e.find, () => e.replace); applied++; expected += e.removes; continue; }
    if (n === 0 && occurrences(text, e.replace) >= 1) { skipped++; continue; }
    console.error(`✗ ${file} : motif trouvé ${n}× (attendu 1) — ${e.why.slice(0, 80)}`);
    fatal = true;
  }
  const after = { imp: countImportant(text), br: braces(text) };
  if (after.br[0] !== before.br[0] || after.br[1] !== before.br[1]) { console.error(`✗ ${file} : accolades modifiées`); fatal = true; }
  if (before.imp - after.imp !== expected) { console.error(`✗ ${file} : ${before.imp - after.imp} !important retirés, ${expected} attendus`); fatal = true; }
  plan.push({ file, abs, text, applied, skipped, delta: before.imp - after.imp, left: after.imp });
}
if (fatal) { console.error('\nAbandon : aucune écriture.'); process.exit(1); }

let total = 0;
for (const p of plan) {
  total += p.delta;
  console.log(`${WRITE ? '✓' : '·'} ${p.file.padEnd(52)} −${p.delta} !important  (${p.applied} appliqués, ${p.skipped} déjà faits, reste ${p.left})`);
  if (WRITE && p.applied > 0) fs.writeFileSync(p.abs, p.text);
}
console.log(`\n${WRITE ? 'Écrit' : 'Simulation'} : −${total} !important${TIER2 ? ' (paliers 1+2)' : ' (palier 1)'}.`);
if (!WRITE) console.log('Relance avec --write pour appliquer.');
