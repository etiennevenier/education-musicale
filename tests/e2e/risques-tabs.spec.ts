import { test, expect } from '@playwright/test';

const URL = '/education-musicale/3eme/musique-et-risques-auditifs/';

/**
 * L'audio du simulateur ne doit pas continuer à jouer quand on quitte l'onglet.
 * Avant correctif, la musique continuait et le bouton restait sur « Mettre en pause ».
 */
test('quitter l’onglet simulateur coupe la simulation audio', async ({ page }) => {
  await page.goto(URL, { waitUntil: 'load' });
  await page.click('#main-tab-simulateur');

  const label = page.locator('#btn-play-pause .label');
  const audio = page.locator('#sim-audio');
  const badge = page.locator('#acouphene-warning');

  await expect(label).toHaveText("Lancer l'écoute");
  await page.click('#btn-play-pause');
  await expect(label).toHaveText('Mettre en pause');
  await expect
    .poll(() => page.evaluate(() => !document.querySelector<HTMLAudioElement>('#sim-audio')?.paused), {
      timeout: 8000,
    })
    .toBe(true);

  // Mode acouphène pendant la lecture : la pastille d'avertissement apparaît.
  await page.click('.mode-card[data-mode="acouphene"]');
  await expect(badge).toBeVisible();

  // Changement d'onglet : plus d'audio, bouton revenu à l'état « pause », pastille éteinte.
  await page.click('#main-tab-cours');
  expect(await audio.evaluate((el) => (el as HTMLAudioElement).paused)).toBe(true);
  await expect(label).toHaveText("Reprendre l'écoute");
  await expect(badge).toBeHidden();
  // La pastille est aussi réellement éteinte (fondu de 3 s de l'acouphène).
  await expect
    .poll(() => page.evaluate(() => document.querySelector<HTMLElement>('#acouphene-warning')?.hidden === true), {
      timeout: 6000,
    })
    .toBe(true);
});
