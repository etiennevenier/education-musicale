import { test, expect } from '@playwright/test';

const BASE = '/education-musicale';

test('risques auditifs : preload="none" puis lecture au clic', async ({ page }) => {
  await page.goto(BASE + '/3eme/musique-et-risques-auditifs/', { waitUntil: 'load' });
  const audio = page.locator('#sim-audio');
  await expect(audio).toHaveAttribute('preload', 'none');
  expect(await audio.evaluate((el) => (el as HTMLAudioElement).readyState)).toBe(0);

  await page.locator('#main-tab-simulateur').click();
  await page.locator('#btn-play-pause').click();
  await page.waitForFunction(
    () => {
      const el = document.querySelector<HTMLAudioElement>('#sim-audio');
      return !!el && !el.paused && el.readyState >= 2;
    },
    null,
    { timeout: 15000 },
  );
});

test('labo cinéma : vidéo preload="none" puis lecture après sélection', async ({ page }) => {
  await page.goto(BASE + '/4eme/musique-et-cinema/', { waitUntil: 'load' });
  const video = page.locator('#laboScreenVideo');
  await expect(video).toHaveAttribute('preload', 'none');
  expect(await video.evaluate((el) => (el as HTMLVideoElement).readyState)).toBe(0);
  // Les vignettes autoplay ne doivent pas non plus précharger.
  await expect(page.locator('video[autoplay]').first()).toHaveAttribute('preload', 'none');

  await page.locator('#main-tab-labo').click();
  await page.locator('[data-gif][data-kind="video"]').first().click();
  await page.waitForFunction(
    () => {
      const el = document.querySelector<HTMLVideoElement>('#laboScreenVideo');
      return !!el && !!el.getAttribute('src') && !el.paused;
    },
    null,
    { timeout: 15000 },
  );
});
