import {
  type Component,
  createEffect,
  createSignal,
  on,
  onCleanup,
  onMount,
} from 'solid-js'
import { el } from '@elemaudio/core'
import WebRenderer from '@elemaudio/web-renderer'

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

const ctx = new AudioContext()

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
  const [grid, setGrid] = createSignal(solvedGrid)
  const [focused, setFocused] = createSignal<Block | null>(null)
  const [core] = createSignal(new WebRenderer())

  onMount(async () => {
    let node = await core().initialize(ctx, {
      numberOfInputs: 0,
      numberOfOutputs: 1,
      outputChannelCount: [2],
    })
    node.connect(ctx.destination)
  })

  onCleanup(async () => {
    await ctx.close()
  })

  createEffect(
    on(focused, async (block) => {
      await ctx.resume()

      const freq = 220 * 2 ** ((1 / 12) * ((block ?? 0) - 1))
      const node = el.mul(el.const({ value: block ? 1 : 0 }), el.cycle(freq))
      await core().render(node)
    }),
  )

  return (
    <div class={'grid grid-cols-4 gap-2'}>
      {blocks.map((block) => {
        const { row, column } = getGridPositionForBlock(block, grid())

        return (
          <button
            name="block"
            style={{ 'grid-row': row + 1, 'grid-column': column + 1 }}
            class="hover:text-pink-500 focus:bg-pink-500"
            onfocus={() => setFocused(block)}
            onblur={() => setFocused(null)}
          >
            {block}
          </button>
        )
      })}
    </div>
  )
}
