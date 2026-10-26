import { test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readdirSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, relative } from 'node:path';

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

test('règle color-contrast sur toutes les pages', async ({ browser }) => {
  test.setTimeout(300000);
  const results: unknown[] = [];
  const context = await browser.newContext();
  const page = await context.newPage();
  for (const p of pages) {
    await page.goto(BASE + p, { waitUntil: 'load', timeout: 30000 }).catch(() => {});
    try {
      const res = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze();
      for (const v of res.violations) {
        for (const n of v.nodes) {
          const d = (n as any).any?.[0]?.data ?? (n as any).data ?? {};
          results.push({
            page: p,
            target: (n.target ?? []).join(' '),
            fg: d.fgColor ?? null,
            bg: d.bgColor ?? null,
            ratio: d.contrastRatio ?? null,
            expected: d.expectedContrastRatio ?? null,
            fontSize: d.fontSize ?? null,
            fontWeight: d.fontWeight ?? null,
          });
        }
      }
    } catch {
      results.push({ page: p, target: 'ERREUR_AXE', fg: null, bg: null, ratio: null, expected: null, fontSize: null, fontWeight: null });
    }
  }
  mkdirSync('lh', { recursive: true });
  writeFileSync('lh/contrast.json', JSON.stringify(results, null, 2));
  await context.close();
  console.log(`CONTRAST_DONE nodes=${results.length}`);
});
