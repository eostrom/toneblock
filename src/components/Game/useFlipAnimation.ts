import { useGame } from '../../stores/GameContext'
import type { Block, Grid } from '../../block/types'
import { blocks } from '../../block/constants'

/**
 * Hook to manage FLIP animations for the ToneBlock grid.
 *
 * The caller is responsible for setting values in the `blockRefs` map when rendering the grid.
 * It should call `animateGrid` to animate the transition to a new grid.
 *
 * @returns An object containing `animateGrid` and `blockRefs`.
 */
export const useFlipAnimation = () => {
  const { setGrid, setView } = useGame()
  const blockRefs = new Map<Block | null, HTMLElement>()

  /**
   * Animates the grid transition using the FLIP technique.
   *
   * @param newGrid - The next state of the grid.
   * @param duration - The animation duration in milliseconds.
   * @returns A promise that resolves when the animation finishes.
   */
  const animateGrid = (
    newGrid: Grid,
    duration: number = 300,
  ): Promise<void> => {
    setView('animating', true)
    const rects = new Map<Block | null, DOMRect>()

    // FLIP: First (Capture initial positions)
    blocks.forEach((block) => {
      const element = blockRefs.get(block)
      if (element) rects.set(block, element.getBoundingClientRect())
    })

    // FLIP: Last (Update state/DOM)
    setGrid('grid', newGrid)

    // Wait for DOM to update.
    const frame = requestAnimationFrame(() => {
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
    return new Promise((resolve) => {
      setTimeout(() => {
        cancelAnimationFrame(frame)
        setView('animating', false)
        resolve()
      }, duration)
    })
  }

  return {
    animateGrid,
    blockRefs,
  }
}
