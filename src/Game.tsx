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

  return (
    <div
      class={'mx-auto grid w-full max-w-md grid-cols-4'}
      onKeyDown={onKeyDown}
    >
      {blocks.map((block) => {
        const { row, column } = getPositionForBlock(block, grid())
        const movableDirection = getMovableDirection(block, grid())

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
              class="flex aspect-square h-full w-full items-center justify-center border-t border-l border-gray-300 text-xl font-bold focus:text-white focus:outline-none"
              classList={{
                'hover:bg-gray-100 focus:bg-pink-600 focus:hover:bg-pink-700':
                  !!movableDirection,
                'hover:bg-gray-50 focus:bg-pink-600/50 focus:hover:bg-pink-700/50':
                  !movableDirection,
                // add outer borders on last column/row
                'border-r': column === 3,
                'border-b': row === 3,
              }}
              onfocus={() => setFocused(block)}
              onblur={() => setFocused(null)}
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
  )
}
