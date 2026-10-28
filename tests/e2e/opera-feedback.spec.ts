import { test, expect } from '@playwright/test';

const URL = '/education-musicale/4eme/musique-et-opera/';

/**
 * Barre de feedback vide : les questions de blindtest qui n'ont pas
 * d'explication ne doivent pas laisser une barre colorée vide à l'écran.
 * Le cas est rare (2 questions sur 45), d'où les rechargements successifs.
 */
type Observation = {
  partie: number;
  question: number;
  kind: string;
  texte: string;
  hauteur: number;
  display: string;
  classe: string;
};

test('un feedback de blindtest sans texte ne prend pas de place', async ({ page }) => {
  test.setTimeout(180_000);
  const observations: Observation[] = [];
  const vides: Observation[] = [];

  for (let partie = 1; partie <= 15; partie += 1) {
    await page.goto(URL, { waitUntil: 'load' });
    await page.click('#main-tab-quiz');
    await expect(page.locator('#qoOptions .btn-option').first()).toBeVisible();

    for (let question = 1; question <= 10; question += 1) {
      const label = await page.locator('#qoProgressLabel').textContent();
      await page.locator('#qoOptions .btn-option').first().click();

      const validate = page.locator('#qoBtnValidate');
      if (await validate.isVisible().catch(() => false)) {
        if (await validate.isEnabled().catch(() => false)) await validate.click();
      }

      const seen = await page.evaluate(() => {
        const box = document.querySelector<HTMLElement>('#qoFeedback');
        if (!box) return null;
        const cs = getComputedStyle(box);
        return {
          kind: document.querySelector('#qoKind')?.textContent ?? '',
          texte: (box.textContent ?? '').trim(),
          hauteur: Math.round(box.getBoundingClientRect().height * 100) / 100,
          display: cs.display,
          classe: box.className,
        };
      });

      if (seen && seen.kind.includes('Blindtest')) {
        const observation = { partie, question, ...seen };
        observations.push(observation);
        if (seen.texte === '') vides.push(observation);
      }

      const next = page.locator('#qoBtnNext');
      const canNext = await next.isEnabled().catch(() => false);
      if (canNext) {
        await next.click({ timeout: 2000 }).catch(() => {});
        await page
          .waitForFunction(
            (before) => document.querySelector('#qoProgressLabel')?.textContent !== before,
            label,
            { timeout: 3000 },
          )
          .catch(() => {});
      } else {
        await page.waitForTimeout(600);
      }
    }
  }

  console.log(`blindtests observes : ${observations.length}`);
  console.log(`dont sans texte      : ${vides.length}`);
  for (const v of vides) {
    console.log(
      `  partie ${v.partie} question ${v.question} : hauteur=${v.hauteur}px display=${v.display} classe="${v.classe}"`,
    );
  }

  // Pas de faux vert : si le cas n'a jamais été rencontré, le test échoue.
  expect(vides.length, 'aucun blindtest sans texte rencontré en 15 parties').toBeGreaterThan(0);
  for (const vide of vides) {
    expect(vide.hauteur, `barre de feedback vide encore rendue : ${JSON.stringify(vide)}`).toBe(0);
    expect(vide.display).toBe('none');
  }
});
