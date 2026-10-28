import { test, expect } from '@playwright/test';

const BASE = '/education-musicale';

/**
 * Vérifie que l'onglet masqué suspend bien le contexte Web Audio partagé
 * (initAudioSuspendOnHidden), après qu'un geste l'a créé/repris.
 */
test('onglet masqué → AudioContext.suspend()', async ({ page }) => {
  await page.addInitScript(() => {
    (window as any).__suspendCalls = 0;
    const Ctor = (window as any).AudioContext ?? (window as any).webkitAudioContext;
    if (Ctor?.prototype?.suspend) {
      const original = Ctor.prototype.suspend;
      Ctor.prototype.suspend = function (...args: unknown[]) {
        (window as any).__suspendCalls += 1;
        return original.apply(this, args);
      };
    }
  });

  await page.goto(BASE + '/6eme/musique-et-nuances/', { waitUntil: 'domcontentloaded' });
  // Geste utilisateur : crée et reprend le contexte partagé (getAudioContext).
  await page.locator('#btnPlay').click();
  await page.waitForTimeout(300);

  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { value: true, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });

  await page.waitForFunction(() => (window as any).__suspendCalls > 0, null, { timeout: 5000 });
  expect(await page.evaluate(() => (window as any).__suspendCalls)).toBeGreaterThan(0);
});
