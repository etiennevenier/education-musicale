import { test, expect, type Page } from '@playwright/test';

const BASE = '/education-musicale';

/**
 * Joue un quiz à choix jusqu'à l'écran de fin, sans connaître la bonne réponse :
 * on clique la première option, puis on avance (auto après une bonne réponse,
 * bouton « suivant » après une mauvaise).
 */
async function playChoicesToEnd(
  page: Page,
  root: string,
  optionSelector = '.btn-option',
): Promise<void> {
  const card = page.locator(root);
  for (let i = 0; i < 60; i++) {
    const result = card.locator('.result-container');
    if (await result.isVisible()) {
      if ((await result.textContent())?.includes('Partie terminée !')) return;
    }
    const options = card.locator(optionSelector);
    if ((await options.count()) === 0) break;
    await options.first().click();
    await page.waitForTimeout(1600); // délai d'auto-next (bonne réponse)
    const next = card.locator('.btn-next');
    if ((await next.isVisible()) && (await next.isEnabled())) {
      await next.click();
    }
  }
  await expect(card.locator('.result-container')).toContainText('Partie terminée !');
}

test("HymneQuiz : jouable jusqu'à l'écran de fin", async ({ page }) => {
  await page.goto(BASE + '/6eme/musique-et-hymnes/');
  await playChoicesToEnd(page, '.hymne-quiz-card');
});

test("PubQuiz : jouable jusqu'à l'écran de fin", async ({ page }) => {
  await page.goto(BASE + '/3eme/musique-et-pub/');
  await page.locator('#main-tab-quiz').click(); // onglet « Blindtest » du cours
  await expect(page.locator('#pub-panel-quiz')).toBeVisible();
  await playChoicesToEnd(page, '.pub-quiz-card', '[data-quiz-choices] .btn-option');
});

// Vérifie que chaque quiz est rendu (carte présente) sur sa page.
const quizPages = [
  '/6eme/musique-et-nuances/',
  '/6eme/musique-et-timbre/',
  '/6eme/musique-et-plans-sonores/',
  '/5eme/musique-et-repetition/',
  '/5eme/musique-et-jazz/',
  '/4eme/musique-et-opera/',
];

for (const path of quizPages) {
  test(`quiz rendu sur ${path}`, async ({ page }) => {
    await page.goto(BASE + path);
    expect(await page.locator('.quiz-card').count()).toBeGreaterThan(0);
  });
}