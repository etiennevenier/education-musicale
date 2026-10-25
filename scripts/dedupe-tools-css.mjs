#!/usr/bin/env node
// Usage : node scripts/dedupe-tools-css.mjs [--dry]
// Mutualise le CSS commun de LectureNotes, ClavierNotes, OreilleClavier et OreilleNom
// dans src/styles/tools-shared.css (sélecteurs groupés : même spécificité que les originaux,
// aucun changement de markup ni de JS). Les composants importent la feuille dans leur frontmatter.
//
// Garde-fous (abandon sans rien écrire au moindre écart) :
//  - une règle n'est déplacée que si elle existe À L'IDENTIQUE dans ≥ 2 outils ;
//  - elle reste en place si une règle restante du même composant a la même spécificité,
//    cible le même élément et touche une propriété commune (l'ordre d'émission entre la feuille
//    importée et le <style> du composant n'étant pas garanti, on évite toute dépendance à l'ordre) ;
//  - l'ordre relatif des règles déplacées doit être cohérent entre outils ;
//  - vérification finale : pour chaque outil, (CSS restant + règles partagées filtrées sur sa racine)
//    doit redonner EXACTEMENT l'ensemble de règles d'origine.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

const ROOT = process.cwd();
const DIR = resolve(ROOT, 'src/components/entrainement');
const SHARED = resolve(ROOT, 'src/styles/tools-shared.css');
const IMPORT_LINE = "import '../../styles/tools-shared.css';\n";
const DRY = process.argv.includes('--dry');

const TOOLS = [
  { file: 'LectureNotes.astro', root: 'tool-notes', prefix: 'notes' },
  { file: 'ClavierNotes.astro', root: 'tool-clavier-notes', prefix: 'cn' },
  { file: 'OreilleClavier.astro', root: 'tool-oreille-clavier', prefix: 'oc' },
  { file: 'OreilleNom.astro', root: 'tool-oreille-nom', prefix: 'on' },
];

const fail = (msg) => {
  console.error(`✖ ${msg}\nAucun fichier modifié.`);
  process.exit(1);
};

if (existsSync(SHARED)) fail(`Existe déjà : ${SHARED} (script déjà appliqué ?)`);

// ── Scanner CSS (commentaires, chaînes, accolades imbriquées) ────────────────
const skipComment = (t, i) => {
  if (t[i] === '/' && t[i + 1] === '*') {
    const e = t.indexOf('*/', i + 2);
    return e === -1 ? t.length : e + 2;
  }
  return i;
};
const findClose = (t, open) => {
  let d = 0;
  for (let i = open; i < t.length; i++) {
    const c = t[i];
    if (c === '/' && t[i + 1] === '*') { i = t.indexOf('*/', i + 2) + 1; continue; }
    if (c === '"' || c === "'") { i++; while (i < t.length && t[i] !== c) { if (t[i] === '\\') i++; i++; } continue; }
    if (c === '{') d++;
    else if (c === '}') { d--; if (d === 0) return i; }
  }
  return -1;
};
function parseItems(t, base, media, out) {
  let i = 0;
  while (i < t.length) {
    while (i < t.length) {
      if (/\s/.test(t[i])) i++;
      else { const j = skipComment(t, i); if (j !== i) i = j; else break; }
    }
    if (i >= t.length) break;
    const s0 = i;
    let j = i;
    while (j < t.length && t[j] !== '{' && t[j] !== ';') { const k = skipComment(t, j); if (k !== j) { j = k; continue; } j++; }
    if (j >= t.length) break;
    if (t[j] === ';') { i = j + 1; continue; }
    const close = findClose(t, j);
    if (close === -1) fail('Accolade non fermée dans un bloc <style>.');
    const sel = t.slice(s0, j).replace(/\/\*[\s\S]*?\*\//g, '').trim();
    const body = t.slice(j + 1, close);
    if (/^@(media|supports)\b/.test(sel)) {
      const blk = { kind: 'block', sel, start: base + s0, end: base + close + 1, children: [] };
      out.push(blk);
      parseItems(body, base + j + 1, media ? `${media} >> ${sel}` : sel, blk.children);
    } else if (sel.startsWith('@')) {
      out.push({ kind: 'at', sel, start: base + s0, end: base + close + 1 });
    } else {
      out.push({ kind: 'rule', sel, body, media, start: base + s0, end: base + close + 1 });
    }
    i = close + 1;
  }
}
const flatRules = (items) => items.flatMap((x) => (x.kind === 'rule' ? [x] : x.kind === 'block' ? flatRules(x.children) : []));

const normBody = (b) => b.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').trim().replace(/;$/, '').trim();
const splitTop = (s, sep = ',') => {
  const parts = []; let d = 0, cur = '';
  for (const c of s) {
    if (c === '(' || c === '[') d++;
    else if (c === ')' || c === ']') d--;
    if (c === sep && d === 0) { parts.push(cur); cur = ''; } else cur += c;
  }
  parts.push(cur);
  return parts.map((p) => p.replace(/\s+/g, ' ').trim()).filter(Boolean);
};

// ── Spécificité et recouvrement ──────────────────────────────────────────────
function specificity(sel) {
  let s = sel; let a = 0, b = 0, c = 0;
  for (;;) {
    const m = /:(where|not|is|has|matches)\(/.exec(s);
    if (!m) break;
    let d = 0, end = -1;
    for (let i = m.index + m[0].length - 1; i < s.length; i++) {
      if (s[i] === '(') d++;
      else if (s[i] === ')') { d--; if (d === 0) { end = i; break; } }
    }
    if (end === -1) break;
    const args = s.slice(m.index + m[0].length, end);
    s = s.slice(0, m.index) + s.slice(end + 1);
    if (m[1] === 'where') continue;
    let best = [0, 0, 0];
    for (const arg of splitTop(args)) {
      const sp = specificity(arg);
      if (sp[0] > best[0] || (sp[0] === best[0] && (sp[1] > best[1] || (sp[1] === best[1] && sp[2] > best[2])))) best = sp;
    }
    a += best[0]; b += best[1]; c += best[2];
  }
  s = s.replace(/\[[^\]]*\]/g, () => { b++; return ' '; });
  s = s.replace(/#[\w-]+/g, () => { a++; return ' '; });
  s = s.replace(/\.[\w-]+/g, () => { b++; return ' '; });
  s = s.replace(/::[\w-]+/g, () => { c++; return ' '; });
  s = s.replace(/:[\w-]+/g, () => { b++; return ' '; });
  s.replace(/(?:^|[\s>+~])([a-zA-Z][\w-]*)/g, () => { c++; return ''; });
  return [a, b, c];
}
function lastCompound(part) {
  let d = 0, idx = -1;
  for (let i = 0; i < part.length; i++) {
    const ch = part[i];
    if (ch === '(' || ch === '[') d++;
    else if (ch === ')' || ch === ']') d--;
    else if (d === 0 && /[\s>+~]/.test(ch)) idx = i;
  }
  return part.slice(idx + 1);
}
const subjectOf = (part) => {
  const comp = lastCompound(part);
  return { classes: new Set(comp.match(/\.[\w-]+/g) ?? []), tag: (comp.match(/^[a-zA-Z][\w-]*/) ?? [''])[0] };
};
const subjectsOverlap = (x, y) => {
  if (x.classes.size && y.classes.size) return [...x.classes].some((c) => y.classes.has(c));
  if (!x.classes.size && !y.classes.size) return !x.tag || !y.tag || x.tag === y.tag;
  return false;
};
const propsOf = (body) => splitTop(normBody(body), ';').map((d) => d.split(':')[0].trim()).filter(Boolean);
const propsOverlap = (pa, pb) => pa.some((a) => pb.some((b) => a === b || a.startsWith(b + '-') || b.startsWith(a + '-')));
const eq3 = (x, y) => x[0] === y[0] && x[1] === y[1] && x[2] === y[2];

// ── Chargement des composants ────────────────────────────────────────────────
const rootRe = (root) => new RegExp(`#${root}(?![\\w-])`, 'g');
for (const tool of TOOLS) {
  const path = resolve(DIR, tool.file);
  if (!existsSync(path)) fail(`Introuvable : ${path}`);
  tool.path = path;
  tool.src = readFileSync(path, 'utf8');
  if (!tool.src.startsWith('---\n')) fail(`${tool.file} : frontmatter attendu en tête de fichier.`);
  if (tool.src.includes('tools-shared.css')) fail(`${tool.file} importe déjà tools-shared.css.`);
  const opens = [...tool.src.matchAll(/<style([^>]*)>/g)];
  if (opens.length !== 1) fail(`${tool.file} : 1 bloc <style> attendu, ${opens.length} trouvé(s).`);
  const cssStart = opens[0].index + opens[0][0].length;
  const cssEnd = tool.src.indexOf('</style>', cssStart);
  if (cssEnd === -1) fail(`${tool.file} : </style> introuvable.`);
  tool.cssStart = cssStart; tool.cssEnd = cssEnd;
  tool.css = tool.src.slice(cssStart, cssEnd);
  tool.items = [];
  parseItems(tool.css, cssStart, '', tool.items);
  tool.rules = flatRules(tool.items);
  const norm = (part) => part.replace(rootRe(tool.root), '§').replace(new RegExp(`\\.${tool.prefix}-(?=[\\w])`, 'g'), '.X-');
  const occ = new Map();
  tool.rules.forEach((r, idx) => {
    r.idx = idx;
    r.parts = splitTop(r.sel);
    r.body = normBody(r.body);
    r.props = propsOf(r.body);
    r.specs = r.parts.map(specificity);
    r.subjects = r.parts.map(subjectOf);
    r.movable = r.parts.every((p) => p.includes(`#${tool.root}`));
    if (!r.movable) return;
    r.normParts = r.parts.map(norm);
    const base = `${r.media}|${r.normParts.join(',')}`;
    const n = (occ.get(base) ?? 0) + 1;
    occ.set(base, n);
    r.gid = `${base}|#${n}|${r.body}`;
  });
}

// ── Groupes candidats (≥ 2 outils, corps identique) ──────────────────────────
const groupTools = new Map();
for (const tool of TOOLS) {
  for (const r of tool.rules) {
    if (!r.gid) continue;
    if (!groupTools.has(r.gid)) groupTools.set(r.gid, new Set());
    groupTools.get(r.gid).add(tool.file);
  }
}
for (const tool of TOOLS) for (const r of tool.rules) r.moved = !!r.gid && groupTools.get(r.gid).size >= 2;

// Point fixe : on garde en place les règles qui dépendraient de l'ordre d'émission.
const refused = [];
let changed = true;
while (changed) {
  changed = false;
  for (const tool of TOOLS) {
    const residual = tool.rules.filter((r) => !r.moved);
    for (const m of tool.rules.filter((r) => r.moved)) {
      const clash = residual.find((r) =>
        propsOverlap(m.props, r.props) &&
        m.parts.some((_, i) => r.parts.some((_, j) => eq3(m.specs[i], r.specs[j]) && subjectsOverlap(m.subjects[i], r.subjects[j]))),
      );
      if (clash) { m.moved = false; residual.push(m); refused.push(`${tool.file} : ${m.sel.slice(0, 60)} (vs ${clash.sel.slice(0, 40)})`); changed = true; }
    }
  }
  const counts = new Map();
  for (const tool of TOOLS) for (const r of tool.rules) if (r.moved) counts.set(r.gid, (counts.get(r.gid) ?? 0) + 1);
  for (const tool of TOOLS) for (const r of tool.rules) {
    if (r.moved && counts.get(r.gid) < 2) { r.moved = false; changed = true; }
  }
}

// ── Ordre global cohérent des règles partagées (tri topologique) ─────────────
const gids = new Set(); const edges = new Map(); const indeg = new Map();
const addEdge = (a, b) => {
  if (!edges.has(a)) edges.set(a, new Set());
  if (edges.get(a).has(b)) return;
  edges.get(a).add(b); indeg.set(b, (indeg.get(b) ?? 0) + 1);
};
for (const tool of TOOLS) {
  const seq = tool.rules.filter((r) => r.moved).map((r) => r.gid);
  seq.forEach((g) => { gids.add(g); if (!indeg.has(g)) indeg.set(g, 0); });
  for (let i = 1; i < seq.length; i++) addEdge(seq[i - 1], seq[i]);
}
const order = []; const queue = [];
const firstSeen = [...gids];
for (const g of firstSeen) if (indeg.get(g) === 0) queue.push(g);
while (queue.length) {
  const g = queue.shift(); order.push(g);
  for (const n of edges.get(g) ?? []) { indeg.set(n, indeg.get(n) - 1); if (indeg.get(n) === 0) queue.push(n); }
}
if (order.length !== gids.size) fail("Ordre des règles partagées incohérent entre outils (cycle) : mutualisation refusée.");

// ── Génération de la feuille partagée ────────────────────────────────────────
const expand = (part, tool) => part.replace(/§/g, `#${tool.root}`).replace(/\.X-/g, `.${tool.prefix}-`);
const entries = order.map((g) => {
  const tools = TOOLS.filter((t) => t.rules.some((r) => r.moved && r.gid === g));
  const first = tools[0].rules.find((r) => r.moved && r.gid === g);
  const selectors = [];
  for (const t of tools) {
    const r = t.rules.find((x) => x.moved && x.gid === g);
    for (const p of r.parts) { const s = expand(r.normParts[r.parts.indexOf(p)], t); if (!selectors.includes(s)) selectors.push(s); }
  }
  return { gid: g, media: first.media, selectors, decls: splitTop(first.body, ';') };
});
const fmtRule = (e, indent) =>
  `${indent}${e.selectors.join(`,\n${indent}`)} {\n${e.decls.map((d) => `${indent}  ${d};`).join('\n')}\n${indent}}`;
const out = [];
for (let i = 0; i < entries.length;) {
  const media = entries[i].media;
  let j = i; const chunk = [];
  while (j < entries.length && entries[j].media === media) chunk.push(entries[j++]);
  if (!media) out.push(chunk.map((e) => fmtRule(e, '')).join('\n\n'));
  else if (media.includes(' >> ')) fail(`@media imbriqué non géré : ${media}`);
  else out.push(`${media} {\n${chunk.map((e) => fmtRule(e, '  ')).join('\n\n')}\n}`);
  i = j;
}
const sharedCss = `/*
 * CSS commun aux outils d'entraînement (LectureNotes, ClavierNotes, OreilleClavier, OreilleNom).
 * Sélecteurs groupés : chaque règle garde la spécificité d'origine (#tool-… .préfixe-…).
 * Généré par scripts/dedupe-tools-css.mjs ; le CSS propre à chaque outil reste dans son composant.
 */

${out.join('\n\n')}
`;

// ── Vérification d'équivalence (par outil) ───────────────────────────────────
const sharedItems = []; parseItems(sharedCss, 0, '', sharedItems);
const sharedRules = flatRules(sharedItems);
const sig = (media, parts, body) => `${media}\u0001${parts.join(',')}\u0001${body}`;
const residualOf = (tool) => tool.rules.filter((r) => !r.moved).map((r) => sig(r.media, r.parts, r.body));
for (const tool of TOOLS) {
  const expected = tool.rules.map((r) => sig(r.media, r.parts, r.body)).sort();
  const actual = residualOf(tool);
  for (const sr of sharedRules) {
    const parts = splitTop(sr.sel).filter((p) => p.includes(`#${tool.root}`));
    if (parts.length) actual.push(sig(sr.media, parts, normBody(sr.body)));
  }
  actual.sort();
  if (expected.length !== actual.length || expected.some((x, i) => x !== actual[i])) {
    fail(`Vérification d'équivalence échouée pour ${tool.file} (attendu ${expected.length} règles, obtenu ${actual.length}).`);
  }
}

// ── Réécriture des composants ────────────────────────────────────────────────
const results = [];
for (const tool of TOOLS) {
  const removeSpans = [];
  const walk = (items) => {
    for (const it of items) {
      if (it.kind === 'rule') {
        const r = tool.rules.find((x) => x.start === it.start);
        if (r?.moved) removeSpans.push([it.start, it.end]);
      } else if (it.kind === 'block') {
        walk(it.children);
        const rules = flatRules(it.children);
        const all = it.children.length > 0 && it.children.every((c) => c.kind === 'rule' && tool.rules.find((x) => x.start === c.start)?.moved);
        if (all && rules.length) removeSpans.push([it.start, it.end, 'block']);
      }
    }
  };
  walk(tool.items);
  // blocs entièrement vidés : on retire le bloc, pas ses enfants un par un
  const blocks = removeSpans.filter((s) => s[2] === 'block');
  const spans = removeSpans.filter((s) => s[2] === 'block' || !blocks.some((b) => s[0] >= b[0] && s[1] <= b[1]));
  spans.sort((x, y) => y[0] - x[0]);
  let text = tool.src;
  let removedBytes = 0;
  for (const [s, e] of spans) {
    let a = s, b = e;
    while (a > 0 && (text[a - 1] === ' ' || text[a - 1] === '\t')) a--;
    if (text[b] === '\n') b++;
    removedBytes += b - a;
    text = text.slice(0, a) + text.slice(b);
  }
  text = text.replace(/\n{3,}(?=[^\n]*)/g, (m, off) => (off > tool.cssStart - 1 ? '\n\n' : m));
  text = text.replace('---\n', `---\n${IMPORT_LINE}`);
  results.push({ tool, text, moved: tool.rules.filter((r) => r.moved).length, total: tool.rules.length, removedBytes });
}

console.log('Outil'.padEnd(24), 'règles déplacées', '  octets retirés');
for (const r of results) console.log(r.tool.file.padEnd(24), `${r.moved}/${r.total}`.padEnd(16), r.removedBytes);
console.log(`Feuille partagée : ${entries.length} règles, ${sharedCss.length} octets.`);
if (refused.length) console.log(`Gardées en place (dépendance d'ordre) : ${new Set(refused).size}`);

if (DRY) { console.log('[dry] OK — équivalence vérifiée, rien écrit.'); process.exit(0); }

mkdirSync(dirname(SHARED), { recursive: true });
writeFileSync(SHARED, sharedCss);
for (const r of results) writeFileSync(r.tool.path, r.text);
console.log(`✔ ${SHARED}\n✔ ${TOOLS.length} composants mis à jour\nVérifier : npx astro check, puis contrôle visuel des 4 outils (bureau + mobile portrait/paysage).`);
