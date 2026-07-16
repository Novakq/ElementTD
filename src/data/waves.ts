/**
 * Wave table — 10 waves for the vertical slice. To add a wave, append a row;
 * the win condition ("survive all waves") follows WAVES.length automatically.
 *
 * Armor elements rotate so that no single element tower is good against
 * everything: e.g. a Nature tower (strong vs Earth) is weak against Fire waves.
 */
import type { WaveDef } from '../core/types';

export const WAVES: readonly WaveDef[] = [
  { name: 'Pebble Golems',   armor: 'EARTH',    count: 10, hp: 35,  speed: 50, bounty: 3,  spawnInterval: 1.0 },
  { name: 'Puddle Sprites',  armor: 'WATER',    count: 10, hp: 60,  speed: 55, bounty: 3,  spawnInterval: 1.0 },
  { name: 'Ember Imps',      armor: 'FIRE',     count: 12, hp: 85,  speed: 55, bounty: 4,  spawnInterval: 0.9 },
  { name: 'Thorn Crawlers',  armor: 'NATURE',   count: 12, hp: 120, speed: 60, bounty: 4,  spawnInterval: 0.9 },
  { name: 'Gloom Bats',      armor: 'DARKNESS', count: 12, hp: 170, speed: 65, bounty: 5,  spawnInterval: 0.8 },
  { name: 'Radiant Wisps',   armor: 'LIGHT',    count: 14, hp: 240, speed: 65, bounty: 5,  spawnInterval: 0.8 },
  { name: 'Granite Brutes',  armor: 'EARTH',    count: 14, hp: 330, speed: 60, bounty: 6,  spawnInterval: 0.8 },
  { name: 'Tide Callers',    armor: 'WATER',    count: 14, hp: 450, speed: 70, bounty: 7,  spawnInterval: 0.7 },
  { name: 'Void Stalkers',   armor: 'DARKNESS', count: 16, hp: 550, speed: 70, bounty: 8,  spawnInterval: 0.7 },
  { name: 'Inferno Lords',   armor: 'FIRE',     count: 16, hp: 700, speed: 75, bounty: 10, spawnInterval: 0.7 },
];
