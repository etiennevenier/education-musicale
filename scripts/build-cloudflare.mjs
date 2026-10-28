#!/usr/bin/env node
/**
 * Construction du site pour Cloudflare (https://musique.etiennevenier.com).
 *
 *   node scripts/build-cloudflare.mjs               # commande de Cloudflare
 *   node scripts/build-cloudflare.mjs --build-only --out dist-cloudflare   # contrôle en CI
 *
 * 1. Mêmes garde-fous que la publication GitHub : astro check, tests, !important.
 *    Si l'un échoue, Cloudflare ne publie rien et garde la version précédente.
 * 2. Construction à la racine du domaine (SITE_TARGET=cloudflare).
 * 3. Vérification du résultat : aucun lien vers l'ancienne adresse
 *    /education-musicale, consigne « ne pas référencer » sur chaque page,
 *    page 404 et fichier _headers présents.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const args = process.argv.slice(2);
const buildOnly = args.includes('--build-only');
const outIndex = args.indexOf('--out');
const outDir = outIndex > -1 ? args[outIndex + 1] : 'dist';

function run(label, command, commandArgs, env = {}) {
  console.log(`\n▶ ${label}`);
  const result = spawnSync(command, commandArgs, {
    stdio: 'inherit',
    env: { ...process.env, ...env },
    shell: process.platform === 'win32',
  });
  if (result.status !== 0) {
    console.error(`\n✗ Échec : ${label}. Rien n'est publié.`);
    process.exit(result.status ?? 1);
  }
}

if (!buildOnly) {
  run('Astro check', 'npx', ['astro', 'check']);
  run('Tests', 'npx', ['vitest', 'run']);
  run('Garde-fou !important', 'node', ['scripts/check-important.mjs']);
}
run('Construction (adresse racine)', 'npx', ['astro', 'build', '--outDir', outDir], {
  SITE_TARGET: 'cloudflare',
});

// --- Vérification du résultat ---
function htmlFiles(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) htmlFiles(full, out);
    else if (entry.endsWith('.html')) out.push(full);
  }
  return out;
}

const problems = [];
const pages = htmlFiles(outDir);
for (const file of pages) {
  const html = readFileSync(file, 'utf8');
  if (/(?:href|src|data-[\w-]+)=["'][^"']*\/education-musicale\//.test(html) || html.includes('"/education-musicale/')) {
    problems.push(`${file} : lien vers l'ancienne adresse /education-musicale`);
  }
  if (!/<meta name="robots" content="noindex, nofollow"/.test(html)) {
    problems.push(`${file} : consigne « ne pas référencer » absente`);
  }
}
for (const required of ['404.html', 'index.html', '_headers']) {
  if (!existsSync(join(outDir, required))) problems.push(`${outDir}/${required} manquant`);
}

if (problems.length) {
  console.error('\n✗ Construction Cloudflare incorrecte :');
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}
console.log(`\n✅ Construction Cloudflare correcte : ${pages.length} pages, à la racine, toutes non référencées.`);
