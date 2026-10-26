#!/usr/bin/env node
// scripts/clean-unused-quiz.mjs
// Supprime les 5 variables/fonctions inutilisées signalées par `astro check`
// et répare une condition manquante dans MoyenAgeMusicTypes.astro.
// Usage : node scripts/clean-unused-quiz.mjs [--dry]
// Tout est calculé en mémoire : à la moindre erreur, AUCUN fichier n'est modifié.

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'src');
const DRY = process.argv.includes('--dry');

function sub(content, pattern, replacement, label, maxLen = Infinity) {
  if (typeof pattern === 'string') {
    if (!content.includes(pattern)) throw new Error(`motif introuvable : ${label}`);
    return content.replace(pattern, () => replacement);
  }
  const m = content.match(pattern);
  if (!m) throw new Error(`motif introuvable : ${label}`);
  if (m[0].length > maxLen) throw new Error(`bloc suspect (trop long) : ${label}`);
  return content.replace(pattern, replacement); // $1, $2 interprétés
}

const OPS = {
  // 'index' jamais lu
  'components/JazzQuiz.astro': (c) =>
    sub(c, 'entry.options.forEach((option, index) => {', 'entry.options.forEach((option) => {', 'forEach(option, index)'),

  // Condition `if (currentPlayer)` perdue : le bloc { stopAudio(); } s'exécutait toujours,
  // même quand la piste en cours n'appartenait pas à ce composant.
  'components/MoyenAgeMusicTypes.astro': (c) =>
    sub(
      c,
      /(sameTrack\(getCurrentAudioUrl\(\), player\.url\),\n[ \t]*\);\n)[ \t]*\{\n([ \t]*stopAudio\(\);\n[ \t]*\}\n)/,
      '$1          if (currentPlayer) {\n$2',
      'bloc { stopAudio(); } sans condition',
      400,
    ),

  // Message de réussite jamais utilisé (le feedback d'une bonne réponse est vide)
  'components/OstinatoQuiz.astro': (c) =>
    sub(
      c,
      /\n  function successMessage\(question: OstinatoQuestion\): string \{[\s\S]*?\n  \}\n/,
      '',
      'fonction successMessage',
      400,
    ),

  // Variable `answer` jamais lue + helpers d'article (withArticle, lowerFirst) devenus inutiles
  'components/PlansSonoresQuiz.astro': (c) => {
    c = sub(
      c,
      /\n[ \t]*\/\/ Instrument -> [^\n]*\n[ \t]*\/\/ Plan sonore -> [^\n]*\n[ \t]*const answer = currentQuestion\.type === 'theme-instrument'\n[ \t]*\? withArticle\(currentQuestion\.correctAnswer\)\n[ \t]*: lowerFirst\(currentQuestion\.correctAnswer\);\n/,
      '',
      'const answer (Plans sonores)',
      500,
    );
    // Bloc complet : commentaire, SILENT_H_WORDS, FEMININE_WORDS, withArticle, lowerFirst
    c = sub(
      c,
      /\n  \/\/ --- Article devant le nom d'un instrument -+\n[\s\S]*?\n  function lowerFirst\(text: string\): string \{\n[^\n]*\n  \}\n/,
      '',
      "bloc « Article devant le nom d'un instrument »",
      1600,
    );
    for (const name of ['withArticle', 'lowerFirst', 'SILENT_H_WORDS', 'FEMININE_WORDS']) {
      if (new RegExp(`\\b${name}\\b`).test(c)) throw new Error(`${name} encore utilisé : suppression annulée`);
    }
    return c;
  },

  'components/PubQuiz.astro': (c) =>
    sub(c, '      const answer = question.sound.label;\n', '', 'const answer (Pub)'),
};

const errors = [];
const results = new Map();
for (const [rel, fn] of Object.entries(OPS)) {
  const file = path.join(SRC, rel);
  try {
    if (!fs.existsSync(file)) throw new Error('fichier absent');
    const before = fs.readFileSync(file, 'utf8');
    results.set(file, { rel, before, after: fn(before) });
  } catch (e) {
    errors.push(`✖ src/${rel} : ${e.message}`);
  }
}

if (errors.length) {
  errors.forEach((l) => console.error(l));
  console.error('\nAucun fichier modifié. Envoie-moi ces lignes pour ajuster le script.');
  process.exit(1);
}

if (DRY) {
  console.log(`✔ Vérification OK : ${results.size} fichiers seraient modifiés (aucune écriture).`);
} else {
  const backupDir = path.join(ROOT, '.clean-unused-backup');
  for (const [file, { rel, before, after }] of results) {
    const backup = path.join(backupDir, rel);
    fs.mkdirSync(path.dirname(backup), { recursive: true });
    fs.writeFileSync(backup, before);
    fs.writeFileSync(file, after);
    console.log(`✔ src/${rel} (${after.split('\n').length - before.split('\n').length} lignes)`);
  }
  console.log('\nSauvegardes : .clean-unused-backup/ — ensuite : npx astro check');
}
