#!/usr/bin/env node
/**
 * audit-important.mjs — inventaire reproductible des `!important`.
 *
 * Pour chaque déclaration `!important` (CSS + <style> des .astro audités) :
 *   - fichier:ligne, sélecteur, spécificité (a,b,c), media query ;
 *   - règles NON-important concurrentes sur la même propriété et le même
 *     dernier compartiment de sélecteur, de spécificité >= la sienne.
 * Aucune concurrente  → candidat à la suppression immédiate.
 * Des concurrentes    → la bataille de cascade à résoudre à la source.
 *
 * Limites assumées : l'analyse est statique. Elle ne voit ni les styles
 * inline écrits par les scripts (listés à part), ni les fichiers hors
 * périmètre (tools-shared.css, Layout.astro) : à passer en argument.
 *
 * Usage :
 *   node scripts/audit-important.mjs
 *   node scripts/audit-important.mjs --extra src/styles/tools-shared.css --extra src/layouts/Layout.astro
 *   node scripts/audit-important.mjs --max 0        # CI : échoue s'il reste plus de N !important
 *
 * Dépendances (dev) : postcss, postcss-selector-parser
 */
import fs from 'node:fs';
import path from 'node:path';
import postcss from 'postcss';
import parser from 'postcss-selector-parser';

const argv = process.argv.slice(2);
const opt = (name) => argv.flatMap((a, i) => (a === name ? [argv[i + 1]] : []));
const max = opt('--max')[0] !== undefined ? Number(opt('--max')[0]) : null;
const ROOT = process.cwd();
const TOOLS_DIR = 'src/components/entrainement';
const files = [
  'src/styles/tools-landscape.css',
  ...fs.readdirSync(path.join(ROOT, TOOLS_DIR)).filter((f) => f.endsWith('.astro')).map((f) => `${TOOLS_DIR}/${f}`),
];
const extra = opt('--extra');

const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const cmp = (a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2];

/** Spécificité (a,b,c) ; :is/:not/:has = la plus forte de leurs branches ; :where = 0. */
function specificity(selector) {
  let total = [0, 0, 0];
  parser((root) => {
    root.each((sel) => {
      sel.each((n) => {
        if (n.type === 'id') total[0]++;
        else if (n.type === 'class' || n.type === 'attribute') total[1]++;
        else if (n.type === 'tag') total[2]++;
        else if (n.type === 'pseudo') {
          const name = n.value.toLowerCase();
          if (name === ':where') return;
          if (name === ':is' || name === ':not' || name === ':has') {
            let best = [0, 0, 0];
            n.each((arg) => { const s = specificity(arg.toString()); if (cmp(s, best) > 0) best = s; });
            total = add(total, best);
          } else if (name.startsWith('::') || name === ':before' || name === ':after') total[2]++;
          else total[1]++;
        }
      });
    });
  }).processSync(selector);
  return total;
}
const lastCompound = (s) => s.replace(/\s*>\s*/g, ' > ').trim().split(/\s+/).pop();

function load(file) {
  const abs = path.join(ROOT, file);
  const text = fs.readFileSync(abs, 'utf8');
  if (file.endsWith('.css')) return { file, css: text, offset: 0 };
  const m = text.match(/<style[^>]*>([\s\S]*?)<\/style>/);
  if (!m) return null;
  const head = text.slice(0, m.index + m[0].indexOf('>') + 1);
  return { file, css: m[1], offset: head.split('\n').length - 1 };
}

const decls = [];
for (const src of [...files, ...extra].map(load).filter(Boolean)) {
  postcss.parse(src.css).walkDecls((d) => {
    const rule = d.parent;
    if (rule.type !== 'rule') return;
    const media = [];
    for (let p = rule.parent; p && p.type !== 'root'; p = p.parent) if (p.type === 'atrule') media.push(p.params.replace(/\s+/g, ' '));
    for (const raw of rule.selectors) {
      const sel = raw.replace(/\s+/g, ' ').trim();
      decls.push({ file: src.file, line: d.source.start.line + src.offset, sel, prop: d.prop, imp: d.important, media: media.join(' | '), spec: specificity(sel), tail: lastCompound(sel) });
    }
  });
}

const seen = new Set();
const rows = [];
for (const d of decls.filter((x) => x.imp)) {
  const key = `${d.file}:${d.line}:${d.prop}`;
  if (seen.has(key)) continue;
  seen.add(key);
  const rivals = decls.filter((e) => !e.imp && e.prop === d.prop && e.tail === d.tail && !(e.file === d.file && e.line === d.line) && cmp(e.spec, d.spec) >= 0);
  rows.push({ ...d, rivals });
}

console.log(`${rows.length} déclarations !important\n`);
const byFile = new Map();
for (const r of rows) byFile.set(r.file, [...(byFile.get(r.file) ?? []), r]);
for (const [file, list] of byFile) {
  const free = list.filter((r) => r.rivals.length === 0).length;
  console.log(`${file}  —  ${list.length} (dont ${free} sans concurrente ≥ spécificité)`);
  for (const r of list) {
    const rival = r.rivals[0] ? `  ⇠ ${r.rivals[0].file}:${r.rivals[0].line} [${r.rivals[0].spec}]` : '';
    console.log(`  L${String(r.line).padEnd(4)} ${r.prop.padEnd(20)} [${r.spec}] ${r.sel.slice(0, 64)}${rival}`);
  }
  console.log();
}

// Styles inline écrits par les scripts : ce sont eux que les !important de tools-landscape.css combattent.
console.log('Styles inline écrits par les scripts :');
for (const f of files.filter((x) => x.endsWith('.astro'))) {
  const text = fs.readFileSync(path.join(ROOT, f), 'utf8');
  const hits = new Set();
  for (const m of text.matchAll(/(\w+)\.style\.(\w+)\s*=/g)) hits.add(`${m[1]}.${m[2]}`);
  for (const m of text.matchAll(/(\w+)\.style\.setProperty\('([^']+)'/g)) hits.add(`${m[1]}.setProperty(${m[2]})`);
  if (hits.size) console.log(`  ${path.basename(f).padEnd(24)} ${[...hits].join(', ')}`);
}

if (max !== null && rows.length > max) {
  console.error(`\n✗ ${rows.length} !important > seuil ${max}`);
  process.exit(1);
}
