import {
  type Component,
  createEffect,
  createMemo,
  createSignal,
  on,
  onCleanup,
  onMount,
} from 'solid-js'
import WebRenderer from '@elemaudio/web-renderer'
import springSkyImage from './assets/images/spring-sky.jpg'
import type { Block, Direction } from './block/types'
import { blocks, DELTAS, solvedGrid } from './block/constants'
import {
  applyDeltaToPosition,
  areNeighborsCorrect,
  getBlockAtPosition,
  getCorrectNeighborGroups,
  getMovableBlocks,
  getMovableDirection,
  getPositionForBlock,
  isBlockMovable,
  isPositionInGrid,
  isSolved,
  moveBlock,
} from './block/utils'
import { blockTone, blockTones } from './tone'

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
 * Maps the size of a group to a Tailwind background color class.
 *
 * @param size - The size of the contiguous group.
 * @param maxSize - The maximum possible size of a group.
 * @returns A Tailwind background color class.
 */
const getBackgroundColorForGroupSize = (
  size: number,
  maxSize: number,
): string => {
  if (size <= 1) return 'bg-gray-500'
  if (size >= maxSize) return 'bg-white'

  const step = (maxSize - 1) / 5

  if (size <= 1 + step) return 'bg-gray-400'
  if (size <= 1 + step * 2) return 'bg-gray-300'
  if (size <= 1 + step * 3) return 'bg-gray-200'
  if (size <= 1 + step * 4) return 'bg-gray-100'

  return 'bg-white'
}

/**
 * The main ToneBlock game component.
 */
export const Game: Component = () => {
  const [grid, setGrid] = createSignal(solvedGrid)
  const [focused, setFocused] = createSignal<Block | null>(null)
  const [core] = createSignal(new WebRenderer())

  const [shuffling, setShuffling] = createSignal(false)
  const gridWidth = createMemo(() => grid()[0].length)
  const gridHeight = createMemo(() => grid().length)

  const blocksInGridOrder = createMemo(() =>
    grid().flatMap((row, rowIndex) =>
      row.map((block, columnIndex) => ({ block, rowIndex, columnIndex })),
    ),
  )

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
    shuffle(1200, 0)
  }

  const shuffle = async (delay = 2000, moves = 0) => {
    await ctx.resume()

    const movableBlocks = getMovableBlocks(grid())
    if (movableBlocks.length === 0) {
      setShuffling(false)
      return
    }

    const randomBlock =
      movableBlocks[Math.floor(Math.random() * movableBlocks.length)]

    setGrid(moveBlock(randomBlock, grid()))

    // Stop after a fixed number of moves for predictable entropy,
    // and using a 0.8 multiplier for the delay.
    // Continue until the combined size of all non-singleton groups is no more than 4.
    if (moves < 40 || combinedNonSingletonSize() > 4) {
      setTimeout(() => shuffle(delay * 0.8, moves + 1), delay)
    } else {
      setShuffling(false)
    }
  }

  const reset = async () => {
    setGrid(solvedGrid)
    getButtonForBlock(null)?.focus()
    await ctx.resume()
  }

  const sortedGroups = createMemo(() =>
    getCorrectNeighborGroups(grid()).toSorted((a, b) => b.size - a.size),
  )
  const biggestGroup = createMemo(() => sortedGroups()[0])
  const combinedNonSingletonSize = createMemo(() =>
    sortedGroups()
      .filter((g) => g.size > 1)
      .reduce((acc, g) => acc + g.size, 0),
  )

  createEffect(
    on(biggestGroup, async (group) => {
      await ctx.resume()

      await core().render(blockTones([...group.values()]))
    }),
  )

  return (
    <div class="mx-auto w-full max-w-md space-y-4">
      <div
        class="grid"
        style={{ 'grid-template-columns': `repeat(${gridWidth()}, 1fr)` }}
        onKeyDown={onKeyDown}
      >
        {blocksInGridOrder().map(({ block, rowIndex, columnIndex }) => {
          const movableDirection = getMovableDirection(block, grid())

          const neighborBlockLeft = getBlockAtPosition(grid(), {
            row: rowIndex,
            column: columnIndex - 1,
          })
          const neighborBlockUp = getBlockAtPosition(grid(), {
            row: rowIndex - 1,
            column: columnIndex,
          })

          const group = sortedGroups().find((g) => g.has(block))
          const groupSize = group?.size ?? 0
          const maxGroupSize = gridWidth() * gridHeight() - 1
          const bgColor = block
            ? getBackgroundColorForGroupSize(groupSize, maxGroupSize)
            : ''

          return (
            <div
              class="group relative overflow-hidden"
              classList={{
                'z-20': focused() === block,
                'group-hover:z-20': true,
              }}
              style={{
                'grid-row': rowIndex + 1,
                'grid-column': columnIndex + 1,
              }}
            >
              <button
                name="block"
                data-block-key={getBlockKey(block)}
                class={`flex aspect-square h-full w-full items-center justify-center border-gray-300 text-xl font-bold focus:text-white focus:outline-none disabled:opacity-50 ${bgColor} bg-blend-multiply`}
                classList={{
                  'hover:bg-blue-100/50 focus:bg-pink-600 focus:hover:bg-pink-700':
                    isBlockMovable(block, grid()),
                  'hover:bg-blue-50/50 focus:bg-pink-600/50 focus:hover:bg-pink-700/50':
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
                  'border-r': columnIndex === gridWidth() - 1,
                  'border-b': rowIndex === gridHeight() - 1,
                  'bg-white': !block,
                }}
                style={{
                  'background-image': block ? `url(${springSkyImage})` : 'none',
                  'background-size': `${gridWidth() * 100}% ${
                    gridHeight() * 100
                  }%`,
                  'background-position': (() => {
                    if (!block) return '0 0'
                    const pos = getPositionForBlock(block, solvedGrid)
                    return `${(pos.column / (gridWidth() - 1)) * 100}% ${
                      (pos.row / (gridHeight() - 1)) * 100
                    }%`
                  })(),
                }}
                disabled={shuffling()}
                onfocus={() => setFocused(block)}
                onblur={() => setFocused(null)}
                onclick={() => onClick(block)}
              >
                {block && (
                  <span class="relative z-10 text-transparent">{block}</span>
                )}
              </button>
              {movableDirection && (
                <div
                  class={`pointer-events-none absolute z-50 text-blue-100 opacity-0 group-focus-within:text-pink-600 group-focus-within:opacity-100 group-hover:opacity-100 group-focus-within:group-hover:text-pink-700 ${INDICATOR_STYLE[movableDirection].classList}`}
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
          class="rounded bg-gray-200 px-4 py-2 font-bold text-gray-800 hover:bg-blue-300 disabled:opacity-50"
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
      <div class="mt-4 space-y-2">
        <h2 class="text-center font-bold text-gray-700">
          Correct Neighbor Groups
        </h2>
        <div class="flex flex-wrap justify-center gap-1">
          {sortedGroups().map((group) => {
            const maxGroupSize = gridWidth() * gridHeight() - 1
            const bgColor = getBackgroundColorForGroupSize(
              group.size,
              maxGroupSize,
            )
            return (
              <div
                class={`rounded border border-gray-300 px-2 py-1 text-sm font-semibold shadow-sm ${bgColor}`}
              >
                {Array.from(group)
                  .toSorted((a, b) => a - b)
                  .join(' ')}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
