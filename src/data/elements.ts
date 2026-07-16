/** Display metadata for each element (names + color coding). */
import type { AttackElement } from '../core/element';

export interface ElementInfo {
  name: string;
  color: number;
}

export const ELEMENT_INFO: Record<AttackElement, ElementInfo> = {
  FIRE: { name: 'Fire', color: 0xe24b2c },
  WATER: { name: 'Water', color: 0x2e7de2 },
  EARTH: { name: 'Earth', color: 0x9a6a3a },
  NATURE: { name: 'Nature', color: 0x3fae4a },
  LIGHT: { name: 'Light', color: 0xf5e663 },
  DARKNESS: { name: 'Darkness', color: 0x8e44e0 },
  COMPOSITE: { name: 'Composite', color: 0x9aa0a6 },
};

/** Phaser Text wants CSS strings; Graphics wants numbers. */
export function cssColor(color: number): string {
  return '#' + color.toString(16).padStart(6, '0');
}
