import Phaser from 'phaser';
import { CANVAS_H, CANVAS_W } from './data/config';
import { GameScene } from './scenes/GameScene';
import { UIScene } from './scenes/UIScene';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'app',
  width: CANVAS_W,
  height: CANVAS_H,
  backgroundColor: '#10151c',
  scene: [GameScene, UIScene], // GameScene auto-starts and launches UIScene
});

// Dev-only hook so the sim can be inspected from the browser console.
if (import.meta.env.DEV) {
  (window as unknown as { __game: Phaser.Game }).__game = game;
}
