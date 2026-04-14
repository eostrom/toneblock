import { createStore } from 'solid-js/store'
import type { Block } from '../block/types'

/** UI state for the game. */
export type GameState = {
  /** True if an animation is in progress. */
  animating: boolean
  /** True if the grid is being shuffled. */
  shuffling: boolean
  /** The block currently being considered for pushing. */
  activeBlock: Block | null
  /** The block that currently has keyboard focus. */
  focusedBlock: Block | null
  /** The block currently under the mouse pointer. */
  hoveredBlock: Block | null
  /** True if the game is animating or shuffling. */
  readonly busy: boolean
  /** Status description of why the game is busy, or null. */
  readonly busyStatus: 'Shuffling' | 'Animating' | null
}

/** Creates the game store with derived properties using getters. */
export const createGameStore = (): ReturnType<
  typeof createStore<GameState>
> => {
  return createStore<GameState>({
    animating: false,
    shuffling: false,
    activeBlock: null,
    focusedBlock: null,
    hoveredBlock: null,
    get busy() {
      return this.animating || this.shuffling
    },
    get busyStatus() {
      if (this.shuffling) return 'Shuffling'
      if (this.animating) return 'Animating'
      return null
    },
  })
}
