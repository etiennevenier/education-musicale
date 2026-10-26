/**
 * Détection des identifiants YouTube dans le code source.
 *
 * Aucun appel réseau : ce module ne fait que lire les fichiers de `src/`.
 * Utilisé par `scripts/check-videos.mjs` (CLI) et `tests/videoIds.test.ts`.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative, extname } from 'node:path';

// `process.cwd()` (racine du dépôt) : fonctionne aussi sous Vitest, où
// `import.meta.url` n'est pas une URL `file:`.
const ROOT = process.cwd();
const SRC = join(ROOT, 'src');
const EXTS = new Set(['.ts', '.astro', '.js', '.mjs']);

/** Formes acceptées d'un identifiant YouTube (11 caractères). */
export const VIDEO_ID_RE = /^[A-Za-z0-9_-]{11}$/;

const PATTERNS = [
  // URL complète : watch?v=ID, youtu.be/ID, /embed/ID
  {
    kind: 'url',
    re: /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube-nocookie\.com\/embed\/)([A-Za-z0-9_-]*)/g,
  },
  // Champ d'objet / de composant : youtubeId: 'ID', videoId: "ID"
  {
    kind: 'field',
    re: /(?:youtubeId|videoId|ytId)\s*[:=]\s*['"]([^'"]*)['"]/g,
  },
  // Attribut HTML : data-video-id="ID"
  {
    kind: 'attr',
    re: /data-video-id\s*=\s*["']([^"']*)["']/g,
  },
];

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (EXTS.has(extname(entry.name))) out.push(full);
  }
  return out;
}

/**
 * Retourne toutes les occurrences d'identifiants YouTube littéraux.
 * @returns {{ file: string, line: number, kind: string, value: string }[]}
 */
export function scanVideoIds(srcDir = SRC) {
  const entries = [];
  for (const file of walk(srcDir)) {
    const lines = readFileSync(file, 'utf8').split('\n');
    lines.forEach((line, index) => {
      // Les identifiants cités dans un commentaire (ex. « watch?v=XXXX ») ne
      // sont pas utilisés à l'exécution : on les ignore.
      const trimmed = line.trim();
      if (
        trimmed.startsWith('//') ||
        trimmed.startsWith('*') ||
        trimmed.startsWith('/*') ||
        trimmed.startsWith('<!--')
      ) {
        return;
      }
      for (const { kind, re } of PATTERNS) {
        re.lastIndex = 0;
        let match;
        while ((match = re.exec(line))) {
          const value = match[1];
          const after = line.slice(match.index + match[0].length);
          // Ignore les valeurs construites par interpolation (`${...}`).
          if (value === '' && after.startsWith('$')) continue;
          entries.push({ file: relative(ROOT, file), line: index + 1, kind, value });
        }
      }
    });
  }
  return entries;
}

/** Retourne les identifiants manquants (vides) ou mal formés (≠ 11 caractères). */
export function findIssues(entries) {
  return entries.filter((entry) => !VIDEO_ID_RE.test(entry.value));
}
