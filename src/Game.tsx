import { createSignal, type Component } from 'solid-js'

type Block = number

const blocks = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, null]

type Grid = (Block | null)[][]

const solvedGrid: Grid = [
  [1, 2, 3, 4],
  [5, 6, 7, 8],
  [9, 10, 11, 12],
  [13, 14, 15, null],
]

type GridPosition = {
  row: number
  column: number
}

const getGridPositionForBlock = (
  block: Block | null,
  grid: Grid,
): GridPosition => {
  const rowIndex = grid.findIndex((row) => row.includes(block))

  if (rowIndex === -1) {
    return { row: 0, column: 0 }
  }

  const columnIndex = grid[rowIndex].findIndex((cell) => cell === block)

  return { row: rowIndex, column: columnIndex }
}

export const Game: Component = () => {
  const [grid, setGrid] = createSignal<Grid>(solvedGrid)

  return (
    <div class={'grid grid-cols-4 gap-2'}>
      {blocks.map((block) => {
        const { row, column } = getGridPositionForBlock(block, grid())

        return (
          <button
            name="block"
            style={{ 'grid-row': row + 1, 'grid-column': column + 1 }}
          >
            {block}
          </button>
        )
      })}
    </div>
  )
}
