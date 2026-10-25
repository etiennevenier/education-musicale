// Usage : node scripts/extract-bruitomatic-data.mjs
// Déplace les données du frontmatter de Bruitomatic.astro vers src/data/bruitomaticData.ts
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const FILE = 'src/components/Bruitomatic.astro';
const OUT = 'src/data/bruitomaticData.ts';
const IMPORT_LINE = "import { relativeUrl } from '../utils/navigation';";
const NAMES = ['categories', 'tracks', 'presets', 'steps'];

const fail = (msg) => {
  console.error(`Abandon, rien n'a été modifié : ${msg}`);
  process.exit(1);
};

if (existsSync(OUT)) fail(`${OUT} existe déjà`);

const src = readFileSync(FILE, 'utf8');
const match = src.match(/^---\n([\s\S]*?)\n---\n/);
if (!match) fail('frontmatter introuvable');
const frontmatter = match[1];
if (!frontmatter.startsWith(IMPORT_LINE)) fail("l'import de relativeUrl n'est pas en première ligne");

let body = frontmatter.slice(IMPORT_LINE.length).trim();

body = body
  .replace(/^interface /gm, 'export interface ')
  .replace(/^const (categories|tracks|presets|steps)\b/gm, 'export const $1')
  // Index de ligne = ordre d'affichage (familles puis pistes) : la navigation clavier suit la grille.
  .replace(
    /^const rowIndexById[\s\S]*?\n\);/m,
    `/** Index de ligne dans l'ordre d'affichage (familles, puis pistes). */
export const rowIndexById: Record<string, number> = Object.fromEntries(
  categories
    .flatMap((category) => tracks.filter((track) => track.category === category.id))
    .map((track, index) => [track.id, index]),
);`,
  );

for (const name of [...NAMES, 'rowIndexById']) {
  if (!body.includes(`export const ${name}`)) fail(`« ${name} » introuvable dans le frontmatter`);
}

writeFileSync(OUT, `/** Données du séquenceur Bruitomatic (familles, pistes, modèles). */\n\n${body}\n`);

const newFrontmatter = `${IMPORT_LINE}
import { categories, presets, rowIndexById, steps, tracks } from '../data/bruitomaticData';`;
writeFileSync(FILE, src.replace(match[0], `---\n${newFrontmatter}\n---\n`));

console.log(`OK : ${OUT} créé (${body.split('\n').length} lignes), frontmatter allégé.`);