import { test, expect } from '@playwright/test';

const BASE = '/education-musicale';
const URL = BASE + '/entrainement/lecture-notes/';

/**
 * Le menu garde ses 6 boutons distincts (index interne data-level 1 à 6), mais
 * l'en-tête du jeu doit afficher le numéro pédagogique : 1, 1, 2, 2, 3, 4.
 * Avant correctif, il affichait l'index (2, 3, 4, 5, 6), d'où des « Niveau 5 »
 * et « Niveau 6 » qui n'existent pas dans le menu.
 */
const CASES = [
  { index: 1, expected: '1', label: 'Niveau 1 · Clé de Sol' },
  { index: 2, expected: '1', label: 'Niveau 1 · Clé de Fa' },
  { index: 3, expected: '2', label: 'Niveau 2 · Clé de Sol' },
  { index: 4, expected: '2', label: 'Niveau 2 · Clé de Fa' },
  { index: 5, expected: '3', label: 'Niveau 3 · double portée' },
  { index: 6, expected: '4', label: 'Niveau 4 · double portée' },
] as const;

test.describe('Lecture de notes — titres de niveau', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  for (const c of CASES) {
    test(`data-level=${c.index} (${c.label}) affiche « Niveau ${c.expected} »`, async ({ page }) => {
      await page.goto(URL, { waitUntil: 'load' });
      await page.locator(`.level-btn[data-level="${c.index}"]`).click();

      const indicator = page.locator('#level-indicator');
      await expect(indicator).toHaveText(c.expected);
      // L'en-tête complet : « Niveau <numéro affiché> ».
      await expect(page.locator('.notes-hud')).toContainText(`Niveau ${c.expected}`);

      // Jamais 5 ni 6 : ce sont des index internes, pas des niveaux.
      expect(await page.locator('.notes-hud').innerText()).not.toMatch(/Niveau\s*[56]\b/);

      // L'info-bulle garde le libellé complet (avec la clé).
      const title = await indicator.getAttribute('title');
      expect(title).toMatch(new RegExp(`^Niveau ${c.expected} — `));

      // document.title n'est pas modifié par l'outil.
      expect(await page.title()).not.toMatch(/Niveau\s*[56]\b/);
    });
  }

  test("l'écran de fin ne mentionne aucun numéro de niveau", async ({ page }) => {
    await page.goto(URL, { waitUntil: 'load' });
    await page.locator('.level-btn[data-level="6"]').click();
    await expect(page.locator('#level-indicator')).toHaveText('4');

    const resultText = await page.locator('#score-section').evaluate((el) => el.textContent ?? '');
    expect(resultText).not.toMatch(/Niveau/);
  });

  test('les clés localStorage héritées ne changent ni le niveau ni le titre', async ({ page }) => {
    // Aucune clé n'est utilisée par l'outil (vérifié par grep dans src) : on
    // pré-remplit des clés plausibles d'une version antérieure pour prouver
    // qu'elles sont ignorées et que le menu démarre sur un état propre.
    await page.addInitScript(() => {
      for (const key of ['lecture-notes-level', 'notes-level', 'lectureNotes.level', 'challenge-best-score']) {
        window.localStorage.setItem(key, '6');
      }
    });
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));

    await page.goto(URL, { waitUntil: 'load' });
    await expect(page.locator('.level-btn')).toHaveCount(6);
    await expect(page.locator('#menu-section')).toBeVisible();

    await page.locator('.level-btn[data-level="5"]').click();
    await expect(page.locator('#level-indicator')).toHaveText('3');
    await expect(page.locator('.notes-hud')).toContainText('Niveau 3');
    expect(errors).toEqual([]);
  });
});

/**
 * Hauteur de la partition : le SVG est en `width:100% ; height:auto`, donc sa
 * hauteur découle de la largeur de la carte ; au-delà de 768 px de haut, aucune
 * règle CSS ne la contraint. Résultat avant correctif : 268 px de débordement à
 * 1440×900 (portée simple) et 136 à 334 px sur iPad paysage. La partition doit se
 * dimensionner sur la hauteur disponible, sans dépasser la fenêtre.
 */
const DESKTOP_VIEWPORTS = [
  { width: 1280, height: 720 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
  { width: 2560, height: 1300 },
] as const;

// iPad en paysage : M4 13" (avec/sans barres Safari), 12,9" M2 et 11".
const IPAD_LANDSCAPE = [
  { width: 1376, height: 1032 },
  { width: 1376, height: 880 },
  { width: 1366, height: 1024 },
  { width: 1366, height: 870 },
  { width: 1194, height: 834 },
  { width: 1194, height: 690 },
] as const;

/** Planchers de lisibilité appliqués par l'outil (px de hauteur de SVG). */
const MIN_STAFF_HEIGHT = { simple: 160, double: 190 } as const;

function measureLayout(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const box = (sel: string) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const b = el.getBoundingClientRect();
      return { bottom: Math.round(b.bottom * 10) / 10, width: b.width, height: b.height };
    };
    const svgEl = document.querySelector('#staff-svg');
    const vb = (svgEl?.getAttribute('viewBox') ?? '').trim().split(/\s+/).map(Number);
    return {
      docScroll: document.documentElement.scrollHeight,
      innerH: window.innerHeight,
      answers: box('.notes-answers'),
      hud: box('.notes-hud'),
      staff: box('.notes-staff'),
      svg: box('#staff-svg'),
      clamped: svgEl instanceof SVGElement && svgEl.style.maxHeight !== '',
      vbRatio: vb[2] / vb[3],
    };
  });
}

async function expectLevelFits(page: import('@playwright/test').Page, level: number) {
  await page.locator(`.level-btn[data-level="${level}"]`).click();
  // Portée réellement dessinée (une tête de note par question).
  await expect(page.locator('#staff-svg ellipse')).toHaveCount(1);

  const m = await measureLayout(page);

  // Le document ne dépasse pas la fenêtre (tolérance 1 px d'arrondi) et les
  // boutons de réponse restent au-dessus de la ligne de flottaison.
  expect(m.docScroll, `document ${m.docScroll} px > fenêtre ${m.innerH} px`).toBeLessThanOrEqual(m.innerH + 1);
  expect(m.answers!.bottom, `boutons ${m.answers!.bottom} px > fenêtre ${m.innerH} px`).toBeLessThanOrEqual(m.innerH);
  expect(m.hud!.bottom).toBeLessThanOrEqual(m.innerH);

  // Quand la hauteur a dû être réduite : ratio du viewBox conservé (aucune
  // déformation) et plancher de lisibilité du type de portée respecté.
  if (m.clamped) {
    const floor = level >= 5 ? MIN_STAFF_HEIGHT.double : MIN_STAFF_HEIGHT.simple;
    const ratio = m.svg!.width / m.svg!.height;
    expect(Math.abs(ratio - m.vbRatio) / m.vbRatio).toBeLessThan(0.02);
    expect(m.svg!.height).toBeGreaterThanOrEqual(floor);
    expect(m.staff!.height).toBeGreaterThanOrEqual(floor);
  }
}

for (const [label, viewports, mobile] of [
  ['bureau', DESKTOP_VIEWPORTS, false],
  ['iPad en paysage', IPAD_LANDSCAPE, true],
] as const) {
  test.describe(`Lecture de notes — portée contenue dans la fenêtre (${label})`, () => {
    if (mobile) {
      test.use({ hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
    }
    for (const vp of viewports) {
      for (const level of [1, 2, 3, 4, 5, 6] as const) {
        test(`data-level=${level} tient dans ${vp.width}×${vp.height}`, async ({ page }) => {
          await page.setViewportSize({ width: vp.width, height: vp.height });
          await page.goto(URL, { waitUntil: 'load' });
          await expectLevelFits(page, level);
        });
      }
    }
  });
}

