import type { SchoolCalendars } from '../utils/sequenceCalendar';

/**
 * Dates de secours : début des vacances (samedi) de la zone A (académie de Lyon),
 * dans l'ordre Toussaint, Noël, Hiver, Printemps. Clé = année de la rentrée.
 *
 * Elles ne servent que si le service du ministère ne répond pas au moment de la
 * publication (les dates officielles sont lues automatiquement, voir
 * src/utils/officialCalendar.ts). Source : service-public.gouv.fr.
 */
export const FALLBACK_CALENDARS: SchoolCalendars = {
  2026: ['2026-10-17', '2026-12-19', '2027-02-13', '2027-04-10'],
  2027: ['2027-10-23', '2027-12-18', '2028-02-19', '2028-04-22'],
};
