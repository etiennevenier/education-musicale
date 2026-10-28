import { test, expect } from '@playwright/test';

const URL = '/education-musicale/entrainement/dessiner-clefs/';

/**
 * La portée de dessin est un SVG `width:100% ; height:auto` (viewBox 360 × 252) :
 * sa hauteur découle de la largeur de la carte et, au-delà de 768 px de haut,
 * aucune règle CSS ne la bornait (389 px de débordement à 1440×900, jusqu'à
 * 455 px sur iPad paysage). Elle doit désormais tenir dans la hauteur disponible.
 * Plancher de lisibilité : 150 px de haut (échelle 0,60).
 */
const desktop = [
  { width: 1280, height: 720 },
  { width: 1440, height: 900 },
  { width: 1440, height: 1000 },
  { width: 1920, height: 1080 },
  { width: 2560, height: 1300 },
] as const;

const iPads = [
  { width: 1376, height: 1032 },
  { width: 1376, height: 880 },
  { width: 1366, height: 1024 },
  { width: 1366, height: 870 },
  { width: 1194, height: 834 },
] as const;

const MIN_BOARD_HEIGHT = 150;
const BOARD_RATIO = 360 / 252;

async function measureBoard(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const board = document.querySelector('#cl-board') as SVGElement;
    const r = board.getBoundingClientRect();
    const sheet = document.querySelector('#tool-clefs .sheet')!.getBoundingClientRect();
    const slider = document.querySelector('#tool-clefs .slider-row')!.getBoundingClientRect();
    const caption = document.querySelector('#tool-clefs .caption')!.getBoundingClientRect();
    const card = document.querySelector('#tool-clefs')!.getBoundingClientRect();
    return {
      boardW: Math.round(r.width),
      boardH: Math.round(r.height),
      boardBottom: Math.round(r.bottom),
      sheetBottom: Math.round(sheet.bottom),
      sliderBottom: Math.round(slider.bottom),
      captionBottom: Math.round(caption.bottom),
      cardBottom: Math.round(card.bottom),
      docScroll: document.documentElement.scrollHeight,
      innerH: window.innerHeight,
    };
  });
}

/** Coordonnées normalisées (0 → 1) du tracé dans le repère du viewBox. */
async function traceBox(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const board = document.querySelector('#cl-board') as SVGSVGElement;
    const draw = document.querySelector('#cl-drawG') as SVGGElement;
    const bb = draw.getBBox();
    const vb = board.viewBox.baseVal;
    return {
      x: Math.round(((bb.x - vb.x) / vb.width) * 1000) / 1000,
      y: Math.round(((bb.y - vb.y) / vb.height) * 1000) / 1000,
      w: Math.round((bb.width / vb.width) * 1000) / 1000,
      h: Math.round((bb.height / vb.height) * 1000) / 1000,
      visible: [...draw.querySelectorAll('.stroke, .dot')].filter((el) => (el as SVGElement).style.display !== 'none')
        .length,
      pct: document.querySelector('#cl-pct')!.textContent,
    };
  });
}

async function setProgress(page: import('@playwright/test').Page, value: number) {
  await page.evaluate((v) => {
    const slider = document.querySelector('#cl-slider') as HTMLInputElement;
    slider.value = String(v);
    slider.dispatchEvent(new Event('input', { bubbles: true }));
  }, value);
  await page.waitForTimeout(120);
}

for (const [label, viewports, mobile] of [
  ['bureau', desktop, false],
  ['iPad paysage', iPads, true],
] as const) {
  test.describe(`Dessiner les clefs — la carte tient dans la fenêtre (${label})`, () => {
    if (mobile) test.use({ hasTouch: true, isMobile: true, deviceScaleFactor: 2 });

    for (const vp of viewports) {
      test(`${vp.width}×${vp.height} : pas de débordement vertical`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto(URL, { waitUntil: 'load' });
        await expect(page.locator('#cl-board')).toBeVisible();

        const m = await measureBoard(page);
        expect(m.docScroll, `document ${m.docScroll} px > fenêtre ${m.innerH} px`).toBeLessThanOrEqual(m.innerH + 1);
        expect(m.cardBottom).toBeLessThanOrEqual(m.innerH);
        expect(m.sheetBottom).toBeLessThanOrEqual(m.innerH);
        expect(m.sliderBottom).toBeLessThanOrEqual(m.innerH);
        expect(m.captionBottom).toBeLessThanOrEqual(m.innerH);
        // Plancher de lisibilité et ratio du viewBox conservés.
        expect(m.boardH).toBeGreaterThanOrEqual(MIN_BOARD_HEIGHT);
        expect(Math.abs(m.boardW / m.boardH - BOARD_RATIO) / BOARD_RATIO).toBeLessThan(0.02);
      });
    }
  });
}

test.describe('Dessiner les clefs — tracé, modèle et onglets', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('le tracé suit le curseur et reste aux mêmes coordonnées normalisées', async ({ page }) => {
    await page.goto(URL, { waitUntil: 'load' });

    await setProgress(page, 50);
    const half = await traceBox(page);
    expect(half.pct).toContain('50');
    expect(half.visible).toBeGreaterThan(0);

    await setProgress(page, 100);
    const full = await traceBox(page);
    expect(full.pct).toContain('100');
    expect(full.visible).toBeGreaterThan(half.visible);
    // Tracé complet : il descend plus bas et couvre plus haut que la moitié.
    expect(full.y).toBeLessThan(half.y);
    expect(full.h).toBeGreaterThan(half.h);
    
  });

  test('les onglets Clef de Sol / Clef de Fa remettent la progression à zéro', async ({ page }) => {
    await page.goto(URL, { waitUntil: 'load' });
    await setProgress(page, 60);
    const solBox = await traceBox(page);

    await page.locator('#cl-tab-fa').click();
    await page.waitForTimeout(200);
    await expect(page.locator('#cl-tab-fa')).toHaveAttribute('aria-selected', 'true');
    const faPct = await page.locator('#cl-pct').innerText();
    expect(faPct).toContain('0');
    const faBox = await traceBox(page);
    expect(faBox.visible).toBe(0);
    // La clef de Fa est plus basse que celle de Sol : le tracé n'a pas la même origine.
    expect(faBox.h).not.toBe(solBox.h);

    await page.locator('#cl-tab-sol').click();
    await page.waitForTimeout(200);
    await expect(page.locator('#cl-tab-sol')).toHaveAttribute('aria-selected', 'true');
  });

  test("le modèle s'affiche au tap et au clavier, et se masque au second tap", async ({ page }) => {
    await page.goto(URL, { waitUntil: 'load' });
    const ghost = page.locator('#cl-ghostG');
    await expect(ghost).toBeHidden();

    await page.locator('#cl-board').click({ position: { x: 40, y: 60 } });
    await expect(ghost).toBeVisible();
    await expect(page.locator('#cl-board')).toHaveAttribute('aria-pressed', 'true');

    await page.locator('#cl-board').click({ position: { x: 40, y: 60 } });
    await expect(ghost).toBeHidden();

    // Accessibilité clavier : Entrée affiche le modèle.
    await page.locator('#cl-board').focus();
    await page.keyboard.press('Enter');
    await expect(ghost).toBeVisible();
    await page.keyboard.press(' ');
    await expect(ghost).toBeHidden();
  });

  test('un redimensionnement en cours de tracé ne déplace ni ne perd le tracé', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(URL, { waitUntil: 'load' });
    await setProgress(page, 50);
    const before = await traceBox(page);

    await page.setViewportSize({ width: 1440, height: 760 });
    await page.waitForTimeout(400);
    const after = await traceBox(page);

    expect(after.pct).toBe(before.pct);
    expect(after.visible).toBe(before.visible);
    // Coordonnées normalisées identiques : même tracé, à la même place relative.
    expect(after.x).toBeCloseTo(before.x, 1);
    expect(after.y).toBeCloseTo(before.y, 1);
    expect(after.w).toBeCloseTo(before.w, 1);
    expect(after.h).toBeCloseTo(before.h, 1);

    const m = await measureBoard(page);
    expect(m.docScroll).toBeLessThanOrEqual(m.innerH + 1);
  });
});
