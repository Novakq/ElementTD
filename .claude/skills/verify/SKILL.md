---
name: verify
description: Build, launch, and drive Element TD in headless Chromium to verify changes at the real surface.
---

# Verifying Element TD

## Launch

```bash
npm install
npm run dev -- --port 5173 --strictPort &   # Vite dev server
```

## Drive (headless browser)

Use Playwright with the pre-installed Chromium (do NOT `playwright install`):

```js
import { chromium } from 'playwright'; // npm install --no-save playwright
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
});
```

- The whole game is one `<canvas>` (960x600: 800px board + 160px sidebar).
  Get its bounding rect and click at canvas-relative coordinates.
- Sidebar buttons: tower N center ≈ `(880, 142 + N*54)` (Arrow=0, Fire=1, …);
  START WAVE button center ≈ `(880, 568)`. Board tile `(tx,ty)` center =
  `(tx*40+20, ty*40+20)`.
- **Gotcha:** Phaser ignores a single synthetic mousemove — use
  `page.mouse.move(x, y, { steps: 10 })` or hover state never updates.
- In dev builds `window.__game` exposes the Phaser game; read sim state with
  `window.__game.scene.getScene('game').sim` (gold, lives, phase, waveIndex,
  creeps, towers). Poll `sim.phase` instead of sleeping fixed durations.
- Collect `page.on('pageerror')` / console errors — a clean run has none.

## Flows worth driving

1. Select tower → hover (green/red ghost) → click to place (gold deducted).
2. START WAVE → creeps walk the path, towers shoot, kills pay bounty.
3. Wave clears → +5% interest, next wave in build phase; leak → lives-1.
4. Lives to 0 → DEFEAT overlay; forced `sim.phase='won'` → VICTORY; RESTART
   button resets to gold 100 / lives 20 / wave 1.
