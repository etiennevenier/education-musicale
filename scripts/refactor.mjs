#!/usr/bin/env node
/**
 * refactor.mjs — refactorisation automatique du module Entraînement.
 *
 * Usage (depuis la racine du dépôt) :
 *   node scripts/refactor.mjs              # simulation : liste ce qui serait modifié, n'écrit rien
 *   node scripts/refactor.mjs --apply      # applique (exige un arbre git propre, sauf --force)
 *   node scripts/refactor.mjs --apply --only=h1,toolpage
 *   node scripts/refactor.mjs --skip=contrast
 *   node scripts/refactor.mjs --root=/chemin/du/depot --overwrite
 *
 * Étapes (ordre d'exécution) :
 *   h1         1. un seul h1 par page (+ h1 invisible du hub mobile)
 *   toolpage   8. ToolPage.astro + src/data/tools.ts, pages et hub réécrits
 *   translate  2. « Challenge Over ! » -> « Défi terminé ! »
 *   bfcache    3. pageshow / event.persisted sur les outils concernés
 *   storage    4. clés localStorage préfixées « education-musicale: »
 *   sitemap    5. référence à generate-sitemap retirée du script de build
 *   outline    6. suppression des `outline: none`
 *   contrast   7. contrastes WCAG (pastilles, numéros, dégradés, survol des quiz)
 *   shared     8. utils/dom.ts, utils/challengeTool.ts, utils/clefs.ts, ClefSprite.astro
 *   tests      tests e2e de recette (cibles tactiles, h1, clés SVG, touches du piano)
 *
 * Le script est idempotent : le relancer ne change plus rien.
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve, relative } from 'node:path';
import { execSync } from 'node:child_process';

/* ------------------------------------------------------------------ */
/* Options                                                             */
/* ------------------------------------------------------------------ */
const argv = process.argv.slice(2);
const flag = (name) => argv.includes(name);
const opt = (name) => {
  const hit = argv.find((a) => a === name || a.startsWith(name + '='));
  if (!hit) return undefined;
  if (hit.includes('=')) return hit.slice(hit.indexOf('=') + 1);
  const next = argv[argv.indexOf(hit) + 1];
  return next && !next.startsWith('--') ? next : undefined;
};
const list = (v) => (v ? v.split(',').map((s) => s.trim()).filter(Boolean) : null);

const ROOT = resolve(opt('--root') ?? process.cwd());
const APPLY = flag('--apply');
const OVERWRITE = flag('--overwrite');
const ONLY = list(opt('--only'));
const SKIP = list(opt('--skip')) ?? [];
const PREFIX = 'education-musicale:';

const enabled = (id) => (ONLY ? ONLY.includes(id) : true) && !SKIP.includes(id);

/* ------------------------------------------------------------------ */
/* Magasin de fichiers (lecture / écriture différée)                   */
/* ------------------------------------------------------------------ */
const store = new Map(); // chemin absolu -> { rel, before, after }
const touched = new Map(); // étape -> Set(rel)
const notes = []; // { step, level, text }

const abs = (rel) => join(ROOT, rel);
const note = (step, level, text) => notes.push({ step, level, text });

function load(rel) {
  const p = abs(rel);
  if (store.has(p)) return store.get(p);
  const before = existsSync(p) ? readFileSync(p, 'utf8') : null;
  const entry = { rel, before, after: before };
  store.set(p, entry);
  return entry;
}

function read(rel) {
  return load(rel).after;
}

function write(rel, text, step) {
  const entry = load(rel);
  if (entry.after === text) return false;
  entry.after = text;
  if (!touched.has(step)) touched.set(step, new Set());
  touched.get(step).add(rel);
  return true;
}

/** Applique `fn` au contenu d'un fichier existant. */
function update(rel, step, fn) {
  const src = read(rel);
  if (src === null) {
    note(step, 'warn', 'fichier introuvable : ' + rel);
    return;
  }
  write(rel, fn(src), step);
}

/** Crée un fichier neuf (n'écrase pas l'existant sans --overwrite). */
function create(rel, content, step) {
  const current = read(rel);
  if (current !== null && !OVERWRITE) {
    if (current !== content) note(step, 'info', 'existe déjà, laissé tel quel : ' + rel);
    return;
  }
  write(rel, content, step);
}

const SKIP_DIRS = new Set(['node_modules', 'dist', '.astro', '.git', 'lh', 'test-results', 'playwright-report']);

function walk(relDir, exts, out = []) {
  const dir = abs(relDir);
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const relPath = join(relDir, entry);
    const st = statSync(join(dir, entry));
    if (st.isDirectory()) walk(relPath, exts, out);
    else if (exts.some((e) => entry.endsWith(e))) out.push(relPath.split('\\').join('/'));
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Aides CSS / Astro                                                   */
/* ------------------------------------------------------------------ */
/** Parcourt les règles « sélecteur { corps } » (sans imbrication). `fn` renvoie la règle remplaçante ou null. */
function mapRules(css, fn) {
  return css.replace(/([^{}]+)\{([^{}]*)\}/g, (all, sel, body) => {
    const out = fn(sel, body);
    return out === null || out === undefined ? all : out;
  });
}

/** Applique `fn` au contenu de chaque bloc <style> d'un fichier .astro. */
function mapStyleBlocks(src, fn) {
  return src.replace(/(<style\b[^>]*>)([\s\S]*?)(<\/style>)/g, (_all, a, b, c) => a + fn(b) + c);
}

/** Applique `fn` au balisage uniquement (hors frontmatter, <style> et <script>). */
function mapMarkup(src, fn) {
  const fm = src.match(/^---\n[\s\S]*?\n---\n/);
  const head = fm ? fm[0] : '';
  const rest = src.slice(head.length);
  const parts = rest.split(/(<style\b[\s\S]*?<\/style>|<script\b[\s\S]*?<\/script>)/g);
  return (
    head +
    parts.map((p) => (/^<(style|script)\b/.test(p) ? p : fn(p))).join('')
  );
}

const mapCss = (rel, src, fn) => (rel.endsWith('.css') ? fn(src) : mapStyleBlocks(src, fn));

function addImport(src, line) {
  if (src.includes(line)) return src;
  if (!/^---\n/.test(src)) return '---\n' + line + '\n---\n' + src;
  return src.replace(/^---\n/, () => '---\n' + line + '\n');
}

const TOOL_SLUGS = [
  ['lecture-notes', 'LectureNotes'],
  ['lecture-rythmique', 'LectureRythmique'],
  ['piano-interactif', 'PianoInteractif'],
  ['dessiner-clefs', 'DessinerClefs'],
  ['clavier-notes', 'ClavierNotes'],
  ['oreille-nom', 'OreilleNom'],
  ['oreille-clavier', 'OreilleClavier'],
];
const TOOL_COMPONENTS = TOOL_SLUGS.map(([, c]) => 'src/components/entrainement/' + c + '.astro');
const TOOL_CSS = ['src/styles/tools-shared.css', 'src/styles/tools-shell.css', 'src/styles/tools-landscape.css'];

/* ================================================================== */
/* 1. h1                                                               */
/* ================================================================== */
function stepH1() {
  const step = 'h1';

  update('src/layouts/Layout.astro', step, (s) => {
    let out = s;
    if (!out.includes('siteTitleIsHeading')) {
      out = out.replace('} = Astro.props;', () =>
        "} = Astro.props;\n// Un seul <h1> par page : le titre du site n'en est un que sur les pages « full ».\nconst siteTitleIsHeading = mobileHeader === 'full';",
      );
      out = out.replace(
        /<h1><a href=\{relativeUrl\('\/'\)\}>Éducation Musicale<\/a><\/h1>/,
        () =>
          "{siteTitleIsHeading\n        ? <h1><a href={relativeUrl('/')}>Éducation Musicale</a></h1>\n        : <p class=\"site-title\"><a href={relativeUrl('/')}>Éducation Musicale</a></p>}",
      );
      const withComment =
        /\{\/\*[^{}]*?\*\/\}\s*\{mobileHeader === 'hidden' && <h1 class="visually-hidden">\{title\}<\/h1>\}/;
      const replacement =
        "{/* Hub (en-tête « minimal ») : le titre du site est un paragraphe, masqué sur mobile ;\n          ce h1 invisible garde un titre de page dans l'arbre d'accessibilité.\n          Les pages d'outils (« hidden ») reçoivent le leur de ToolPage.astro. */}\n      {mobileHeader === 'minimal' && <h1 class=\"visually-hidden\">{title}</h1>}";
      if (withComment.test(out)) out = out.replace(withComment, () => replacement);
      else
        out = out.replace(
          /\{mobileHeader === 'hidden' && <h1 class="visually-hidden">\{title\}<\/h1>\}/,
          () => "{mobileHeader === 'minimal' && <h1 class=\"visually-hidden\">{title}</h1>}",
        );
      out = mapStyleBlocks(out, (css) => css.replace(/\.site-header h1\b/g, '.site-header :is(h1, .site-title)'));
      out = out.replace(/\n<\/style>\s*$/, () =>
        '\n\n  /* Titre du site rendu en <p> (hub, outils) : même gabarit que le h1. */\n  .site-header .site-title {\n    font-size: 2em;\n  }\n</style>\n',
      );
    }
    return out;
  });

  // Composants d'outils : le titre visible devient un <p> décoratif (le h1 unique vient de ToolPage).
  for (const rel of TOOL_COMPONENTS) {
    update(rel, step, (s) => {
      let out = mapMarkup(s, (markup) =>
        markup.replace(/<h1(?:\s+class="([^"]*)")?>([\s\S]*?)<\/h1>/g, (_all, cls, inner) =>
          '<p class="' + ((cls ? cls + ' ' : '') + 'tool-title') + '" aria-hidden="true">' + inner + '</p>',
        ),
      );
      out = mapStyleBlocks(out, retargetH1);
      return out;
    });
  }
  for (const rel of TOOL_CSS) update(rel, step, (s) => retargetH1(s));
}

function retargetH1(css) {
  return mapRules(css, (sel, body) =>
    /\bh1\b/.test(sel) ? sel.replace(/\bh1\b/g, '.tool-title') + '{' + body + '}' : null,
  );
}

/* ================================================================== */
/* 8a. ToolPage + tools.ts + pages + hub                               */
/* ================================================================== */
const TOOLS_TS = `/**
 * Source unique des outils d'entraînement : hub, pages (ToolPage) et tests.
 */
export interface ToolInfo {
  slug: string;
  title: string;
  icon: string;
  description: string;
  /** Chemin sans base : à passer à relativeUrl(). */
  path: string;
}

const RAW = [
  { slug: 'lecture-notes', title: 'Lecture de Notes', icon: '🎼', description: 'Lis des notes sur la portée, en clé de sol et en clé de fa.' },
  { slug: 'lecture-rythmique', title: 'Lecture Rythmique', icon: '🥁', description: 'Reproduis des rythmes en tapant en mesure avec le métronome.' },
  { slug: 'piano-interactif', title: 'Piano Interactif', icon: '🎹', description: 'Joue sur un clavier de 88 touches et vois la note sur la portée.' },
  { slug: 'dessiner-clefs', title: 'Dessiner les Clefs', icon: '✒️', description: 'Apprends à tracer la clef de sol et la clef de fa, étape par étape.' },
  { slug: 'clavier-notes', title: 'Identification Clavier', icon: '🔴', description: 'Retrouve le nom de la note indiquée sur le clavier du piano.' },
  { slug: 'oreille-nom', title: 'Oreille — Noms', icon: '👂', description: 'Écoute une note et retrouve son nom.' },
  { slug: 'oreille-clavier', title: 'Oreille — Clavier', icon: '🔔', description: 'Écoute une note et retrouve sa touche sur le clavier.' },
] as const;

export type ToolSlug = (typeof RAW)[number]['slug'];

export const tools: ToolInfo[] = RAW.map((tool) => ({ ...tool, path: '/entrainement/' + tool.slug }));

export function getTool(slug: ToolSlug): ToolInfo {
  const tool = tools.find((item) => item.slug === slug);
  if (!tool) throw new Error('Outil inconnu : ' + slug);
  return tool;
}
`;

const TOOL_PAGE = `---
// Gabarit commun des 7 pages d'outils d'entraînement : feuilles de style du shell,
// métadonnées issues de src/data/tools.ts et h1 unique (invisible : le titre visible
// est un <p class="tool-title"> décoratif dans chaque composant).
import Layout from './Layout.astro';
import '../styles/tools-shell.css';
import '../styles/tools-landscape.css';
import { getTool, type ToolSlug } from '../data/tools';

interface Props {
  slug: ToolSlug;
}

const tool = getTool(Astro.props.slug);
---

<Layout
  title={tool.title}
  description={tool.description}
  wide
  backLabel="Accueil"
  mobileHeader="hidden"
>
  <h1 class="visually-hidden">{tool.title}</h1>
  <slot />
</Layout>
`;

function stepToolPage() {
  const step = 'toolpage';
  create('src/data/tools.ts', TOOLS_TS, step);
  create('src/layouts/ToolPage.astro', TOOL_PAGE, step);

  for (const [slug, comp] of TOOL_SLUGS) {
    const page = 'src/pages/entrainement/' + slug + '.astro';
    const component = 'src/components/entrainement/' + comp + '.astro';
    if (read(component) === null) {
      note(step, 'warn', 'composant absent, page non réécrite : ' + component);
      continue;
    }
    const content =
      "---\nimport ToolPage from '../../layouts/ToolPage.astro';\nimport " +
      comp +
      " from '../../components/entrainement/" +
      comp +
      ".astro';\n---\n\n<ToolPage slug=\"" +
      slug +
      '">\n  <' +
      comp +
      ' />\n</ToolPage>\n';
    const current = read(page);
    if (current !== null && !/ToolPage/.test(current) && !/mobileHeader="hidden"/.test(current)) {
      note(step, 'warn', 'page inattendue, non réécrite : ' + page);
      continue;
    }
    write(page, content, step);
  }

  update('src/pages/entrainement/index.astro', step, (s) => {
    let out = s;
    if (/const tools = \[/.test(out)) {
      out = out.replace(/const tools = \[[\s\S]*?\n\];\n?/, () => '');
      out = addImport(out, "import { tools } from '../../data/tools';");
      out = out.replace(/href=\{tool\.href\}/g, () => 'href={relativeUrl(tool.path)}');
    }
    return out;
  });
}

/* ================================================================== */
/* 2. Traduction « Challenge Over ! »                                  */
/* ================================================================== */
function stepTranslate() {
  const step = 'translate';
  const files = [...walk('src', ['.astro', '.ts']), ...walk('tests', ['.ts'])];
  for (const rel of files) {
    const src = read(rel);
    if (src === null || !/Challenge Over\s?!/.test(src)) continue;
    write(rel, src.replace(/Challenge Over\s?!/g, () => 'Défi terminé !'), step);
  }
}

/* ================================================================== */
/* 3. bfcache                                                          */
/* ================================================================== */
function stepBfcache() {
  const step = 'bfcache';
  const targets = [
    ['src/components/entrainement/ClavierNotes.astro', 'backToMenu'],
    ['src/components/entrainement/OreilleClavier.astro', 'backToMenu'],
    ['src/components/entrainement/OreilleNom.astro', 'backToMenu'],
    ['src/components/entrainement/LectureNotes.astro', 'returnToNotesMenu'],
  ];
  const single = /^([ \t]*)window\.addEventListener\('pagehide', \(\) => session\?\.cancel\(\)\);[ \t]*$/m;
  const block = /^([ \t]*)window\.addEventListener\('pagehide', \(\) => \{\n[\s\S]*?\n\1\}\);[ \t]*$/m;

  for (const [rel, fn] of targets) {
    update(rel, step, (s) => {
      if (/addEventListener\('pageshow'/.test(s)) return s;
      const re = single.test(s) ? single : block;
      const m = s.match(re);
      if (!m) {
        note(step, 'warn', "écouteur pagehide introuvable, à traiter à la main : " + rel);
        return s;
      }
      const ind = m[1];
      const add =
        '\n' + ind + "// bfcache : à la restauration depuis le cache, la session est morte : retour au menu.\n" +
        ind + "window.addEventListener('pageshow', (event) => {\n" +
        ind + '  if (event.persisted) ' + fn + '();\n' +
        ind + '});';
      return s.replace(re, (all) => all + add);
    });
  }

  // Les écouteurs de resize ne doivent être désarmés que si la page ne peut pas être restaurée.
  const abortRe =
    /window\.addEventListener\('pagehide', \(\) => \{\s*if \(staffResizeFrame\) window\.cancelAnimationFrame\(staffResizeFrame\);\s*staffResizeAbort\.abort\(\);\s*\}, \{ once: true \}\);/;
  for (const rel of ['src/components/entrainement/LectureNotes.astro', 'src/components/entrainement/PianoInteractif.astro']) {
    update(rel, step, (s) =>
      s.replace(abortRe, () =>
        "window.addEventListener('pagehide', (event) => {\n" +
        '            if (staffResizeFrame) window.cancelAnimationFrame(staffResizeFrame);\n' +
        '            staffResizeFrame = 0;\n' +
        '            // bfcache : si la page peut être restaurée, les écouteurs doivent survivre.\n' +
        '            if (!event.persisted) staffResizeAbort.abort();\n' +
        '        });',
      ),
    );
  }
}

/* ================================================================== */
/* 4. localStorage / sessionStorage                                    */
/* ================================================================== */
function stepStorage() {
  const step = 'storage';
  const files = [...walk('src', ['.astro', '.ts', '.js', '.mjs']), ...walk('tests', ['.ts'])];
  const call = /(\b(?:localStorage|sessionStorage)\.(?:getItem|setItem|removeItem)\(\s*)(['"`])([^'"`$\\]+)\2/g;
  const dynamic = /\b(?:localStorage|sessionStorage)\.(?:getItem|setItem|removeItem)\(\s*(?!['"`])/;
  const konst = /(\bconst\s+[A-Za-z_]*KEY[A-Za-z_]*\s*(?::\s*string\s*)?=\s*)(['"])([^'"\\]+)\2/g;

  for (const rel of files) {
    const src = read(rel);
    if (src === null || !/localStorage|sessionStorage/.test(src)) continue;
    let out = src.replace(call, (all, a, q, key) => (key.startsWith(PREFIX) ? all : a + q + PREFIX + key + q));
    out = out.replace(konst, (all, a, q, key) => (key.startsWith(PREFIX) ? all : a + q + PREFIX + key + q));
    if (dynamic.test(out)) note(step, 'warn', 'clé de stockage non littérale, à vérifier à la main : ' + rel);
    write(rel, out, step);
  }
  note(step, 'info', 'les anciennes valeurs (bannière d\'orientation, zoom du piano, avertissement de rotation) sont simplement ignorées : chaque préférence est redemandée une fois.');
}

/* ================================================================== */
/* 5. package.json : sitemap obsolète                                  */
/* ================================================================== */
function stepSitemap() {
  const step = 'sitemap';
  update('package.json', step, (s) => {
    const out = s.replace(/\s*&&\s*node\s+\S*generate-sitemap\S*/g, () => '');
    if (/generate-sitemap/.test(out)) note(step, 'warn', 'package.json référence encore generate-sitemap (hors script build).');
    return out;
  });
  for (const rel of walk('.github', ['.yml', '.yaml'])) {
    const src = read(rel);
    if (src && /generate-sitemap/.test(src)) note(step, 'warn', 'workflow qui appelle generate-sitemap : ' + rel);
  }
}

/* ================================================================== */
/* 6. outline: none                                                    */
/* ================================================================== */
function fixOutline(css, rel) {
  return mapRules(css, (sel, body) => {
    if (!/outline\s*:\s*none/.test(body)) return null;
    const decl = /[ \t]*outline\s*:\s*none\s*(?:!important)?\s*;?[ \t]*\n?/g;
    if (/:focus-visible/.test(sel)) {
      const nb = body.replace(decl, '');
      if (nb.trim() === '') {
        const comments = sel.match(/\/\*[\s\S]*?\*\//g);
        return comments ? '\n  ' + comments.join('\n  ') + '\n' : '';
      }
      return sel + '{' + nb + '}';
    }
    if (/:focus(?![-\w(])/.test(sel)) {
      // Focus programmatique (zone de résultat, champ) : pas d'anneau au clic, anneau au clavier.
      return sel.replace(/:focus(?![-\w(])/g, ':focus:not(:focus-visible)') + '{' + body + '}';
    }
    note('outline', 'warn', 'outline: none hors contexte :focus, à examiner : ' + rel + ' (' + sel.trim().split('\n').pop().trim() + ')');
    return null;
  });
}

function stepOutline() {
  const files = [...walk('src', ['.css', '.astro'])];
  for (const rel of files) {
    const src = read(rel);
    if (src === null || !/outline\s*:\s*none/.test(src)) continue;
    write(rel, mapCss(rel, src, (css) => fixOutline(css, rel)), 'outline');
  }
}

/* ================================================================== */
/* 7. Contrastes                                                       */
/* ================================================================== */
function stepContrast() {
  const step = 'contrast';
  const swap = (rel, pairs) =>
    update(rel, step, (s) => pairs.reduce((acc, [re, to]) => acc.replace(re, () => to), s));

  // Lecture rythmique : pastilles, étiquettes SVG, numéros de mesure, signes « + ».
  const rhythmPairs = [
    [/#e8890c/gi, '#b45309'], // orange : 2,62 -> 5,02
    [/#1f9d62/gi, '#15803d'], // vert   : 3,47 -> 5,02
    [/#7a879f/gi, '#64748b'], // gris   : 3,62 -> 4,76
    [/#8b98b5/gi, '#64748b'], // numéros de mesure : 2,82 -> 4,76
    [/#a3afc6/gi, '#64748b'], // signes « + » : 2,21 -> 4,76
  ];
  swap('src/components/entrainement/LectureRythmique.astro', rhythmPairs);
  swap('src/utils/lectureRythmique.ts', rhythmPairs);

  // Dessiner les clefs : numéros de lignes de la portée.
  swap('src/components/entrainement/DessinerClefs.astro', [[/#8b98b5/gi, '#64748b']]);

  // « Bravo ! » : #059669 -> #047857 (texte uniquement).
  for (const rel of ['src/styles/tools-shared.css', 'src/components/entrainement/LectureNotes.astro']) {
    update(rel, step, (s) =>
      mapCss(rel, s, (css) =>
        mapRules(css, (sel, body) =>
          /color\s*:\s*#059669\s*;/i.test(body) && /feedback/.test(sel)
            ? sel + '{' + body.replace(/color(\s*:\s*)#059669/i, (_all, c) => 'color' + c + '#047857') + '}'
            : null,
        ),
      ),
    );
  }

  // Libellés de statistiques : #64748b sur #faf5ff = 4,43 -> #475569.
  update('src/styles/tools-shared.css', step, (s) =>
    mapRules(s, (sel, body) =>
      /stat-label/.test(sel) && /color\s*:\s*#64748b/i.test(body)
        ? sel + '{' + body.replace(/color(\s*:\s*)#64748b/i, (_all, c) => 'color' + c + '#475569') + '}'
        : null,
    ),
  );

  // Dégradé des boutons principaux : début #a855f7 (3,96) -> #9333ea (5,38).
  const gradFiles = [...TOOL_COMPONENTS, ...TOOL_CSS];
  for (const rel of gradFiles) {
    update(rel, step, (s) =>
      s.replace(/linear-gradient\(135deg,\s*var\(--accent-strong\),/g, () => 'linear-gradient(135deg, #9333ea,'),
    );
  }

  // Survol des quiz : --qc-accent-hover était identique à la couleur de repos.
  update('src/styles/quiz-card.css', step, (s) =>
    s.replace(/(--qc-accent-hover\s*:\s*)#0369a1/i, (_all, a) => a + '#075985'),
  );
}

/* ================================================================== */
/* 8b. Fichiers partagés                                               */
/* ================================================================== */
const DOM_TS = `/**
 * Aides DOM partagées par les outils (remplace les copies locales de
 * mustElement, mustSvg, queryButtons et svgEl).
 */
const SVG_NS = 'http://www.w3.org/2000/svg';
export type SvgAttrs = Record<string, string | number>;

export function mustElement(selector: string, scope: ParentNode = document): HTMLElement {
  const el = scope.querySelector(selector);
  if (!(el instanceof HTMLElement)) throw new Error('Élément introuvable : ' + selector);
  return el;
}

export function mustInput(selector: string, scope: ParentNode = document): HTMLInputElement {
  const el = scope.querySelector(selector);
  if (!(el instanceof HTMLInputElement)) throw new Error('Champ introuvable : ' + selector);
  return el;
}

export function mustSvg(selector: string, scope: ParentNode = document): SVGSVGElement {
  const el = scope.querySelector(selector);
  if (!(el instanceof SVGSVGElement)) throw new Error('SVG introuvable : ' + selector);
  return el;
}

export function mustGroup(selector: string, scope: ParentNode = document): SVGGElement {
  const el = scope.querySelector(selector);
  if (!(el instanceof SVGGElement)) throw new Error('Groupe SVG introuvable : ' + selector);
  return el;
}

export function queryButtons(scope: ParentNode, selector: string): HTMLButtonElement[] {
  const found: HTMLButtonElement[] = [];
  scope.querySelectorAll(selector).forEach((el) => {
    if (el instanceof HTMLButtonElement) found.push(el);
  });
  return found;
}

/** Crée un élément SVG et lui applique ses attributs. */
export function svgEl(name: string, attrs: SvgAttrs = {}, parent?: SVGElement): SVGElement {
  const el = document.createElementNS(SVG_NS, name);
  if (!(el instanceof SVGElement)) throw new Error('Élément SVG invalide : ' + name);
  for (const key in attrs) el.setAttribute(key, String(attrs[key]));
  if (parent) parent.appendChild(el);
  return el;
}
`;

const CHALLENGE_TOOL_TS = `/**
 * Briques communes aux outils « challenge » (ClavierNotes, OreilleClavier, OreilleNom).
 * Remplace les copies de pickTarget / pickMidi / showResult.
 */
import { shuffle } from './random';
import { CHALLENGE_QUESTION_COUNT, type ChallengeResult } from './challenge';

export interface TargetBag<T> {
  /** Tire la cible suivante : sac mélangé, jamais deux fois la même d'affilée. */
  next(): T;
  reset(): void;
}

export function createTargetBag<T>(items: readonly T[]): TargetBag<T> {
  let bag: T[] = [];
  let last: T | undefined;

  return {
    next(): T {
      if (bag.length === 0) {
        bag = shuffle(items);
        const first = bag[0];
        const second = bag[1];
        if (bag.length > 1 && first === last && first !== undefined && second !== undefined) {
          bag[0] = second;
          bag[1] = first;
        }
      }
      const value = bag.shift();
      if (value === undefined) {
        const fallback = items[0];
        if (fallback === undefined) throw new Error('Aucune cible disponible');
        return fallback;
      }
      last = value;
      return value;
    },
    reset(): void {
      bag = [];
      last = undefined;
    },
  };
}

export interface ResultTargets {
  score: HTMLElement;
  percent: HTMLElement;
  time: HTMLElement;
  reason: HTMLElement;
}

export const CHALLENGE_REASON_LABELS = {
  timeout: '⏱ Temps écoulé !',
  complete: '🏁 Les ' + CHALLENGE_QUESTION_COUNT + ' questions sont terminées.',
} as const;

/** Remplit l'écran « Défi terminé ! » (score, réussite, temps, motif). */
export function renderChallengeResult(targets: ResultTargets, result: ChallengeResult): void {
  targets.score.textContent = result.score + ' / ' + result.total;
  targets.percent.textContent = result.percent + ' %';
  targets.time.textContent = result.elapsedLabel;
  targets.reason.textContent = CHALLENGE_REASON_LABELS[result.reason];
}
`;

const CLEFS_TS = `/**
 * Dessin des clés de sol et de fa à partir du sprite <ClefSprite /> (tracés officiels
 * GKey.svg / FKey.svg) : plus aucun glyphe Unicode (U+1D11E / U+1D122), donc le même
 * rendu sur tous les appareils.
 *
 * Géométrie :
 *  - clé de fa : mesurée sur le tracé (les deux points encadrent la ligne de Fa, soit
 *    exactement 1 interligne = 5,84 unités du viewBox 18 x 20) ;
 *  - clé de sol : proportions de la clé SVG (7 interlignes de haut, ligne de Sol à 62 %
 *    de la hauteur). Si l'ajustement visuel ne convient pas, ne retoucher que
 *    TREBLE_SPACES et TREBLE_ANCHOR.
 */
const NS = 'http://www.w3.org/2000/svg';

export type ClefType = 'treble' | 'bass';

const TREBLE_VIEWBOX = { w: 640, h: 1280 };
const TREBLE_SPACES = 7.0; // hauteur de la clé de sol, en interlignes
const TREBLE_ANCHOR = 0.62; // part de la hauteur située au-dessus de la ligne de Sol

const BASS_VIEWBOX = { w: 18, h: 20 };
const BASS_UNITS_PER_SPACE = 5.84;
const BASS_ANCHOR = 6.05 / 20; // part de la hauteur située au-dessus de la ligne de Fa

/**
 * @param svg        portée cible
 * @param type       'treble' (ligne de repère = Sol, 2e depuis le bas) ou 'bass' (Fa, 4e)
 * @param x          bord gauche de la clé
 * @param refLineY   ordonnée de la ligne de repère
 * @param spacing    interligne (distance entre deux lignes)
 */
export function drawClefSymbol(
  svg: SVGElement,
  type: ClefType,
  x: number,
  refLineY: number,
  spacing: number,
  color = '#1e293b',
): SVGSVGElement {
  const treble = type === 'treble';
  const viewBox = treble ? TREBLE_VIEWBOX : BASS_VIEWBOX;
  const height = treble ? TREBLE_SPACES * spacing : (BASS_VIEWBOX.h * spacing) / BASS_UNITS_PER_SPACE;
  const width = (height * viewBox.w) / viewBox.h;
  const anchor = treble ? TREBLE_ANCHOR : BASS_ANCHOR;

  const clef = document.createElementNS(NS, 'svg');
  clef.setAttribute('x', String(x));
  clef.setAttribute('y', String(refLineY - anchor * height));
  clef.setAttribute('width', String(width));
  clef.setAttribute('height', String(height));
  clef.setAttribute('viewBox', '0 0 ' + viewBox.w + ' ' + viewBox.h);
  clef.setAttribute('overflow', 'visible');
  clef.setAttribute('aria-hidden', 'true');
  clef.setAttribute('focusable', 'false');
  clef.setAttribute('class', 'staff-clef staff-clef--' + type);
  clef.style.color = color;

  const use = document.createElementNS(NS, 'use');
  use.setAttribute('href', treble ? '#notes-clef-sol' : '#notes-clef-fa');
  clef.appendChild(use);
  svg.appendChild(clef);
  return clef;
}
`;

function stepShared() {
  const step = 'shared';
  create('src/utils/dom.ts', DOM_TS, step);
  create('src/utils/challengeTool.ts', CHALLENGE_TOOL_TS, step);
  create('src/utils/clefs.ts', CLEFS_TS, step);

  // Sprite des clés : extrait de LectureNotes, partagé avec le piano.
  const ln = 'src/components/entrainement/LectureNotes.astro';
  const src = read(ln);
  if (src === null) return;
  if (/<ClefSprite\s*\/>/.test(src)) return;
  const m = src.match(/([ \t]*)<!-- Sprite SVG local[^\n]*-->\s*(<svg class="clef-sprite"[\s\S]*?<\/svg>)\n/);
  if (!m) {
    note(step, 'warn', 'sprite des clés introuvable dans LectureNotes (déjà extrait ?)');
    return;
  }
  const svg = m[2].replace(
    'class="clef-sprite"',
    () => 'style="position:absolute;width:0;height:0;overflow:hidden;pointer-events:none"',
  );
  create(
    'src/components/entrainement/ClefSprite.astro',
    '---\n// Sprite SVG des clés de sol et de fa (tracés officiels GKey.svg / FKey.svg).\n// À inclure une seule fois par page ; on le référence avec <use href="#notes-clef-sol"> / "#notes-clef-fa".\n---\n' +
      svg +
      '\n',
    step,
  );
  write(
    ln,
    addImport(src.replace(m[0], () => m[1] + '<ClefSprite />\n'), "import ClefSprite from './ClefSprite.astro';"),
    step,
  );
  update('src/components/entrainement/PianoInteractif.astro', step, (s) => {
    if (/<ClefSprite\s*\/>/.test(s)) return s;
    const out = s.replace(/(<div id="tool-piano" class="tool-root">\n)/, (all) => all + '  <ClefSprite />\n');
    return addImport(out, "import ClefSprite from './ClefSprite.astro';");
  });
}

/* ================================================================== */
/* Tests de recette                                                    */
/* ================================================================== */
const SPEC_TOUCH = `import { test, expect } from '@playwright/test';

/**
 * Cibles tactiles : 24 px minimum partout (WCAG 2.5.8), 44 px de haut pour les
 * boutons d'action (Apple HIG / WCAG 2.5.5), en portrait et en paysage mobile.
 */
const BASE = '/education-musicale/entrainement/';
const TOOLS = [
  'lecture-notes', 'lecture-rythmique', 'piano-interactif', 'dessiner-clefs',
  'clavier-notes', 'oreille-nom', 'oreille-clavier',
];
const VIEWPORTS = [
  { width: 390, height: 844 },
  { width: 844, height: 390 },
];
const MIN_TARGET = 24;
const MIN_COMFORT = 44;
const COMFORT =
  '.level-btn, .cn-level-btn, .on-level-btn, .oc-level-btn, .note-btn, .tap-btn, .btn, .tab, .hub-back';

for (const vp of VIEWPORTS) {
  for (const tool of TOOLS) {
    test('cibles tactiles ' + tool + ' ' + vp.width + 'x' + vp.height, async ({ browser }) => {
      const context = await browser.newContext({ viewport: vp, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
      const page = await context.newPage();
      await page.goto(BASE + tool + '/', { waitUntil: 'load' });
      await page.waitForTimeout(300);

      const report = await page.evaluate(
        ({ comfort }) => {
          const tooSmall: string[] = [];
          const notComfortable: string[] = [];
          document.querySelectorAll('.tool-root button, .tool-root a[href]').forEach((el) => {
            const r = el.getBoundingClientRect();
            if (r.width === 0 || r.height === 0) return;
            const label = (el.getAttribute('aria-label') || el.textContent || el.className).trim().slice(0, 40);
            if (Math.min(r.width, r.height) < 24) tooSmall.push(label + ' ' + Math.round(r.width) + 'x' + Math.round(r.height));
            if (el.matches(comfort) && r.height < 44) notComfortable.push(label + ' h=' + Math.round(r.height));
          });
          return { tooSmall, notComfortable };
        },
        { comfort: COMFORT },
      );

      expect(report.tooSmall, 'cibles < ' + MIN_TARGET + ' px').toEqual([]);
      expect(report.notComfortable, 'boutons d\\'action < ' + MIN_COMFORT + ' px de haut').toEqual([]);
      await context.close();
    });
  }
}
`;

const SPEC_A11Y = `import { test, expect } from '@playwright/test';

const BASE = '/education-musicale';
const TOOLS = [
  'lecture-notes', 'lecture-rythmique', 'piano-interactif', 'dessiner-clefs',
  'clavier-notes', 'oreille-nom', 'oreille-clavier',
];

test.describe('h1 unique', () => {
  for (const vp of [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 844, height: 390 }]) {
    for (const tool of TOOLS) {
      test(tool + ' ' + vp.width + 'x' + vp.height, async ({ page }) => {
        await page.setViewportSize(vp);
        await page.goto(BASE + '/entrainement/' + tool + '/', { waitUntil: 'load' });
        await expect(page.locator('h1')).toHaveCount(1);
        // Le h1 doit rester dans l'arbre d'accessibilité (pas de display:none).
        expect(await page.locator('h1').evaluate((el) => getComputedStyle(el).display)).not.toBe('none');
      });
    }
    test('hub ' + vp.width + 'x' + vp.height, async ({ page }) => {
      await page.setViewportSize(vp);
      await page.goto(BASE + '/entrainement/', { waitUntil: 'load' });
      await expect(page.locator('h1')).toHaveCount(1);
      expect(await page.locator('h1').evaluate((el) => getComputedStyle(el).display)).not.toBe('none');
    });
  }
});

test.describe('fin de défi en français', () => {
  test.use({ viewport: { width: 1440, height: 900 } });
  for (const tool of ['lecture-notes', 'clavier-notes', 'oreille-nom', 'oreille-clavier']) {
    test(tool, async ({ page }) => {
      await page.goto(BASE + '/entrainement/' + tool + '/', { waitUntil: 'load' });
      const html = await page.content();
      expect(html).not.toContain('Challenge Over');
      expect(html).toContain('Défi terminé');
    });
  }
});

test.describe('clés SVG', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('lecture de notes : <use> et recouvrement de la portée', async ({ page }) => {
    await page.goto(BASE + '/entrainement/lecture-notes/', { waitUntil: 'load' });
    for (const [level, id] of [['1', 'notes-clef-sol'], ['2', 'notes-clef-fa']] as const) {
      await page.goto(BASE + '/entrainement/lecture-notes/', { waitUntil: 'load' });
      await page.locator('.level-btn[data-level="' + level + '"]').click();
      await expect(page.locator('#staff-svg use[href="#' + id + '"]')).toHaveCount(1);
      await expect(page.locator('#staff-svg text')).toHaveCount(0);
      const geo = await page.evaluate(() => {
        const clef = document.querySelector('#staff-svg .staff-clef')!.getBoundingClientRect();
        const lines = [...document.querySelectorAll('#staff-svg line')].slice(0, 5).map((l) => l.getBoundingClientRect());
        return { top: clef.top, bottom: clef.bottom, w: clef.width, first: lines[0].top, last: lines[4].bottom };
      });
      expect(geo.w).toBeGreaterThan(10);
      // La clé recouvre verticalement la portée (la clé de sol la dépasse des deux côtés).
      expect(geo.top).toBeLessThanOrEqual(geo.last);
      expect(geo.bottom).toBeGreaterThanOrEqual(geo.first);
      if (id === 'notes-clef-sol') {
        expect(geo.top).toBeLessThanOrEqual(geo.first);
        expect(geo.bottom).toBeGreaterThanOrEqual(geo.last);
      }
    }
  });

  test('piano : deux clés <use>, aucun glyphe Unicode', async ({ page }) => {
    await page.goto(BASE + '/entrainement/piano-interactif/', { waitUntil: 'load' });
    await page.locator('#piano button.white-key').nth(20).click();
    await expect(page.locator('#piano-staff-svg use')).toHaveCount(2);
    await expect(page.locator('#piano-staff-svg text')).toHaveCount(0);
  });
});

test.describe('piano : touches sémantiques', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('88 boutons, un seul arrêt de tabulation, flèches et Entrée', async ({ page }) => {
    await page.goto(BASE + '/entrainement/piano-interactif/', { waitUntil: 'load' });
    await expect(page.locator('#piano button')).toHaveCount(88);
    await expect(page.locator('#piano button[tabindex="0"]')).toHaveCount(1);
    for (const el of await page.locator('#piano button').all()) {
      expect(await el.getAttribute('aria-label')).toBeTruthy();
    }
    await page.locator('#piano button').first().focus();
    await page.keyboard.press('ArrowRight');
    expect(await page.evaluate(() => (document.activeElement as HTMLElement).dataset.midi)).toBe('22');
    await page.keyboard.press('Enter');
    await expect(page.locator('#piano-note-display')).toHaveText('Note : La#0');
  });
});

test.describe('bfcache : pageshow persisted', () => {
  test.use({ viewport: { width: 1440, height: 900 } });
  for (const tool of ['clavier-notes', 'oreille-nom', 'oreille-clavier', 'lecture-notes']) {
    test(tool + ' revient au menu', async ({ page }) => {
      await page.goto(BASE + '/entrainement/' + tool + '/', { waitUntil: 'load' });
      await page.locator('[data-level]').first().click();
      await page.evaluate(() => {
        const event = new PageTransitionEvent('pageshow', { persisted: true });
        window.dispatchEvent(event);
      });
      await expect(page.locator('[data-level]').first()).toBeVisible();
    });
  }
});
`;

function stepTests() {
  create('tests/e2e/touch-targets.spec.ts', SPEC_TOUCH, 'tests');
  create('tests/e2e/refactor-recette.spec.ts', SPEC_A11Y, 'tests');
}

/* ================================================================== */
/* Orchestration                                                       */
/* ================================================================== */
const STEPS = [
  ['h1', stepH1],
  ['toolpage', stepToolPage],
  ['translate', stepTranslate],
  ['bfcache', stepBfcache],
  ['storage', stepStorage],
  ['sitemap', stepSitemap],
  ['outline', stepOutline],
  ['contrast', stepContrast],
  ['shared', stepShared],
  ['tests', stepTests],
];

function ensureCleanGit() {
  if (!APPLY || flag('--force')) return;
  try {
    const out = execSync('git status --porcelain', { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    if (out) {
      console.error('✋ Arbre git non propre. Commitez (ou stashez) d\'abord, ou relancez avec --force.\n' + out);
      process.exit(2);
    }
  } catch {
    // pas de dépôt git : on continue
  }
}

function main() {
  if (!existsSync(abs('package.json')) || !existsSync(abs('src'))) {
    console.error('✋ Lancez le script à la racine du dépôt (package.json + src/ attendus) ou passez --root=…');
    process.exit(1);
  }
  ensureCleanGit();

  if (ONLY && ONLY.includes('h1') && !ONLY.includes('toolpage')) {
    note('h1', 'warn', "l'étape h1 suppose toolpage (le h1 des outils vient de ToolPage.astro) : ajoutez toolpage à --only.");
  }

  for (const [id, fn] of STEPS) {
    if (!enabled(id)) continue;
    try {
      fn();
    } catch (error) {
      note(id, 'error', String(error && error.stack ? error.stack : error));
    }
  }

  console.log((APPLY ? '✍️  Application' : '👀 Simulation (rien n\'est écrit)') + ' — racine : ' + relative(process.cwd(), ROOT) + '\n');
  let total = 0;
  for (const [id] of STEPS) {
    const files = touched.get(id);
    if (!files || files.size === 0) {
      if (enabled(id)) console.log('• ' + id.padEnd(10) + ' rien à faire (déjà à jour ?)');
      continue;
    }
    total += files.size;
    console.log('• ' + id.padEnd(10) + ' ' + files.size + ' fichier(s)');
    for (const f of [...files].sort()) console.log('     ' + f);
  }
  if (notes.length) {
    console.log('\nRemarques :');
    for (const n of notes) console.log('  ' + (n.level === 'error' ? '❌' : n.level === 'warn' ? '⚠️ ' : 'ℹ️ ') + ' [' + n.step + '] ' + n.text);
  }

  if (APPLY) {
    for (const entry of store.values()) {
      if (entry.after === entry.before || entry.after === null) continue;
      const p = abs(entry.rel);
      mkdirSync(dirname(p), { recursive: true });
      writeFileSync(p, entry.after, 'utf8');
    }
    console.log('\n✅ ' + total + ' fichier(s) écrit(s). Contrôlez avec « git diff », puis :');
    console.log('   npx astro check && npm test && npm run check:important && npm run build');
  } else {
    console.log('\nPour appliquer : node scripts/refactor.mjs --apply');
  }
}

main();
