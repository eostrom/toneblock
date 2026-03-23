import type { Delta, Direction, Grid } from './types'

/**
 * Initial set of block values.
 */
export const blocks = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, null]

/**
 * Target solved state of the grid.
 */
export const solvedGrid: Grid = [
  [1, 2, 3, 4],
  [5, 6, 7, 8],
  [9, 10, 11, 12],
  [13, 14, 15, null],
]

/**
 * Maps directions to their corresponding coordinate changes.
 */
export const DELTAS: Record<Direction, Delta> = {
  Up: { row: -1, column: 0 },
  Down: { row: 1, column: 0 },
  Left: { row: 0, column: -1 },
  Right: { row: 0, column: 1 },
}
