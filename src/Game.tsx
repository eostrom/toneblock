import {
  type Component,
  createEffect,
  createMemo,
  createSignal,
  For,
  on,
  onCleanup,
  onMount,
  Show,
} from 'solid-js'
import WebRenderer from '@elemaudio/web-renderer'
import springSkyImage from './assets/images/spring-sky.jpg'
import type { Block, Direction } from './block/types'
import { blocks, DELTAS, solvedGrid } from './block/constants'
import {
  applyDeltaToPosition,
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
import { blockTones } from './tone'

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

const createStatus = () => {
  const [status, setStatus] = createSignal(false)
  const start = () => setStatus(true)
  const stop = () => setStatus(false)

  return [status, start, stop]
}

/**
 * The main ToneBlock game component.
 */
export const Game: Component = () => {
  const [grid, setGrid] = createSignal(solvedGrid)
  const [focused, setFocused] = createSignal<Block | null>(null)
  const [core] = createSignal(new WebRenderer())

  const [shuffling, startShuffling, stopShuffling] = createStatus()
  const [animating, startAnimating, stopAnimating] = createStatus()
  /**
   * Combined state indicating that the game is currently performing an automated task
   * (like shuffling or a block move animation) and should not process user input.
   */
  const busy = createMemo(() => shuffling() || animating())
  
  const gridWidth = createMemo(() => grid()[0].length)
  const gridHeight = createMemo(() => grid().length)

  onMount(async () => {
    const node = await core().initialize(ctx, {
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

  const animateMove = async (block: Block | null, duration?: number) => {
    startAnimating()
    await animateGrid(moveBlock(block, grid()), duration)
    stopAnimating()
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if (busy()) return

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
    if (busy()) return

    const movableDirection = getMovableDirection(block, grid())
    if (!movableDirection) return

    animateMove(block)
      getButtonForBlock(null)?.focus()
    }

  const handleClick = () => {
    startShuffling()
    shuffle(1200, 0)
  }

  const shuffle = async (delay = 2000, moves = 0) => {
    await ctx.resume()

    const movableBlocks = getMovableBlocks(grid())
    if (movableBlocks.length === 0) {
      stopShuffling()
      return
    }

    const randomBlock =
      movableBlocks[Math.floor(Math.random() * movableBlocks.length)]

    animateMove(randomBlock, delay)

    // Stop after a fixed number of moves for predictable entropy,
    // and using a 0.8 multiplier for the delay.
    // Continue until the combined size of all non-singleton groups is no more than 4.
    if (moves < 40 || combinedNonSingletonSize() > 4) {
      setTimeout(() => shuffle(delay * 0.8, moves + 1), delay)
    } else {
      stopShuffling()
    }
  }

  const reset = async () => {
    if (busy()) return

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

  const blockRefs = new Map<Block | null, HTMLDivElement>()

  const animateGrid = (
    newGrid: (Block | null)[][],
    duration: number = 300,
  ): Promise<void> => {
    const rects = new Map<Block | null, DOMRect>()

    // FLIP: First (Capture initial positions)
    blocks.forEach((block) => {
      const element = blockRefs.get(block)
      if (element) rects.set(block, element.getBoundingClientRect())
    })

    // FLIP: Last (Update state/DOM)
    setGrid(newGrid)

    // Wait for DOM to update.
    requestAnimationFrame(() => {
      blocks.forEach((block) => {
        const element = blockRefs.get(block)
        const initialRect = rects.get(block)
        if (!element || !initialRect) return

        const finalRect = element.getBoundingClientRect()

        // FLIP: Invert
        const deltaX = initialRect.left - finalRect.left
        const deltaY = initialRect.top - finalRect.top

        if (deltaX !== 0 || deltaY !== 0) {
          element.style.transform = `translate(${deltaX}px, ${deltaY}px)`
          element.style.transition = 'none'

          // FLIP: Play
          requestAnimationFrame(() => {
            element.style.transition = `transform ${duration}ms ease-out`
            element.style.transform = ''
          })
        }
      })
    })

    // Return a promise that resolves when the transition is complete
    return new Promise((resolve) => setTimeout(resolve, duration))
  }

  return (
    <div class="mx-auto w-full max-w-md space-y-4">
      <div class="relative">
      <div
        class="grid"
          role="grid"
          aria-busy={busy()}
          aria-live="polite"
          aria-atomic="true"
          classList={{ 'cursor-wait': busy() }}
          style={{
            'grid-template-columns': `repeat(${gridWidth()}, 1fr)`,
            'grid-template-rows': `repeat(${gridHeight()}, 1fr)`,
          }}
        onKeyDown={onKeyDown}
      >
          <For each={blocks}>
            {(block) => {
              const movableDirection = () => getMovableDirection(block, grid())

              const bgColor = () => {
                if (block === null) return 'transparent'

                const group = () =>
                  sortedGroups().find((g) => block !== null && g.has(block))
                const groupSize = group()?.size ?? 0
          const maxGroupSize = gridWidth() * gridHeight() - 1
                return getBackgroundColorForGroupSize(groupSize, maxGroupSize)
              }

              const position = () => getPositionForBlock(block, grid())
              const correctPosition = getPositionForBlock(block, solvedGrid)

          return (
            <div
                  ref={(element) => blockRefs.set(block, element)}
              class="group relative overflow-hidden"
              classList={{
                'z-20': focused() === block,
                'group-hover:z-20': true,
                    'opacity-0': block === null,
              }}
              style={{
                    'grid-row': position().row + 1,
                    'grid-column': position().column + 1,
              }}
            >
              <button
                name="block"
                data-block-key={getBlockKey(block)}
                    class={`flex aspect-square h-full w-full items-center justify-center text-xl font-bold transition-colors focus:text-white focus:outline-none ${bgColor()} bg-blend-multiply`}
                classList={{
                      'cursor-wait': busy(),
                  'hover:bg-blue-100/50 focus:bg-pink-600 focus:hover:bg-pink-700':
                        isBlockMovable(block, grid()) && !busy(),
                  'hover:bg-blue-50/50 focus:bg-pink-600/50 focus:hover:bg-pink-700/50':
                        !isBlockMovable(block, grid()) || busy(),
                }}
                style={{
                      'background-image': block
                        ? `url(${springSkyImage})`
                        : 'none',
                  'background-size': `${gridWidth() * 100}% ${
                    gridHeight() * 100
                  }%`,
                      'background-position': `${(correctPosition.column / (gridWidth() - 1)) * 100}% ${(correctPosition.row / (gridHeight() - 1)) * 100}%`,
                }}
                    disabled={busy()}
                    onFocus={() => setFocused(block)}
                    onBlur={() => setFocused(null)}
                    onClick={() => onClick(block)}
              >
                    {block !== null && (
                      <span class="relative z-10 text-transparent">
                        {block}
                      </span>
                )}
              </button>
                  <Show when={movableDirection()}>
                    {(direction) => (
                <div
                        class={`pointer-events-none absolute z-50 text-blue-100 opacity-0 group-focus-within:text-pink-600 group-focus-within:opacity-100 group-hover:opacity-100 group-focus-within:group-hover:text-pink-700 ${
                          INDICATOR_STYLE[direction()].classList
                        }`}
                  style={{
                          'clip-path': INDICATOR_STYLE[direction()].clipPath,
                  }}
                />
              )}
                  </Show>
            </div>
          )
            }}
          </For>
        </div>
        {busy() && (
          <div class="pointer-events-none absolute top-1 right-1 z-50 flex items-center gap-1.5 rounded-full bg-white/60 px-2 py-0.5 text-[10px] font-bold tracking-wider text-gray-700 uppercase shadow-sm backdrop-blur-sm">
            <svg
              class="h-3 w-3 animate-spin text-pink-600"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              />
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>{shuffling() ? 'Shuffling' : 'Animating'}</span>
          </div>
        )}
      </div>
      <div class="flex justify-center space-x-4">
        <button
          class="rounded bg-gray-200 px-4 py-2 font-bold text-gray-800 hover:bg-blue-300 disabled:opacity-50"
          onClick={reset}
          disabled={busy() || isSolved(grid())}
        >
          Reset
        </button>
        <button
          class="rounded bg-pink-600 px-4 py-2 font-bold text-white hover:bg-pink-700 disabled:opacity-50"
          onclick={handleClick}
          disabled={busy()}
        >
          Shuffle
        </button>
      </div>
      <div class="mt-4 space-y-2">
        <h2 class="text-center font-bold text-gray-700">
          Correct Neighbor Groups
        </h2>
        <div class="flex flex-wrap justify-center gap-1">
          <For each={sortedGroups()}>
            {(group) => (
            <div class="rounded border border-gray-300 px-2 py-1 text-sm font-semibold shadow-sm">
                {Array.from(group)
                  .toSorted((a, b) => a - b)
                  .join(' ')}
              </div>
            )}
          </For>
        </div>
      </div>
    </div>
  )
}
