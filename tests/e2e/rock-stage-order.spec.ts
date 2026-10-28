import { test, expect } from '@playwright/test';

const URL = '/education-musicale/4eme/musique-et-rock/';

/**
 * Les cartes du Studio Rock sont mélangées au chargement (shuffle + réinsertion).
 * Ordre figé avec un Math.random déterministe : il doit rester identique après
 * centralisation du mélange dans utils/random (même nombre d'appels à Math.random).
 */
const SEED = `(() => { let s = 20260101;
  Math.random = () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; }; })();`;

const EXPECTED = [
  [
    'batterie', 'trombone', 'trompette', 'contrebasse', 'basson', 'piano', 'saxophone',
    'chant', 'basse', 'violon', 'guitare', 'harpe', 'clarinette', 'fluteabec', 'synthetiseur',
  ],
  [
    'alternancecalmeexplosion', 'harmoniesvocales', 'paillettesmaquillage', 'saturation',
    'textesrebelles', 'ecritureinfluencedrogue', 'formatcourt', 'sonsale', '3accords',
    'grilledeblues', 'annees50', 'jazzinfluence',
  ],
];

test('l’ordre des cartes du Studio Rock reste identique (RNG fixé)', async ({ page }) => {
  await page.addInitScript(SEED);
  await page.goto(URL, { waitUntil: 'load' });
  await page.click('#main-tab-studio');
  await expect(page.locator('[data-rack-grid]').first()).toBeVisible();

  const grids = await page.evaluate(() =>
    [...document.querySelectorAll('[data-rack-grid]')].map((grid) =>
      [...grid.children].map((child) => child.getAttribute('data-item-id')),
    ),
  );
  expect(grids).toEqual(EXPECTED);
});
