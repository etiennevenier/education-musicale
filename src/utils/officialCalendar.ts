/**
 * Lecture du calendrier scolaire officiel (zone A, académie de Lyon) à la
 * construction du site, depuis les données ouvertes du ministère.
 *
 * Sécurité : si le service ne répond pas ou renvoie des dates incohérentes,
 * on garde les dates de secours de src/data/calendrierScolaire.ts. La
 * publication ne peut donc jamais échouer à cause de ce service.
 */
// Extensions « .ts » explicites : ce fichier est aussi lu directement par Node
// (scripts/update-calendar.mjs, mise à jour mensuelle des dates de secours).
import { FALLBACK_CALENDARS } from '../data/calendrierScolaire.ts';
import { isPlausibleCalendar, type SchoolCalendars } from './sequenceCalendar.ts';

const API =
  'https://data.education.gouv.fr/api/explore/v2.1/catalog/datasets/fr-en-calendrier-scolaire/records';

interface ApiRecord {
  description?: string;
  population?: string;
  start_date?: string;
  location?: string;
  annee_scolaire?: string;
}

const KINDS: [number, RegExp][] = [
  [0, /toussaint/i],
  [1, /no[eë]l/i],
  [2, /hiver/i],
  [3, /printemps/i],
];

/** Date de début à l'heure de Paris ; un vendredi soir devient le samedi. */
function toParisSaturday(iso: string): string | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  let day = `${get('year')}-${get('month')}-${get('day')}`;
  const weekday = get('weekday');
  if (weekday === 'Fri') {
    const next = new Date(`${day}T12:00:00Z`);
    next.setUTCDate(next.getUTCDate() + 1);
    day = next.toISOString().slice(0, 10);
  } else if (weekday !== 'Sat') {
    return null;
  }
  return day;
}

/** Transforme les enregistrements du ministère en calendriers par année de rentrée. */
export function parseOfficialRecords(records: ApiRecord[]): SchoolCalendars {
  const byYear: Record<number, (string | undefined)[]> = {};
  for (const record of records) {
    if (!record.location || !/lyon/i.test(record.location)) continue;
    if (record.population && /enseignant/i.test(record.population)) continue;
    const year = Number(record.annee_scolaire?.slice(0, 4));
    const kind = KINDS.find(([, re]) => re.test(record.description ?? ''))?.[0];
    if (!year || kind === undefined || !record.start_date) continue;
    const day = toParisSaturday(record.start_date);
    if (!day) continue;
    const slot = (byYear[year] ??= []);
    if (!slot[kind] || day < slot[kind]!) slot[kind] = day;
  }
  const calendars: SchoolCalendars = {};
  for (const [yearText, starts] of Object.entries(byYear)) {
    const year = Number(yearText);
    const clean = starts.filter((d): d is string => !!d);
    if (clean.length === 4 && isPlausibleCalendar(year, starts as string[])) {
      calendars[year] = starts as [string, string, string, string];
    }
  }
  return calendars;
}

async function fetchOfficial(): Promise<SchoolCalendars> {
  const url = new URL(API);
  url.searchParams.set('where', 'location="Lyon"');
  url.searchParams.set('limit', '100');
  url.searchParams.set('order_by', 'start_date desc');
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = (await res.json()) as { results?: ApiRecord[] };
  return parseOfficialRecords(json.results ?? []);
}

/**
 * Dates officielles vérifiées : plausibles et, pour une année déjà connue,
 * à 7 jours au plus des dates de secours (sinon jugées suspectes et ignorées).
 * Objet vide si le service du ministère ne répond pas.
 */
export async function readOfficialCalendars(): Promise<SchoolCalendars> {
  let official: SchoolCalendars = {};
  try {
    official = await fetchOfficial();
  } catch (error) {
    console.warn(`[calendrier] service du ministère indisponible (${String(error)}) : dates de secours.`);
  }
  for (const [yearText, starts] of Object.entries(official)) {
    const known = FALLBACK_CALENDARS[Number(yearText)];
    if (!known) continue;
    const days = (a: string, b: string) => Math.abs(Date.parse(a) - Date.parse(b)) / 86400000;
    if (starts.some((d, i) => days(d, known[i]) > 7)) {
      console.warn(`[calendrier] dates officielles ${yearText} incohérentes, dates de secours gardées.`);
      delete official[Number(yearText)];
    }
  }
  return official;
}

let cache: Promise<SchoolCalendars> | undefined;

/**
 * Calendriers à utiliser : les dates officielles quand elles sont lisibles,
 * sinon les dates de secours. Un seul appel réseau par construction du site.
 */
export function loadSchoolCalendars(): Promise<SchoolCalendars> {
  cache ??= (async () => {
    const official = await readOfficialCalendars();
    const merged: SchoolCalendars = { ...FALLBACK_CALENDARS, ...official };
    const years = Object.keys(official);
    const summary = years.length
      ? `dates officielles lues pour ${years.map((y) => `${y}-${Number(y) + 1}`).join(', ')}`
      : 'dates de secours uniquement';
    console.log(`[calendrier] ${summary} : ${JSON.stringify(merged)}`);
    if (process.env.GITHUB_ACTIONS) {
      // Visible dans le résumé de la publication sur GitHub.
      console.log(`::notice title=Calendrier scolaire::${summary}`);
    }
    return merged;
  })();
  return cache;
}
