import { type Component, For, onMount } from 'solid-js'
import { unwait } from './utils/promise'
import type { Block, Direction } from './block/types'
import { DELTAS, solvedGrid } from './block/constants'
import {
  applyDeltaToPosition,
  getBlockAtPosition,
  getMovableBlocks,
  getMovableDirection,
  getPositionForBlock,
  isPositionInGrid,
  moveBlock,
} from './block/utils'
import { Cell } from './components/Game/Cell'
import { useToneBlockAudio } from './components/Game/useToneBlockAudio'
import { useFlipAnimation } from './components/Game/useFlipAnimation'
import { useGame } from './stores/GameContext'

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
 * The main ToneBlock game component.
 */
export const Game: Component = () => {
  const {
    grid: gridState,
    setGrid: setGridState,
    view: viewState,
    setView: setViewState,
  } = useGame()

  const { animateGrid, blockRefs } = useFlipAnimation()

  const audio = useToneBlockAudio(() => gridState.grid)

  onMount(() => {
    getButtonForBlock(null)?.focus()
  })

  const animateMove = async (block: Block | null, duration?: number) =>
    await animateGrid(moveBlock(block, gridState.grid), duration)

  const onKeyDown = (e: KeyboardEvent) => {
    const direction = getDirectionFromKey(e.key)
    if (!direction) return
    e.preventDefault()
    if (viewState.busy) return

    const currentPosition = getPositionForBlock(
      viewState.focusedBlock,
      gridState.grid,
    )
    const nextPosition = applyDeltaToPosition(
      currentPosition,
      DELTAS[direction],
    )

    if (!isPositionInGrid(gridState.grid, nextPosition)) return

    const nextBlock = getBlockAtPosition(gridState.grid, nextPosition)
    getButtonForBlock(nextBlock)?.focus()
  }

  const handleMove = async (block: Block | null) => {
    if (viewState.busy) return

    const movableDirection = getMovableDirection(block, gridState.grid)
    if (!movableDirection) return

    await animateMove(block)
    getButtonForBlock(null)?.focus()
  }

  const shuffle = async () => {
    await audio.activate()
    setViewState('shuffling', true)

    for (let moves = 0; moves < 40; moves++) {
      const movableBlocks = getMovableBlocks(gridState.grid)
      const randomBlock =
        movableBlocks[Math.floor(Math.random() * movableBlocks.length)]

      await animateMove(randomBlock, 1200 * 0.8 ** moves)
    }

    setViewState('shuffling', false)
  }

  const reset = async () => {
    await audio.activate()
    setGridState('grid', solvedGrid)
    getButtonForBlock(null)?.focus()
  }

  return (
    <div class="mx-auto w-full max-w-md space-y-4">
      <div class="relative">
        <div
          class="grid"
          role="grid"
          aria-busy={viewState.busy}
          aria-live="polite"
          aria-atomic="true"
          classList={{ 'cursor-wait': viewState.busy }}
          style={{
            'grid-template-columns': `repeat(${gridState.width}, 1fr)`,
            'grid-template-rows': `repeat(${gridState.height}, 1fr)`,
          }}
          onKeyDown={onKeyDown}
        >
          <For each={gridState.blocksInVisualOrder}>
            {(block) => (
              <Cell
                block={block}
                onMove={handleMove}
                ref={(element) => blockRefs.set(block, element)}
              />
            )}
          </For>
        </div>
        {viewState.busy && (
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
            <span>{viewState.busyStatus}</span>
          </div>
        )}
      </div>
      <div class="flex justify-center space-x-4">
        <button
          class="rounded bg-gray-200 px-4 py-2 font-bold text-gray-800 hover:bg-blue-300 disabled:opacity-50"
          onClick={() => unwait(reset)()}
          disabled={viewState.busy || gridState.isSolved}
        >
          Reset
        </button>
        <button
          class="rounded bg-pink-600 px-4 py-2 font-bold text-white hover:bg-pink-700 disabled:opacity-50"
          onClick={() => unwait(shuffle)()}
          disabled={viewState.busy}
        >
          Shuffle
        </button>
        <button
          class="rounded bg-gray-200 px-4 py-2 font-bold text-gray-800 hover:bg-blue-300 disabled:opacity-50"
          onClick={() => (audio.isMuted() ? audio.unmute() : audio.mute())}
          disabled={viewState.busy}
        >
          {audio.isMuted() ? 'Unmute' : 'Mute'}
        </button>
      </div>
    </div>
  )
}
