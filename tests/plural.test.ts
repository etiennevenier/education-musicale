import { describe, expect, it } from 'vitest';
import { plural } from '../src/utils/plural';

describe('plural', () => {
  it('accorde 0 et 1 au singulier, 2 et plus au pluriel', () => {
    expect(plural(0, 'situation')).toBe('0 situation');
    expect(plural(1, 'situation')).toBe('1 situation');
    expect(plural(2, 'situation')).toBe('2 situations');
    expect(plural(9, 'situation')).toBe('9 situations');
  });

  it('accepte une forme plurielle personnalisée', () => {
    expect(plural(1, 'frappe en trop', 'frappes en trop')).toBe('1 frappe en trop');
    expect(plural(4, 'frappe en trop', 'frappes en trop')).toBe('4 frappes en trop');
    expect(plural(0, 'parfaite', 'parfaites')).toBe('0 parfaite');
    expect(plural(3, 'parfaite', 'parfaites')).toBe('3 parfaites');
  });

  it('conserve les grands nombres (usages mesurés du nuancier)', () => {
    expect(plural(18869, 'situation')).toBe('18869 situations');
    expect(plural(21272, 'situation')).toBe('21272 situations');
  });
});
