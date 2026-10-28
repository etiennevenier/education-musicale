import { describe, expect, it } from 'vitest';
import { getListenUrl } from '../src/utils/engagementEvaluation';

/**
 * getListenUrl construit la recherche YouTube « artiste titre audio ».
 * Régression corrigée : artiste et titre étaient collés (`${artiste}${titre}`),
 * ce qui donnait « RenaudHexagone audio ».
 */
describe('getListenUrl', () => {
  it('sépare artiste et titre par une espace', () => {
    expect(getListenUrl({ artiste: 'Renaud', titre: 'Hexagone' })).toBe(
      'https://www.youtube.com/results?search_query=Renaud%20Hexagone%20audio',
    );
  });

  it('encode les accents et l’apostrophe typographique', () => {
    expect(getListenUrl({ artiste: 'Édith Piaf', titre: 'L’Hymne à l’amour' })).toBe(
      'https://www.youtube.com/results?search_query=%C3%89dith%20Piaf%20L%E2%80%99Hymne%20%C3%A0%20l%E2%80%99amour%20audio',
    );
  });

  it('conserve les titres déjà espacés (pas de double espace)', () => {
    expect(getListenUrl({ artiste: 'Sting', titre: 'Russians' })).toBe(
      'https://www.youtube.com/results?search_query=Sting%20Russians%20audio',
    );
  });
});
