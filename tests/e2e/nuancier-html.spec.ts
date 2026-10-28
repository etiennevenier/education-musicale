import { test, expect } from '@playwright/test';
import { createHash } from 'node:crypto';

const URL = '/education-musicale/4eme/musique-et-recyclage/';

/**
 * Le nuancier tire ses 8 cartes avec Math.random : à graine fixe, le HTML du
 * composant doit rester identique après remplacement du `plural` local par
 * l'utilitaire partagé (aucun changement de rendu, aucune erreur de module).
 */
const SEED = `(() => { let s = 20260101;
  Math.random = () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; }; })();`;

const EXPECTED_HASH = '802c4703be50baa4';
const EXPECTED_LENGTH = 53445;

test('le HTML du nuancier est inchangé (RNG fixé, aucune erreur console)', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });

  await page.addInitScript(SEED);
  await page.goto(URL, { waitUntil: 'load' });
  await page.click('#main-tab-nuancier');
  await expect(page.locator('[data-nuancier]')).toBeVisible();

  const html = await page.evaluate(() => document.querySelector('[data-nuancier]')?.innerHTML ?? '');
  const hash = createHash('sha256').update(html).digest('hex').slice(0, 16);
  expect(html.length).toBe(EXPECTED_LENGTH);
  expect(hash).toBe(EXPECTED_HASH);
  expect(errors).toEqual([]);

  // Les 8 cartes du tirage et la consigne sont bien rendues.
  await expect(page.locator('[data-nuancier] [data-card]')).toHaveCount(8);
  await expect(page.locator('[data-nuancier] [data-card]:not([hidden])')).toHaveCount(1);
});
