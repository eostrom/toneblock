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
import type { Block, Direction } from './domain/types'
import { blocks, DELTAS, solvedGrid } from './domain/constants'
import {
  applyDeltaToPosition,
  getBlockAtPosition,
  getPositionForBlock,
  isPositionInGrid,
} from './domain/utils'

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
 * The base frequency for the root note (E3).
 */
const ROOT_FREQ = 110 * 2 ** (7 / 12)

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
  })

  onCleanup(async () => {
    await ctx.close()
  })

  createEffect(
    on(focused, async (block) => {
      await ctx.resume()

      const scale = [0, 3, 5, 7, 10]
      const index = (block ?? 1) - 1
      const semitones = Math.floor(index / 5) * 12 + scale[index % 5]
      const freq = ROOT_FREQ * 2 ** (semitones / 12)
      const node = el.mul(el.const({ value: block ? 1 : 0 }), el.cycle(freq))
      await core().render(node)
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
    <div class={'grid grid-cols-4 gap-2'} onKeyDown={onKeyDown}>
      {blocks.map((block) => {
        const { row, column } = getPositionForBlock(block, grid())

        return (
          <button
            name="block"
            data-block-key={getBlockKey(block)}
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
