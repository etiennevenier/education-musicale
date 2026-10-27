import { describe, expect, it } from 'vitest';
import { formatClock, formatCountdown } from '../src/utils/challenge';

/**
 * Table mesurée sur l'implémentation d'origine (formatMmSs locale), avant
 * délégation à formatTime(). Elle doit rester identique après.
 */
const TABLE: Array<[ms: number, clock: string, countdown: string]> = [
  [0, '0:00', '0:00'],
  [1, '0:00', '0:01'],
  [250, '0:00', '0:01'],
  [499, '0:00', '0:01'],
  [500, '0:01', '0:01'],
  [501, '0:01', '0:01'],
  [999, '0:01', '0:01'],
  [1000, '0:01', '0:01'],
  [1499, '0:01', '0:02'],
  [1500, '0:02', '0:02'],
  [1501, '0:02', '0:02'],
  [3000, '0:03', '0:03'],
  [59999, '1:00', '1:00'],
  [60000, '1:00', '1:00'],
  [61000, '1:01', '1:01'],
  [89500, '1:30', '1:30'],
  [599999, '10:00', '10:00'],
  [600000, '10:00', '10:00'],
  [3599999, '60:00', '60:00'],
  [3600000, '60:00', '60:00'],
  [-1, '0:00', '0:00'],
  [-499, '0:00', '0:00'],
  [-500, '0:00', '0:00'],
  [-999, '0:00', '0:00'],
  [-1500, '0:00', '0:00'],
  [-59999, '0:00', '0:00'],
];

describe('formatClock / formatCountdown', () => {
  it.each(TABLE)('%i ms → clock %s / countdown %s', (ms, clock, countdown) => {
    expect(formatClock(ms)).toBe(clock);
    expect(formatCountdown(ms)).toBe(countdown);
  });

  it('arrondit au plus proche pour le chrono et au supérieur pour le compte à rebours', () => {
    // .4 / .5 / .6 seconde : Math.round monte dès 500 ms, Math.ceil dès 1 ms.
    expect([formatClock(1499), formatClock(1500), formatClock(1501)]).toEqual(['0:01', '0:02', '0:02']);
    expect([formatCountdown(1499), formatCountdown(1500), formatCountdown(1501)]).toEqual([
      '0:02',
      '0:02',
      '0:02',
    ]);
    expect([formatClock(499), formatClock(500), formatClock(501)]).toEqual(['0:00', '0:01', '0:01']);
  });

  it('gère les entrées non finies comme formatTime (0:00)', () => {
    expect(formatClock(Number.NaN)).toBe('NaN:NaN');
    expect(formatCountdown(Number.NaN)).toBe('NaN:NaN');
    expect(formatClock(Number.POSITIVE_INFINITY)).toBe('Infinity:NaN');
    expect(formatCountdown(Number.POSITIVE_INFINITY)).toBe('Infinity:NaN');
    expect(formatClock(Number.NEGATIVE_INFINITY)).toBe('0:00');
    expect(formatCountdown(Number.NEGATIVE_INFINITY)).toBe('0:00');
  });
});
