import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readdirSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { settleAnimations } from './axeSettle';

const DIST = join(process.cwd(), 'dist');
const BASE = '/education-musicale';

function collectPages(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry.startsWith('_') || entry === 'node_modules') continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) collectPages(full, out);
    else if (entry === 'index.html') {
      const rel = relative(DIST, dir).replace(/\\/g, '/');
      out.push(rel === '' ? '/' : `/${rel}/`);
    }
  }
  return out;
}

const pages = collectPages(DIST);
const results: Array<Record<string, unknown>> = [];

async function scan(page: Page, pagePath: string, state: string): Promise<void> {
  try {
    await settleAnimations(page);
    const res = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze();
    for (const v of res.violations) {
      for (const n of v.nodes) {
        const d = (n as any).any?.[0]?.data ?? (n as any).data ?? {};
        results.push({
          page: pagePath,
          state,
          target: (n.target ?? []).join(' '),
          fg: d.fgColor ?? null,
          bg: d.bgColor ?? null,
          ratio: d.contrastRatio ?? null,
          expected: d.expectedContrastRatio ?? null,
        });
      }
    }
  } catch (error) {
    results.push({ page: pagePath, state, target: 'ERREUR_AXE', error: String(error) });
  }
}

/** Joue le premier quiz à choix jusqu'à l'écran de fin (même logique que quiz.spec). */
async function playToResult(page: Page): Promise<boolean> {
  const root = page.locator('.quiz-card').first();
  if ((await root.count()) === 0) return false;
  for (let i = 0; i < 40; i++) {
    const result = root.locator('.result-container');
    if (await result.isVisible().catch(() => false)) {
      if ((await result.textContent())?.includes('Partie terminée !')) return true;
    }
    const options = root.locator('.btn-option');
    if ((await options.count()) === 0) return false;
    await options.first().click({ timeout: 2000 }).catch(() => {});
    await page.waitForTimeout(1600); // délai d'auto-next (bonne réponse)
    const next = root.locator('.btn-next');
    if ((await next.isVisible().catch(() => false)) && (await next.isEnabled().catch(() => false))) {
      await next.click().catch(() => {});
    }
  }
  return (await root.locator('.result-container').textContent().catch(() => ''))?.includes(
    'Partie terminée !',
  ) ?? false;
}

test('color-contrast après interaction (quiz, résultat, hover/focus)', async ({ browser }) => {
  test.setTimeout(1500000);
  const context = await browser.newContext();
  const page = await context.newPage();

  for (const p of pages) {
    await page.goto(BASE + p, { waitUntil: 'load', timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(150);
    await scan(page, p, 'initial');

    // Onglet « quiz » / « blindtest » : affiche le quiz s'il est dans un panneau.
    const quizTab = page.locator('[role="tab"][id*="quiz"], [role="tab"][id*="blindtest"]');
    if ((await quizTab.count()) > 0) {
      await quizTab.first().click({ timeout: 2000 }).catch(() => {});
      await page.waitForTimeout(250);
    }

    if ((await page.locator('.quiz-card').count()) > 0) {
      await scan(page, p, 'quiz-affiche');
      const reached = await playToResult(page);
      if (reached) await scan(page, p, 'resultat-final');
      // Repart d'une page propre pour les états hover/focus.
      await page.goto(BASE + p, { waitUntil: 'load', timeout: 30000 }).catch(() => {});
      await page.waitForTimeout(150);
    }

    // États hover/focus des boutons principaux.
    for (const selector of ['.btn-primary', '.btn-action', '.btn-play', '[data-play]', '.dual-all']) {
      const button = page.locator(selector).first();
      if ((await button.count()) === 0) continue;
      if (!(await button.isVisible().catch(() => false))) continue;
      await button.scrollIntoViewIfNeeded().catch(() => {});
      await button.hover({ timeout: 2000 }).catch(() => {});
      await button.focus().catch(() => {});
      await scan(page, p, `hover-focus:${selector}`);
    }
  }

  mkdirSync('lh', { recursive: true });
  writeFileSync('lh/contrast-interaction.json', JSON.stringify(results, null, 2));
  const nodes = results.filter((r) => r.target !== 'ERREUR_AXE');
  const pagesTouched = new Set(nodes.map((r) => r.page));
  console.log(
    `CONTRAST_INTERACTION nodes=${nodes.length} pages=${pagesTouched.size} erreurs=${results.length - nodes.length}`,
  );
  await context.close();
  expect(results, 'violations color-contrast après interaction (toutes les pages)').toEqual([]);
});
