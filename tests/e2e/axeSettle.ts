import type { Page } from '@playwright/test';

/**
 * Avance les animations et transitions finies à leur état final avant un scan axe.
 *
 * Sans cela, un panneau encore en fondu (`opacity` < 1) fait calculer à axe une
 * couleur de texte mélangée au fond : faux positif de contraste (ex. `.hymn-note`
 * sur /5eme/musique-et-moyen-age/). Les animations infinies sont ignorées.
 */
export async function settleAnimations(page: Page): Promise<void> {
  await page.evaluate(() => {
    for (const animation of document.getAnimations()) {
      try {
        animation.finish();
      } catch {
        // Animation infinie (spinner, pulsation…) : impossible à terminer.
      }
    }
  });
}
