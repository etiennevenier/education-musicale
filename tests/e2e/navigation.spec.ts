import { test, expect } from '@playwright/test';

const BASE = '/education-musicale';

test('navigation entre 3 pages sans erreur console', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));

  for (const path of [
    '/6eme/musique-et-nuances/',
    '/4eme/musique-et-cinema/',
    '/3eme/musique-et-risques-auditifs/',
  ]) {
    await page.goto(BASE + path, { waitUntil: 'load' });
    await page.waitForTimeout(400);
  }

  expect(errors).toEqual([]);
});
