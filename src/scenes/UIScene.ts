/**
 * Sidebar HUD: gold/lives/wave readout, the tower build bar (generated from
 * the TOWERS data table), the "start next wave" button, and the win/lose
 * overlay. Reads GameSim state every frame; writes only via sim methods
 * and the shared registry key for tower selection.
 */
import Phaser from 'phaser';
import { BOARD_W, CANVAS_H, CANVAS_W, SIDEBAR_W } from '../data/config';
import { cssColor, ELEMENT_INFO } from '../data/elements';
import { TOWERS } from '../data/towers';
import type { GameSim } from '../sim/GameSim';
import { GameScene, SELECTED_TOWER_KEY } from './GameScene';

interface TowerButton {
  defId: string;
  cost: number;
  bg: Phaser.GameObjects.Rectangle;
}

const PANEL_X = BOARD_W;
const PAD = 8;

export class UIScene extends Phaser.Scene {
  private sim!: GameSim;
  private goldText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;
  private waveText!: Phaser.GameObjects.Text;
  private nextWaveText!: Phaser.GameObjects.Text;
  private towerButtons: TowerButton[] = [];
  private startBtn!: Phaser.GameObjects.Rectangle;
  private startText!: Phaser.GameObjects.Text;
  private overlayShown = false;

  constructor() {
    super('ui');
  }

  create(): void {
    this.sim = (this.scene.get('game') as GameScene).sim;
    this.towerButtons = [];
    this.overlayShown = false;

    this.add.rectangle(PANEL_X, 0, SIDEBAR_W, CANVAS_H, 0x141a24).setOrigin(0);

    const text = (y: number, str: string, size = 13, color = '#dce3ec') =>
      this.add.text(PANEL_X + PAD, y, str, { fontSize: `${size}px`, color });

    text(10, 'ELEMENT TD', 15, '#f5e663');
    this.goldText = text(36, '');
    this.livesText = text(54, '');
    this.waveText = text(72, '');
    this.nextWaveText = text(90, '', 11, '#9fb0c3');

    this.createBuildBar(118);
    this.createStartButton();
  }

  update(): void {
    const sim = this.sim;
    this.goldText.setText(`Gold: ${sim.gold}`);
    this.livesText.setText(`Lives: ${sim.lives}`);

    const waveNo = Math.min(sim.waveIndex + 1, sim.totalWaves);
    this.waveText.setText(`Wave: ${waveNo} / ${sim.totalWaves}`);
    const next = sim.upcomingWave;
    if (sim.phase === 'build' && next) {
      this.nextWaveText.setText(
        `Next: ${next.count}x ${ELEMENT_INFO[next.armor].name}\n${next.name} (${next.hp} hp)`
      );
    } else {
      this.nextWaveText.setText(sim.phase === 'wave' ? 'Wave in progress…' : '');
    }

    // Build-bar states: highlight selection, dim unaffordable towers.
    const selected = this.registry.get(SELECTED_TOWER_KEY) as string | null;
    for (const btn of this.towerButtons) {
      const isSelected = btn.defId === selected;
      btn.bg.setStrokeStyle(isSelected ? 2 : 1, isSelected ? 0xf5e663 : 0x3a4657);
      btn.bg.setAlpha(sim.gold >= btn.cost ? 1 : 0.4);
    }

    const canStart = sim.phase === 'build';
    this.startBtn.setFillStyle(canStart ? 0x2c7a3a : 0x2a3442);
    this.startText.setText(canStart ? 'START WAVE' : 'WAVE RUNNING');

    if ((sim.phase === 'won' || sim.phase === 'lost') && !this.overlayShown) {
      this.showEndOverlay(sim.phase === 'won');
    }
  }

  /** One button per row of the TOWERS table — new towers appear automatically. */
  private createBuildBar(startY: number): void {
    const btnH = 48;
    TOWERS.forEach((def, i) => {
      const y = startY + i * (btnH + 6);
      const bg = this.add
        .rectangle(PANEL_X + PAD, y, SIDEBAR_W - PAD * 2, btnH, 0x1e2836)
        .setOrigin(0)
        .setStrokeStyle(1, 0x3a4657)
        .setInteractive({ useHandCursor: true });
      bg.on('pointerdown', () => {
        const current = this.registry.get(SELECTED_TOWER_KEY) as string | null;
        this.registry.set(SELECTED_TOWER_KEY, current === def.id ? null : def.id);
      });

      const color = ELEMENT_INFO[def.element].color;
      this.add.rectangle(PANEL_X + PAD + 6, y + btnH / 2, 20, 20, color).setOrigin(0, 0.5);
      this.add.text(PANEL_X + PAD + 34, y + 7, def.name, {
        fontSize: '13px',
        color: cssColor(color),
      });
      this.add.text(PANEL_X + PAD + 34, y + 25, `${def.cost}g · ${def.damage} dmg`, {
        fontSize: '10px',
        color: '#9fb0c3',
      });
      this.towerButtons.push({ defId: def.id, cost: def.cost, bg });
    });
  }

  private createStartButton(): void {
    const y = CANVAS_H - 52;
    this.startBtn = this.add
      .rectangle(PANEL_X + PAD, y, SIDEBAR_W - PAD * 2, 40, 0x2c7a3a)
      .setOrigin(0)
      .setInteractive({ useHandCursor: true });
    this.startBtn.on('pointerdown', () => this.sim.startNextWave());
    this.startText = this.add
      .text(PANEL_X + SIDEBAR_W / 2, y + 20, 'START WAVE', { fontSize: '14px', color: '#ffffff' })
      .setOrigin(0.5);
  }

  /** Full-screen win/lose overlay with a restart button. */
  private showEndOverlay(won: boolean): void {
    this.overlayShown = true;
    this.add.rectangle(0, 0, CANVAS_W, CANVAS_H, 0x000000, 0.7).setOrigin(0).setDepth(10);
    this.add
      .text(BOARD_W / 2, CANVAS_H / 2 - 60, won ? 'VICTORY!' : 'DEFEAT', {
        fontSize: '48px',
        color: won ? '#f5e663' : '#e05252',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(11);
    this.add
      .text(
        BOARD_W / 2,
        CANVAS_H / 2 - 10,
        won ? 'You survived all 10 waves.' : 'The creeps broke through.',
        { fontSize: '18px', color: '#dce3ec' }
      )
      .setOrigin(0.5)
      .setDepth(11);

    const btn = this.add
      .rectangle(BOARD_W / 2, CANVAS_H / 2 + 50, 180, 44, 0x2c7a3a)
      .setDepth(11)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(BOARD_W / 2, CANVAS_H / 2 + 50, 'RESTART', { fontSize: '16px', color: '#ffffff' })
      .setOrigin(0.5)
      .setDepth(12);
    btn.on('pointerdown', () => {
      // GameScene.create() rebuilds the sim and restarts this UI scene too.
      this.scene.get('game').scene.restart();
    });
  }
}
