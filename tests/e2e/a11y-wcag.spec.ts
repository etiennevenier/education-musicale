import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readdirSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { settleAnimations } from './axeSettle';

// Toutes les règles WCAG 2.2 A/AA d'axe (noms de boutons, clavier, cibles tactiles,
// ARIA…), sur chaque page ET dans chaque onglet. Le contraste et l'ordre des titres
// ont déjà leurs propres tests (contrast.spec.ts) : ils sont exclus ici.
const DIST = join(process.cwd(), 'dist');
const BASE = '/education-musicale';
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const SKIP = ['color-contrast', 'heading-order', 'page-has-heading-one'];

function collectPages(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry.startsWith('_') || entry === 'node_modules') continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) collectPages(full, out);
    else if (entry === 'index.html') {
      const rel = relative(DIST, dir).replace(/\\/g, '/');
      out.push(rel === '' ? '/' : `/${rel}/`);
    }
  }
  return out;
}

const pages = collectPages(DIST);

test('règles WCAG A/AA (hors contraste) sur toutes les pages et tous les onglets', async ({ browser }) => {
  test.setTimeout(600000);
  const found = new Map<string, { page: string; where: string; rule: string; target: string }>();
  const context = await browser.newContext();
  const page = await context.newPage();

  const scan = async (path: string, where: string) => {
    await settleAnimations(page);
    const res = await new AxeBuilder({ page }).withTags(TAGS).disableRules(SKIP).analyze();
    for (const v of res.violations) {
      for (const n of v.nodes) {
        const target = (n.target ?? []).join(' ');
        found.set(`${path}|${v.id}|${target}`, { page: path, where, rule: v.id, target });
      }
    }
  };

  for (const p of pages) {
    await page.goto(BASE + p, { waitUntil: 'load', timeout: 30000 }).catch(() => {});
    await scan(p, 'initial');
    const tabs = page.locator('[role="tab"]');
    const count = await tabs.count();
    for (let i = 0; i < count; i++) {
      const tab = tabs.nth(i);
      if (!(await tab.isVisible())) continue;
      await tab.click();
      await scan(p, `onglet ${((await tab.textContent()) ?? '').trim().slice(0, 30)}`);
    }
  }

  const violations = [...found.values()];
  // Visible directement sur GitHub (résumé de la vérification), sans ouvrir les journaux.
  for (const v of violations.slice(0, 30)) {
    console.log(`::error title=Accessibilité (${v.rule})::${v.page} — ${v.where} — ${v.target}`);
  }
  mkdirSync('lh', { recursive: true });
  writeFileSync('lh/wcag.json', JSON.stringify(violations, null, 2));
  await context.close();
  expect(violations, 'violations WCAG A/AA (hors contraste)').toEqual([]);
});
