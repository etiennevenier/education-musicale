// Usage : node scripts/extract-engagement-logic.mjs
// Extrait la logique pure d'EngagementDecrypteur.astro vers src/utils/engagementEvaluation.ts
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const FILE = 'src/components/EngagementDecrypteur.astro';
const OUT = 'src/utils/engagementEvaluation.ts';

const fail = (msg) => {
  console.error(`Abandon, rien n'a été modifié : ${msg}`);
  process.exit(1);
};
const mustReplace = (text, from, to, label) => {
  if (!text.includes(from)) fail(`motif introuvable (${label})`);
  return text.replace(from, () => to);
};

if (existsSync(OUT)) fail(`${OUT} existe déjà`);
let src = readFileSync(FILE, 'utf8');

// 1. Bloc de logique pure : du premier type à la fin d'evaluate
const START = '  type EvidenceItem = {';
const END_MARK = '  const root = document.querySelector<HTMLElement>(\'[data-decrypteur]\');';
const start = src.indexOf(START);
const end = src.indexOf(END_MARK);
if (start === -1 || end === -1 || end < start) fail('bloc de logique introuvable');
const block = src.slice(start, end);

let logic = block
  .split('\n')
  .map((line) => (line.startsWith('  ') ? line.slice(2) : line))
  .join('\n')
  .trimEnd();

logic = logic
  .replace(/^type /gm, 'export type ')
  .replace(/^const (createEvidence|acceptedCauses|assessEvidence|evaluate)\b/gm, 'export const $1');

for (const name of ['createEvidence', 'acceptedCauses', 'assessEvidence', 'evaluate']) {
  if (!logic.includes(`export const ${name}`)) fail(`« ${name} » introuvable dans le bloc`);
}

// 2. Identifiants neutres : le DOM ne révèle plus quelles citations sont exactes
const ceStart = logic.indexOf('export const createEvidence');
const ceEnd = logic.indexOf(']);', ceStart);
if (ceStart === -1 || ceEnd === -1) fail('createEvidence mal formée');
logic =
  logic.slice(0, ceStart) +
  `export const createEvidence = (song: EngagementSong): EvidenceItem[] =>
  shuffle(
    [
      ...song.indicesTextuels.map((text) => ({ text, correct: true })),
      ...song.leurresTextuels.map((text) => ({ text, correct: false })),
    ].map((item, index) => ({ id: \`\${song.id}-\${index}\`, ...item })),
  );` +
  logic.slice(ceEnd + 3);

const header = `import { shuffle } from './random';
import type { Cause, EngagementSong } from '../data/engagementSongs';

`;
const listenUrl = `

/** Lien de recherche YouTube pour écouter un morceau. */
export const getListenUrl = (song: Pick<EngagementSong, 'artiste' | 'titre'>): string =>
  \`https://www.youtube.com/results?search_query=\${encodeURIComponent(\`\${song.artiste}\${song.titre} audio\`)}\`;
`;

// 3. Composant : retrait du bloc + imports
src = src.slice(0, start) + src.slice(end);
src = mustReplace(
  src,
  `  import { shuffle } from '../utils/random';
  import { CAUSE_LABELS, SONGS } from '../data/engagementSongs';
  import type { Cause, EngagementSong } from '../data/engagementSongs';`,
  `  import { CAUSE_LABELS, SONGS } from '../data/engagementSongs';
  import type { Cause } from '../data/engagementSongs';
  import { acceptedCauses, createEvidence, evaluate, getListenUrl } from '../utils/engagementEvaluation';
  import type { EvidenceItem, EvidenceReport, Result, SongState } from '../utils/engagementEvaluation';`,
  'imports du script',
);

// 4. Lien d'écoute : un seul endroit
src = mustReplace(
  src,
  `import { CAUSE_LABELS, SONGS, type Cause } from '../data/engagementSongs';`,
  `import { CAUSE_LABELS, SONGS, type Cause } from '../data/engagementSongs';
import { getListenUrl } from '../utils/engagementEvaluation';`,
  'import frontmatter',
);
src = mustReplace(
  src,
  `const firstListenUrl = firstSong
  ? \`https://www.youtube.com/results?search_query=\${encodeURIComponent(\`\${firstSong.artiste}\${firstSong.titre} audio\`)}\`
  : 'https://www.youtube.com/results?search_query=musique+engagee';`,
  `const firstListenUrl = firstSong
  ? getListenUrl(firstSong)
  : 'https://www.youtube.com/results?search_query=musique+engagee';`,
  'firstListenUrl',
);
src = mustReplace(
  src,
  `      const listenUrl = \`https://www.youtube.com/results?search_query=\${encodeURIComponent(\`\${song.artiste}\${song.titre} audio\`)}\`;
      listenLink.href = listenUrl;`,
  `      listenLink.href = getListenUrl(song);`,
  'listenUrl du script',
);

// 5. Annonce du bilan aux lecteurs d'écran (la zone data-live existait mais n'était jamais remplie)
src = mustReplace(
  src,
  `    const dots = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-dot]'));`,
  `    const dots = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-dot]'));
    const live = root.querySelector<HTMLElement>('[data-live]')!;`,
  'déclaration des dots',
);
src = mustReplace(
  src,
  `      renderFeedback(state, result);
      syncChoices();
      textList.querySelectorAll`,
  `      renderFeedback(state, result);
      live.textContent = \`\${state.song.titre} : \${feedbackTitle.textContent ?? ''}\`;
      syncChoices();
      textList.querySelectorAll`,
  'validation',
);

writeFileSync(OUT, header + logic + listenUrl);
writeFileSync(FILE, src);
console.log(`OK : ${OUT} créé (${(header + logic + listenUrl).split('\n').length} lignes), composant allégé.`);