import { test, expect } from '@playwright/test';

const BASE = '/education-musicale';

test('Métissage : onglets et carte fonctionnels', async ({ page }) => {
  await page.goto(BASE + '/3eme/musique-et-metissage/');

  // Onglets présents
  const tabs = page.locator('.main-tab');
  expect(await tabs.count()).toBeGreaterThan(0);

  // Activer l'onglet « Voyage » (carte)
  await page.locator('[data-main-tab="voyage"]').click();
  await expect(page.locator('#world-map')).toBeVisible();

  // Les pilules de voyage sont là
  const pills = page.locator('.num-pill');
  expect(await pills.count()).toBeGreaterThan(0);

  // Des marqueurs sont rendus ; laisser l'animation initiale se terminer
  await expect(page.locator('#map-dynamic-layer .marker').first()).toBeVisible();
  await page.waitForTimeout(900);

  // Cliquer une autre pilule : les marqueurs sont re-rendus
  await pills.nth(1).click();
  await page.waitForTimeout(900); // animation selectVoyage
  await expect(page.locator('#map-dynamic-layer .marker').first()).toBeVisible();
});