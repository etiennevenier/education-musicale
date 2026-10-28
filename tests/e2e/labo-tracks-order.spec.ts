import { test, expect } from '@playwright/test';

const URL = '/education-musicale/4eme/musique-et-cinema/';

/**
 * Les extraits du Labo Cinéma sont mélangés au chargement, puis renumérotés
 * « Extrait N » selon leur position. Ordre et libellés figés avec un Math.random
 * déterministe : ils doivent rester identiques après centralisation du mélange
 * (même nombre d'appels à Math.random, même réinsertion).
 */
const SEED = `(() => { let s = 20260101;
  Math.random = () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; }; })();`;

const EXPECTED = [
  ['drole', 'Extrait 1'],
  ['joyeuse', 'Extrait 2'],
  ['triste', 'Extrait 3'],
];

test('l’ordre des extraits du Labo Cinéma et leurs libellés restent identiques (RNG fixé)', async ({ page }) => {
  await page.addInitScript(SEED);
  await page.goto(URL, { waitUntil: 'load' });
  await expect(page.locator('.labo-tracks')).toBeAttached();

  const tracks = await page.evaluate(() =>
    [...document.querySelectorAll('.labo-tracks > *')].map((button) => [
      button.getAttribute('data-music'),
      button.querySelector('.labo-track-name')?.textContent,
    ]),
  );
  expect(tracks).toEqual(EXPECTED);

  // Les trois extraits restent les seuls enfants directs du conteneur.
  const count = await page.locator('.labo-tracks > [data-music]').count();
  expect(count).toBe(3);
});
