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
