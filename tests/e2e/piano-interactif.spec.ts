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
// ---------------------------------------------------------------------------
// LOT M / LOT N — niveaux de zoom « Vue complète / Zoom / Grand zoom »
// ---------------------------------------------------------------------------

/** Niveaux : 0 = vue complète (calculée), 1 = 52 px (noire 33), 2 = 84 px (noire 54). */
const ZOOM_WHITE = 52;
const ZOOM_BLACK = 33;
const GRAND_WHITE = 84;
const GRAND_BLACK = 54;
const LEVEL_LABELS = ['Vue complète', 'Zoom', 'Grand zoom'] as const;
/** Plancher produit : aucun niveau ne doit laisser moins de 8 touches visibles. */
const MIN_VISIBLE_KEYS = 8;

const LARGE = [
  { width: 1376, height: 1032 },
  { width: 1376, height: 880 },
  { width: 1366, height: 1024 },
  { width: 1194, height: 834 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
] as const;

const SMALL = [
  { width: 1280, height: 720 },
  { width: 1024, height: 768 },
  { width: 844, height: 390 },
  { width: 390, height: 844 },
  { width: 834, height: 1194 },
  { width: 1032, height: 1376 },
] as const;

type Canvas = { width: number; height: number; mobile: boolean };

const LARGE_CASES: Canvas[] = LARGE.map((v, i) => ({ ...v, mobile: i < 4 }));
const SMALL_CASES: Canvas[] = SMALL.map((v, i) => ({ ...v, mobile: i >= 2 }));

for (const c of LARGE_CASES) {
  test(`contrôle de zoom présent (${c.width}×${c.height})`, async ({ browser }) => {
    const ctx = await browser.newContext({
      viewport: { width: c.width, height: c.height },
      ...(c.mobile ? { hasTouch: true, isMobile: true, deviceScaleFactor: 2 } : {}),
    });
    const page = await ctx.newPage();
    await page.goto(URL, { waitUntil: 'load' });
    await expect(page.locator('#piano-zoom-controls')).toBeVisible();
    await expect(page.locator('#piano-zoom-level')).toHaveText('Vue complète');
    // Aux extrémités : « − » inactif en vue complète, « + » actif.
    await expect(page.locator('#piano-zoom-out')).toBeDisabled();
    await expect(page.locator('#piano-zoom-in')).toBeEnabled();
    await ctx.close();
  });
}

for (const c of SMALL_CASES) {
  test(`contrôle de zoom absent (${c.width}×${c.height})`, async ({ browser }) => {
    const ctx = await browser.newContext({
      viewport: { width: c.width, height: c.height },
      ...(c.mobile ? { hasTouch: true, isMobile: true, deviceScaleFactor: 2 } : {}),
    });
    const page = await ctx.newPage();
    await page.goto(URL, { waitUntil: 'load' });
    await expect(page.locator('#piano-zoom-controls')).toBeHidden();
    await ctx.close();
  });
}

/** Mesures du clavier dans un contexte donné. */
async function keyboardMetrics(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const wrapper = document.querySelector('.piano-wrapper') as HTMLElement;
    const whites = [...document.querySelectorAll('.white-key')] as HTMLElement[];
    const blacks = [...document.querySelectorAll('.black-key')] as HTMLElement[];
    const wr = wrapper.getBoundingClientRect();
    const cs = getComputedStyle(wrapper);
    const left = wr.left + parseFloat(cs.paddingLeft);
    const right = wr.right - parseFloat(cs.paddingRight);
    const fully = whites.filter((k) => {
      const b = k.getBoundingClientRect();
      return b.left >= left - 1 && b.right <= right + 1;
    }).length;
    const do4 = whites.find((k) => k.textContent === 'Do4');
    const do4Rect = do4?.getBoundingClientRect();
    return {
      white: Math.round(whites[0].getBoundingClientRect().width),
      black: Math.round(blacks[0].getBoundingClientRect().width),
      fully,
      hScroll: wrapper.scrollWidth > wrapper.clientWidth + 1,
      do4Offset: do4Rect ? Math.round(do4Rect.left + do4Rect.width / 2 - (wr.left + wrapper.clientWidth / 2)) : null,
      doc: document.documentElement.scrollHeight,
      innerH: window.innerHeight,
      hintVisible: getComputedStyle(document.querySelector('.piano-scroll-hint')!).display !== 'none',
    };
  });
}

for (const c of LARGE_CASES) {
  test(`trois niveaux : tailles, défilement, note centrale conservée (${c.width}×${c.height})`, async ({ browser }) => {
    const ctx = await browser.newContext({
      viewport: { width: c.width, height: c.height },
      ...(c.mobile ? { hasTouch: true, isMobile: true, deviceScaleFactor: 2 } : {}),
    });
    const page = await ctx.newPage();
    await page.goto(URL, { waitUntil: 'load' });
    const level = page.locator('#piano-zoom-level');
    const zoomIn = page.locator('#piano-zoom-in');
    const zoomOut = page.locator('#piano-zoom-out');

    // Niveau 0 : vue complète (comportement du lot L).
    const full = await keyboardMetrics(page);
    expect(full.white).toBeLessThan(ZOOM_WHITE);
    // L'aide au défilement suit le débordement réel (masquée si les 88 touches tiennent).
    expect(full.hintVisible).toBe(full.hScroll);
    expect(full.doc).toBeLessThanOrEqual(full.innerH + 1);
    if (c.width >= 1366) {
      expect(full.fully).toBe(52);
      expect(full.hScroll).toBe(false);
    }
    await expect(level).toHaveText(LEVEL_LABELS[0]);
    await expect(zoomOut).toBeDisabled();

    // Niveau 1 : Zoom 52/33 px (comportement du lot M).
    await zoomIn.click();
    await page.waitForTimeout(250);
    const zoom = await keyboardMetrics(page);
    expect(zoom.white).toBe(ZOOM_WHITE);
    expect(zoom.black).toBe(ZOOM_BLACK);
    expect(zoom.hScroll, 'le Zoom doit défiler').toBe(true);
    expect(zoom.hintVisible, "l'aide au défilement est utile en Zoom").toBe(true);
    expect(zoom.doc).toBeLessThanOrEqual(zoom.innerH + 1);
    expect(zoom.fully).toBeGreaterThanOrEqual(MIN_VISIBLE_KEYS);
    // En vue complète le clavier tient : il n'y a pas de note au centre, on repart
    // du Do central (comportement du lot M), puis on le conserve.
    expect(Math.abs(zoom.do4Offset ?? 999)).toBeLessThanOrEqual(2);
    await expect(level).toHaveText(LEVEL_LABELS[1]);
    await expect(zoomOut).toBeEnabled();

    // Niveau 2 : Grand zoom 84/54 px, note centrale conservée.
    await zoomIn.click();
    await page.waitForTimeout(250);
    const grand = await keyboardMetrics(page);
    expect(grand.white).toBe(GRAND_WHITE);
    expect(grand.black).toBe(GRAND_BLACK);
    expect(grand.hScroll).toBe(true);
    expect(grand.doc).toBeLessThanOrEqual(grand.innerH + 1);
    expect(grand.fully).toBeGreaterThanOrEqual(MIN_VISIBLE_KEYS);
    expect(Math.abs(grand.do4Offset ?? 999)).toBeLessThanOrEqual(2);
    await expect(level).toHaveText(LEVEL_LABELS[2]);
    await expect(zoomIn).toBeDisabled();

    // Retour au niveau 0.
    await zoomOut.click();
    await zoomOut.click();
    await page.waitForTimeout(250);
    const back = await keyboardMetrics(page);
    expect(back.white).toBe(full.white);
    expect(back.doc).toBeLessThanOrEqual(back.innerH + 1);
    await expect(level).toHaveText(LEVEL_LABELS[0]);
    await ctx.close();
  });
}

// ---------------------------------------------------------------------------
// Geste tactile : appui vs relâchement, glissement, multi-touch, annulation
// ---------------------------------------------------------------------------

async function openPianoWithCounter(browser: import('@playwright/test').Browser, level = 0) {
  const context = await browser.newContext({
    viewport: { width: 1376, height: 1032 },
    hasTouch: true,
    isMobile: true,
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  await page.addInitScript(() => {
    const proto = window.AudioContext.prototype;
    const original = proto.createOscillator;
    (window as unknown as { __osc: number }).__osc = 0;
    proto.createOscillator = function patched(this: AudioContext) {
      (window as unknown as { __osc: number }).__osc += 1;
      return original.call(this);
    };
  });
  await page.goto(URL, { waitUntil: 'load' });
  await page.waitForTimeout(400);
  for (let i = 0; i < level; i += 1) {
    await page.locator('#piano-zoom-in').click();
    await page.waitForTimeout(250);
  }
  return page;
}

const oscCount = (page: import('@playwright/test').Page) =>
  page.evaluate(() => (window as unknown as { __osc: number }).__osc);
const noteText = (page: import('@playwright/test').Page) => page.locator('#piano-note-display').innerText();

/** Point de contact au centre-bas de la touche `index` du sélecteur. */
async function touchPoint(page: import('@playwright/test').Page, selector: string, index: number) {
  const box = await page.locator(selector).nth(index).boundingBox();
  if (!box) throw new Error('touche introuvable');
  return { x: box.x + box.width / 2, y: box.y + box.height - 20 };
}

async function dispatchPointer(
  page: import('@playwright/test').Page,
  type: 'pointerdown' | 'pointerup' | 'pointercancel',
  pt: { x: number; y: number },
  pointerId = 11,
  moveX = 0,
) {
  await page.evaluate(
    ({ type, pt, pointerId, moveX }) => {
      const target = document.elementFromPoint(pt.x, pt.y)!;
      target.dispatchEvent(
        new PointerEvent(type, {
          pointerType: 'touch',
          pointerId,
          clientX: pt.x + (type === 'pointerup' ? moveX : 0),
          clientY: pt.y,
          bubbles: true,
          isPrimary: true,
        }),
      );
    },
    { type, pt, pointerId, moveX },
  );
}

test("vue complète (aucun défilement) : la note part à l'appui, avant le relâchement", async ({ browser }) => {
  const page = await openPianoWithCounter(browser, 0);
  const pt = await touchPoint(page, '.white-key.c-key', 3);
  await dispatchPointer(page, 'pointerdown', pt);
  await page.waitForTimeout(80);
  // 80 ms avant le relâchement : le son est déjà parti.
  expect(await oscCount(page)).toBe(1);
  await expect.poll(() => noteText(page)).toBe('Note : Do4');
  await dispatchPointer(page, 'pointerup', pt);
  await page.waitForTimeout(150);
  expect(await oscCount(page)).toBe(1);   // pas de seconde note au relâchement
  await page.context().close();
});

test("Zoom (défilement actif) : la note part au relâchement, pas à l'appui", async ({ browser }) => {
  const page = await openPianoWithCounter(browser, 1);
  const pt = await touchPoint(page, '.white-key.c-key', 3);
  await dispatchPointer(page, 'pointerdown', pt);
  await page.waitForTimeout(80);
  expect(await oscCount(page)).toBe(0);
  await dispatchPointer(page, 'pointerup', pt);
  await page.waitForTimeout(150);
  expect(await oscCount(page)).toBe(1);
  await page.context().close();
});

test("un glissement de 30 px ne joue aucune note et ne laisse rien d'actif (Zoom et Grand zoom)", async ({ browser }) => {
  for (const level of [1, 2]) {
    const page = await openPianoWithCounter(browser, level);
    const pt = await touchPoint(page, '.white-key.c-key', 3);
    await dispatchPointer(page, 'pointerdown', pt);
    await dispatchPointer(page, 'pointerup', pt, 11, 30);
    await page.waitForTimeout(400);
    expect(await oscCount(page), `niveau ${level}`).toBe(0);
    expect(await noteText(page)).toBe('Clique sur une touche 🎹');
    expect(await page.locator('.white-key.active, .black-key.active').count()).toBe(0);
    await page.context().close();
  }
});

test('pointercancel annule la note en attente (Zoom)', async ({ browser }) => {
  const page = await openPianoWithCounter(browser, 1);
  const pt = await touchPoint(page, '.white-key.c-key', 3);
  await dispatchPointer(page, 'pointerdown', pt);
  await dispatchPointer(page, 'pointercancel', pt);
  await dispatchPointer(page, 'pointerup', pt);
  await page.waitForTimeout(300);
  expect(await oscCount(page)).toBe(0);
  expect(await page.locator('.white-key.active, .black-key.active').count()).toBe(0);
  await page.context().close();
});

test('deux doigts simultanés jouent deux notes (vue complète)', async ({ browser }) => {
  const page = await openPianoWithCounter(browser, 0);
  const points = await page.evaluate(() => {
    const keys = [...document.querySelectorAll('.white-key')];
    const a = keys[20].getBoundingClientRect();
    const b = keys[30].getBoundingClientRect();
    return [
      { x: a.left + a.width / 2, y: a.top + a.height - 20 },
      { x: b.left + b.width / 2, y: b.top + b.height - 20 },
    ];
  });
  for (let i = 0; i < points.length; i += 1) {
    await dispatchPointer(page, 'pointerdown', points[i], 20 + i);
  }
  await page.waitForTimeout(200);
  expect(await oscCount(page)).toBe(2);
  await page.waitForTimeout(350);
  expect(await page.locator('.white-key.active, .black-key.active').count()).toBe(0);
  await page.context().close();
});

// ---------------------------------------------------------------------------
// Lecture en jeu, préférence mémorisée, accessibilité
// ---------------------------------------------------------------------------

test.describe('Lecture et préférence', () => {
  test.use({ viewport: { width: 1376, height: 1032 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });

  test('Do4, La0 (après défilement) et une noire sont jouables aux trois niveaux', async ({ page }) => {
    await page.goto(URL, { waitUntil: 'load' });
    const display = page.locator('#piano-note-display');

    for (const level of [0, 1, 2]) {
      if (level > 0) {
        await page.locator('#piano-zoom-in').click();
        await page.waitForTimeout(250);
      }
      await expect(page.locator('#piano-zoom-level')).toHaveText(LEVEL_LABELS[level]);
      // Do4
      await page.locator('.white-key.c-key').nth(3).click();
      await expect(display).toHaveText('Note : Do4');
      // La0 : on ramène le clavier au début
      await page.locator('.piano-wrapper').evaluate((el) => { el.scrollLeft = 0; });
      await page.locator('.white-key').first().click();
      await expect(display).toHaveText('Note : La0');
      // Touche noire alignée sur la frontière Do4 / Ré4
      const blackIndex = await page.evaluate(() => {
        const whites = [...document.querySelectorAll('.white-key')];
        const blacks = [...document.querySelectorAll('.black-key')];
        const do4 = whites.find((k) => k.textContent === 'Do4')!;
        const boundary = do4.getBoundingClientRect().right;
        return blacks.findIndex((b) => {
          const r = b.getBoundingClientRect();
          return Math.abs(r.left + r.width / 2 - boundary) < 1.5;
        });
      });
      expect(blackIndex).toBeGreaterThanOrEqual(0);
      await page.locator('.black-key').nth(blackIndex).click();
      await expect(display).toHaveText('Note : Do#4');
    }
  });

  test('la préférence est mémorisée et les anciennes valeurs du lot M sont migrées', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));

    const readLevel = () => page.locator('#piano-zoom-level').innerText();

    // Ancienne valeur « full » (lot M) = niveau 0.
    await page.addInitScript(() => {
      if (window.localStorage.getItem('education-musicale:piano-interactif-view') === null) {
        window.localStorage.setItem('education-musicale:piano-interactif-view', 'full');
      }
    });
    await page.goto(URL, { waitUntil: 'load' });
    await expect(page.locator('#piano-zoom-level')).toHaveText(LEVEL_LABELS[0]);
    expect((await keyboardMetrics(page)).white).toBeLessThan(ZOOM_WHITE);

    // Ancienne valeur « zoom » (lot M) = niveau 1.
    await page.evaluate(() => window.localStorage.setItem('education-musicale:piano-interactif-view', 'zoom'));
    await page.reload({ waitUntil: 'load' });
    await expect(page.locator('#piano-zoom-level')).toHaveText(LEVEL_LABELS[1]);
    expect((await keyboardMetrics(page)).white).toBe(ZOOM_WHITE);

    // Nouvelle valeur « grand » = niveau 2.
    await page.evaluate(() => window.localStorage.setItem('education-musicale:piano-interactif-view', 'grand'));
    await page.reload({ waitUntil: 'load' });
    await expect(page.locator('#piano-zoom-level')).toHaveText(LEVEL_LABELS[2]);
    expect((await keyboardMetrics(page)).white).toBe(GRAND_WHITE);

    // Valeur invalide : vue complète, sans erreur, valeur laissée intacte.
    await page.evaluate(() => window.localStorage.setItem('education-musicale:piano-interactif-view', 'n-importe-quoi'));
    await page.reload({ waitUntil: 'load' });
    await expect(page.locator('#piano-zoom-level')).toHaveText(LEVEL_LABELS[0]);
    expect((await keyboardMetrics(page)).white).toBeLessThan(ZOOM_WHITE);
    expect(await page.evaluate(() => window.localStorage.getItem('education-musicale:piano-interactif-view'))).toBe('n-importe-quoi');

    // Les boutons mémorisent le niveau atteint.
    await page.locator('#piano-zoom-in').click();
    await page.waitForTimeout(200);
    expect(await page.evaluate(() => window.localStorage.getItem('education-musicale:piano-interactif-view'))).toBe('zoom');
    await page.locator('#piano-zoom-in').click();
    await page.waitForTimeout(200);
    expect(await page.evaluate(() => window.localStorage.getItem('education-musicale:piano-interactif-view'))).toBe('grand');
    await page.locator('#piano-zoom-out').click();
    await page.waitForTimeout(200);
    expect(await page.evaluate(() => window.localStorage.getItem('education-musicale:piano-interactif-view'))).toBe('zoom');
    expect(await readLevel()).toBe(LEVEL_LABELS[1]);
    expect(errors).toEqual([]);
  });
});

test.describe('Accessibilité du réglage de zoom', () => {
  test.use({ viewport: { width: 1376, height: 1032 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });

  test('axe sans violation aux trois niveaux', async ({ page }) => {
    const AxeBuilder = (await import('@axe-core/playwright')).default;
    await page.goto(URL, { waitUntil: 'load' });
    for (let level = 0; level < 3; level += 1) {
      if (level > 0) {
        await page.locator('#piano-zoom-in').click();
        await page.waitForTimeout(300);
      }
      const scan = await new AxeBuilder({ page }).include('#tool-piano').analyze();
      expect(scan.violations.map((v) => `${v.id} (${v.nodes.length})`), `niveau ${level}`).toEqual([]);
    }
  });

  test('les boutons se rejoignent au Tab et s\'activent à Entrée et à Espace', async ({ page }) => {
    await page.goto(URL, { waitUntil: 'load' });
    await page.locator('body').click({ position: { x: 4, y: 4 } });
    // « − » est désactivé en vue complète : le premier bouton atteint est « + ».
    let reached = false;
    for (let i = 0; i < 8 && !reached; i += 1) {
      await page.keyboard.press('Tab');
      reached = await page.evaluate(() => document.activeElement?.id === 'piano-zoom-in');
    }
    expect(reached, 'le bouton « + » doit être atteignable au Tab').toBe(true);

    await page.keyboard.press('Enter');
    await expect(page.locator('#piano-zoom-level')).toHaveText(LEVEL_LABELS[1]);
    expect((await keyboardMetrics(page)).white).toBe(ZOOM_WHITE);

    // Le bouton « − » devient actif : on l'atteint au Tab et on revient avec Espace.
    reached = false;
    for (let i = 0; i < 8 && !reached; i += 1) {
      await page.keyboard.press('Tab');
      reached = await page.evaluate(() => document.activeElement?.id === 'piano-zoom-out');
    }
    expect(reached, 'le bouton « − » doit être atteignable au Tab').toBe(true);
    await page.keyboard.press(' ');
    await expect(page.locator('#piano-zoom-level')).toHaveText(LEVEL_LABELS[0]);
    expect((await keyboardMetrics(page)).white).toBeLessThan(ZOOM_WHITE);
  });
});

test.describe('Marges de hauteur, polices macOS et polices plus hautes', () => {
  const FONT_PROXY = '#tool-piano, #tool-piano * { font-family: Verdana, sans-serif !important; }';

  for (const [label, withProxy] of [
    ['polices macOS', false],
    ['polices plus hautes (proxy CI)', true],
  ] as const) {
    for (const c of LARGE_CASES) {
      test(`marge >= 0 aux trois niveaux — ${label} — ${c.width}×${c.height}`, async ({ browser }) => {
        const ctx = await browser.newContext({
          viewport: { width: c.width, height: c.height },
          ...(c.mobile ? { hasTouch: true, isMobile: true, deviceScaleFactor: 2 } : {}),
        });
        if (withProxy) {
          // La police est injectée dans le <head> de la réponse : elle est en place
          // avant le premier calcul de l'outil, comme sur une CI aux polices plus hautes.
          await ctx.route('**/education-musicale/**', async (route) => {
            const response = await route.fetch();
            const type = response.headers()['content-type'] ?? '';
            if (!type.includes('text/html')) return route.fulfill({ response });
            const body = (await response.text()).replace('</head>', `<style>${FONT_PROXY}</style></head>`);
            return route.fulfill({
              response,
              body,
              headers: { ...response.headers(), 'content-type': 'text/html; charset=utf-8' },
            });
          });
        }
        const page = await ctx.newPage();
        await page.goto(URL, { waitUntil: 'load' });
        for (let level = 0; level < 3; level += 1) {
          if (level > 0) {
            await page.locator('#piano-zoom-in').click();
            await page.waitForTimeout(250);
          }
          const m = await keyboardMetrics(page);
          expect(m.doc, `niveau ${level} : ${m.doc} px > ${m.innerH} px`).toBeLessThanOrEqual(m.innerH + 1);
          expect(m.fully, `niveau ${level} : touches visibles`).toBeGreaterThanOrEqual(MIN_VISIBLE_KEYS);
        }
        await ctx.close();
      });
    }
  }
});

