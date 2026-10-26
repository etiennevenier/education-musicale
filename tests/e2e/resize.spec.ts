import { test, expect } from '@playwright/test';

const BASE = '/education-musicale';

/**
 * Les redessins sur resize passent par requestAnimationFrame (cleanup pagehide).
 * On vérifie qu'un aller-retour de viewport ne casse ni le rendu ni la console.
 */
const cases = [
  ['/entrainement/piano-interactif/', '#piano-staff-svg'],
  ['/entrainement/lecture-notes/', '#staff-svg'],
  ['/6eme/musique-et-tempo/', '#rhythm-svg'],
] as const;

for (const [path, svg] of cases) {
  test(`resize sans erreur : ${path}`, async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (error) => errors.push(error.message));

    await page.goto(BASE + path, { waitUntil: 'load' });
    await expect(page.locator(svg)).toBeAttached();

    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(400);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.waitForTimeout(400);

    await expect(page.locator(svg)).toBeAttached();
    expect(errors).toEqual([]);
  });
}
