import { describe, expect, it } from 'vitest';
import { CYCLE, damageMultiplier, ELEMENTS, type Element } from '../src/core/element';

/**
 * Expected full 6x6 matrix, written out explicitly (not derived from CYCLE)
 * so a bug in the cycle order or the multiplier math can't hide in the test.
 *
 * Cycle: Light -> Darkness -> Water -> Fire -> Nature -> Earth -> Light
 * Row = attack element, column = armor element.
 */
const EXPECTED: Record<Element, Record<Element, number>> = {
  //           armor:  LIGHT DARKNESS WATER FIRE NATURE EARTH
  LIGHT:    { LIGHT: 1.0, DARKNESS: 2.0, WATER: 1.0, FIRE: 1.0, NATURE: 1.0, EARTH: 0.5 },
  DARKNESS: { LIGHT: 0.5, DARKNESS: 1.0, WATER: 2.0, FIRE: 1.0, NATURE: 1.0, EARTH: 1.0 },
  WATER:    { LIGHT: 1.0, DARKNESS: 0.5, WATER: 1.0, FIRE: 2.0, NATURE: 1.0, EARTH: 1.0 },
  FIRE:     { LIGHT: 1.0, DARKNESS: 1.0, WATER: 0.5, FIRE: 1.0, NATURE: 2.0, EARTH: 1.0 },
  NATURE:   { LIGHT: 1.0, DARKNESS: 1.0, WATER: 1.0, FIRE: 0.5, NATURE: 1.0, EARTH: 2.0 },
  EARTH:    { LIGHT: 2.0, DARKNESS: 1.0, WATER: 1.0, FIRE: 1.0, NATURE: 0.5, EARTH: 1.0 },
};

describe('damageMultiplier', () => {
  it('matches the expected 6x6 element matrix', () => {
    for (const attack of ELEMENTS) {
      for (const armor of ELEMENTS) {
        expect(damageMultiplier(attack, armor), `${attack} vs ${armor}`).toBe(
          EXPECTED[attack][armor]
        );
      }
    }
  });

  it('COMPOSITE deals 1.0x against every armor element', () => {
    for (const armor of ELEMENTS) {
      expect(damageMultiplier('COMPOSITE', armor)).toBe(1.0);
    }
  });

  it('each element is strong against exactly one and weak against exactly one', () => {
    for (const attack of ELEMENTS) {
      const row = ELEMENTS.map((armor) => damageMultiplier(attack, armor));
      expect(row.filter((m) => m === 2.0)).toHaveLength(1);
      expect(row.filter((m) => m === 0.5)).toHaveLength(1);
      expect(row.filter((m) => m === 1.0)).toHaveLength(4);
    }
  });

  it('cycle order matches the spec', () => {
    expect(CYCLE).toEqual(['LIGHT', 'DARKNESS', 'WATER', 'FIRE', 'NATURE', 'EARTH']);
  });
});
