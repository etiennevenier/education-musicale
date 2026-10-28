import { describe, expect, it } from 'vitest';
import { FALLBACK_CALENDARS } from '../src/data/calendrierScolaire';
import { parseOfficialRecords } from '../src/utils/officialCalendar';
import {
  buildBoundaries,
  isPlausibleCalendar,
  parisToday,
  pickSequenceIndex,
} from '../src/utils/sequenceCalendar';

const boundaries = buildBoundaries(FALLBACK_CALENDARS, 2025, 2028);
/** Numéro de séquence affiché (1 à 5) pour une date. */
const seq = (date: string) => pickSequenceIndex(boundaries, date) + 1;

describe('séquence « En ce moment » — année 2026-2027 (zone A)', () => {
  it.each([
    ['2026-09-01', 1],
    ['2026-10-16', 1], // dernier jour de classe avant la Toussaint
    ['2026-10-17', 2], // 1er jour des vacances : la séquence suivante apparaît
    ['2026-10-28', 2],
    ['2026-12-18', 2],
    ['2026-12-19', 3],
    ['2027-02-12', 3],
    ['2027-02-13', 4], // vacances d'hiver zone A (et non le 6 février)
    ['2027-04-09', 4],
    ['2027-04-10', 5], // vacances de printemps zone A (et non le 3 avril)
    ['2027-07-14', 5], // l'été garde la séquence 5
    ['2027-08-31', 5],
  ])('le %s → séquence %i', (date, expected) => {
    expect(seq(date)).toBe(expected);
  });
});

describe('séquence « En ce moment » — année 2027-2028 (zone A)', () => {
  it.each([
    ['2027-09-01', 1],
    ['2027-10-22', 1],
    ['2027-10-23', 2],
    ['2027-12-18', 3],
    ['2028-02-19', 4],
    ['2028-04-21', 4],
    ['2028-04-22', 5], // printemps 2028 (et non le 15 avril)
  ])('le %s → séquence %i', (date, expected) => {
    expect(seq(date)).toBe(expected);
  });
});

describe('année sans calendrier connu', () => {
  it('bascule quand même aux dates approximatives', () => {
    const b = buildBoundaries({}, 2030, 2030);
    expect(pickSequenceIndex(b, '2030-09-01') + 1).toBe(1);
    expect(pickSequenceIndex(b, '2030-10-25') + 1).toBe(2);
    expect(pickSequenceIndex(b, '2031-05-01') + 1).toBe(5);
  });

  it('date illisible : -1 (la carte de la publication reste affichée)', () => {
    expect(pickSequenceIndex(boundaries, '28/10/2026')).toBe(-1);
  });
});

describe('date du jour à Paris', () => {
  it('minuit à Paris compte déjà pour le jour suivant', () => {
    // 22 h 30 UTC le 16 octobre = 0 h 30 le 17 octobre à Paris (heure d'été).
    expect(parisToday(new Date('2026-10-16T22:30:00Z'))).toBe('2026-10-17');
    // 23 h 30 UTC le 18 décembre = 0 h 30 le 19 décembre à Paris (heure d'hiver).
    expect(parisToday(new Date('2026-12-18T23:30:00Z'))).toBe('2026-12-19');
  });
});

describe('dates de secours', () => {
  it('sont plausibles pour chaque année', () => {
    for (const [year, starts] of Object.entries(FALLBACK_CALENDARS)) {
      expect(isPlausibleCalendar(Number(year), starts), year).toBe(true);
    }
  });
});

describe('lecture des données du ministère', () => {
  const base = { location: 'Lyon', population: '-', annee_scolaire: '2026-2027' };
  const records = [
    { ...base, description: 'Vacances de la Toussaint', start_date: '2026-10-16T22:00:00+00:00' },
    { ...base, description: 'Vacances de Noël', start_date: '2026-12-18T23:00:00+00:00' },
    // Début annoncé le vendredi soir : ramené au samedi.
    { ...base, description: "Vacances d'Hiver", start_date: '2027-02-12T17:00:00+01:00' },
    { ...base, description: 'Vacances de Printemps', start_date: '2027-04-09T22:00:00+00:00' },
    // Ignorés : enseignants, autre académie.
    { ...base, population: 'Enseignants', description: 'Vacances de Noël', start_date: '2026-12-01T00:00:00+00:00' },
    { ...base, location: 'Paris', description: 'Vacances de Noël', start_date: '2026-12-01T00:00:00+00:00' },
  ];

  it('retrouve les 4 débuts de vacances (samedis, heure de Paris)', () => {
    expect(parseOfficialRecords(records)).toEqual({
      2026: ['2026-10-17', '2026-12-19', '2027-02-13', '2027-04-10'],
    });
  });

  it('écarte une année incomplète ou incohérente', () => {
    expect(parseOfficialRecords(records.slice(0, 3))).toEqual({});
    const wrong = records.map((r) =>
      r.description.includes('Printemps') ? { ...r, start_date: '2026-11-06T23:00:00+00:00' } : r,
    );
    expect(parseOfficialRecords(wrong)).toEqual({});
  });
});
