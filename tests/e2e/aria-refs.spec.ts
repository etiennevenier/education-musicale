import { test, expect } from '@playwright/test';
import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const DIST = join(process.cwd(), 'dist');
const BASE = '/education-musicale';

/** Même collecte que smoke.spec.ts : toutes les pages de dist. */
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
const ATTRS = ['aria-labelledby', 'aria-controls', 'aria-describedby'] as const;

type Violation = { page: string; tag: string; attr: string; value: string; missing: string[] };

test('toutes les références ARIA pointent vers un id existant', async ({ page }) => {
  test.setTimeout(180_000);
  const violations: Violation[] = [];
  let references = 0;

  for (const path of pages) {
    await page.goto(BASE + path, { waitUntil: 'load' });
    await page.waitForTimeout(150);

    const found = await page.evaluate((attrs) => {
      const out: Violation[] = [];
      let count = 0;
      for (const attr of attrs) {
        for (const el of document.querySelectorAll(`[${attr}]`)) {
          const value = el.getAttribute(attr) ?? '';
          const ids = value.split(/\s+/).filter(Boolean);
          if (ids.length === 0) continue;
          count += 1;
          const missing = ids.filter((id) => document.getElementById(id) === null);
          if (missing.length > 0) {
            out.push({
              page: '',
              tag: el.tagName.toLowerCase(),
              attr,
              value,
              missing,
            });
          }
        }
      }
      return { out, count };
    }, ATTRS as unknown as string[]);

    references += found.count;
    for (const violation of found.out) violations.push({ ...violation, page: path });
  }

  console.log(`pages analysées : ${pages.length} | références ARIA vérifiées : ${references}`);
  console.log(`violations : ${violations.length}`);
  for (const v of violations) {
    console.log(`  ${v.page} -> <${v.tag} ${v.attr}="${v.value}"> id manquant : ${v.missing.join(', ')}`);
  }

  expect(violations, `${violations.length} référence(s) ARIA cassée(s)`).toEqual([]);
});
