import {
  type Component,
  createEffect,
  createSignal,
  on,
  onCleanup,
  onMount,
} from 'solid-js'
import WebRenderer from '@elemaudio/web-renderer'
import type { Block, Direction } from './block/types'
import { blocks, DELTAS, solvedGrid } from './block/constants'
import {
  applyDeltaToPosition,
  getBlockAtPosition,
  getPositionForBlock,
  isPositionInGrid,
  getMovableDirection,
  isBlockMovable,
  getMovableBlocks,
  isSolved,
  moveBlock,
  areNeighborsCorrect,
} from './block/utils'
import { blockTone } from './tone'

/**
 * Shared audio context for synthesized block tones.
 */
const ctx = new AudioContext()

/**
 * Generates a string identifier for a block to be used as a DOM attribute.
 *
 * @param block - The block to identify.
 * @returns A string key.
 */
const getBlockKey = (block: Block | null): string =>
  block === null ? 'null' : String(block)

/**
 * Finds the DOM button element corresponding to a given block.
 *
 * @param block - The block to find.
 * @returns The button element or null.
 */
const getButtonForBlock = (block: Block | null): HTMLButtonElement | null =>
  document.querySelector(`button[data-block-key="${getBlockKey(block)}"]`)

/**
 * Maps a keyboard key string to its corresponding navigation direction.
 *
 * @param key - The keyboard event key.
 * @returns The direction or null.
 */
const getDirectionFromKey = (key: string): Direction | null => {
  const directions: Record<string, Direction> = {
    ArrowUp: 'Up',
    ArrowDown: 'Down',
    ArrowLeft: 'Left',
    ArrowRight: 'Right',
  }
  return directions[key] ?? null
}

/**
 * Styles for the movement indicator based on direction.
 */
const INDICATOR_STYLE: Record<
  Direction,
  { classList: string; clipPath: string }
> = {
  Up: {
    classList: 'bottom-full left-0 w-full h-full bg-current',
    clipPath: 'polygon(0% 100%, 100% 100%, 50% 50%)',
  },
  Down: {
    classList: 'top-full left-0 w-full h-full bg-current',
    clipPath: 'polygon(0% 0%, 100% 0%, 50% 50%)',
  },
  Left: {
    classList: 'right-full top-0 w-full h-full bg-current',
    clipPath: 'polygon(100% 0%, 100% 100%, 50% 50%)',
  },
  Right: {
    classList: 'left-full top-0 w-full h-full bg-current',
    clipPath: 'polygon(0% 0%, 0% 100%, 50% 50%)',
  },
}

/**
 * The main ToneBlock game component.
 */
export const Game: Component = () => {
  const [grid, setGrid] = createSignal(solvedGrid)
  const [focused, setFocused] = createSignal<Block | null>(null)
  const [core] = createSignal(new WebRenderer())

  const [shuffling, setShuffling] = createSignal(false)

  onMount(async () => {
    let node = await core().initialize(ctx, {
      numberOfInputs: 0,
      numberOfOutputs: 1,
      outputChannelCount: [2],
    })
    node.connect(ctx.destination)

    getButtonForBlock(null)?.focus()
  })

  onCleanup(async () => {
    await ctx.close()
  })

  createEffect(
    on(focused, async (block) => {
      await ctx.resume()

      await core().render(blockTone(block))
    }),
  )

  const onKeyDown = (e: KeyboardEvent) => {
    if (shuffling()) return
    const direction = getDirectionFromKey(e.key)
    if (!direction) return

    const currentPosition = getPositionForBlock(focused(), grid())
    const nextPosition = applyDeltaToPosition(
      currentPosition,
      DELTAS[direction],
    )

    if (!isPositionInGrid(grid(), nextPosition)) return

    e.preventDefault()
    const nextBlock = getBlockAtPosition(grid(), nextPosition)
    getButtonForBlock(nextBlock)?.focus()
  }

  const onClick = (block: Block | null) => {
    const movableDirection = getMovableDirection(block, grid())

    if (movableDirection) {
      setGrid(moveBlock(block, grid()))
      getButtonForBlock(null)?.focus()
    }
  }

  const startShuffle = () => {
    setShuffling(true)
    shuffle(1000, 0)
  }

  const shuffle = (delay = 1000, moves = 0) => {
    const movableBlocks = getMovableBlocks(grid())
    if (movableBlocks.length === 0) {
      setShuffling(false)
      return
    }

    const randomBlock =
      movableBlocks[Math.floor(Math.random() * movableBlocks.length)]

    setGrid(moveBlock(randomBlock, grid()))

    // Stop after a fixed number of moves for predictable entropy,
    // and using a 0.8 multiplier for the delay as requested.
    if (moves < 40) {
      setTimeout(() => shuffle(delay * 0.8, moves + 1), delay)
    } else {
      setShuffling(false)
    }
  }

  const reset = () => {
    setGrid(solvedGrid)
    getButtonForBlock(null)?.focus()
  }

  return (
    <div class="mx-auto w-full max-w-md space-y-4">
      <div class={'grid grid-cols-4'} onKeyDown={onKeyDown}>
        {blocks.map((block) => {
          const { row, column } = getPositionForBlock(block, grid())
          const movableDirection = getMovableDirection(block, grid())

          const neighborBlockLeft = getBlockAtPosition(grid(), {
            row,
            column: column - 1,
          })
          const neighborBlockUp = getBlockAtPosition(grid(), {
            row: row - 1,
            column,
          })

          return (
            <div
              class="group relative"
              classList={{
                'z-20': focused() === block,
                'group-hover:z-20': true,
              }}
              style={{ 'grid-row': row + 1, 'grid-column': column + 1 }}
            >
              <button
                name="block"
                data-block-key={getBlockKey(block)}
                class="flex aspect-square h-full w-full items-center justify-center border-gray-300 text-xl font-bold focus:text-white focus:outline-none disabled:opacity-50"
                classList={{
                  'hover:bg-gray-100 focus:bg-pink-600 focus:hover:bg-pink-700':
                    isBlockMovable(block, grid()),
                  'hover:bg-gray-50 focus:bg-pink-600/50 focus:hover:bg-pink-700/50':
                    !isBlockMovable(block, grid()),
                  'border-t': !areNeighborsCorrect(
                    neighborBlockUp,
                    block,
                    'Down',
                  ),
                  'border-l': !areNeighborsCorrect(
                    neighborBlockLeft,
                    block,
                    'Right',
                  ),
                  // add outer borders on last column/row
                  'border-r': column === 3,
                  'border-b': row === 3,
                }}
                disabled={shuffling()}
                onfocus={() => setFocused(block)}
                onblur={() => setFocused(null)}
                onclick={() => onClick(block)}
              >
                {block}
              </button>
              {movableDirection && (
                <div
                  class={`pointer-events-none absolute z-50 text-gray-100 opacity-0 group-focus-within:text-pink-600 group-focus-within:opacity-100 group-hover:opacity-100 group-focus-within:group-hover:text-pink-700 ${INDICATOR_STYLE[movableDirection].classList}`}
                  style={{
                    'clip-path': INDICATOR_STYLE[movableDirection].clipPath,
                  }}
                />
              )}
            </div>
          )
        })}
      </div>
      <div class="flex justify-center space-x-4">
        <button
          class="rounded bg-gray-200 px-4 py-2 font-bold text-gray-800 hover:bg-gray-300 disabled:opacity-50"
          onclick={reset}
          disabled={shuffling() || isSolved(grid())}
        >
          Reset
        </button>
        <button
          class="rounded bg-pink-600 px-4 py-2 font-bold text-white hover:bg-pink-700 disabled:opacity-50"
          onclick={startShuffle}
          disabled={shuffling()}
        >
          Shuffle
        </button>
      </div>
    </div>
  )
}
