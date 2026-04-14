import { createStore } from 'solid-js/store'
import type { Block, Grid } from '../block/types'
import { solvedGrid } from '../block/constants'
import { getCorrectNeighborGroups, isSolved } from '../block/utils'

/** Abstract grid model state. */
export type GridState = {
  /** The 2D array representing the current grid layout. */
  grid: Grid
  /** The width of the grid. */
  readonly width: number
  /** The height of the grid. */
  readonly height: number
  /** The groups of neighbors that are correctly positioned. */
  readonly correctNeighborGroups: Set<Block>[]
  /** True if the grid is solved. */
  readonly isSolved: boolean
  /** The blocks in the grid in visual order (flat). */
  readonly blocksInVisualOrder: (Block | null)[]
}

/**
 * Creates the grid store with derived properties using getters.
 *
 * @param initialGrid - The starting grid state.
 */
export const createGridStore = (initialGrid: Grid = solvedGrid) => {
  return createStore<GridState>({
    grid: initialGrid,
    get width() {
      return this.grid[0].length
    },
    get height() {
      return this.grid.length
    },
    get correctNeighborGroups() {
      return getCorrectNeighborGroups(this.grid)
    },
    get isSolved() {
      return isSolved(this.grid)
    },
    get blocksInVisualOrder() {
      return this.grid.flat()
    },
  })
}
