/**
 * Shared types between the data tables, the simulation, and the renderer.
 * No Phaser imports here — everything stays inspectable/testable in Node.
 */
import type { AttackElement, Element } from './element';

/** Static definition of a tower type (a row in src/data/towers.ts). */
export interface TowerDef {
  id: string;
  name: string;
  element: AttackElement;
  /** Damage per shot, before the element multiplier. */
  damage: number;
  /** Targeting radius in pixels, measured from the tower's center. */
  range: number;
  /** Seconds between shots. */
  cooldown: number;
  cost: number;
  /** Reserved for future upgrades / dual+triple combination towers. */
  tier: number;
}

/** Static definition of one wave (a row in src/data/waves.ts). */
export interface WaveDef {
  name: string;
  /** Armor element shared by every creep in the wave. */
  armor: Element;
  count: number;
  hp: number;
  /** Movement speed in pixels per second. */
  speed: number;
  /** Gold awarded per kill. */
  bounty: number;
  /** Seconds between creep spawns within the wave. */
  spawnInterval: number;
}

/** A live creep inside the simulation. */
export interface CreepState {
  id: number;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  bounty: number;
  armor: Element;
  /** Index of the waypoint the creep is currently walking toward. */
  nextWaypoint: number;
  alive: boolean;
}

/** A placed tower inside the simulation. */
export interface TowerState {
  id: number;
  def: TowerDef;
  /** Center position in pixels. */
  x: number;
  y: number;
  tileX: number;
  tileY: number;
  /** Seconds until the tower may shoot again. */
  cooldown: number;
}

/** Events emitted by GameSim.update() so the renderer can show effects. */
export type SimEvent =
  | { type: 'shot'; fromX: number; fromY: number; toX: number; toY: number; element: AttackElement }
  | { type: 'death'; x: number; y: number; bounty: number }
  | { type: 'leak' }
  | { type: 'waveCleared'; waveNumber: number; interest: number }
  | { type: 'won' }
  | { type: 'lost' };

export type GamePhase = 'build' | 'wave' | 'won' | 'lost';
