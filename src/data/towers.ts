/**
 * Tower stat table. Game logic reads exclusively from here — to add a tower,
 * append a row (and it will automatically appear in the build bar).
 *
 * The six element towers are tuned to ~24-25 base DPS with different
 * damage/speed profiles; the Arrow starter is cheap, composite (always 1.0x)
 * and weaker. `tier` is reserved for future dual/triple combination towers.
 */
import type { TowerDef } from '../core/types';

export const TOWERS: readonly TowerDef[] = [
  { id: 'arrow',    name: 'Arrow',    element: 'COMPOSITE', damage: 8,  range: 110, cooldown: 0.7,  cost: 30, tier: 1 },
  { id: 'fire',     name: 'Fire',     element: 'FIRE',      damage: 22, range: 130, cooldown: 0.9,  cost: 70, tier: 1 },
  { id: 'water',    name: 'Water',    element: 'WATER',     damage: 34, range: 140, cooldown: 1.4,  cost: 70, tier: 1 },
  { id: 'earth',    name: 'Earth',    element: 'EARTH',     damage: 50, range: 120, cooldown: 2.0,  cost: 70, tier: 1 },
  { id: 'nature',   name: 'Nature',   element: 'NATURE',    damage: 16, range: 130, cooldown: 0.65, cost: 70, tier: 1 },
  { id: 'light',    name: 'Light',    element: 'LIGHT',     damage: 26, range: 160, cooldown: 1.1,  cost: 70, tier: 1 },
  { id: 'darkness', name: 'Darkness', element: 'DARKNESS',  damage: 40, range: 125, cooldown: 1.6,  cost: 70, tier: 1 },
];

export function towerDef(id: string): TowerDef {
  const def = TOWERS.find((t) => t.id === id);
  if (!def) throw new Error(`Unknown tower id: ${id}`);
  return def;
}
