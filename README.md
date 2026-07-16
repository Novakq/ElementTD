# Element TD — Milestone 1 (vertical slice)

A web tower-defense game inspired by Warcraft 3's *Element TD*, built with
TypeScript (strict), Vite, and Phaser 3. No binary assets: creeps are circles,
towers are squares, color-coded by element.

## Run it

```bash
npm install
npm run dev     # open the printed URL (default http://localhost:5173)
npm test        # Vitest — full 6x6 element damage matrix
npm run build   # typecheck + production build
```

## How to play

- Click a tower in the sidebar, then click a free tile to place it
  (right-click deselects). The path tiles are unbuildable.
- Click **START WAVE** to send the next wave; waves are player-triggered.
- Kills pay a bounty; at the end of each wave you earn **5% interest** on
  banked gold. A leaked creep costs 1 of your 20 lives.
- Survive all 10 waves to win.

## The element cycle

`Light -> Darkness -> Water -> Fire -> Nature -> Earth -> (back to Light)`

Attacking the element **after** yours in the cycle deals **2.0x**; attacking
the element **before** yours deals **0.5x**; everything else (and the Arrow
tower's Composite damage) is **1.0x**.

The matrix lives in **`src/core/element.ts`** as the pure function
`damageMultiplier(attack, armor)` — no Phaser dependencies — and is fully
covered by `tests/damageMultiplier.test.ts`.

## Project structure

```
src/
├── main.ts               Phaser bootstrap
├── core/
│   ├── element.ts        Element type, cycle order, damageMultiplier (pure)
│   └── types.ts          TowerDef, WaveDef, CreepState, TowerState, SimEvent
├── data/                 ← all game content lives here as typed tables
│   ├── config.ts         economy + board constants (gold, lives, interest, grid)
│   ├── elements.ts       element names + colors
│   ├── towers.ts         tower stat table
│   ├── waves.ts          the 10 wave definitions
│   └── map.ts            creep path waypoints + buildable-tile logic
├── sim/
│   └── GameSim.ts        headless simulation (no Phaser): creeps, towers,
│                         waves, economy. Steps via update(dt), emits SimEvents.
└── scenes/
    ├── GameScene.ts      draws the board + sim state, handles placement input
    └── UIScene.ts        HUD, build bar, start-wave button, win/lose overlay
tests/
└── damageMultiplier.test.ts
```

The simulation is deliberately separated from rendering: `GameSim` can be
constructed and stepped in Node (or a future headless balance test) — the
Phaser scenes only read its state and the events returned by `update(dt)`.

## Adding content (no code changes needed)

**New tower** — append a row to `TOWERS` in `src/data/towers.ts`:

```ts
{ id: 'frost', name: 'Frost', element: 'WATER', damage: 20, range: 150,
  cooldown: 1.0, cost: 90, tier: 1 },
```

It appears in the build bar automatically. The `tier` field is reserved for
the future upgrade / dual-element combination system.

**New wave** — append a row to `WAVES` in `src/data/waves.ts`:

```ts
{ name: 'Storm Drakes', armor: 'LIGHT', count: 18, hp: 900, speed: 80,
  bounty: 12, spawnInterval: 0.6 },
```

The win condition follows `WAVES.length`, so an 11th wave just works.

**New element colors / names** — edit `src/data/elements.ts`.
**Path or grid changes** — edit `WAYPOINT_TILES` in `src/data/map.ts`
(axis-aligned polyline in tile coordinates; blocked tiles are derived).

## Out of scope for this milestone

Dual/triple/quad combination towers, upgrades, the Elemental Guardian
element-pick progression, selling, multiple lanes, sound, and sprites are
intentionally absent — but the data tables (`tier`, `AttackElement`, per-wave
armor) are shaped so they can be added without a rewrite.
