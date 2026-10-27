#!/usr/bin/env node
/**
 * Garde-fou de non-régression sur les `!important`.
 *
 * Compte les occurrences de `!important` dans src/**\/*.{css,astro} et échoue
 * si le total dépasse MAX. Le but est de faire baisser ce nombre progressivement :
 * quand un `!important` est retiré, baisser MAX dans le même commit.
 *
 * Usage : node scripts/check-important.mjs
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

/** Plafond courant (à baisser à chaque retrait). */
const MAX = 341;

const SRC = join(process.cwd(), 'src');
const EXT = /\.(css|astro)$/;

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (EXT.test(entry)) out.push(full);
  }
  return out;
}

const files = walk(SRC);
let total = 0;
const perFile = [];

for (const file of files) {
  const count = (readFileSync(file, 'utf8').match(/!important/g) ?? []).length;
  if (count > 0) {
    perFile.push([relative(process.cwd(), file), count]);
    total += count;
  }
}

perFile.sort((a, b) => b[1] - a[1]);

console.log(`!important dans src/ : ${total} (plafond ${MAX})`);
for (const [file, count] of perFile) console.log(`  ${String(count).padStart(4)} ${file}`);

if (total > MAX) {
  console.error(
    `\n❌ ${total} !important > plafond ${MAX}. Retirer des !important ou justifier une exception.`,
  );
  process.exit(1);
}

console.log('\n✅ plafond respecté');
