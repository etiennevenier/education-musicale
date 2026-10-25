#!/usr/bin/env node
// Correctif : RockStyle n'a plus `image` (remplacé par `file`) ; l'image de la carte débloquée
// est relue depuis la carte de galerie correspondante (URL déjà résolue par relativeUrl).
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const FILE = resolve(process.cwd(), 'src/components/RockStageBuilder.astro');
const src = readFileSync(FILE, 'utf8');

const from = '        unlockImage.src = style.image;\n';
const to =
  "        const cardImage = galleryCards\n          .find((card) => card.dataset.styleCard === style.id)\n          ?.querySelector<HTMLImageElement>('img');\n        if (cardImage) unlockImage.src = cardImage.src;\n";

const n = src.split(from).length - 1;
if (n !== 1) {
  console.error(`✖ Ancre : ${n} occurrence(s), 1 attendue (déjà corrigé ?). Aucun fichier modifié.`);
  process.exit(1);
}
writeFileSync(FILE, src.replace(from, () => to));
console.log('✔ RockStageBuilder.astro corrigé. Vérifier : npx astro check');
