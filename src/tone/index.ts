import { el } from '@elemaudio/core'
import type { Block } from '../block/types'

/**
 * The base frequency for the root note (E3).
 */
const ROOT_FREQ = 110 * 2 ** (2 / 12)

/**
 * Calculates the frequency for a given block.
 * Uses a minor pentatonic scale rooted at E3.
 *
 * @param block - The block value.
 * @returns The frequency in Hz.
 */
function blockFrequency(block: Block | null) {
  const scale = [0, 3, 5, 7, 10]
  const index = (block ?? 1) - 1
  const semitones = Math.floor(index / 5) * 12 + scale[index % 5]

  return ROOT_FREQ * 2 ** (semitones / 12)
}

/**
 * Generates an Elementary audio node representing the tone for a given block.
 *
 * @param block - The block value.
 * @returns An Elementary node.
 */
export function blockTone(block: Block | null) {
  const freq = blockFrequency(block)

  return el.mul(el.const({ value: block ? 1 : 0 }), el.cycle(freq))
}

export function blockTones(blocks: Block[]) {
  return el.add(...blocks.map(blockTone))
}
