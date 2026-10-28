import { test, expect } from '@playwright/test';

const BASE = '/education-musicale';

/**
 * Exclusivité audio globale (initAudioExclusivity) : un son qui démarre
 * arrête les autres lecteurs de la page.
 */
test('lecture d un son → arrête les autres', async ({ page }) => {
  await page.goto(BASE + '/4eme/musique-et-recyclage/', { waitUntil: 'load' });

  const cards = page.locator('[data-dual-player] [data-card]');
  const first = cards.nth(0);
  const second = cards.nth(1);
  const firstAudio = first.locator('audio[data-audio]');

  await first.locator('[data-play]').click();
  await page.waitForFunction(
    () => {
      const a = document.querySelector<HTMLAudioElement>('[data-card] audio[data-audio]');
      return !!a && !a.paused;
    },
    null,
    { timeout: 15000 },
  );

  await second.locator('[data-play]').click();
  await page.waitForFunction(
    () => {
      const all = Array.from(document.querySelectorAll<HTMLAudioElement>('[data-card] audio[data-audio]'));
      const firstAudioEl = all[0];
      const secondAudioEl = all[1];
      return !!firstAudioEl && !!secondAudioEl && firstAudioEl.paused && !secondAudioEl.paused;
    },
    null,
    { timeout: 15000 },
  );

  await expect(firstAudio).toBeAttached();
  expect(await firstAudio.evaluate((el) => (el as HTMLAudioElement).paused)).toBe(true);
});
