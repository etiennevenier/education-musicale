import { readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { tools } from '../src/data/tools';

describe('outils d\'entraînement', () => {
  it('chaque page de src/pages/entrainement est déclarée dans tools.ts (hub + admin automatiques)', () => {
    const pages = readdirSync('src/pages/entrainement')
      .filter((f) => f.endsWith('.astro') && f !== 'index.astro')
      .map((f) => f.replace('.astro', ''))
      .sort();
    expect(tools.map((t) => t.slug).sort()).toEqual(pages);
  });
});
