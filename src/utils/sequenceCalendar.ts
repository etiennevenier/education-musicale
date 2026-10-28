/**
 * Choix de la séquence « En ce moment » d'après le calendrier scolaire.
 *
 * Fonctions pures (aucun réseau) : utilisées à la construction du site et
 * testées dans tests/sequenceCalendar.test.ts. Toutes les dates sont des
 * chaînes « AAAA-MM-JJ » à l'heure de Paris : on les compare comme du texte,
 * ce qui évite tout décalage de fuseau horaire.
 *
 * Règle : chaque séquence commence le premier jour des vacances qui la
 * précèdent (samedi) ; la séquence 1 commence le 1er septembre.
 */

/** Débuts des vacances d'une année scolaire : Toussaint, Noël, Hiver, Printemps. */
export type HolidayStarts = [string, string, string, string];

/** Calendriers connus, indexés par l'année de la rentrée (2026 = année 2026-2027). */
export type SchoolCalendars = Record<number, HolidayStarts>;

/** [date de début, numéro de séquence (0 à 4)], triés par date croissante. */
export type Boundary = [string, number];

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Date du jour à Paris, au format AAAA-MM-JJ. */
export function parisToday(now: Date = new Date()): string {
  // formatToParts : indépendant de la mise en forme propre à chaque navigateur.
  const parts = new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

/**
 * Bascules approximatives, utilisées seulement pour une année dont le
 * calendrier officiel est inconnu (même règle que l'ancien site).
 */
function approximateStarts(year: number): HolidayStarts {
  return [`${year}-10-25`, `${year}-12-25`, `${year + 1}-02-16`, `${year + 1}-04-16`];
}

/**
 * Liste des bascules pour les années scolaires `fromYear` à `toYear` (années de rentrée).
 */
export function buildBoundaries(calendars: SchoolCalendars, fromYear: number, toYear: number): Boundary[] {
  const boundaries: Boundary[] = [];
  for (let year = fromYear; year <= toYear; year++) {
    const starts = calendars[year] ?? approximateStarts(year);
    boundaries.push([`${year}-09-01`, 0]);
    starts.forEach((date, i) => boundaries.push([date, i + 1]));
  }
  return boundaries;
}

/**
 * Numéro de la séquence (0 à 4) en cours le jour `today` (AAAA-MM-JJ).
 * Retourne -1 si la date est illisible ou antérieure à la première bascule.
 */
export function pickSequenceIndex(boundaries: Boundary[], today: string): number {
  if (!DATE_RE.test(today)) return -1;
  let index = -1;
  for (const [start, seq] of boundaries) {
    if (start <= today) index = seq;
    else break;
  }
  return index;
}

/** Vérifie qu'un calendrier d'une année est plausible (dates valides, ordonnées, aux bons mois). */
export function isPlausibleCalendar(year: number, starts: string[]): starts is HolidayStarts {
  if (starts.length !== 4 || !starts.every((d) => DATE_RE.test(d))) return false;
  const months = starts.map((d) => d.slice(0, 7));
  const ok =
    [`${year}-10`, `${year}-11`].includes(months[0]) &&
    months[1] === `${year}-12` &&
    [`${year + 1}-02`, `${year + 1}-03`].includes(months[2]) &&
    [`${year + 1}-04`, `${year + 1}-05`].includes(months[3]);
  return ok && starts.every((d, i) => i === 0 || starts[i - 1] < d);
}
