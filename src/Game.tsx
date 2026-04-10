import {
  type Component,
  createMemo,
  createSignal,
  For,
  onMount,
} from 'solid-js'
import { unwait } from './utils/promise'
import springSkyImage from './assets/images/spring-sky.jpg'
import type { Block, Direction } from './block/types'
import { blocks, DELTAS, solvedGrid } from './block/constants'
import {
  applyDeltaToPosition,
  getBlockAtPosition,
  getCorrectNeighborGroups,
  getMovableBlocks,
  getMovableDirection,
  getMovementPath,
  getPositionForBlock,
  isBlockMovable,
  isPositionInGrid,
  isSolved,
  moveBlock,
} from './block/utils'
import { useToneBlockAudio } from './components/Game/useToneBlockAudio'

/**
 * Finds the DOM button element corresponding to a given block.
 *
 * @param block - The block to find.
 * @returns The button element or null.
 */
const getButtonForBlock = (block: Block | null): HTMLButtonElement | null => {
  const buttons = Array.from(document.querySelectorAll('button[name="block"]'))

  return (
    (buttons.find((button) => {
      if (block === null) return button.textContent === 'empty'
      return button.textContent === String(block)
    }) as HTMLButtonElement) ?? null
  )
}

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
  const [hovered, setHovered] = createSignal<Block | null>(null)
  const [activeBlock, setActiveBlock] = createSignal<Block | null>(null)

  const [shuffling, startShuffling, stopShuffling] = createStatus()
  const [animating, startAnimating, stopAnimating] = createStatus()
  /**
   * Combined state indicating that the game is currently performing an automated task
   * (like shuffling or a block move animation) and should not process user input.
   */
  const busy = createMemo(() => shuffling() || animating())

  const gridWidth = createMemo(() => grid()[0].length)
  const gridHeight = createMemo(() => grid().length)

  const audio = useToneBlockAudio(grid)

  onMount(() => {
    getButtonForBlock(null)?.focus()
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

  const onBlockClick = async (block: Block | null) => {
    if (busy()) return

    const movableDirection = getMovableDirection(block, grid())
    if (!movableDirection) return

    await animateMove(block)
    getButtonForBlock(null)?.focus()
  }

  const shuffle = async () => {
    await audio.activate()
    startShuffling()

    for (let moves = 0; moves < 40; moves++) {
      const movableBlocks = getMovableBlocks(grid())
      const randomBlock =
        movableBlocks[Math.floor(Math.random() * movableBlocks.length)]

      await animateMove(randomBlock, 1200 * 0.8 ** moves)
    }

    stopShuffling()
  }

  const reset = async () => {
    await audio.activate()
    setGrid(solvedGrid)
    getButtonForBlock(null)?.focus()
  }

  const sortedGroups = createMemo(() =>
    getCorrectNeighborGroups(grid()).toSorted((a, b) => b.size - a.size),
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
              const pushDirection = () => {
                const path = getMovementPath(activeBlock(), grid())
                return path.affectedBlocks.has(block) ? path.direction : null
              }

              const handleFocus = () => {
                setFocused(block)
                if (isBlockMovable(block, grid())) setActiveBlock(block)
                else if (isBlockMovable(hovered(), grid()))
                  setActiveBlock(hovered())
              }

              const handleBlur = () => {
                setFocused(null)
                if (isBlockMovable(hovered(), grid())) setActiveBlock(hovered())
                else setActiveBlock(null)
              }

              const handleMouseEnter = () => {
                setHovered(block)
                if (isBlockMovable(block, grid())) setActiveBlock(block)
              }

              const handleMouseMove = () => {
                if (isBlockMovable(block, grid())) setActiveBlock(block)
              }

              const handleMouseLeave = () => {
                setHovered(null)
                if (isBlockMovable(focused(), grid())) setActiveBlock(focused())
                else setActiveBlock(null)
              }

              const handleClick = () => {
                unwait(onBlockClick)(block)
              }

              return (
                <div
                  ref={(element) => blockRefs.set(block, element)}
                  class="group relative"
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
                    class={`flex aspect-square h-full w-full items-center justify-center text-xl font-bold outline-0 outline-[rgba(219,39,119,0)] transition-all duration-200 focus:outline-4 focus:-outline-offset-4 focus:outline-[rgba(219,39,119,0.7)] ${bgColor()} bg-blend-multiply`}
                    classList={{
                      'cursor-wait': busy(),
                      '-translate-y-[10%]': !busy() && pushDirection() === 'Up',
                      'translate-y-[10%]':
                        !busy() && pushDirection() === 'Down',
                      '-translate-x-[10%]':
                        !busy() && pushDirection() === 'Left',
                      'translate-x-[10%]':
                        !busy() && pushDirection() === 'Right',
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
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    onMouseEnter={handleMouseEnter}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    onClick={handleClick}
                  >
                    <span class="relative z-10 text-transparent">
                      {block || 'empty'}
                    </span>
                  </button>
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
          onClick={() => unwait(reset)()}
          disabled={busy() || isSolved(grid())}
        >
          Reset
        </button>
        <button
          class="rounded bg-pink-600 px-4 py-2 font-bold text-white hover:bg-pink-700 disabled:opacity-50"
          onClick={() => unwait(shuffle)()}
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
