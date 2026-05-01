import { type Accessor, createEffect, createMemo, on } from 'solid-js'
import type { Grid } from '../../block/types'
import { blockTones } from '../../tone'
import { useAudio } from '../audio/useAudio'
import { getCorrectNeighborGroups } from '../../block/utils'

/**
 * Higher-level hook to audialize a ToneBlock grid game.
 *
 * @param biggestGroup - An accessor for the largest group of connected blocks.
 * @returns An object containing audio control functions.
 */
export const useToneBlockAudio = (grid: Accessor<Grid>) => {
  const { render, activate, isMuted, mute, unmute } = useAudio()

  const sortedGroups = createMemo(() =>
    getCorrectNeighborGroups(grid()).toSorted((a, b) => b.size - a.size),
  )
  const biggestGroup = createMemo(() => sortedGroups()[0])

  createEffect(
    on([biggestGroup], async ([biggestGroup]) => {
      await activate()

      // Sort the group to ensure a consistent audio graph for Elementary.
      const sortedGroup = [...biggestGroup].toSorted((a, b) => a - b)
      await render(blockTones(sortedGroup))
    }),
  )

  return { activate, mute, unmute, isMuted }
}
