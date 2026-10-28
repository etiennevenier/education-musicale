#!/usr/bin/env node
/**
 * Vérifie les identifiants YouTube du dépôt.
 *
 *   npm run check:videos             # format uniquement (aucun réseau)
 *   npm run check:videos -- --online # + existence via oEmbed (réseau requis)
 *   npm run check:videos -- --online --report rapport.md  # + rapport lisible
 *
 * Sortie non nulle si un identifiant est vide/mal formé (toujours) ou
 * introuvable (uniquement avec --online).
 */
import { findIssues, scanVideoIds } from './videoIds.mjs';

const online = process.argv.includes('--online');
const entries = scanVideoIds();
const issues = findIssues(entries);
const unique = [...new Set(entries.map((e) => e.value))];

console.log(
  `IDs YouTube : ${entries.length} occurrences, ${unique.length} uniques, ` +
    `${issues.length} manquant(s)/mal formé(s).`,
);

for (const issue of issues) {
  console.error(`  ✗ ${issue.file}:${issue.line} [${issue.kind}] "${issue.value}"`);
}

let onlineFailures = 0;
if (online) {
  const reportIdx = process.argv.indexOf('--report');
  const reportPath = reportIdx > -1 ? process.argv[reportIdx + 1] : null;

  async function fetchStatus(id) {
    const url = `https://www.youtube.com/oembed?url=${encodeURIComponent(
      `https://www.youtube.com/watch?v=${id}`,
    )}&format=json`;
    try {
      const res = await fetch(url, {
        headers: { 'user-agent': 'Mozilla/5.0 (check-videos)' },
        signal: AbortSignal.timeout(15000),
      });
      return res.status;
    } catch (error) {
      return String(error?.message ?? error);
    }
  }

  // Une nouvelle tentative (après une pause) en cas d'erreur réseau ou de
  // limitation (429, 5xx) : évite les fausses alertes.
  async function check(id) {
    let status = await fetchStatus(id);
    if (typeof status !== 'number' || status === 429 || status >= 500) {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      status = await fetchStatus(id);
    }
    return { id, status };
  }

  /** Classe un statut oEmbed : vidéo supprimée, intégration interdite, ou non vérifiable. */
  function classify(status) {
    if (status === 400 || status === 404) return 'introuvable';
    if (status === 401 || status === 403) return 'integration';
    return 'inconnu';
  }

  const results = [];
  const queue = [...unique];
  await Promise.all(
    Array.from({ length: 6 }, async () => {
      while (queue.length) {
        const id = queue.shift();
        results.push(await check(id));
        await new Promise((resolve) => setTimeout(resolve, 120));
      }
    }),
  );

  const bad = results.filter((r) => r.status !== 200).sort((a, b) => a.id.localeCompare(b.id));
  onlineFailures = bad.length;
  console.log(`\noEmbed : ${results.length - bad.length}/${results.length} accessibles.`);
  for (const r of bad) {
    console.error(`  ✗ ${r.id} → HTTP ${r.status}`);
  }

  if (reportPath) {
    const { writeFileSync } = await import('node:fs');
    const labels = {
      introuvable: '❌ Vidéo supprimée ou devenue privée',
      integration: '🚫 Lecture sur un autre site interdite par YouTube (la vidéo ne se lancera pas sur le site)',
      inconnu: '❓ Vérification impossible cette fois (YouTube n’a pas répondu) : à revérifier le mois prochain',
    };
    const lines = [
      `Vérification du ${new Date().toLocaleDateString('fr-FR')} : ` +
        `${results.length - bad.length} vidéo(s) sur ${results.length} fonctionnent.`,
      '',
    ];
    for (const kind of ['introuvable', 'integration', 'inconnu']) {
      const group = bad.filter((r) => classify(r.status) === kind);
      if (!group.length) continue;
      lines.push(`## ${labels[kind]}`, '');
      for (const r of group) {
        const where = entries
          .filter((e) => e.value === r.id)
          .map((e) => `\`${e.file}\` ligne ${e.line}`)
          .join(', ');
        lines.push(`- https://www.youtube.com/watch?v=${r.id} — utilisée dans ${where}`);
      }
      lines.push('');
    }
    lines.push('Pour la remplacer : donner à Claude le lien de la nouvelle vidéo et le nom de la séquence.');
    writeFileSync(reportPath, lines.join('\n'));
    // Signale au workflow s'il y a un vrai problème (pas seulement des « non vérifiables »).
    const real = bad.filter((r) => classify(r.status) !== 'inconnu').length;
    writeFileSync(reportPath + '.count', String(real));
  }
}

process.exit(issues.length > 0 || onlineFailures > 0 ? 1 : 0);
