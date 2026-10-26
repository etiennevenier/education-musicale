import { test, expect } from '@playwright/test';
import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const DIST = join(process.cwd(), 'dist');

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
const BASE = '/education-musicale';

test.describe('Smoke : pages sans erreur console', () => {
  for (const path of pages) {
    test(`${path}`, async ({ page }) => {
      const errors: string[] = [];
      page.on('console', (msg) => {
        // Bruit interne Chromium (Compute Pressure API), indépendant du site.
        if (msg.type() !== 'error' || msg.text().includes('compute-pressure')) return;
        // Vignette YouTube 404 (vidéo supprimée) : déjà ignorée côté réseau ci-dessous,
        // mais Chromium la remonte aussi en console avec un message sans URL.
        const failedUrl = msg.location().url;
        if (failedUrl.includes('i.ytimg.com') && msg.text().includes('Failed to load resource')) {
          return;
        }
        errors.push(msg.text());
      });
      page.on('pageerror', (err) => errors.push(String(err)));
      page.on('response', (res) => {
        // Les vignettes YouTube (i.ytimg.com) peuvent renvoyer 404 pour une vidéo
        // supprimée : géré par la façade, ce n'est pas une erreur du site.
        if (res.status() >= 400 && !res.url().includes('i.ytimg.com')) {
          errors.push(`HTTP ${res.status()} ${res.url()}`);
        }
      });

      await page.goto(BASE + path, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(800);

      expect(errors, `Erreurs console sur ${path}`).toEqual([]);
    });
  }
});