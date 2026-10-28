import { describe, expect, it } from 'vitest';
import { formatTime } from '../src/utils/formatTime';

describe('formatTime', () => {
  it('formate les secondes entières en m:ss', () => {
    expect(formatTime(0)).toBe('0:00');
    expect(formatTime(59)).toBe('0:59');
    expect(formatTime(60)).toBe('1:00');
    expect(formatTime(61)).toBe('1:01');
    expect(formatTime(3599)).toBe('59:59');
    expect(formatTime(3600)).toBe('60:00');
    expect(formatTime(36000)).toBe('600:00');
  });

  it('tronque les décimales (jamais d’arrondi au-dessus)', () => {
    expect(formatTime(0.4)).toBe('0:00');
    expect(formatTime(0.9)).toBe('0:00');
    expect(formatTime(59.9)).toBe('0:59');
    expect(formatTime(60.5)).toBe('1:00');
    expect(formatTime(61.99)).toBe('1:01');
  });

  it('ramène les durées négatives à 0:00', () => {
    expect(formatTime(-1)).toBe('0:00');
    expect(formatTime(-0.5)).toBe('0:00');
    expect(formatTime(-3600)).toBe('0:00');
  });

  it('ramène les entrées non finies à 0:00', () => {
    expect(formatTime(Number.NaN)).toBe('0:00');
    expect(formatTime(Number.POSITIVE_INFINITY)).toBe('0:00');
    expect(formatTime(Number.NEGATIVE_INFINITY)).toBe('0:00');
  });
});
