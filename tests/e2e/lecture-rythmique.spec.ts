import { test, expect } from '@playwright/test';

const URL = '/education-musicale/entrainement/lecture-rythmique/';

/**
 * Libellés de phase et panneau de score : le HTML produit par setPhase() et
 * showScore() doit rester identique (mêmes balises, même <small>, même ordre).
 * Les 10 valeurs attendues sont déterministes (tempo 80, 1 mesure d'introduction,
 * 2 mesures à reproduire) ; seul le pourcentage de précision dépend du jeu.
 */
const EXPECTED_PHASES = [
  "Prêt ?<small>Clique sur « Démarrer l'exercice ».</small>",
  "Prépare-toi…<small>La mesure d'introduction arrive.</small>",
  "Mesure d'introduction<small>Écoute le tempo : 1 sur 4</small>",
  "Mesure d'introduction<small>Écoute le tempo : 2 sur 4</small>",
  "Mesure d'introduction<small>Écoute le tempo : 3 sur 4</small>",
  "Mesure d'introduction<small>Écoute le tempo : 4 sur 4</small>",
  "À toi ! Mesure 1 sur 2<small>Barre d'espace ou bouton TAPER</small>",
  "À toi ! Mesure 2 sur 2<small>Barre d'espace ou bouton TAPER</small>",
  'Mesures terminées<small>Calcul du résultat…</small>',
  'Résultat<small>Réécoute la question ou ta réponse, ou clique sur « Recommencer ».</small>',
];

test.use({ viewport: { width: 1280, height: 900 } });

test('les libellés de phase et le panneau de score gardent le même balisage', async ({ page }) => {
  test.setTimeout(45000);

  await page.addInitScript(() => {
    (window as unknown as { __phases: string[] }).__phases = [];
    document.addEventListener('DOMContentLoaded', () => {
      const phase = document.querySelector('#rt-phase');
      if (!phase) return;
      const record = () => {
        const html = phase.innerHTML;
        const list = (window as unknown as { __phases: string[] }).__phases;
        if (list[list.length - 1] !== html) list.push(html);
      };
      record();
      new MutationObserver(record).observe(phase, { childList: true, subtree: true, characterData: true });
    });
  });

  await page.goto(URL, { waitUntil: 'load' });
  await page.click('#rt-btnStart');
  await page.waitForTimeout(1500);
  for (let i = 0; i < 14; i += 1) {
    await page.keyboard.press('Space');
    await page.waitForTimeout(700);
  }
  await expect(page.locator('#rt-result')).toBeVisible({ timeout: 15000 });

  const phases = await page.evaluate(() => (window as unknown as { __phases: string[] }).__phases);
  expect(phases).toEqual(EXPECTED_PHASES);

  // Chaque phase porte un vrai <small> (le CSS cible `.phase small`).
  await expect(page.locator('#rt-phase small')).toHaveCount(1);

  // Panneau de score : « <small>Précision</small>NN % » — valeur libre, balisage fixe.
  const scoreHtml = await page.locator('#rt-score').evaluate((el) => el.innerHTML);
  expect(scoreHtml).toMatch(/^<small>Précision<\/small>\d+ %$/);
  await expect(page.locator('#rt-score small')).toHaveCount(1);
  await expect(page.locator('#rt-verdict')).not.toBeEmpty();
  // Les puces de détail sont créées en DOM (span.chip) : au moins trois.
  expect(await page.locator('#rt-chips .chip').count()).toBeGreaterThanOrEqual(3);
});
