#!/usr/bin/env node
/**
 * Vérifie les identifiants YouTube du dépôt.
 *
 *   npm run check:videos             # format uniquement (aucun réseau)
 *   npm run check:videos -- --online # + existence via oEmbed (réseau requis)
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
  async function check(id) {
    const url = `https://www.youtube.com/oembed?url=${encodeURIComponent(
      `https://www.youtube.com/watch?v=${id}`,
    )}&format=json`;
    try {
      const res = await fetch(url, {
        headers: { 'user-agent': 'Mozilla/5.0 (check-videos)' },
        signal: AbortSignal.timeout(15000),
      });
      return { id, status: res.status };
    } catch (error) {
      return { id, status: String(error?.message ?? error) };
    }
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

  const bad = results.filter((r) => r.status !== 200);
  onlineFailures = bad.length;
  console.log(`\noEmbed : ${results.length - bad.length}/${results.length} accessibles.`);
  for (const r of bad.sort((a, b) => a.id.localeCompare(b.id))) {
    console.error(`  ✗ ${r.id} → HTTP ${r.status}`);
  }
}

process.exit(issues.length > 0 || onlineFailures > 0 ? 1 : 0);
