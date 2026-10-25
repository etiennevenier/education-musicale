// Usage : node scripts/dedupe-quiz-css.mjs          (simulation)
//         node scripts/dedupe-quiz-css.mjs --write  (applique)
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const SHARED = 'src/styles/quiz-card.css';
const WRITE = process.argv.includes('--write');

/** Découpe un CSS en blocs de premier niveau : commentaire | espace | règle. */
function split(css) {
  const out = [];
  let i = 0;
  while (i < css.length) {
    if (css.startsWith('/*', i)) {
      const end = css.indexOf('*/', i + 2);
      const stop = end === -1 ? css.length : end + 2;
      out.push({ kind: 'comment', text: css.slice(i, stop) });
      i = stop;
    } else if (/\s/.test(css[i])) {
      let j = i;
      while (j < css.length && /\s/.test(css[j])) j++;
      out.push({ kind: 'ws', text: css.slice(i, j) });
      i = j;
    } else {
      let j = i;
      while (j < css.length && css[j] !== '{' && css[j] !== ';') j++;
      if (css[j] !== '{') { out.push({ kind: 'other', text: css.slice(i, j + 1) }); i = j + 1; continue; }
      let depth = 0, k = j;
      for (; k < css.length; k++) {
        if (css[k] === '{') depth++;
        else if (css[k] === '}' && --depth === 0) break;
      }
      out.push({
        kind: 'rule',
        text: css.slice(i, k + 1),
        prelude: css.slice(i, j),
        body: css.slice(j + 1, k),
      });
      i = k + 1;
    }
  }
  return out;
}

const norm = (s) => s.replace(/\s+/g, ' ').trim();
const key = (r) =>
  norm(r.prelude) + '{' + r.body.split(';').map(norm).filter(Boolean).sort().join(';') + '}';

const shared = split(readFileSync(SHARED, 'utf8')).filter((b) => b.kind === 'rule');
const sharedKeys = new Set(shared.map(key));
const sharedSelectors = new Set(shared.map((r) => norm(r.prelude)));

function walk(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith('.astro') ? [p] : [];
  });
}

for (const file of walk('src/components')) {
  const src = readFileSync(file, 'utf8');
  if (!/styles\/quiz-card\.css/.test(src)) continue;

  let removed = 0;
  const divergent = [];
  const next = src.replace(/(<style[^>]*>)([\s\S]*?)(<\/style>)/g, (_, open, css, close) => {
    const blocks = split(css);
    const kept = [];
    for (let n = 0; n < blocks.length; n++) {
      const b = blocks[n];
      if (b.kind === 'rule' && !b.prelude.trim().startsWith('@')) {
        if (sharedKeys.has(key(b))) {
          removed++;
          if (blocks[n + 1]?.kind === 'ws') n++; // retire l'espace qui suit
          continue;
        }
        if (sharedSelectors.has(norm(b.prelude))) divergent.push(norm(b.prelude));
      }
      kept.push(b.text);
    }
    return open + kept.join('') + close;
  });

  console.log(`${file} : ${removed} règle(s) identique(s) retirée(s)`);
  if (divergent.length) console.log('   divergentes (conservées) :', divergent.join(' | '));
  if (WRITE && removed) writeFileSync(file, next);
}
console.log(WRITE ? '\nFichiers modifiés.' : '\nSimulation : ajoute --write pour appliquer.');