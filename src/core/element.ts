/**
 * The element system: pure data + math, NO Phaser dependencies.
 *
 * The six elements form a cycle. Each element is STRONG (2.0x) against the
 * element immediately AFTER it in the cycle, and WEAK (0.5x) against the
 * element immediately BEFORE it. Everything else (including self) is 1.0x.
 *
 *   Light -> Darkness -> Water -> Fire -> Nature -> Earth -> (back to Light)
 */

/** Cycle order. `CYCLE[i]` is strong against `CYCLE[i + 1]`. */
export const CYCLE = ['LIGHT', 'DARKNESS', 'WATER', 'FIRE', 'NATURE', 'EARTH'] as const;

/** One of the six creep/tower elements. Creep armor is always one of these. */
export type Element = (typeof CYCLE)[number];

/**
 * What a tower attacks with. 'COMPOSITE' is attack-only (the Arrow starter
 * tower) and deals neutral damage to every armor type.
 */
export type AttackElement = Element | 'COMPOSITE';

export const ELEMENTS: readonly Element[] = CYCLE;

/**
 * Damage multiplier of an attack element against an armor element.
 *  - 2.0 when the armor element is immediately after the attack in the cycle
 *  - 0.5 when the armor element is immediately before the attack in the cycle
 *  - 1.0 otherwise (including COMPOSITE attacks and same-element matchups)
 */
export function damageMultiplier(attack: AttackElement, armor: Element): number {
  if (attack === 'COMPOSITE') return 1.0;
  const i = CYCLE.indexOf(attack);
  const n = CYCLE.length;
  if (CYCLE[(i + 1) % n] === armor) return 2.0;
  if (CYCLE[(i + n - 1) % n] === armor) return 0.5;
  return 1.0;
}
