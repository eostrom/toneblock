/**
 * Represents a block value in the grid.
 */
export type Block = number

/**
 * Represents the 2D grid of blocks.
 */
export type Grid = (Block | null)[][]

/**
 * Represents a position in the grid by row and column indices.
 */
export type Position = {
  row: number
  column: number
}

/**
 * Represents a range with inclusive min and max values.
 */
export type Range = {
  min: number
  max: number
}

/**
 * Represents a relative change in position.
 */
export type Delta = {
  row: number
  column: number
}

/**
 * Represents the four cardinal directions for navigation.
 */
export type Direction = 'Up' | 'Down' | 'Left' | 'Right'
