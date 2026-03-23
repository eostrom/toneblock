import type { Block, Delta, Grid, Position } from './types'

/**
 * Finds the position of a specific block in the grid.
 *
 * @param block - The block to find.
 * @param grid - The grid to search in.
 * @returns The coordinates of the block.
 */
export const getPositionForBlock = (
  block: Block | null,
  grid: Grid,
): Position => {
  const rowIndex = grid.findIndex((row) => row.includes(block))
  if (rowIndex === -1) return { row: 0, column: 0 }
  const columnIndex = grid[rowIndex].findIndex((cell) => cell === block)
  return { row: rowIndex, column: columnIndex }
}

/**
 * Retrieves the block at a specific grid position.
 *
 * @param grid - The grid to look in.
 * @param position - The coordinates to check.
 * @returns The block value or null.
 */
export const getBlockAtPosition = (
  grid: Grid,
  position: Position,
): Block | null => grid[position.row]?.[position.column] ?? null

/**
 * Calculates a new position by applying a delta to an existing one.
 *
 * @param position - The original coordinates.
 * @param delta - The change to apply.
 * @returns The new coordinates.
 */
export const applyDeltaToPosition = (
  position: Position,
  delta: Delta,
): Position => ({
  row: position.row + delta.row,
  column: position.column + delta.column,
})

/**
 * Determines whether a position is within the grid boundaries.
 *
 * @param grid - The grid to validate against.
 * @param position - The coordinates to check.
 * @returns True if the position is valid.
 */
export const isPositionInGrid = (grid: Grid, position: Position): boolean =>
  position.row >= 0 &&
  position.row < grid.length &&
  position.column >= 0 &&
  position.column < (grid[0]?.length ?? 0)
