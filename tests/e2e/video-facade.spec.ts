import { test, expect } from '@playwright/test';

const BASE = '/education-musicale';

// Pages qui comportent au moins une vidéo (une façade par vidéo).
const videoPages = [
  '/3eme/musique-et-engagement/',
  '/3eme/musique-et-metissage/',
  '/3eme/musique-et-pub/',
  '/3eme/musique-et-rap/',
  '/3eme/musique-et-risques-auditifs/',
  '/4eme/musique-et-bruits/',
  '/4eme/musique-et-cinema/',
  '/4eme/musique-et-opera/',
  '/4eme/musique-et-rock/',
  '/5eme/musique-et-heros/',
  '/5eme/musique-et-jazz/',
  '/5eme/musique-et-moyen-age/',
  '/5eme/musique-et-repetition/',
  '/5eme/musique-et-voix/',
  '/6eme/musique-et-hymnes/',
  '/6eme/musique-et-nuances/',
  '/6eme/musique-et-plans-sonores/',
  '/6eme/musique-et-tempo/',
  '/6eme/musique-et-timbre/',
];

const TIERS = /youtube\.com|youtube-nocookie\.com|googlevideo\.com/;

test('aucune iframe ni requête YouTube avant clic', async ({ page }) => {
  const tiers: string[] = [];
  page.on('request', (r) => {
    if (TIERS.test(r.url())) tiers.push(r.url());
  });

  for (const p of videoPages) {
    await page.goto(BASE + p, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);
    expect(await page.locator('iframe').count(), `iframes présentes sur ${p}`).toBe(0);
    expect(await page.locator('[data-video-facade]').count(), `façade absente sur ${p}`).toBeGreaterThan(0);
  }

  expect(tiers, 'requêtes tiers avant clic').toEqual([]);
});

test('après un clic : exactement 1 iframe youtube-nocookie', async ({ page }) => {
  await page.goto(BASE + '/5eme/musique-et-voix/');
  await page.locator('[data-video-facade]').first().click();
  await expect(page.locator('iframe')).toHaveCount(1);
  const src = await page.locator('iframe').first().getAttribute('src');
  expect(src).toContain('https://www.youtube-nocookie.com/embed/');
  expect(src).toContain('autoplay=1');
  expect(src).toContain('rel=0');
});

test('navigation clavier : Entrée active la façade', async ({ page }) => {
  await page.goto(BASE + '/5eme/musique-et-voix/');
  const facade = page.locator('[data-video-facade]').first();
  await facade.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('iframe')).toHaveCount(1);
});

test('HymneVideoAnalyzer : façade puis iframe #hvPlayer fonctionnel', async ({ page }) => {
  await page.goto(BASE + '/6eme/musique-et-hymnes/');

  const facade = page.locator('#hvFacade');
  await expect(facade).toBeVisible();
  await expect(page.locator('#hvPlayer')).toHaveCount(0);

  // La vidéo courante est fixée au démarrage (vignette + identifiant).
  await expect(facade).toHaveAttribute('data-video-id', /[\w-]{11}/);
  await expect(page.locator('#hvThumb')).toHaveAttribute('src', /i\.ytimg\.com/);

  await facade.click();
  const player = page.locator('#hvPlayer');
  await expect(player).toHaveCount(1);
  const src = await player.getAttribute('src');
  expect(src).toContain('https://www.youtube-nocookie.com/embed/');

  // Le titre de la vidéo courante est affiché.
  await expect(page.locator('#hvVideoTitle')).not.toHaveText('');
});
