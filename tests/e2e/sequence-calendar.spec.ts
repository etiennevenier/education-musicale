import { test, expect } from '@playwright/test';

const BASE = '/education-musicale';

// Le navigateur recalcule la séquence du jour : on fixe l'horloge de la page
// pour vérifier chaque bascule, quel que soit le jour de la publication.
const cases: [string, string, string][] = [
  ['2026-10-16T18:00:00+02:00', 'Séquence 1', '/6eme/musique-et-tempo/'],
  ['2026-10-17T08:00:00+02:00', 'Séquence 2', '/6eme/musique-et-nuances/'],
  ['2027-02-12T18:00:00+01:00', 'Séquence 3', '/6eme/musique-et-timbre/'],
  ['2027-02-13T08:00:00+01:00', 'Séquence 4', '/6eme/musique-et-plans-sonores/'],
  ['2027-04-10T08:00:00+02:00', 'Séquence 5', '/6eme/musique-et-hymnes/'],
  ['2027-09-01T08:00:00+02:00', 'Séquence 1', '/6eme/musique-et-tempo/'],
];

for (const [when, label, path] of cases) {
  test(`6ème le ${when} : ${label}`, async ({ page }) => {
    await page.clock.setFixedTime(new Date(when));
    await page.goto(`${BASE}/6eme/`);
    const card = page.locator('#current-seq');
    await expect(card.locator('.seq-num')).toHaveText(label);
    await expect(card).toHaveAttribute('href', `${BASE}${path.replace(/\/$/, '')}`);
  });
}
