import { describe, expect, it } from 'vitest';
import { hymneVideosList } from '../src/data/hymnesData';
// @ts-expect-error - utilitaire JavaScript sans déclaration de types
import { findIssues, scanVideoIds, VIDEO_ID_RE } from '../scripts/videoIds.mjs';

describe('identifiants YouTube', () => {
  it('détecte les identifiants littéraux du code source', () => {
    const entries = scanVideoIds();
    expect(entries.length).toBeGreaterThan(100);
  });

  it('aucun identifiant manquant ou mal formé (11 caractères requis)', () => {
    const issues = findIssues(scanVideoIds());
    // Message lisible en cas d'échec : fichier:ligne et valeur fautive.
    expect(
      issues,
      issues.map((i: { file: string; line: number; value: string }) => `${i.file}:${i.line} "${i.value}"`).join('\n'),
    ).toEqual([]);
  });

  it('les 15 vidéos de hymnesData ont un identifiant bien formé', () => {
    expect(hymneVideosList).toHaveLength(15);
    for (const video of hymneVideosList) {
      const id = new URL(video.url).searchParams.get('v') ?? '';
      expect(id, `${video.id} — ${video.title}`).toMatch(VIDEO_ID_RE);
    }
  });
});
