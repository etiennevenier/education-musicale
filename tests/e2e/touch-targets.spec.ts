import { test, expect } from '@playwright/test';

/**
 * Cibles tactiles : 24 px minimum partout (WCAG 2.5.8), 44 px de haut pour les
 * boutons d'action (Apple HIG / WCAG 2.5.5), en portrait et en paysage mobile.
 */
const BASE = '/education-musicale/entrainement/';
const TOOLS = [
  'lecture-notes', 'lecture-rythmique', 'piano-interactif', 'dessiner-clefs',
  'clavier-notes', 'oreille-nom', 'oreille-clavier',
];
const VIEWPORTS = [
  { width: 390, height: 844 },
  { width: 844, height: 390 },
];
const MIN_TARGET = 24;
const MIN_COMFORT = 44;
const COMFORT =
  '.level-btn, .cn-level-btn, .on-level-btn, .oc-level-btn, .note-btn, .tap-btn, .btn, .tab, .hub-back';

for (const vp of VIEWPORTS) {
  for (const tool of TOOLS) {
    test('cibles tactiles ' + tool + ' ' + vp.width + 'x' + vp.height, async ({ browser }) => {
      const context = await browser.newContext({ viewport: vp, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
      const page = await context.newPage();
      await page.goto(BASE + tool + '/', { waitUntil: 'load' });
      await page.waitForTimeout(300);

      const report = await page.evaluate(
        ({ comfort }) => {
          const tooSmall: string[] = [];
          const notComfortable: string[] = [];
          document.querySelectorAll('.tool-root button, .tool-root a[href]').forEach((el) => {
            const r = el.getBoundingClientRect();
            if (r.width === 0 || r.height === 0) return;
            const label = (el.getAttribute('aria-label') || el.textContent || el.className).trim().slice(0, 40);
            if (Math.min(r.width, r.height) < 24) tooSmall.push(label + ' ' + Math.round(r.width) + 'x' + Math.round(r.height));
            if (el.matches(comfort) && r.height < 44) notComfortable.push(label + ' h=' + Math.round(r.height));
          });
          return { tooSmall, notComfortable };
        },
        { comfort: COMFORT },
      );

      expect(report.tooSmall, 'cibles < ' + MIN_TARGET + ' px').toEqual([]);
      expect(report.notComfortable, 'boutons d\'action < ' + MIN_COMFORT + ' px de haut').toEqual([]);
      await context.close();
    });
  }
}
