/** Global tunables for the economy and the board. */

export const STARTING_GOLD = 100;
export const STARTING_LIVES = 20;

/** Fraction of banked gold paid as interest at the end of each wave. */
export const INTEREST_RATE = 0.05;

/** Board geometry. The playfield is GRID_W x GRID_H tiles of TILE px. */
export const TILE = 40;
export const GRID_W = 20;
export const GRID_H = 15;
export const BOARD_W = GRID_W * TILE; // 800
export const BOARD_H = GRID_H * TILE; // 600

/** Sidebar UI strip to the right of the board. */
export const SIDEBAR_W = 160;
export const CANVAS_W = BOARD_W + SIDEBAR_W; // 960
export const CANVAS_H = BOARD_H; // 600
