import { test, expect } from '@playwright/test';

const URL = '/education-musicale/3eme/musique-et-rap/';

/**
 * Le séquenceur du bac à sable ne doit pas continuer à tourner quand on quitte
 * l'onglet FUN : avant correctif, la boucle restait active et les pas
 * continuaient de s'allumer en arrière-plan.
 */
test('quitter l’onglet FUN arrête le séquenceur', async ({ page }) => {
  await page.goto(URL, { waitUntil: 'load' });
  await page.click('#main-tab-fun');

  const label = page.locator('#seq-play-btn .label');
  await expect(label).toHaveText('Jouer le Beat');

  await page.click('#seq-play-btn');
  await expect(label).toHaveText('Stopper');
  await expect.poll(() => page.locator('.step-btn.playing').count(), { timeout: 5000 }).toBeGreaterThan(0);

  await page.click('#main-tab-cours');

  await expect(label).toHaveText('Jouer le Beat');
  expect(await page.locator('.step-btn.playing').count()).toBe(0);
});
