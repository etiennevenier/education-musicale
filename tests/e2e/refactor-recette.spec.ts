import { test, expect } from '@playwright/test';

const BASE = '/education-musicale';
const TOOLS = [
  'lecture-notes', 'lecture-rythmique', 'piano-interactif', 'dessiner-clefs',
  'clavier-notes', 'oreille-nom', 'oreille-clavier',
];

test.describe('h1 unique', () => {
  for (const vp of [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 844, height: 390 }]) {
    for (const tool of TOOLS) {
      test(tool + ' ' + vp.width + 'x' + vp.height, async ({ page }) => {
        await page.setViewportSize(vp);
        await page.goto(BASE + '/entrainement/' + tool + '/', { waitUntil: 'load' });
        await expect(page.locator('h1')).toHaveCount(1);
        // Le h1 doit rester dans l'arbre d'accessibilité (pas de display:none).
        expect(await page.locator('h1').evaluate((el) => getComputedStyle(el).display)).not.toBe('none');
      });
    }
    test('hub ' + vp.width + 'x' + vp.height, async ({ page }) => {
      await page.setViewportSize(vp);
      await page.goto(BASE + '/entrainement/', { waitUntil: 'load' });
      await expect(page.locator('h1')).toHaveCount(1);
      expect(await page.locator('h1').evaluate((el) => getComputedStyle(el).display)).not.toBe('none');
    });
  }
});

test.describe('fin de défi en français', () => {
  test.use({ viewport: { width: 1440, height: 900 } });
  for (const tool of ['lecture-notes', 'clavier-notes', 'oreille-nom', 'oreille-clavier']) {
    test(tool, async ({ page }) => {
      await page.goto(BASE + '/entrainement/' + tool + '/', { waitUntil: 'load' });
      const html = await page.content();
      expect(html).not.toContain('Challenge Over');
      expect(html).toContain('Défi terminé');
    });
  }
});

test.describe('clés SVG', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('lecture de notes : <use> et recouvrement de la portée', async ({ page }) => {
    await page.goto(BASE + '/entrainement/lecture-notes/', { waitUntil: 'load' });
    for (const [level, id] of [['1', 'notes-clef-sol'], ['2', 'notes-clef-fa']] as const) {
      await page.goto(BASE + '/entrainement/lecture-notes/', { waitUntil: 'load' });
      await page.locator('.level-btn[data-level="' + level + '"]').click();
      await expect(page.locator('#staff-svg use[href="#' + id + '"]')).toHaveCount(1);
      await expect(page.locator('#staff-svg text')).toHaveCount(0);
      const geo = await page.evaluate(() => {
        const clef = document.querySelector('#staff-svg .staff-clef')!.getBoundingClientRect();
        const lines = [...document.querySelectorAll('#staff-svg line')].slice(0, 5).map((l) => l.getBoundingClientRect());
        return { top: clef.top, bottom: clef.bottom, w: clef.width, first: lines[0].top, last: lines[4].bottom };
      });
      expect(geo.w).toBeGreaterThan(10);
      // La clé recouvre verticalement la portée (la clé de sol la dépasse des deux côtés).
      expect(geo.top).toBeLessThanOrEqual(geo.last);
      expect(geo.bottom).toBeGreaterThanOrEqual(geo.first);
      if (id === 'notes-clef-sol') {
        expect(geo.top).toBeLessThanOrEqual(geo.first);
        expect(geo.bottom).toBeGreaterThanOrEqual(geo.last);
      }
    }
  });

  test('piano : deux clés <use>, aucun glyphe Unicode', async ({ page }) => {
    await page.goto(BASE + '/entrainement/piano-interactif/', { waitUntil: 'load' });
    await page.locator('#piano button.white-key').nth(20).click();
    await expect(page.locator('#piano-staff-svg use')).toHaveCount(2);
    await expect(page.locator('#piano-staff-svg text')).toHaveCount(0);
  });
});

test.describe('piano : touches sémantiques', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('88 boutons, un seul arrêt de tabulation, flèches et Entrée', async ({ page }) => {
    await page.goto(BASE + '/entrainement/piano-interactif/', { waitUntil: 'load' });
    await expect(page.locator('#piano button')).toHaveCount(88);
    await expect(page.locator('#piano button[tabindex="0"]')).toHaveCount(1);
    for (const el of await page.locator('#piano button').all()) {
      expect(await el.getAttribute('aria-label')).toBeTruthy();
    }
    await page.locator('#piano button').first().focus();
    await page.keyboard.press('ArrowRight');
    expect(await page.evaluate(() => (document.activeElement as HTMLElement).dataset.midi)).toBe('22');
    await page.keyboard.press('Enter');
    await expect(page.locator('#piano-note-display')).toHaveText('Note : La#0');
  });
});

test.describe('bfcache : pageshow persisted', () => {
  test.use({ viewport: { width: 1440, height: 900 } });
  for (const tool of ['clavier-notes', 'oreille-nom', 'oreille-clavier', 'lecture-notes']) {
    test(tool + ' revient au menu', async ({ page }) => {
      await page.goto(BASE + '/entrainement/' + tool + '/', { waitUntil: 'load' });
      await page.locator('[data-level]').first().click();
      await page.evaluate(() => {
        const event = new PageTransitionEvent('pageshow', { persisted: true });
        window.dispatchEvent(event);
      });
      await expect(page.locator('[data-level]').first()).toBeVisible();
    });
  }
});
