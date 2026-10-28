import { test, expect } from '@playwright/test';

const BASE = '/education-musicale';

/**
 * Garde-fou CLS sur les pages à quiz.
 *
 * Le 1er écran des quiz est injecté par le module JS dans des conteneurs vides :
 * sans réserve d'espace (`.quiz-card :empty` dans `src/styles/quiz-card.css`),
 * la carte grandit de ~270 px après le téléchargement du JS et pousse le reste
 * de la page hors du viewport (0,048 mesuré sur les hymnes avant correctif).
 *
 * Mesure identique à Lighthouse : entrées `layout-shift` sans interaction
 * récente, sous Slow 4G + CPU ×4 (CDP). `Math.random` est seedé : le tirage
 * des questions (et donc la hauteur du 1er écran) reste le même d'une exécution
 * à l'autre, sinon la mesure n'est pas reproductible.
 */
const LIMITE_CLS = 0.02;

const PAGES: [string, string][] = [
  ['hymnes', '/6eme/musique-et-hymnes/'],
  ['répétition (ostinato)', '/5eme/musique-et-repetition/'],
  ['timbre', '/6eme/musique-et-timbre/'],
  ['plans sonores', '/6eme/musique-et-plans-sonores/'],
];

interface Entree {
  valeur: number;
  temps: number;
  sources: string[];
}

test.describe('CLS au chargement des pages à quiz', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  for (const [nom, chemin] of PAGES) {
    test(`${nom} : CLS <= ${LIMITE_CLS}`, async ({ page, context }) => {
      test.setTimeout(60000);

      const cdp = await context.newCDPSession(page);
      await cdp.send('Network.enable');
      await cdp.send('Network.emulateNetworkConditions', {
        offline: false,
        latency: 150,
        downloadThroughput: Math.round((1.6 * 1024 * 1024) / 8),
        uploadThroughput: Math.round((750 * 1024) / 8),
        connectionType: 'cellular3g',
      });
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });

      await page.addInitScript(() => {
        // Tirage déterministe : même question à chaque exécution.
        let graine = 20261027;
        Math.random = () => {
          graine = (graine * 1664525 + 1013904223) % 4294967296;
          return graine / 4294967296;
        };

        const mesure = { valeur: 0, entrees: [] as Entree[] };
        new PerformanceObserver((liste) => {
          for (const entree of liste.getEntries() as unknown as {
            value: number;
            startTime: number;
            hadRecentInput: boolean;
            sources?: { node: Node | null }[];
          }[]) {
            if (entree.hadRecentInput) continue;
            mesure.valeur += entree.value;
            mesure.entrees.push({
              valeur: Math.round(entree.value * 10000) / 10000,
              temps: Math.round(entree.startTime),
              sources: (entree.sources ?? []).map((s) => {
                const el = s.node as HTMLElement | null;
                if (!el || el.nodeType !== 1) return '(texte)';
                const cls = (el.getAttribute('class') ?? '').trim().split(/\s+/).slice(0, 2).join('.');
                return `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${cls ? '.' + cls : ''}`;
              }),
            });
          }
        }).observe({ type: 'layout-shift', buffered: true });
        (window as unknown as { __cls: typeof mesure }).__cls = mesure;
      });

      await page.goto(BASE + chemin, { waitUntil: 'load' });
      // Attend le rendu du 1er écran (injecté par le module JS) puis laisse
      // passer les décalages qui suivent immédiatement l'hydratation.
      await page.waitForFunction(
        () => {
          const conteneur = document.querySelector('.quiz-card .question-container');
          return !!conteneur && conteneur.childElementCount > 0;
        },
        null,
        { timeout: 20000 },
      );
      await page.waitForTimeout(1500);

      const resultat = await page.evaluate(
        () => (window as unknown as { __cls: { valeur: number; entrees: Entree[] } }).__cls,
      );
      console.log(`${nom} : CLS = ${resultat.valeur.toFixed(4)}`);

      const detail = resultat.entrees
        .map((e) => `${e.valeur} à ${e.temps} ms [${e.sources.join(', ')}]`)
        .join(' | ');
      expect(
        resultat.valeur,
        `CLS = ${resultat.valeur.toFixed(4)} sur ${chemin}${detail ? ` — décalages : ${detail}` : ''}`,
      ).toBeLessThanOrEqual(LIMITE_CLS);
    });
  }
});
