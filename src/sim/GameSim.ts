/**
 * Headless game simulation. No Phaser imports — this class can be stepped
 * and inspected from tests or a script. The renderer calls update(dt) once
 * per frame and reads public state + returned events.
 */
import { damageMultiplier } from '../core/element';
import type { CreepState, GamePhase, SimEvent, TowerState, WaveDef } from '../core/types';
import { INTEREST_RATE, STARTING_GOLD, STARTING_LIVES, TILE } from '../data/config';
import { isBuildable, WAYPOINTS } from '../data/map';
import { towerDef } from '../data/towers';
import { WAVES } from '../data/waves';

export class GameSim {
  gold = STARTING_GOLD;
  lives = STARTING_LIVES;
  /** Index into WAVES of the current (during 'wave') or next (during 'build') wave. */
  waveIndex = 0;
  phase: GamePhase = 'build';

  creeps: CreepState[] = [];
  towers: TowerState[] = [];

  private activeWave: WaveDef | null = null;
  private spawnRemaining = 0;
  private spawnTimer = 0;
  private nextId = 1;
  private occupied = new Set<string>();

  /** The wave the player will face next (null once all waves are done). */
  get upcomingWave(): WaveDef | null {
    return this.waveIndex < WAVES.length ? WAVES[this.waveIndex] : null;
  }

  get totalWaves(): number {
    return WAVES.length;
  }

  /** Player-triggered: begin spawning the next wave. */
  startNextWave(): boolean {
    if (this.phase !== 'build' || !this.upcomingWave) return false;
    this.activeWave = this.upcomingWave;
    this.spawnRemaining = this.activeWave.count;
    this.spawnTimer = 0; // first creep spawns immediately
    this.phase = 'wave';
    return true;
  }

  /** True if the tile is a legal, unoccupied build spot (ignores gold). */
  canPlaceAt(tileX: number, tileY: number): boolean {
    return isBuildable(tileX, tileY) && !this.occupied.has(`${tileX},${tileY}`);
  }

  /** Attempt to buy + place a tower. Returns true on success. */
  placeTower(defId: string, tileX: number, tileY: number): boolean {
    if (this.phase === 'won' || this.phase === 'lost') return false;
    const def = towerDef(defId);
    if (!this.canPlaceAt(tileX, tileY) || this.gold < def.cost) return false;
    this.gold -= def.cost;
    this.occupied.add(`${tileX},${tileY}`);
    this.towers.push({
      id: this.nextId++,
      def,
      x: tileX * TILE + TILE / 2,
      y: tileY * TILE + TILE / 2,
      tileX,
      tileY,
      cooldown: 0,
    });
    return true;
  }

  /** Advance the simulation by dt seconds. Returns render-worthy events. */
  update(dt: number): SimEvent[] {
    const events: SimEvent[] = [];
    if (this.phase !== 'wave') return events;

    this.spawnCreeps(dt);
    this.moveCreeps(dt, events);
    this.fireTowers(dt, events);
    this.creeps = this.creeps.filter((c) => c.alive);
    this.checkWaveEnd(events);
    return events;
  }

  private spawnCreeps(dt: number): void {
    if (this.spawnRemaining <= 0 || !this.activeWave) return;
    this.spawnTimer -= dt;
    while (this.spawnTimer <= 0 && this.spawnRemaining > 0) {
      const w = this.activeWave;
      this.creeps.push({
        id: this.nextId++,
        x: WAYPOINTS[0].x,
        y: WAYPOINTS[0].y,
        hp: w.hp,
        maxHp: w.hp,
        speed: w.speed,
        bounty: w.bounty,
        armor: w.armor,
        nextWaypoint: 1,
        alive: true,
      });
      this.spawnRemaining--;
      this.spawnTimer += w.spawnInterval;
    }
  }

  /** Walk each creep along the waypoint polyline; leaks cost a life. */
  private moveCreeps(dt: number, events: SimEvent[]): void {
    for (const c of this.creeps) {
      let travel = c.speed * dt;
      while (travel > 0 && c.nextWaypoint < WAYPOINTS.length) {
        const wp = WAYPOINTS[c.nextWaypoint];
        const dist = Math.hypot(wp.x - c.x, wp.y - c.y);
        if (dist <= travel) {
          c.x = wp.x;
          c.y = wp.y;
          c.nextWaypoint++;
          travel -= dist;
        } else {
          c.x += ((wp.x - c.x) / dist) * travel;
          c.y += ((wp.y - c.y) / dist) * travel;
          travel = 0;
        }
      }
      if (c.nextWaypoint >= WAYPOINTS.length) {
        // Reached the exit: leak. The creep is simply removed for now.
        c.alive = false;
        this.lives--;
        events.push({ type: 'leak' });
        if (this.lives <= 0 && this.phase === 'wave') {
          this.phase = 'lost';
          events.push({ type: 'lost' });
        }
      }
    }
  }

  /** Each ready tower shoots the nearest living creep in range (instant hit). */
  private fireTowers(dt: number, events: SimEvent[]): void {
    for (const t of this.towers) {
      t.cooldown -= dt;
      if (t.cooldown > 0) continue;

      let target: CreepState | null = null;
      let best = t.def.range;
      for (const c of this.creeps) {
        if (!c.alive) continue;
        const d = Math.hypot(c.x - t.x, c.y - t.y);
        if (d <= best) {
          best = d;
          target = c;
        }
      }
      if (!target) {
        t.cooldown = 0; // stay ready; don't bank negative cooldown while idle
        continue;
      }

      t.cooldown = t.def.cooldown;
      target.hp -= t.def.damage * damageMultiplier(t.def.element, target.armor);
      events.push({
        type: 'shot',
        fromX: t.x,
        fromY: t.y,
        toX: target.x,
        toY: target.y,
        element: t.def.element,
      });
      if (target.hp <= 0) {
        target.alive = false;
        this.gold += target.bounty;
        events.push({ type: 'death', x: target.x, y: target.y, bounty: target.bounty });
      }
    }
  }

  /** When the wave is fully cleared: pay interest and advance (or win). */
  private checkWaveEnd(events: SimEvent[]): void {
    if (this.phase !== 'wave' || this.spawnRemaining > 0 || this.creeps.length > 0) return;
    const interest = Math.floor(this.gold * INTEREST_RATE);
    this.gold += interest;
    events.push({ type: 'waveCleared', waveNumber: this.waveIndex + 1, interest });
    this.waveIndex++;
    if (this.waveIndex >= WAVES.length) {
      this.phase = 'won';
      events.push({ type: 'won' });
    } else {
      this.phase = 'build';
    }
    this.activeWave = null;
  }
}
