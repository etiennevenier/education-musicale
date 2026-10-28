#!/usr/bin/env node
/**
 * Mise à jour automatique des dates de secours (src/data/calendrierScolaire.ts).
 *
 *   node scripts/update-calendar.mjs
 *
 * Lit le calendrier officiel (zone A, académie de Lyon) et ajoute au fichier
 * les années que le ministère vient de publier. Lancé chaque mois par
 * .github/workflows/calendar.yml : le site n'a donc jamais besoin de dates
 * approximatives, même s'il n'est plus modifié pendant des années.
 *
 * Ne touche à rien si le service ne répond pas ou si rien n'a changé.
 * Sortie : « changed=true|false » (lu par le workflow).
 */
import { readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { FALLBACK_CALENDARS } from '../src/data/calendrierScolaire.ts';
import { readOfficialCalendars } from '../src/utils/officialCalendar.ts';
import { parisToday } from '../src/utils/sequenceCalendar.ts';

const FILE = 'src/data/calendrierScolaire.ts';

// On garde l'année scolaire en cours et les suivantes (les années passées ne servent plus).
const today = parisToday();
const currentYear = Number(today.slice(0, 4)) - (today.slice(5, 7) < '09' ? 1 : 0);
const keep = (calendars) =>
  Object.fromEntries(
    Object.entries(calendars)
      .filter(([year]) => Number(year) >= currentYear)
      .sort(([a], [b]) => Number(a) - Number(b)),
  );

const official = await readOfficialCalendars();
const before = keep(FALLBACK_CALENDARS);
const after = keep({ ...FALLBACK_CALENDARS, ...official });
const changed = Object.keys(official).length > 0 && JSON.stringify(before) !== JSON.stringify(after);

if (changed) {
  const lines = Object.entries(after)
    .map(([year, starts]) => `  ${year}: [${starts.map((d) => `'${d}'`).join(', ')}],`)
    .join('\n');
  const text = readFileSync(FILE, 'utf8');
  const updated = text.replace(
    /export const FALLBACK_CALENDARS: SchoolCalendars = \{[\s\S]*?\n\};/,
    `export const FALLBACK_CALENDARS: SchoolCalendars = {\n${lines}\n};`,
  );
  if (updated === text) {
    console.error(`✗ Bloc FALLBACK_CALENDARS introuvable dans ${FILE} : rien n'est modifié.`);
    process.exit(1);
  }
  writeFileSync(FILE, updated);
  console.log(`✅ ${FILE} mis à jour : ${Object.keys(after).map((y) => `${y}-${Number(y) + 1}`).join(', ')}`);
} else {
  console.log('Calendrier déjà à jour (ou service indisponible) : rien à faire.');
}
if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `changed=${changed}\n`);
