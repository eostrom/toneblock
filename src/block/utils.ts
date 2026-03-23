import type { Block, Delta, Direction, Grid, Position, Range } from './types'
import { DELTAS } from './constants'

/**
 * Retrieves a row from the grid.
 *
 * @param grid - The grid to read from.
 * @param rowIndex - The index of the row to retrieve.
 * @returns The row at the specified index.
 */
export const getRowFromGrid = (
  grid: Grid,
  rowIndex: number,
): (Block | null)[] => grid[rowIndex]

/**
 * Retrieves a column from the grid.
 *
 * @param grid - The grid to read from.
 * @param columnIndex - The index of the column to retrieve.
 * @returns The column at the specified index.
 */
export const getColumnFromGrid = (
  grid: Grid,
  columnIndex: number,
): (Block | null)[] => grid.map((row) => row[columnIndex])

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

/**
 * Determines in which direction a block can be moved, if any.
 * A block can be moved if the null block is in the same row or column.
 *
 * @param block - The block to check.
 * @param grid - The current grid state.
 * @returns The direction to the null block, or null if it cannot move.
 */
export const getMovableDirection = (
  block: Block | null,
  grid: Grid,
): Direction | null => {
  if (block === null) return null

  const position = getPositionForBlock(block, grid)
  const nullPosition = getPositionForBlock(null, grid)

  if (position.row === nullPosition.row)
    return position.column < nullPosition.column ? 'Right' : 'Left'
  else if (position.column === nullPosition.column)
    return position.row < nullPosition.row ? 'Down' : 'Up'
  else return null
}

/**
 * Creates a range object with the smaller of two values as min and larger as max.
 *
 * @param a - First value.
 * @param b - Second value.
 * @returns A range object.
 */
export const makeRange = (a: number, b: number): Range => ({
  min: Math.min(a, b),
  max: Math.max(a, b),
})

/**
 * Determines whether a value falls within an inclusive range.
 *
 * @param value - The value to check.
 * @param range - The boundaries to check against.
 * @returns True if the value is within the range.
 */
export const isInRange = (value: number, range: Range): boolean =>
  value >= range.min && value <= range.max

/**
 * Checks if two arrays contain the same elements, regardless of order.
 *
 * @param a - First array.
 * @param b - Second array.
 * @returns True if they are permutations of each other.
 */
const isPermutation = (a: (Block | null)[], b: (Block | null)[]): boolean => {
  if (a.length !== b.length) return false

  const sortedA = a.toSorted()
  const sortedB = b.toSorted()

  return sortedA.every((val, i) => val === sortedB[i])
}

/**
 * Replaces a row in the grid with new content, ensuring it's a permutation.
 *
 * @param grid - The current grid state.
 * @param rowIndex - The index of the row to replace.
 * @param newRow - The new content of the row.
 * @returns The modified grid.
 * @throws Error if the new row is not a permutation of the old row.
 */
const rearrangeRowInGrid = (
  grid: Grid,
  rowIndex: number,
  newRow: (Block | null)[],
): Grid => {
  if (!isPermutation(grid[rowIndex], newRow))
    throw new Error('New row content must be a permutation of the old row')

  return grid.map((row, i) => (i === rowIndex ? newRow : row))
}

/**
 * Replaces a column in the grid with new content, ensuring it's a permutation.
 *
 * @param grid - The current grid state.
 * @param columnIndex - The index of the column to replace.
 * @param newColumn - The new content of the column.
 * @returns The modified grid.
 * @throws Error if the new column is not a permutation of the old column.
 */
const rearrangeColumnInGrid = (
  grid: Grid,
  columnIndex: number,
  newColumn: (Block | null)[],
): Grid => {
  const oldColumn = getColumnFromGrid(grid, columnIndex)
  if (!isPermutation(oldColumn, newColumn))
    throw new Error(
      'New column content must be a permutation of the old column',
    )

  return grid.map((row) =>
    row.map((cell, i) =>
      i === columnIndex ? newColumn[grid.indexOf(row)] : cell,
    ),
  )
}

/**
 * Slides blocks within a sequence toward an empty space.
 *
 * @param sequence - The sequence of blocks to modify.
 * @param index - The index of the clicked block.
 * @param nullIndex - The index of the null block.
 * @returns The new sequence after sliding.
 */
const slideBlocksWithinSequence = (
  sequence: (Block | null)[],
  index: number,
  nullIndex: number,
): (Block | null)[] => {
  const range = makeRange(index, nullIndex)
  const delta = Math.sign(index - nullIndex)

  return sequence.map((cell, i) => {
    if (i === index) return null
    if (isInRange(i, range)) return sequence[i + delta]
    return cell
  })
}

/**
 * Moves a block horizontally toward the null block in the grid.
 *
 * @param grid - The current grid state.
 * @param position - The position of the clicked block.
 * @returns The new grid state.
 */
const moveBlockHorizontally = (grid: Grid, position: Position): Grid => {
  const nullPosition = getPositionForBlock(null, grid)
  const row = getRowFromGrid(grid, position.row)
  const newRow = slideBlocksWithinSequence(
    row,
    position.column,
    nullPosition.column,
  )

  return rearrangeRowInGrid(grid, position.row, newRow)
}

/**
 * Moves a block vertically toward the null block in the grid.
 *
 * @param grid - The current grid state.
 * @param position - The position of the clicked block.
 * @returns The new grid state.
 */
const moveBlockVertically = (grid: Grid, position: Position): Grid => {
  const nullPosition = getPositionForBlock(null, grid)
  const column = getColumnFromGrid(grid, position.column)
  const newColumn = slideBlocksWithinSequence(
    column,
    position.row,
    nullPosition.row,
  )

  return rearrangeColumnInGrid(grid, position.column, newColumn)
}

/**
 * Determines whether a movement direction is horizontal.
 *
 * @param direction - The direction to check.
 * @returns True if the direction is Left or Right.
 */
export const isDirectionHorizontal = (direction: Direction): boolean =>
  direction === 'Left' || direction === 'Right'

/**
 * Moves a block toward the null block in the grid.
 *
 * All blocks between the specified block and the null block are pushed
 * in the direction of the movement.
 *
 * @param block - The block to move.
 * @param grid - The current grid state.
 * @returns The new grid state after movement.
 */
export const moveBlock = (block: Block | null, grid: Grid): Grid => {
  if (block === null) return grid

  const movableDirection = getMovableDirection(block, grid)
  if (!movableDirection) return grid

  const position = getPositionForBlock(block, grid)

  if (isDirectionHorizontal(movableDirection))
    return moveBlockHorizontally(grid, position)
  else return moveBlockVertically(grid, position)
}
