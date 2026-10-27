import { test, expect } from '@playwright/test';

const URL = '/education-musicale/entrainement/piano-interactif/';

/**
 * Décision produit : les 88 touches (52 blanches) doivent être visibles sans
 * défilement sur iPad Pro 13" en paysage et sur tout écran de bureau >= 1440 px.
 * La largeur d'une touche blanche = largeur disponible / 52, bornée à [24, 48] px :
 * 24 px est la cible tactile du WCAG 2.5.8, 48 px la taille tactile historique.
 * Sous 24 px, le clavier défile horizontalement (centré sur le Do central).
 * Le mode compact (hauteur <= 768), le téléphone et le portrait sont inchangés.
 */
const iPads = [
  { width: 1376, height: 1032 },
  { width: 1376, height: 880 },
  { width: 1366, height: 1024 },
  { width: 1366, height: 870 },
] as const;

const desktop = [
  { width: 1440, height: 900 },
  { width: 1440, height: 1000 },
  { width: 1920, height: 1080 },
  { width: 2560, height: 1300 },
] as const;

const MIN_KEY = 24;

export type PianoMetrics = {
  docScroll: number;
  innerH: number;
  keyWidth: number;
  whiteKeys: number;
  fullyVisible: number;
  hScroll: boolean;
  keyboardWidth: number;
  available: number;
  hintVisible: boolean;
  cardBottom: number;
};

async function measurePiano(page: import('@playwright/test').Page): Promise<PianoMetrics> {
  return page.evaluate(() => {
    const wrapper = document.querySelector('.piano-wrapper') as HTMLElement;
    const whites = [...document.querySelectorAll('.white-key')] as HTMLElement[];
    const wr = wrapper.getBoundingClientRect();
    const cs = getComputedStyle(wrapper);
    const innerLeft = wr.left + parseFloat(cs.paddingLeft);
    const innerRight = wr.right - parseFloat(cs.paddingRight);
    const fully = whites.filter((k) => {
      const b = k.getBoundingClientRect();
      return b.left >= innerLeft - 1 && b.right <= innerRight + 1;
    }).length;
    const hint = document.querySelector('.piano-scroll-hint') as HTMLElement;
    const card = document.querySelector('#tool-piano')!.getBoundingClientRect();
    return {
      docScroll: document.documentElement.scrollHeight,
      innerH: window.innerHeight,
      keyWidth: whites.length ? Math.round(whites[0].getBoundingClientRect().width) : 0,
      whiteKeys: whites.length,
      fullyVisible: fully,
      hScroll: wrapper.scrollWidth > wrapper.clientWidth + 1,
      keyboardWidth: Math.round((document.querySelector('#piano') as HTMLElement).getBoundingClientRect().width),
      available: Math.round(wrapper.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)),
      hintVisible: hint ? getComputedStyle(hint).display !== 'none' : false,
      cardBottom: Math.round(card.bottom),
    };
  });
}

for (const [label, viewports, mobile] of [
  ['iPad paysage', iPads, true],
  ['bureau', desktop, false],
] as const) {
  test.describe(`Piano interactif — 88 touches visibles (${label})`, () => {
    if (mobile) test.use({ hasTouch: true, isMobile: true, deviceScaleFactor: 2 });

    for (const vp of viewports) {
      test(`${vp.width}×${vp.height} : clavier entier, sans défilement`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto(URL, { waitUntil: 'load' });
        await expect(page.locator('.white-key')).toHaveCount(52);

        const m = await measurePiano(page);
        expect(m.whiteKeys).toBe(52);
        expect(m.fullyVisible, `touches visibles ${m.fullyVisible}/52`).toBe(52);
        expect(m.hScroll, 'défilement horizontal résiduel').toBe(false);
        expect(m.keyboardWidth).toBeLessThanOrEqual(m.available + 1);
        expect(m.keyWidth).toBeGreaterThanOrEqual(MIN_KEY);
        // L'aide au défilement devient inutile : elle est masquée.
        expect(m.hintVisible).toBe(false);
        // Pas de dépassement vertical.
        expect(m.docScroll).toBeLessThanOrEqual(m.innerH + 1);
        expect(m.cardBottom).toBeLessThanOrEqual(m.innerH);
      });
    }
  });
}

test.describe('Piano interactif — écrans plus étroits et modes existants', () => {
  test.use({ hasTouch: true, isMobile: true, deviceScaleFactor: 2 });

  test('1194×834 (iPad 11") : défilement horizontal, touches au minimum de 24 px', async ({ page }) => {
    await page.setViewportSize({ width: 1194, height: 834 });
    await page.goto(URL, { waitUntil: 'load' });
    const m = await measurePiano(page);
    expect(m.keyWidth).toBe(MIN_KEY);
    expect(m.hScroll).toBe(true);
    expect(m.hintVisible).toBe(true);
    expect(m.fullyVisible).toBeGreaterThanOrEqual(40);
    expect(m.fullyVisible).toBeLessThan(52);
    expect(m.docScroll).toBeLessThanOrEqual(m.innerH + 1);
  });

  test('390×844 (téléphone) : comportement inchangé (touches 48 px, défilement)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(URL, { waitUntil: 'load' });
    const m = await measurePiano(page);
    expect(m.keyWidth).toBe(48);
    expect(m.hScroll).toBe(true);
  });

  test('1024×768 (mode compact, hauteur <= 768) : touches 48 px, défilement', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto(URL, { waitUntil: 'load' });
    const m = await measurePiano(page);
    expect(m.keyWidth).toBe(48);
    expect(m.hScroll).toBe(true);
    expect(m.docScroll).toBeLessThanOrEqual(m.innerH + 1);
  });
});

test.describe('Piano interactif — jeu des touches et robustesse', () => {
  test.use({ viewport: { width: 1376, height: 1032 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });

  test('La0, Do4, Do8 et une touche noire sont jouables et correctement alignés', async ({ page }) => {
    await page.goto(URL, { waitUntil: 'load' });
    const display = page.locator('#piano-note-display');

    await page.locator('.white-key').first().click();
    await expect(display).toHaveText('Note : La0');

    await page.locator('.white-key.c-key').nth(3).click();
    await expect(display).toHaveText('Note : Do4');

    await page.locator('.white-key').last().click();
    await expect(display).toHaveText('Note : Do8');

    // Touche noire dont le centre est sur la frontière Do4 / Ré4 = Do#4.
    const blackIndex = await page.evaluate(() => {
      const whites = [...document.querySelectorAll('.white-key')];
      const blacks = [...document.querySelectorAll('.black-key')];
      const do4 = whites.find((k) => k.textContent === 'Do4');
      if (!do4) return -1;
      const boundary = do4.getBoundingClientRect().right;
      return blacks.findIndex((b) => {
        const r = b.getBoundingClientRect();
        return Math.abs(r.left + r.width / 2 - boundary) < 1.5;
      });
    });
    expect(blackIndex).toBeGreaterThanOrEqual(0);
    await page.locator('.black-key').nth(blackIndex).click();
    await expect(display).toHaveText('Note : Do#4');

    // Les 36 touches noires restent centrées sur les frontières des blanches.
    const maxGap = await page.evaluate(() => {
      const whites = [...document.querySelectorAll('.white-key')];
      const blacks = [...document.querySelectorAll('.black-key')];
      let worst = 0;
      for (const black of blacks) {
        const bc = black.getBoundingClientRect();
        const centre = bc.left + bc.width / 2;
        let best = Number.POSITIVE_INFINITY;
        for (let i = 0; i < whites.length - 1; i += 1) {
          best = Math.min(best, Math.abs(whites[i].getBoundingClientRect().right - centre));
        }
        worst = Math.max(worst, best);
      }
      return worst;
    });
    expect(maxGap).toBeLessThan(1.5);
  });

  test("resize : une salve ne redessine qu'une fois, et aucune boucle", async ({ page }) => {
    await page.goto(URL, { waitUntil: 'load' });
    // Chaque réadaptation redessine la portée : on compte les salves de mutations du SVG.
    await page.evaluate(() => {
      (window as unknown as { __draws: number }).__draws = 0;
      const svg = document.querySelector('#piano-staff-svg')!;
      new MutationObserver((records) => {
        if (records.some((r) => r.type === 'childList')) (window as unknown as { __draws: number }).__draws += 1;
      }).observe(svg, { childList: true });
    });
    const read = () => page.evaluate(() => (window as unknown as { __draws: number }).__draws);

    await page.evaluate(() => {
      for (let i = 0; i < 5; i += 1) window.dispatchEvent(new Event('resize'));
    });
    await page.waitForTimeout(300);
    expect(await read()).toBe(1);

    for (const height of [1000, 980, 960, 940, 920]) {
      await page.setViewportSize({ width: 1376, height });
      await page.waitForTimeout(180);
    }
    expect(await read()).toBe(6);

    await page.waitForTimeout(1200);
    expect(await read()).toBe(6); // aucun redessin spontané
    expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(921);
  });
});
