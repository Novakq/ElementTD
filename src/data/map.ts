/**
 * The single fixed creep path and buildable-tile logic.
 *
 * The path is an axis-aligned polyline declared in TILE coordinates; pixel
 * waypoints and the set of blocked tiles are derived from it. Creeps enter
 * off-screen on the left and exit off-screen on the right.
 */
import { GRID_H, GRID_W, TILE } from './config';

/** Path corners in tile coordinates. Consecutive points share a row or column. */
export const WAYPOINT_TILES: ReadonlyArray<readonly [number, number]> = [
  [-1, 2],
  [16, 2],
  [16, 7],
  [3, 7],
  [3, 12],
  [20, 12],
];

/** Pixel-space waypoints (tile centers) that creeps walk between. */
export const WAYPOINTS: ReadonlyArray<{ x: number; y: number }> = WAYPOINT_TILES.map(
  ([tx, ty]) => ({ x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2 })
);

const tileKey = (tx: number, ty: number): string => `${tx},${ty}`;

/** Every tile the path passes through (rasterized from the polyline). */
export const PATH_TILES: ReadonlySet<string> = (() => {
  const tiles = new Set<string>();
  for (let i = 0; i < WAYPOINT_TILES.length - 1; i++) {
    const [x0, y0] = WAYPOINT_TILES[i];
    const [x1, y1] = WAYPOINT_TILES[i + 1];
    const dx = Math.sign(x1 - x0);
    const dy = Math.sign(y1 - y0);
    let x = x0;
    let y = y0;
    tiles.add(tileKey(x, y));
    while (x !== x1 || y !== y1) {
      x += dx;
      y += dy;
      tiles.add(tileKey(x, y));
    }
  }
  return tiles;
})();

export function isPathTile(tx: number, ty: number): boolean {
  return PATH_TILES.has(tileKey(tx, ty));
}

/** A tile can hold a tower if it is on the grid and off the path. */
export function isBuildable(tx: number, ty: number): boolean {
  if (tx < 0 || ty < 0 || tx >= GRID_W || ty >= GRID_H) return false;
  return !isPathTile(tx, ty);
}
