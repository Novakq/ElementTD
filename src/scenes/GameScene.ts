/**
 * Renders the simulation and handles board input (tower placement).
 * All game rules live in GameSim; this scene only draws state and
 * forwards clicks.
 */
import Phaser from 'phaser';
import type { SimEvent } from '../core/types';
import { BOARD_H, BOARD_W, GRID_H, GRID_W, TILE } from '../data/config';
import { ELEMENT_INFO } from '../data/elements';
import { isPathTile, WAYPOINTS } from '../data/map';
import { towerDef } from '../data/towers';
import { GameSim } from '../sim/GameSim';

interface Tracer {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  color: number;
  ttl: number;
}

const TRACER_LIFETIME = 0.12;
const CREEP_RADIUS = 9;
const TOWER_SIZE = 28;

/** Registry key for the tower id currently selected in the build bar. */
export const SELECTED_TOWER_KEY = 'selectedTowerId';

export class GameScene extends Phaser.Scene {
  sim!: GameSim;

  private towerLayer!: Phaser.GameObjects.Graphics;
  private dynamicLayer!: Phaser.GameObjects.Graphics;
  private tracers: Tracer[] = [];
  private hoverTile: { tx: number; ty: number } | null = null;
  private drawnTowerCount = 0;

  constructor() {
    super('game');
  }

  create(): void {
    this.sim = new GameSim();
    this.tracers = [];
    this.hoverTile = null;
    this.drawnTowerCount = 0;
    this.registry.set(SELECTED_TOWER_KEY, null);

    this.drawBoard();
    this.towerLayer = this.add.graphics();
    this.dynamicLayer = this.add.graphics();

    this.input.mouse?.disableContextMenu();
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      const tx = Math.floor(p.x / TILE);
      const ty = Math.floor(p.y / TILE);
      this.hoverTile = p.x < BOARD_W ? { tx, ty } : null;
    });
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (p.rightButtonDown()) {
        this.registry.set(SELECTED_TOWER_KEY, null); // right-click deselects
        return;
      }
      this.tryPlaceTower(p.x, p.y);
    });

    // The UI scene runs alongside this one; restart it if it already exists
    // (i.e. when the player hit Restart on the win/lose screen).
    if (this.scene.isActive('ui')) {
      this.scene.get('ui').scene.restart();
    } else {
      this.scene.launch('ui');
    }
  }

  update(_time: number, deltaMs: number): void {
    // Clamp dt so a backgrounded tab doesn't produce one giant sim step.
    const dt = Math.min(deltaMs / 1000, 0.05);

    const events = this.sim.update(dt);
    this.consumeEvents(events);

    for (const tr of this.tracers) tr.ttl -= dt;
    this.tracers = this.tracers.filter((tr) => tr.ttl > 0);

    this.drawTowers();
    this.drawDynamic();
  }

  private tryPlaceTower(px: number, py: number): void {
    const selectedId = this.registry.get(SELECTED_TOWER_KEY) as string | null;
    if (!selectedId || px >= BOARD_W) return;
    this.sim.placeTower(selectedId, Math.floor(px / TILE), Math.floor(py / TILE));
  }

  private consumeEvents(events: SimEvent[]): void {
    for (const ev of events) {
      if (ev.type === 'shot') {
        this.tracers.push({
          fromX: ev.fromX,
          fromY: ev.fromY,
          toX: ev.toX,
          toY: ev.toY,
          color: ELEMENT_INFO[ev.element].color,
          ttl: TRACER_LIFETIME,
        });
      }
    }
  }

  /** Static background: grass tiles, grid lines, the creep path, entry/exit. */
  private drawBoard(): void {
    const g = this.add.graphics();
    g.fillStyle(0x22303f);
    g.fillRect(0, 0, BOARD_W, BOARD_H);

    for (let ty = 0; ty < GRID_H; ty++) {
      for (let tx = 0; tx < GRID_W; tx++) {
        if (isPathTile(tx, ty)) {
          g.fillStyle(0x54452e);
          g.fillRect(tx * TILE, ty * TILE, TILE, TILE);
        }
      }
    }

    g.lineStyle(1, 0xffffff, 0.05);
    for (let x = 0; x <= GRID_W; x++) g.lineBetween(x * TILE, 0, x * TILE, BOARD_H);
    for (let y = 0; y <= GRID_H; y++) g.lineBetween(0, y * TILE, BOARD_W, y * TILE);

    const start = WAYPOINTS[0];
    const end = WAYPOINTS[WAYPOINTS.length - 1];
    this.add
      .text(Math.max(start.x, 6), start.y, '▶', { fontSize: '18px', color: '#e8d9a0' })
      .setOrigin(0, 0.5);
    this.add
      .text(Math.min(end.x, BOARD_W - 6), end.y, '▶', { fontSize: '18px', color: '#e8d9a0' })
      .setOrigin(1, 0.5);
  }

  /** Towers change rarely; redraw the layer only when one is added. */
  private drawTowers(): void {
    if (this.sim.towers.length === this.drawnTowerCount) return;
    this.drawnTowerCount = this.sim.towers.length;
    const g = this.towerLayer;
    g.clear();
    for (const t of this.sim.towers) {
      const color = ELEMENT_INFO[t.def.element].color;
      g.fillStyle(0x10151c);
      g.fillRect(t.x - TOWER_SIZE / 2 - 2, t.y - TOWER_SIZE / 2 - 2, TOWER_SIZE + 4, TOWER_SIZE + 4);
      g.fillStyle(color);
      g.fillRect(t.x - TOWER_SIZE / 2, t.y - TOWER_SIZE / 2, TOWER_SIZE, TOWER_SIZE);
    }
  }

  /** Per-frame layer: creeps, HP bars, shot tracers, placement ghost. */
  private drawDynamic(): void {
    const g = this.dynamicLayer;
    g.clear();

    for (const tr of this.tracers) {
      g.lineStyle(2, tr.color, tr.ttl / TRACER_LIFETIME);
      g.lineBetween(tr.fromX, tr.fromY, tr.toX, tr.toY);
    }

    for (const c of this.sim.creeps) {
      g.fillStyle(ELEMENT_INFO[c.armor].color);
      g.fillCircle(c.x, c.y, CREEP_RADIUS);
      g.lineStyle(1.5, 0x10151c, 1);
      g.strokeCircle(c.x, c.y, CREEP_RADIUS);

      const barW = 22;
      const barY = c.y - CREEP_RADIUS - 7;
      g.fillStyle(0x501818);
      g.fillRect(c.x - barW / 2, barY, barW, 3);
      g.fillStyle(0x4fd457);
      g.fillRect(c.x - barW / 2, barY, barW * Math.max(0, c.hp / c.maxHp), 3);
    }

    this.drawGhost(g);
  }

  /** Preview square + range circle under the cursor while placing. */
  private drawGhost(g: Phaser.GameObjects.Graphics): void {
    const selectedId = this.registry.get(SELECTED_TOWER_KEY) as string | null;
    if (!selectedId || !this.hoverTile) return;
    const def = towerDef(selectedId);
    const { tx, ty } = this.hoverTile;
    const cx = tx * TILE + TILE / 2;
    const cy = ty * TILE + TILE / 2;
    const ok = this.sim.canPlaceAt(tx, ty) && this.sim.gold >= def.cost;
    const tint = ok ? 0x4fd457 : 0xe05252;

    g.fillStyle(tint, 0.12);
    g.fillCircle(cx, cy, def.range);
    g.lineStyle(1, tint, 0.5);
    g.strokeCircle(cx, cy, def.range);
    g.fillStyle(ELEMENT_INFO[def.element].color, 0.6);
    g.fillRect(cx - TOWER_SIZE / 2, cy - TOWER_SIZE / 2, TOWER_SIZE, TOWER_SIZE);
    g.lineStyle(2, tint, 0.9);
    g.strokeRect(tx * TILE, ty * TILE, TILE, TILE);
  }
}
